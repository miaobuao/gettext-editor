<template>
  <n-config-provider
    :theme-overrides="{ common: { fontWeightStrong: '600' } }"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-notification-provider>
      <n-loading-bar-provider>
        <router-view></router-view>
      </n-loading-bar-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { zhCN, dateZhCN } from 'naive-ui';
</script>
