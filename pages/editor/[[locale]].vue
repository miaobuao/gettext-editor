<template>{{ locale }}</template>

<script setup lang="ts">
const route = useRoute();
const locale = computed(() => route.params.locale);
</script>
