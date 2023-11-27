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
              <v-list nav>
                <template v-for="msg in gettext.value.template.msg.slice(1)">
                  <v-list-item
                    v-if="msg.str.length === 1 && msg.str[0].length === 0"
                    :title="gettext.value.findMsgId(msg.id)?.id"
                    :value="msg.id"
                    @click="selectedMsgId = msg.id"
                    :active="msg.id === selectedMsgId"
                    rounded="xl"
                  >
                    <template v-slot:append>
                      <v-badge dot color="error" inline></v-badge>
                    </template>
                  </v-list-item>
                  <v-list-item
                    v-else
                    :title="gettext.value.findMsgId(msg.id)?.id"
                    :subtitle="msg.str.join(' ')"
                    :value="msg.id"
                    @click="selectedMsgId = msg.id"
                    :active="msg.id === selectedMsgId"
                    rounded="xl"
                  >
                    <template v-slot:append>
                      <v-badge dot color="success" inline> </v-badge>
                    </template>
                  </v-list-item>
                </template>
              </v-list>
            </n-layout-sider>
            <n-layout :native-scrollbar="false">
              <v-card variant="flat" v-if="selectedMsgId">
                <v-card-item>
                  <div>
                    <div class="text-overline mb-1">
                      {{ $t('editor.label.source_string') }}
                    </div>
                    <div class="text-h6 mb-1">
                      {{ gettext.value.findMsgId(selectedMsgId)?.id }}
                    </div>
                    <div class="text-caption" v-pre=""></div>
                  </div>
                </v-card-item>
                <v-card-actions>
                  <v-btn>save</v-btn>
                </v-card-actions>
              </v-card>
            </n-layout>
          </n-layout>
        </n-layout>
      </div>
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
const selectedMsgId = ref<string>();
const selectedMsg = computed({
  get() {
    return gettext.value.findMsg(
      locale.value?.code ?? '',
      selectedMsgId.value ?? ''
    );
  },
  set() {},
});
</script>

<style scoped lang="scss">
.editor-container {
  height: calc(100vh - 48px - 64px);
  overflow-y: auto;
}
</style>
