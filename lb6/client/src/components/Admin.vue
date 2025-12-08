<template>
    <v-container>
        <v-card class="pa-4" elevation="2">
            <v-card-title>Админка — брокеры</v-card-title>
            <v-card-text>
                <v-data-table :headers="headers" :items="brokers" item-key="name" dense>
                    <template v-slot:item.cash="{ item }">
                        {{ formatPrice(item.cash) }}
                    </template>
                    <template v-slot:no-data>
                        <v-alert type="info">Список брокеров пуст.</v-alert>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            headers: [
                { text: 'Имя', value: 'name' },
                { text: 'Баланс', value: 'cash' },
            ],
            brokers: [],
        };
    },
    methods: {
        formatPrice(p) {
            if (p === undefined || p === null) return '-';
            return Number(p).toFixed(2);
        },
        async loadBrokers() {
            try {
                const res = await fetch('/broker/admin');
                if (!res.ok) {
                    console.warn('/broker/admin returned', res.status);
                    this.brokers = [];
                    return;
                }
                const data = await res.json();
                // ensure cash field exists for each broker
                this.brokers = Array.isArray(data)
                    ? data.map(b => ({ name: b.name || '', cash: typeof b.cash === 'number' ? b.cash : Number(b.cash || 0) }))
                    : [];
                console.debug('[Admin] loaded brokers', this.brokers);
            } catch (e) {
                console.error('Failed to load brokers', e);
                this.brokers = [];
            }
        },
    },
    async mounted() {
        await this.loadBrokers();
    },
};
</script>

<style scoped>
</style>
