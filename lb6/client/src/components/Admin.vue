<template>
    <v-container>
        <v-card class="pa-4" elevation="5">
            <v-card-title class="text-h4">Админ: Список участников</v-card-title>
            <v-data-table
                :headers="headers"
                :items="brokers"
                :loading="loading"
                class="elevation-1"
            >
                <template v-slot:item.portfolio="{ item }">
                    <v-chip v-for="(qty, symbol) in item.portfolio" :key="symbol" small>{{ symbol }}: {{ qty }}</v-chip>
                </template>
                <template v-slot:item.totalBalance="{ item }">
                    {{ item.totalBalance.toFixed(2) }}$
                </template>
            </v-data-table>
        </v-card>
    </v-container>
</template>

<script>
import { mapState } from 'vuex';

export default {
    data() {
        return {
            brokers: [],
            loading: true,
            headers: [
                { text: 'Имя', value: 'name' },
                { text: 'Баланс', value: 'cash' },
                { text: 'Портфель', value: 'portfolio' },
                { text: 'Общий баланс', value: 'totalBalance' },
            ],
        };
    },
    async mounted() {
        try {
            const res = await fetch('/broker/admin');
            this.brokers = await res.json();
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    },
};
</script>
