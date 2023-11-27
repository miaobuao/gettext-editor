<template>
  <v-tabs v-model="tab" bg-color="primary">
    <v-tab v-for="ctx in context" :value="ctx"> {{ ctx }}</v-tab>
  </v-tabs>

  <v-window v-model="tab">
    <v-window-item v-for="ctx in context" :value="ctx">
      <div class="editor-container w-full flex">
        <n-layout style="height: 100%">
          <n-layout position="absolute" has-sider>
            <n-layout-sider :native-scrollbar="false" bordered :width="240">
              <v-list nav lines="two">
                <template v-for="{ str, id, msgUuid } in msgs?.slice(1)">
                  <v-list-item
                    v-if="(str?.length ?? 0) === 0"
                    :title="id.id"
                    :value="msgUuid"
                    @click="selectedMsgUuid = msgUuid"
                    :active="selectedMsgUuid === msgUuid"
                    rounded="xl"
                  >
                    <template v-slot:append>
                      <v-badge dot color="error" inline></v-badge>
                    </template>
                  </v-list-item>
                  <v-list-item
                    v-else
                    :title="id.id"
                    :subtitle="str"
                    :value="msgUuid"
                    @click="selectedMsgUuid = msgUuid"
                    :active="selectedMsgUuid === msgUuid"
                    rounded="xl"
                  >
                    <template v-slot:append>
                      <v-badge
                        dot
                        :color="
                          unsavedUpdate?.has(msgUuid) ? 'warning' : 'success'
                        "
                        inline
                      >
                      </v-badge>
                    </template>
                  </v-list-item>
                </template>
              </v-list>
            </n-layout-sider>
            <n-layout :native-scrollbar="false">
              <v-card variant="flat" v-if="selectedMsg">
                <v-card-item>
                  <div>
                    <div class="text-overline mb-1">
                      {{ $t('editor.label.source_string') }}
                    </div>
                    <div class="text-h6">
                      {{ selectedMsg.id.id }}
                    </div>
                  </div>
                </v-card-item>
                <v-container>
                  <v-row>
                    <v-col cols="12" lg="6">
                      <v-card>
                        <v-textarea
                          :rows="3"
                          autofocus
                          auto-grow
                          line
                          counter
                          :label="$t('editor.label.target_string')"
                          :model-value="selectedMsg.str"
                          @update:modelValue="
                            onUpdateMsgStr(selectedMsg.msgUuid, $event)
                          "
                        ></v-textarea>
                        <v-card-actions>
                          <v-btn @click="saveMsgStr(selectedMsg.msgUuid)">{{
                            $t('common.save')
                          }}</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    <v-col cols="12" lg="6">
                      <v-card>
                        <v-card-item>
                          <v-textarea
                            :label="$t('common.comment')"
                            variant="underlined"
                            counter
                            :model-value="selectedMsg.meta.comment"
                            @update:modelValue="
                              onUpdateComment(selectedMsg.msgUuid, $event)
                            "
                          >
                            <template #append-inner>
                              <v-btn
                                @click="updateComment(selectedMsg.msgUuid)"
                                rounded
                                icon="mdi-comment-outline"
                                flat
                              ></v-btn>
                            </template>
                          </v-textarea>
                        </v-card-item>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card>
            </n-layout>
          </n-layout>
        </n-layout>
      </div>
    </v-window-item>
  </v-window>
</template>

<script setup lang="ts">
import { isNil } from 'lodash-es';
import useGettext from '../../stores/gettext';
import { MsgId, msgInit, msgMetaInit } from '../../utils/gettext';
import { fs } from '@tauri-apps/api';

const route = useRoute();
const gettext = useGettext();
const locale = computed(() =>
  gettext.value.locales.get(route.params.locale as string)
);
const unsavedUpdateForAll = reactive(new Map<string, Map<string, string>>());
watch(
  locale,
  (cur) => {
    if (!cur) return;
    const code = cur.code;
    if (unsavedUpdateForAll.has(code)) {
      return;
    }
    unsavedUpdateForAll.set(code, new Map());
  },
  {
    immediate: true,
  }
);
const unsavedUpdate = computed(() =>
  unsavedUpdateForAll.get(locale.value?.code ?? '')
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

const msgs = computed(() => {
  if (!locale.value?.code) {
    return;
  }
  const template = gettext.value.template.msg;
  const res = [];
  for (const msg of template) {
    const msgid = gettext.value.findMsgId(msg.id);
    const msgstr = gettext.value.findMsgStr(locale.value.code, msg.id);
    if (msgid) {
      const str = msgstr ?? msgInit({ id: msg.id });
      res.push({
        msgUuid: msg.id,
        id: msgid,
        str: unsavedUpdate.value?.has(msg.id)
          ? unsavedUpdate.value?.get(msg.id)
          : str.str.join('\n'),
        meta: {
          comment: unsavedComment.value?.has(msg.id)
            ? unsavedComment.value?.get(msg.id)
            : msg.meta.comment.join('\n'),
        },
      });
    }
  }
  return res;
});
const selectedMsgUuid = ref<string>();
const selectedMsg = computed({
  get() {
    return msgs.value?.find((msg) => msg.msgUuid === selectedMsgUuid.value);
  },
  set() {},
});

function onUpdateMsgStr(msgIdx: string, str: string) {
  unsavedUpdate.value?.set(msgIdx, str);
}

function saveMsgStr(msgUuid: string) {
  const value = unsavedUpdate.value?.get(msgUuid);
  if (isNil(value)) {
    return;
  }
  if (locale.value) {
    const msg = gettext.value.findMsgStr(locale.value?.code ?? '', msgUuid);
    if (msg) {
      msg.str = value.split('\n');
      gettext.value.updateLocale(locale.value.code, msg);
    } else {
      gettext.value.updateLocale(
        locale.value.code,
        msgInit({
          id: msgUuid,
          str: value.split('\n'),
        })
      );
    }
    const { data, path } = gettext.value.dumpLocale(locale.value.code) ?? {};
    if (data && path) {
      fs.writeTextFile(path, data);
    }
  }
  unsavedUpdate.value?.delete(msgUuid);
}

const unsavedCommentAll = reactive(new Map<string, Map<string, string>>());
const unsavedComment = computed(() =>
  unsavedCommentAll.get(locale.value?.code ?? '')
);
watch(
  locale,
  (cur) => {
    if (!cur) return;
    const code = cur.code;
    if (unsavedCommentAll.has(code)) {
      return;
    }
    unsavedCommentAll.set(code, new Map());
  },
  {
    immediate: true,
  }
);

function updateComment(msgUuid: string) {
  const code = locale.value?.code;
  if (!code) return;
  const msg = gettext.value.findMsgStr(code, msgUuid);
  const comment = unsavedComment.value?.get(msgUuid);
  if (isNil(comment)) return;
  if (msg) {
    msg.meta.comment = comment.split('\n');
    gettext.value.updateLocale(code, msg);
  } else {
    gettext.value.updateLocale(
      code,
      msgInit({
        id: msgUuid,
        meta: msgMetaInit({
          comment: comment.split('\n'),
        }),
      })
    );
  }
  const { data, path } = gettext.value.dumpLocale(code) ?? {};
  if (data && path) {
    fs.writeTextFile(path, data);
  }
}

function onUpdateComment(msgUuid: string, value: string) {
  const code = locale.value?.code;
  if (!code) return;
  unsavedComment.value?.set(msgUuid, value);
}
</script>

<style scoped lang="scss">
.editor-container {
  height: calc(100vh - 48px - 64px);
  overflow-y: auto;
}
</style>
