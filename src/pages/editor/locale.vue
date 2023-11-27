<template>
  <v-tabs v-model="tab" bg-color="primary">
    <v-tab v-for="ctx in context" :value="ctx"> {{ ctx }}</v-tab>
  </v-tabs>

  <v-window v-model="tab">
    <v-window-item v-for="ctx in context" :value="ctx">
      <v-container>
        <v-card density="compact">
          <v-card-text>{{ ctx }}</v-card-text>
          <v-textarea label="Label" variant="outlined"></v-textarea>
          <v-card-actions>
            <v-btn>{{ $t('common.submit') }}</v-btn>
            <v-btn>{{ $t('common.undo') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-window-item>
  </v-window>
</template>

<script setup lang="ts">
import useGettext from '../../stores/gettext';
import { MsgId } from '../../utils/gettext';
const route = useRoute();
const gettext = useGettext();
const locale = computed(() =>
  gettext.value.locales.get(route.params.locale as string)
);
const msgids = computed(() => {
  const res = new Set<MsgId>();
  locale.value?.msgs.forEach((msg) => {
    const ctx = gettext.value.getMsgId(msg.id);
    if (ctx) res.add(ctx);
  });
  return res;
});
const context = computed(() => {
  const res = new Set<string>();
  msgids.value.forEach((id) => {
    res.add(id.context);
  });
  return Array.from(res);
});
const tab = ref(context.value[0]);
</script>
