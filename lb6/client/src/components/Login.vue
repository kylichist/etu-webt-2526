<template>
    <v-container>
        <v-card class="pa-4">
            <v-card-title>Вход</v-card-title>
            <v-form @submit.prevent="handleLogin">
                <v-text-field v-model="name" label="Имя брокера" required />
                <v-btn type="submit" color="primary">Войти</v-btn>
            </v-form>
        </v-card>
    </v-container>
</template>

<script>
import { mapActions } from 'vuex';

export default {
    data() {
        return { name: '' };
    },
    methods: {
        ...mapActions(['login']),
        async handleLogin() {
            console.log('Handle login called');
            await this.login(this.name);
            this.$router.push('/broker');
        },
    },
};
</script>
