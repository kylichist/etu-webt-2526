<template>
    <v-container>
        <v-row justify="center">
            <v-col cols="12" sm="8" md="4">
                <v-card elevation="8" class="pa-6">
                    <v-card-title class="justify-center">
                        <div class="text-h6">Вход в систему</div>
                    </v-card-title>

                    <v-card-text>
                        <v-form @submit.prevent="handleLogin" ref="form">
                            <v-text-field
                                v-model="name"
                                label="Имя брокера"
                                required
                                outlined
                                dense
                                clearable
                            />
                            <v-card-actions class="pa-0 mt-4">
                                <v-spacer />
                                <v-btn color="primary" type="submit" elevation="2">
                                    <v-icon left>mdi-login</v-icon>Войти
                                </v-btn>
                            </v-card-actions>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
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
            // Клиентская валидация — запрещаем пустое имя
            const trimmed = (this.name || '').trim();
            if (!trimmed) {
                return alert('Введите имя брокера');
            }

            try {
                await this.login(trimmed);
                this.$router.push('/broker');
            } catch (e) {
                console.error('Login error', e);
                alert(`Ошибка входа: ${e.message || e}`);
            }
        },
    },
};
</script>

<style scoped>
.v-card {
    border-radius: 12px;
}
</style>
