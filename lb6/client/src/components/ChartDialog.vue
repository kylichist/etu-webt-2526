<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title>График {{ stock?.symbol }}</v-card-title>
            <line-chart :data="chartData"/>
        </v-card>
    </v-dialog>
</template>

<script>
import { Line } from 'vue-chartjs';

export default {
    name: 'ChartDialog',
    components: { LineChart: Line },
    props: {
        value: { type: Boolean, required: true },
        stock: { type: Object, required: true }
    },
    computed: {
        dialog: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('update:value', val);
            }
        },
        chartData() {
            const history = this.stock && this.stock.priceHistory ? this.stock.priceHistory : [];
            return {
                labels: history.map(p => p.date),
                datasets: [
                    { label: 'Цена', data: history.map(p => p.price) }
                ],
            };
        },
    },
};
</script>
