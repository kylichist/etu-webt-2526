import { createRouter, createWebHistory } from 'vue-router';
import Login from './components/Login.vue';
import Admin from './components/Admin.vue';
import Broker from './components/Broker.vue';

const routes = [
    { path: '/', component: Login },
    { path: '/admin', component: Admin },
    { path: '/broker', component: Broker },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
