<template>
  <n-config-provider
    :theme-overrides="{ common: { fontWeightStrong: '600' } }"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <v-app>
      <router-view></router-view>
    </v-app>
  </n-config-provider>
</template>

<script setup lang="ts">
import { zhCN, dateZhCN } from 'naive-ui';
</script>
