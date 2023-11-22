<template>
  <v-navigation-drawer permanent :width="150">
    <v-list-item :title="project?.name"> </v-list-item>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="locale in project?.locales"
        prepend-icon="mdi-translate"
        :title="locale.name"
        :value="locale.name"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-main> </v-main>
</template>

<script setup lang="ts">
const project = ref<Project>();
</script>
