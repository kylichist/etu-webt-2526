<template>
    <v-app>
        <v-app-bar color="deep-purple accent-4" dark elevate-on-scroll app>
            <v-toolbar-title class="title">
                <v-icon left>mdi-briefcase-outline</v-icon>
                Брокер
            </v-toolbar-title>

            <v-spacer />

            <v-btn color="white" variant="elevated" class="mx-2" @click="router.push('/')">
                <v-icon left dark>mdi-login</v-icon>
                Вход
            </v-btn>

            <v-btn color="white" variant="elevated" class="mx-2" @click="router.push('/admin')">
                <v-icon left dark>mdi-shield-account</v-icon>
                Админ
            </v-btn>

            <v-btn color="white" variant="elevated" class="mx-2" @click="router.push('/broker')">
                <v-icon left dark>mdi-swap-horizontal</v-icon>
                Брокер
            </v-btn>
        </v-app-bar>

        <v-main class="main">
            <v-container fluid class="pa-6">
                <v-row justify="center">
                    <v-col cols="12" md="10" lg="8">
                        <v-card class="content-card" elevation="6">
                            <v-card-title class="d-flex align-center">
                                <div>
                                    <h1 class="headline">Панель</h1>
                                </div>
                            </v-card-title>

                            <v-divider></v-divider>

                            <v-card-text>
                                <router-view />
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>

        <v-footer color="grey lighten-4" padless>
            <v-col class="text-center py-4" cols="12">
                <small class="grey--text text--darken-1">lb6</small>
            </v-col>
        </v-footer>
    </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

html, body, #app {
    height: 100%;
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    background: linear-gradient(180deg, #f6f7fb 0%, #ffffff 100%);
    margin: 0;
}

.v-toolbar__title.title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
}

.content-card {
    border-radius: 12px;
}

.headline {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
}

.subtitle-1 {
    color: #666;
    font-size: 0.95rem;
    margin-top: 4px;
}
</style>
