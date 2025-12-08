<template>
    <v-container>
        <v-card class="pa-4">
            <p>Брокер: {{ broker.name }}</p>
            <p>Дата: {{ currentDate }}</p>
            <p>Баланс: {{ broker.cash }}</p>
            <v-data-table :headers="stockHeaders" :items="stocks">
                <template v-slot:item.actions="{ item }">
                    <v-btn @click="buyStock(item.symbol)">Купить</v-btn>
                    <v-btn @click="sellStock(item.symbol)">Продать</v-btn>
                </template>
            </v-data-table>
            <v-data-table :headers="portfolioHeaders" :items="portfolio" />
        </v-card>
    </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import io from 'socket.io-client';

export default {
    data() {
        return {
            stockHeaders: [{ text: 'Акция', value: 'symbol' }, { text: 'Цена', value: 'price' }, { text: 'Действия', value: 'actions' }],
            portfolioHeaders: [{ text: 'Акция', value: 'symbol' }, { text: 'Количество', value: 'quantity' }],
        };
    },
    computed: {
        ...mapState(['broker', 'stocks', 'currentDate']),
        portfolio() {
            return Object.entries(this.broker.portfolio).map(([symbol, quantity]) => ({ symbol, quantity }));
        },
    },
    methods: {
        ...mapActions(['buyStock', 'sellStock']),
        buyStock(symbol) {
            const quantity = prompt('Количество:');
            if (quantity) this.buyStock({ symbol, quantity });
        },
        sellStock(symbol) {
            const quantity = prompt('Количество:');
            if (quantity) this.sellStock({ symbol, quantity });
        },
    },
    mounted() {
        console.log('Broker component mounted');  // Отладка
        const socket = io('http://localhost:4000');
        socket.on('priceUpdate', (data) => {
            console.log('Price update:', data);  // Отладка
            this.$store.commit('updatePrices', data.prices);
            this.$store.commit('setCurrentDate', data.currentDate);
        });
    },
};
</script>
