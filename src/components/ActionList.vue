<template>
  <v-list>
    <v-list-item v-for="item in option" @click="item.action">
      <v-list-item-title>
        {{ item.title }}
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
export interface ActionListItem {
  title: string;
  action: () => any;
}
export type ActionListOption = ActionListItem[];
defineProps<{
  option: ActionListOption;
}>();
</script>
