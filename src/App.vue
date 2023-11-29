<template>
  <n-config-provider
    :theme-overrides="{ common: { fontWeightStrong: '600' } }"
    :locale="lang"
    :date-locale="dateLang"
  >
    <n-notification-provider>
      <n-loading-bar-provider>
        <router-view></router-view>
      </n-loading-bar-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui';

import { currentLocale, Language } from './locale/utils';

const lang = ref(enUS);
const dateLang = ref(dateEnUS);

watch(
  currentLocale,
  (locale) => {
    if (locale === Language.en) {
      lang.value = enUS;
      dateLang.value = dateEnUS;
    } else if (locale === Language.zh) {
      lang.value = zhCN;
      dateLang.value = dateZhCN;
    }
  },
  {
    immediate: true,
  }
);
</script>
