<template>{{ locale }}</template>

<script setup lang="ts">
const route = useRoute();
const locale = route.params.locale;
</script>
