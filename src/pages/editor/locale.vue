<template>
  <v-tabs v-model="tab" bg-color="primary">
    <v-tab v-for="ctx in context" :value="ctx"> {{ ctx }}</v-tab>
  </v-tabs>

  <v-window v-model="tab">
    <v-window-item v-for="ctx in context" :value="ctx">
      <div class="editor-container w-full flex">
        <n-layout style="height: 100%">
          <n-layout position="absolute" has-sider>
            <n-layout-sider :native-scrollbar="false" bordered :width="200">
            </n-layout-sider>
            <n-layout :native-scrollbar="false"> </n-layout>
          </n-layout>
        </n-layout>
      </div>
      <!-- <v-container class="editor-container space-y-3">
        <v-card
          v-for="msg in gettext.value.template.msg.slice(1)"
          variant="outlined"
          density="compact"
        >
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  auto-grow
                  density="compact"
                  disabled
                  :model-value="gettext.value.findMsgId(msg.id)?.id"
                  label="Msg ID"
                  variant="outlined"
                  rows="1"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  density="compact"
                  auto-grow
                  label="Msg Str"
                  variant="outlined"
                  rows="1"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions density="compact">
            <v-btn density="compact">{{ $t('common.save') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-container> -->
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

<style scoped lang="scss">
.editor-container {
  height: calc(100vh - 48px - 64px);
  overflow-y: auto;
}
</style>
