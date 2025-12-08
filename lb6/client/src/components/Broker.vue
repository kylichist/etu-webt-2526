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
                        <div class="text-right">
                            <div class="subtitle-2">Баланс</div>
                            <div class="text-h6"><strong>{{ formatPrice(broker.cash) }}</strong></div>
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
                                <v-btn color="error" small @click="handleSell(item.symbol)" :disabled="!tradingActive">
                                    <v-icon left small>mdi-cart-remove</v-icon>
                                    Продать
                                </v-btn>
                                <!-- History button removed per request -->
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
            return hasDate && hasNonZeroPrice;
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
                // ensure broker state updated immediately (server also emits brokerUpdate)
                const res = await fetch('/broker/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: this.broker.name}),
                });
                if (res.ok) {
                    const b = await res.json();
                    this.$store.commit('setBroker', b);
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
                await this.sellStockAction({symbol, quantity});
                const res = await fetch('/broker/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: this.broker.name}),
                });
                if (res.ok) {
                    const b = await res.json();
                    this.$store.commit('setBroker', b);
                }
            } catch (e) {
                console.error('Ошибка продажи:', e);
                alert(`Ошибка продажи: ${e.message || e}`);
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

        // Initial REST fallback: get initial stocks and — if we have saved broker name — login
        try {
            const stocksRes = await fetch('/broker/stocks');
            if (stocksRes && stocksRes.ok) {
                const stocks = await stocksRes.json();
                this.$store.commit('setStocks', stocks);
            } else {
                console.warn('/broker/stocks returned', stocksRes && stocksRes.status);
            }

            // restore broker name from localStorage (if present) and login
            let savedName = null;
            try {
                savedName = localStorage.getItem('brokerName');
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
