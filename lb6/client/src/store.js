import { createStore } from 'vuex';

const BROKER_NAME_KEY = 'brokerName';

export default createStore({
    state: {
        broker: { name: '', cash: 0, portfolio: {}, purchasePrices: {} },
        stocks: [], // [{ symbol, price, priceHistory: [{date,price}, ...], ... }]
        currentDate: '',
    },
    mutations: {
        setBroker(state, broker) {
            state.broker = broker || { name: '', cash: 0, portfolio: {}, purchasePrices: {} };
            // persist broker name if present
            try {
                if (state.broker && state.broker.name) {
                    localStorage.setItem(BROKER_NAME_KEY, state.broker.name);
                }
            } catch (e) {
                // ignore localStorage errors
            }
            console.debug('[store] setBroker', state.broker);
        },

        // Replace stocks array entirely (reactivity). Normalize fields.
        setStocks(state, stocks) {
            const arr = Array.isArray(stocks) ? stocks : [];
            state.stocks = arr.map(s => {
                const symbol = String(s.symbol || s.ticker || '').toUpperCase();
                return {
                    ...s,
                    symbol,
                    price: typeof s.price === 'number' ? s.price : Number(s.price || 0),
                    priceHistory: Array.isArray(s.priceHistory)
                        ? s.priceHistory.slice()
                        : Array.isArray(s.history)
                            ? s.history.slice()
                            : [],
                };
            });
            console.debug(
                '[store] setStocks ->',
                state.stocks.map(s => ({ symbol: s.symbol, price: s.price, historyLen: s.priceHistory.length })),
            );
        },

        // Update prices. Accepts:
        // - object {SYMBOL: price, ...}
        // - object with numeric keys (array-like) {0: {...},1:{...}}
        // - array [{symbol,price}, ...] or [p0,p1,...]
        // Always replace state.stocks with a new array (reactivity)
        updatePrices(state, prices) {
            if (!prices) return;

            const normalized = {};

            if (Array.isArray(prices)) {
                if (
                    prices.length > 0 &&
                    typeof prices[0] === 'object' &&
                    prices[0] !== null &&
                    ('symbol' in prices[0] || 'price' in prices[0] || 'ticker' in prices[0])
                ) {
                    // array of objects [{symbol,price}, ...]
                    prices.forEach(item => {
                        const sym = String(item.symbol || item.ticker || '').toUpperCase();
                        if (sym) normalized[sym] = Number(item.price ?? item.p ?? 0);
                    });
                } else {
                    // array of primitive prices -> assign by index to current stocks order
                    prices.forEach((p, idx) => {
                        const s = state.stocks[idx];
                        if (s && s.symbol) normalized[String(s.symbol).toUpperCase()] = Number(p);
                    });
                }
            } else if (prices && typeof prices === 'object') {
                // object: maybe {AAPL:123} or {0:{...},1:{...}}
                Object.entries(prices).forEach(([k, v]) => {
                    if (v && typeof v === 'object' && ('symbol' in v || 'price' in v || 'ticker' in v)) {
                        const sym = String(v.symbol || v.ticker || k).toUpperCase();
                        if (sym) normalized[sym] = Number(v.price ?? v.p ?? 0);
                    } else {
                        normalized[String(k).toUpperCase()] = Number(v);
                    }
                });
            }

            const nowDate = state.currentDate || new Date().toISOString();

            state.stocks = state.stocks.map(stock => {
                const key = String(stock.symbol).toUpperCase();
                if (normalized[key] !== undefined) {
                    const newPrice = Number(normalized[key]);
                    const history = Array.isArray(stock.priceHistory) ? stock.priceHistory.slice() : [];
                    const last = history.length ? history[history.length - 1] : null;
                    if (!last || Number(last.price) !== newPrice || String(last.date) !== String(nowDate)) {
                        history.push({ date: nowDate, price: newPrice });
                    }
                    return { ...stock, price: newPrice, priceHistory: history };
                }
                return stock;
            });

            console.debug(
                '[store] updatePrices ->',
                state.stocks.map(s => ({ symbol: s.symbol, price: s.price })),
            );
        },

        setCurrentDate(state, date) {
            state.currentDate = date || '';
            console.debug('[store] setCurrentDate', state.currentDate);
        },
    },
    actions: {
        async login({ commit }, name) {
            const res = await fetch('/broker/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error(await res.text());
            const broker = await res.json();
            commit('setBroker', broker);
            return broker;
        },

        async buyStock({ state, dispatch }, { symbol, quantity }) {
            if (!state.broker || !state.broker.name) throw new Error('Broker not logged in');
            const res = await fetch('/broker/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerName: state.broker.name, symbol, quantity }),
            });
            if (!res.ok) throw new Error(await res.text());
            // refresh broker data
            if (state.broker.name) await dispatch('login', state.broker.name);
            return res;
        },

        async sellStock({ state, dispatch }, { symbol, quantity }) {
            if (!state.broker || !state.broker.name) throw new Error('Broker not logged in');
            const res = await fetch('/broker/sell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerName: state.broker.name, symbol, quantity }),
            });
            if (!res.ok) throw new Error(await res.text());
            // refresh broker data
            if (state.broker.name) await dispatch('login', state.broker.name);
            return res;
        },
    },
});
