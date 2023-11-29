<template>
  <v-tabs density="compact" v-model="tab" bg-color="primary">
    <v-tab v-for="ctx in context" :value="ctx"> {{ ctx }}</v-tab>
  </v-tabs>

  <v-window v-model="tab">
    <v-window-item v-for="ctx in context" :value="ctx">
      <div class="editor-container w-full flex">
        <n-layout position="absolute" has-sider>
          <n-layout-sider :native-scrollbar="false" bordered :width="240">
            <n-layout position="absolute">
              <n-layout-header class="flex" style="height: 33px" bordered>
                <n-input
                  ref="searchInput"
                  v-model:value="searchString"
                  :bordered="false"
                  @focus="onSearching = true"
                  @blur="onSearching = false"
                ></n-input>
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-translate-off"
                  icon-only
                  flat
                  size="x-small"
                  rounded
                  @click="
                    filterConditions.untranslated =
                      !filterConditions.untranslated
                  "
                  :active="filterConditions.untranslated"
                >
                </v-btn>
              </n-layout-header>
              <n-layout position="absolute" style="top: 33px">
                <n-layout>
                  <v-list nav lines="one">
                    <template v-for="{ str, id, msgUuid } in msgs">
                      <v-list-item
                        v-if="
                          (str?.length ?? 0) === 0 &&
                          !unsavedUpdate?.has(msgUuid)
                        "
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
                              unsavedUpdate?.has(msgUuid)
                                ? 'warning'
                                : 'success'
                            "
                            inline
                          >
                          </v-badge>
                        </template>
                      </v-list-item>
                    </template>
                  </v-list>
                </n-layout>
              </n-layout>
            </n-layout>
          </n-layout-sider>
          <n-layout :native-scrollbar="false">
            <v-card variant="flat" v-if="selectedMsg">
              <v-card-item>
                <div class="flex">
                  <div class="text-overline flex-1 flex items-center">
                    {{ $t('editor.label.source_string') }}
                  </div>
                  <n-popconfirm @positive-click="deleteMsgId">
                    <template #trigger>
                      <n-button text>
                        <v-icon icon="mdi-delete-outline"></v-icon>
                      </n-button>
                    </template>
                    {{ $t('editor.alert.confirm_delete') }}
                  </n-popconfirm>
                </div>
                <div class="text-h6">
                  {{ selectedMsg.id.id }}
                </div>
              </v-card-item>
              <v-container>
                <v-row>
                  <v-col cols="12" lg="6">
                    <v-card>
                      <v-textarea
                        :rows="3"
                        :autofocus="!onSearching"
                        auto-grow
                        hide-details
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
                        <v-btn
                          @click="unsavedUpdate?.delete(selectedMsg.msgUuid)"
                          >{{ $t('common.reset') }}</v-btn
                        >
                      </v-card-actions>
                    </v-card>
                  </v-col>
                  <v-col cols="12" lg="6">
                    <v-textarea
                      :label="$t('common.comment')"
                      variant="solo"
                      counter
                      :rows="1"
                      auto-grow
                      :model-value="selectedMsg.meta.comment"
                      @update:modelValue="
                        onUpdateComment(selectedMsg.msgUuid, $event)
                      "
                    >
                    </v-textarea>
                  </v-col>
                </v-row>
              </v-container>
            </v-card>
          </n-layout>
        </n-layout>
      </div>
    </v-window-item>
  </v-window>
</template>

<script setup lang="ts">
import { isNil } from 'lodash-es';
import useGettext from '../../stores/gettext';
import useUnsavedUpdate from '../../stores/unsavedUpdate';
import { MsgId, msgInit, msgMetaInit } from '../../utils/gettext';
import { fs } from '@tauri-apps/api';

const route = useRoute();
const gettext = useGettext();
const searchInput = ref();
const onSearching = ref(false);
onKeyStroke(
  ['f'],
  (e) => {
    if (!e.ctrlKey) {
      return;
    }
    if (searchInput.value) {
      const el = searchInput.value[0];
      el.focus();
    }
  },
  {
    dedupe: true,
  }
);

const searchString = ref('');
const filterConditions = reactive({
  untranslated: false,
});
const locale = computed(() =>
  gettext.value.locales.get(route.params.locale as string)
);
const unsavedUpdateForAll = useUnsavedUpdate();
watch(
  locale,
  (cur) => {
    if (!cur) return;
    const code = cur.code;
    if (unsavedUpdateForAll.value.has(code)) {
      return;
    }
    unsavedUpdateForAll.value.set(code, new Map());
  },
  {
    immediate: true,
  }
);
const unsavedUpdate = computed(() =>
  unsavedUpdateForAll.value.get(locale.value?.code ?? '')
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
  const substring = searchString.value.trim().toLowerCase();
  let skip = true;
  for (const msg of template) {
    if (skip) {
      skip = false;
      continue;
    }
    const msgid = gettext.value.findMsgId(msg.id);
    const msgstr = gettext.value.findMsgStr(locale.value.code, msg.id);
    if (msgid) {
      const str = msgstr ?? msgInit({ id: msg.id });
      const cell = {
        msgUuid: msg.id,
        id: msgid,
        str: unsavedUpdate.value?.has(msg.id)
          ? unsavedUpdate.value?.get(msg.id)
          : str.str.join('\n'),
        meta: {
          comment: str.meta.comment.join('\n'),
        },
      };
      if (
        ![msgid.id, msgid.plural, cell.str].some((str) =>
          str?.toLowerCase().includes(substring)
        )
      ) {
        continue;
      }
      if (filterConditions.untranslated) {
        if (cell.str?.length ?? 0 > 0) continue;
      }
      res.push(cell);
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

function onUpdateComment(msgUuid: string, value: string) {
  const code = locale.value?.code;
  if (!code) return;
  const msg = gettext.value.findMsgStr(code, msgUuid);
  const commentValue = value.length === 0 ? [] : value.split('\n');
  if (msg) {
    msg.meta.comment = commentValue;
    gettext.value.updateLocale(code, msg);
  } else {
    gettext.value.updateLocale(
      code,
      msgInit({
        id: msgUuid,
        meta: msgMetaInit({
          comment: commentValue,
        }),
      })
    );
  }
  const { data, path } = gettext.value.dumpLocale(code) ?? {};
  if (data && path) {
    fs.writeTextFile(path, data);
  }
}

function deleteMsgId() {
  const uuid = selectedMsg.value?.msgUuid;
  if (!uuid) return;
  gettext.value.removeTemplateMsgId(uuid);
}
</script>

<style scoped lang="scss">
.editor-container {
  height: calc(100vh - 36px - 64px);
  overflow-y: auto;
}
</style>
