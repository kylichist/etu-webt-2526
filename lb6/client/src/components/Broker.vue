<template>
    <v-container>
        <v-row>
            <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="6">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <div>
                            <div class="text-h6">Брокер: <strong>{{ broker.name || '—' }}</strong></div>
                            <div class="caption">Дата: {{ currentDate || '—' }}</div>
                        </div>

                        <div class="text-right d-flex align-center">
                            <div class="mr-4 text-right">
                                <div class="subtitle-2">Баланс</div>
                                <div class="text-h6"><strong>{{ formatPrice(broker.cash) }}</strong></div>
                            </div>


                            <v-btn
                                small
                                color="primary"
                                :loading="refreshing"
                                :disabled="refreshing"
                                @click="restartTrading"
                                title="R"
                            >
                                <v-icon left>mdi-refresh</v-icon>
                                Перезапустить торги
                            </v-btn>
                        </div>
                    </v-card-title>

                    <v-card-text>
                        <v-divider class="mb-3"/>

                        <v-data-table dense :headers="stockHeaders" :items="stocks" class="elevation-1"
                                      item-key="symbol">
                            <template v-slot:item.symbol="{ item }">
                                <div>{{ item.symbol }}</div>
                            </template>

                            <template v-slot:item.price="{ item }">
                                <div class="d-flex align-center">
                                    <v-icon left small color="green darken-1">mdi-currency-usd</v-icon>
                                    <span>{{ formatPrice(item.price) }}</span>
                                </div>
                            </template>

                            <template v-slot:item.actions="{ item }">
                                <v-btn color="success" small class="mr-2" @click="handleBuy(item.symbol)"
                                       :disabled="!tradingActive">
                                    <v-icon left small>mdi-cart-plus</v-icon>
                                    Купить
                                </v-btn>

                                <v-btn color="error" small class="mr-2" @click="handleSell(item.symbol)"
                                       :disabled="!tradingActive">
                                    <v-icon left small>mdi-cart-remove</v-icon>
                                    Продать
                                </v-btn>
                            </template>

                            <template v-slot:no-data>
                                <v-alert type="info" border="left" colored-border>
                                    Нет доступных акций.
                                </v-alert>
                            </template>
                        </v-data-table>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card class="pa-4" elevation="6">
                    <v-card-title>
                        Портфель
                        <v-spacer/>
                        <div class="caption">Всего позиций: {{ portfolio.length }}</div>
                    </v-card-title>

                    <v-card-text>
                        <v-data-table dense :headers="portfolioHeaders" :items="portfolioWithProfit" hide-default-footer
                                      item-key="symbol">
                            <template v-slot:item.symbol="{ item }">
                                <div>{{ item.symbol }}</div>
                            </template>

                            <template v-slot:item.quantity="{ item }">
                                <div>{{ item.quantity }}</div>
                            </template>

                            <template v-slot:item.profit="{ item }">
                                <div :class="{ 'green--text': item.profit >= 0, 'red--text': item.profit < 0 }">
                                    {{ formatPrice(item.profit) }}
                                </div>
                            </template>

                            <template v-slot:no-data>
                                <v-alert type="info">Портфель пуст.</v-alert>
                            </template>
                        </v-data-table>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import {mapActions, mapState} from 'vuex';
import io from 'socket.io-client';

const BROKER_NAME_KEY = 'brokerName';

