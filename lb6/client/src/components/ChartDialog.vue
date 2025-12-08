<template>
    <v-dialog v-model="dialog" max-width="900">
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
                <div>График {{ stock?.symbol || '' }}</div>

                <!-- Белый фон кнопки, чёрный крестик -->
                <button class="close-btn" @click="dialog = false" aria-label="Закрыть">
                    <span class="close-icon">✕</span>
                </button>
            </v-card-title>

            <v-divider />

            <v-card-text>
                <div v-if="!hasData" class="text-center pa-8">
                    <v-icon size="48" color="grey">mdi-chart-line-stacked</v-icon>
                    <div class="mt-3">Нет истории цен для отображения</div>
                </div>

                <div v-else class="chart-wrap">
                    <line-chart :chart-data="chartData" :chart-options="chartOptions" />
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn text color="primary" @click="dialog = false">Закрыть</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

export default {
    name: 'ChartDialog',
    components: { LineChart: Line },
    props: {
        value: { type: Boolean, required: true },
        stock: { type: Object, required: true }
    },
    computed: {
        dialog: {
            get() { return this.value; },
            set(val) { this.$emit('update:value', val); }
        },
        hasData() {
            return !!(this.stock && this.stock.priceHistory && this.stock.priceHistory.length);
        },
        chartData() {
            const history = this.stock && this.stock.priceHistory ? this.stock.priceHistory : [];
            return {
                labels: history.map(p => p.date),
                datasets: [
                    {
                        label: 'Цена',
                        data: history.map(p => p.price),
                        borderColor: '#5E35B1',
                        backgroundColor: 'rgba(94,53,177,0.08)',
                        fill: true,
                        tension: 0.25,
                        pointRadius: 2,
                    }
                ],
            };
        },
        chartOptions() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { mode: 'index', intersect: false },
                },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: { display: true, title: { display: false } },
                    y: { display: true, title: { display: false } },
                },
            };
        },
    },
};
</script>

<style scoped>
.pa-8 { padding: 2rem; }
.text-center { text-align: center; }
.v-card-text { min-height: 320px; }

/* Close button: white background, visible border, black X */
.close-btn {
    background: #ffffff;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 6px;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

/* Use a plain black X character to avoid icon theme color issues */
.close-icon {
    color: #000;
    font-size: 18px;
    line-height: 1;
    user-select: none;
}

/* Ensure the button does not inherit theme styles from parent Vuetify components */
.close-btn:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(94,53,177,0.08);
}

/* Chart container minimum height */
.chart-wrap {
    min-height: 320px;
}
</style>
