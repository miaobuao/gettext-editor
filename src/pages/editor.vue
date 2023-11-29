<template>
  <v-app>
    <v-app-bar>
      <template v-slot:prepend>
        <v-btn icon="mdi-close" @click="$router.back()"></v-btn>
      </template>

      <v-app-bar-title>
        {{ project.name }}
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <v-tooltip :text="$t('action.save_all')" location="left">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-content-save-outline"
            flat
            @click="saveAll"
          >
          </v-btn>
        </template>
      </v-tooltip>

      <v-btn icon="mdi-plus" flat @click="createTemplateMsgId"> </v-btn>

      <v-btn icon="mdi-cog-outline" flat @click="linkToSettings"> </v-btn>
    </v-app-bar>

    <v-navigation-drawer permanent :width="200">
      <n-layout has-sider position="absolute">
        <n-layout-sider bordered :width="32">
          <div class="flex-col">
            <template v-for="item in drawerToolbar">
              <v-tooltip :text="item.tips" location="right">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="item.icon"
                    @click="item.action"
                    flat
                    only-icon
                    rounded
                    size="x-small"
                  ></v-btn>
                </template>
              </v-tooltip>
            </template>
          </div>
        </n-layout-sider>
        <n-layout>
          <v-list density="compact" nav>
            <v-list-item
              v-for="[code] in locales"
              prepend-icon="mdi-translate"
              :title="code"
              :value="code"
              rounded="xl"
              :active="$route.params.locale === code"
              @click="linkToLocaleEditor(code)"
            >
              <template v-slot:append>
                <v-badge dot :color="localeStatus(code)" inline> </v-badge>
              </template>
            </v-list-item>
          </v-list>
        </n-layout>
      </n-layout>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
    </v-main>

    <locale-creator
      v-model:dialog="showLocaleCreator"
      @submit="createLocale"
    ></locale-creator>

    <msg-creator v-model:show="showMsgCreator"></msg-creator>
  </v-app>
</template>

<script setup lang="ts">
import { fs } from '@tauri-apps/api';
import { isNil } from 'lodash-es';
import { selectFiles } from '../utils/file';
import { isDir } from '../utils/invoke';
import { Gettext } from '../utils/gettext';
import type { CreateLocaleForm } from '../components/LocaleCreator.vue';
import { onKeyStroke } from '@vueuse/core';
import useGettext from '../stores/gettext';
import useProject from '../stores/project';
import { useLoadingBar, useNotification } from 'naive-ui';
import useUnsavedUpdate from '../stores/unsavedUpdate';

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();
const loading = useLoadingBar();
const notify = useNotification();
const unsavedUpdate = useUnsavedUpdate();

const showLocaleCreator = ref(false);
const showMsgCreator = ref(false);
const project = useProject();
const gettext = useGettext();
const locales = computed(() => {
  return gettext.value.locales;
});

const drawerToolbar = [
  {
    icon: 'mdi-plus',
    tips: $t('action.add_locale.create_from_template'),
    action: () => {
      showLocaleCreator.value = true;
    },
  },
  {
    icon: 'mdi-link',
    tips: $t('action.add_locale.import_from_file'),
    action: addLocaleFromFile,
  },
  {
    icon: 'mdi-cog-outline',
    tips: $t('common.settings'),
    action: linkToSettings,
  },
];
watch(
  () => route.query.path,
  async (path) => {
    if (isNil(path) || path.length === 0) {
      return;
    }
    loadPot(path as string);
  },
  {
    immediate: true,
  }
);

onKeyStroke(
  ['s'],
  (e) => {
    if (!e.ctrlKey) {
      return;
    }
    for (const [code, unsaved] of unsavedUpdate.value) {
      for (const [uuid, str] of unsaved) {
        const msgstr = gettext.value.findMsgStr(code, uuid);
        msgstr.str = str.split('\n');
        gettext.value.updateLocale(code, msgstr);
        unsaved.delete(uuid);
      }
    }
    saveAll();
  },
  {
    dedupe: true,
  }
);

function createLocale(form: CreateLocaleForm) {
  const { code, path } = form;
  if (isNil(code) || isNil(path)) {
    return;
  }
  gettext.value.createLocale(path, code);
  showLocaleCreator.value = false;
}

async function addLocaleFromFile() {
  const files = await selectFiles();
  if (isNil(files)) {
    return;
  }
  const candidates: string[] = [];
  for (const file of files) {
    if (await fs.exists(file)) {
      if (await isDir(file)) {
        const entires = await fs
          .readDir(file)
          .then((files) =>
            files
              .map((file) => file.name)
              .filter(
                (file) =>
                  !isNil(file) &&
                  (file?.endsWith('.pot') || file?.endsWith('.po'))
              )
          );
        candidates.push(...(entires as string[]));
      } else {
        candidates.push(file);
      }
    } else {
      notify.error({
        title: $t('error.failed_to_import_locale'),
        content: $t('error.file_not_found_', { path: file }),
        duration: 3000,
      });
    }
  }
  // TODO: deduplicate same locales code
  candidates.forEach(async (path) => {
    const text = await fs.readTextFile(path);
    try {
      gettext.value?.importLocaleFromString(path, text);
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === 'error.invalid_po_file') {
        notify.error({
          title: $t('error.failed_to_import_locale'),
          content: $t('error.invalid_po_file', {
            path,
          }),
          duration: 3000,
        });
      }
    }
  });
}

function loadPot(path: string) {
  loading.start();
  Gettext.load(path)
    .then((obj) => {
      gettext.value = obj;
    })
    .catch((err: Error) => {
      const msg = err.message;
      notify.error({
        title: msg,
        duration: 3000,
      });
    })
    .finally(() => {
      loading.finish();
    });
}

function linkToSettings() {
  const tgt = 'editor-settings';
  if (route.name === tgt) return;
  router.replace({
    name: tgt,
  });
}

function linkToLocaleEditor(locale: string) {
  return router.replace({
    name: 'editor-locale',
    params: {
      locale,
    },
  });
}

function saveAll() {
  loading.start();
  const dump = gettext.value.dumpAll();
  Promise.all(
    dump.map(({ path, data }) => {
      return fs.writeTextFile(path, data);
    })
  ).finally(() => {
    loading.finish();
  });
}

function createTemplateMsgId() {
  showMsgCreator.value = true;
}

function localeStatus(localeCode: string) {
  if (unsavedUpdate.value.get(localeCode)?.size ?? 0 > 0) {
    return 'warning';
  }
  if (gettext.value.hasUntranslatedMsgId(localeCode)) {
    return 'error';
  }
  return 'success';
}
</script>

<style lang="scss">
.fullscreen {
  height: 100%;
}
html,
body {
  height: 100%;
}
#app {
  height: 100vh;
  > div {
    height: 100%;
    > div {
      height: 100%;
    }
  }
}
</style>