// trading API origin (use same hostname as page, but port 3000)
const TRADING_API_ORIGIN =
    typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3000/api`
        : 'http://localhost:3000/api';

// fetch with timeout
function fetchWithTimeout(url, opts = {}, timeout = 7000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, {...opts, signal: controller.signal}).finally(() => clearTimeout(id));
}

// retry helper
async function retry(fn, attempts = 3, delayMs = 300) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (e) {
            lastErr = e;
            if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
        }
    }
    throw lastErr;
}

export default {
    data() {
        return {
            stockHeaders: [
                {text: 'Акция', value: 'symbol'},
                {text: 'Цена', value: 'price'},
                {text: 'Действия', value: 'actions', sortable: false},
            ],
            portfolioHeaders: [
                {text: 'Акция', value: 'symbol'},
                {text: 'Количество', value: 'quantity'},
                {text: 'Прибыль/Убыток', value: 'profit'},
            ],
            socket: null,
            refreshing: false,
        };
    },
    computed: {
        ...mapState(['broker', 'stocks', 'currentDate']),
        portfolio() {
            return Object.entries(this.broker.portfolio || {})
                .filter(([, quantity]) => Number(quantity) > 0)
                .map(([symbol, quantity]) => ({symbol, quantity}));
        },
        portfolioWithProfit() {
            return this.portfolio.map(p => {
                const stock = this.stocks.find(s => s.symbol === p.symbol) || {};
                const current = Number(stock.price || 0);
                const purchase = Number((this.broker.purchasePrices && this.broker.purchasePrices[p.symbol]) || 0);
                const profit = (current - purchase) * Number(p.quantity || 0);
                return {...p, currentPrice: current, purchasePrice: purchase, profit};
            });
        },
        tradingActive() {
            const hasDate = !!this.currentDate;
            const hasNonZeroPrice = Array.isArray(this.stocks) && this.stocks.some(s => Number(s.price) > 0);
            const brokerFlag = this.broker && typeof this.broker.tradingActive !== 'undefined' ? !!this.broker.tradingActive : true;
            return hasDate && hasNonZeroPrice && brokerFlag;
        },
    },
    methods: {
        ...mapActions({buyStockAction: 'buyStock', sellStockAction: 'sellStock', login: 'login'}),

        formatPrice(p) {
            if (p === undefined || p === null) return '-';
            return Number(p).toFixed(2);
        },

        async handleBuy(symbol) {
            if (!this.broker || !this.broker.name) {
                return alert('Сначала войдите в систему (введите имя брокера).');
            }
            const q = prompt('Количество:');
            const quantity = Number(q);
            if (!q || Number.isNaN(quantity) || quantity <= 0) return alert('Неверное количество');
            if (!this.tradingActive) return alert('Торги в данный момент не проводятся');
            try {
                const resp = await this.buyStockAction({symbol, quantity});
                if (resp && resp.ok === false) {
                    return alert('Ошибка покупки: ' + (resp.error || 'unknown'));
                }
            } catch (e) {
                console.error('Ошибка покупки:', e);
                alert(`Ошибка покупки: ${e.message || e}`);
            }
        },

        async handleSell(symbol) {
            if (!this.broker || !this.broker.name) {
                return alert('Сначала войдите в систему (введите имя брокера).');
            }
            const q = prompt('Количество:');
            const quantity = Number(q);
            if (!q || Number.isNaN(quantity) || quantity <= 0) return alert('Неверное количество');
            if (!this.tradingActive) return alert('Торги в данный момент не проводятся');
            try {
                const resp = await this.sellStockAction({symbol, quantity});
                if (resp && resp.ok === false) {
                    return alert('Ошибка продажи: ' + (resp.error || 'unknown'));
                }
            } catch (e) {
                console.error('Ошибка продажи:', e);
                alert(`Ошибка продажи: ${e.message || e}`);
            }
        },

        async refreshPrices() {
            if (this.refreshing) {
                console.debug('[Broker] refreshPrices called but already refreshing');
                return;
            }

            console.debug('[Broker] refreshPrices triggered');
            window.__lastRefreshCalledAt = new Date().toISOString();
            this.refreshing = true;
            try {
                const attempt = async () => {
                    const res = await fetchWithTimeout('/broker/stocks', {
                        method: 'GET',
                        cache: 'no-store',
                        headers: {Accept: 'application/json'}
                    }, 7000);
                    if (!res.ok) {
                        const text = await res.text().catch(() => '');
                        throw new Error('Status ' + res.status + ' ' + text);
                    }
                    return await res.json();
                };

                const body = await retry(attempt, 3, 300);
                console.debug('[Broker] refreshPrices -> response body', body);

                if (Array.isArray(body)) {
                    this.$store.commit('setStocks', body);
                    console.debug('[Broker] refreshPrices -> setStocks applied', body.map(s => ({
                        symbol: s.symbol,
                        price: s.price
                    })));
                    return;
                }

                if (body && Array.isArray(body.stocks)) {
                    this.$store.commit('setStocks', body.stocks);
                    console.debug('[Broker] refreshPrices -> setStocks applied from body.stocks', body.stocks.map(s => ({
                        symbol: s.symbol,
                        price: s.price
                    })));
                    return;
                }

                if (body && typeof body === 'object') {
                    if (body.pricesMap && typeof body.pricesMap === 'object') {
                        this.$store.commit('updatePrices', body.pricesMap);
                        console.debug('[Broker] refreshPrices -> updatePrices applied (pricesMap)');
                        return;
                    }
                    const values = Object.values(body);
                    const isPriceMap = values.length > 0 && values.every(v => typeof v === 'number' || (v && typeof v === 'object' && 'price' in v));
                    if (isPriceMap) {
                        this.$store.commit('updatePrices', body);
                        console.debug('[Broker] refreshPrices -> updatePrices applied (direct map)');
                        return;
                    }
                }

                console.warn('[Broker] refreshPrices -> unexpected body', body);
                alert('Обновление цен вернуло неожиданную структуру; см. консоль.');
            } catch (e) {
                console.error('refreshPrices failed', e);
                alert('Ошибка при обновлении цен: ' + (e.message || e));
            } finally {
                this.refreshing = false;
            }
        },

        // restart trading on port 3000 (stop -> start), then refresh prices
        async restartTrading() {
            if (this.refreshing) {
                console.debug('[Broker] restartTrading called but refreshing already in progress');
                return;
            }
            this.refreshing = true;
            console.debug('[Broker] restartTrading triggered: will POST /trading/stop -> /trading/start on', TRADING_API_ORIGIN);

            try {
                // stop on port 3000
                const stopAttempt = async () => {
                    const url = `${TRADING_API_ORIGIN}/trading/stop`;
                    console.debug('[Broker] POST', url);
                    const res = await fetchWithTimeout(url, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'}
                    }, 7000);
                    if (!res.ok) {
                        const txt = await res.text().catch(() => '');
                        throw new Error('stop failed: ' + res.status + ' ' + txt);
                    }
                    const json = await res.json().catch(() => ({}));
                    console.debug('[Broker] stop response', json);
                    return json;
                };
                await retry(stopAttempt, 3, 300);

                // small delay to ensure backend processed stop
                await new Promise(r => setTimeout(r, 250));

                // start on port 3000
                const startAttempt = async () => {
                    const url = `${TRADING_API_ORIGIN}/trading/start`;
                    console.debug('[Broker] POST', url);
                    const res = await fetchWithTimeout(url, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'}
                    }, 7000);
                    if (!res.ok) {
                        const txt = await res.text().catch(() => '');
                        throw new Error('start failed: ' + res.status + ' ' + txt);
                    }
                    const json = await res.json().catch(() => ({}));
                    console.debug('[Broker] start response', json);
                    return json;
                };
                await retry(startAttempt, 3, 300);

                // after successful restart, refresh prices immediately
                await this.refreshPrices();

                // optionally refresh broker snapshot
                try {
                    if (this.broker && this.broker.name) {
                        const r = await fetchWithTimeout('/broker/login', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({name: this.broker.name})
                        }, 5000);
                        if (r.ok) {
                            const b = await r.json().catch(() => null);
                            if (b) this.$store.commit('setBroker', b);
                        }
                    }
                } catch (e) {
                    console.warn('login refresh after restart failed', e);
                }

                alert('Цены обновлены.');
            } catch (e) {
                console.error('restartTrading failed', e);
                alert('Не удалось перезапустить торги: ' + (e.message || e));
            } finally {
                this.refreshing = false;
            }
        },

        handlePriceUpdate(data) {
            if (!data) return;
            if (data.currentDate) this.$store.commit('setCurrentDate', data.currentDate);

            if (data.pricesMap && typeof data.pricesMap === 'object') {
                this.$store.commit('updatePrices', data.pricesMap);
                return;
            }

            if (data.prices !== undefined) {
                this.$store.commit('updatePrices', data.prices);
                return;
            }

            if (Array.isArray(data)) {
                this.$store.commit('setStocks', data);
            } else if (data && Array.isArray(data.stocks)) {
                this.$store.commit('setStocks', data.stocks);
            }
        },
    },

    async mounted() {
        console.log('Broker component mounted');
        window.__refreshPrices = () => {
            console.debug('[window] __refreshPrices invoked');
            this.refreshPrices();
        };
        window.__restartTrading = () => {
            console.debug('[window] __restartTrading invoked');
            this.restartTrading();
        };

        const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
        this.socket = io(socketUrl);

        this.socket.on('connect', () => {
            console.log('Socket connected', this.socket.id);
        });

        this.socket.on('priceUpdate', (data) => {
            try {
                console.debug('priceUpdate received ->', data);
                this.handlePriceUpdate(data);
            } catch (e) {
                console.error('Error handling priceUpdate', e);
            }
        });

        this.socket.on('stocksSnapshot', (payload) => {
            try {
                console.debug('stocksSnapshot received ->', payload);
                const stocks = Array.isArray(payload) ? payload : (payload && payload.stocks) ? payload.stocks : null;
                if (stocks) {
                    this.$store.commit('setStocks', stocks);
                }
            } catch (e) {
                console.error('Error handling stocksSnapshot', e);
            }
        });

        this.socket.on('brokerUpdate', (broker) => {
            try {
                console.debug('brokerUpdate received ->', broker && {name: broker.name, cash: broker.cash});
                if (broker) this.$store.commit('setBroker', broker);
            } catch (e) {
                console.error('Error applying brokerUpdate', e);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('Socket disconnected', reason);
        });

        // initial REST fallback
        try {
            const stocksRes = await fetch('/broker/stocks');
            if (stocksRes && stocksRes.ok) {
                const stocks = await stocksRes.json();
                this.$store.commit('setStocks', stocks);
            } else {
                console.warn('/broker/stocks returned', stocksRes && stocksRes.status);
            }

            let savedName = null;
            try {
                savedName = localStorage.getItem(BROKER_NAME_KEY);
            } catch (e) {
                savedName = null;
            }
            if (savedName) {
                try {
                    await this.login(savedName);
                } catch (e) {
                    console.warn('Auto-login failed', e);
                }
            }
        } catch (e) {
            console.error('Initial REST fallback failed', e);
        }
    },

    beforeUnmount() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    },
};
</script>

<style scoped>
.caption {
    color: #666;
}

.v-data-table .v-btn {
    min-width: 88px;
}

.green--text {
    color: #2e7d32 !important;
}

.red--text {
    color: #c62828 !important;
}
</style>
