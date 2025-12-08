import { createStore } from 'vuex';

export default createStore({
    state: {
        broker: { name: '', cash: 0, portfolio: {} },
        stocks: [],
        currentDate: '',
    },
    mutations: {
        setBroker(state, broker) {
            state.broker = broker;
        },
        updatePrices(state, prices) {
            state.stocks.forEach(stock => {
                if (prices[stock.symbol]) stock.price = prices[stock.symbol];
            });
        },
        setCurrentDate(state, date) {
            state.currentDate = date;
        },
    },
    actions: {
        async login({ commit }, name) {
            const res = await fetch('/broker/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            const broker = await res.json();
            commit('setBroker', broker);
        },
        async buyStock({ state }, { symbol, quantity }) {
            return fetch('/broker/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brokerName: state.broker.name, symbol, quantity }) });
        },
        async sellStock({ state }, { symbol, quantity }) {
            return fetch('/broker/sell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brokerName: state.broker.name, symbol, quantity }) });
        },
    },
});
