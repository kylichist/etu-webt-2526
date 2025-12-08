<template>
    <v-app>
        <v-app-bar color="primary" dark>
            <v-toolbar-title>lb6 - Брокер</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text @click="$router.push('/')">Вход</v-btn>
            <v-btn text @click="$router.push('/admin')">Админ</v-btn>
            <v-btn text @click="$router.push('/broker')">Брокер</v-btn>
        </v-app-bar>
        <v-main>
            <router-view />
        </v-main>
    </v-app>
</template>

<script>
export default {
    name: 'App',
};
</script>

<style>
body {
    margin: 0;
}
</style>
