<template>
  <v-app-bar>
    <template v-slot:prepend>
      <v-btn icon="mdi-close" @click="$router.back()"></v-btn>
    </template>

    <v-app-bar-title>
      {{ project.name }}
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <v-menu>
      <template v-slot:activator="{ props: menu }">
        <v-btn icon="mdi-plus" flat v-bind="menu"> </v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="option in createMenuOptions"
          :key="option.title"
          @click="option.action"
        >
          <v-list-item-title>
            {{ option.title }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn icon="mdi-cog-outline" flat @click="linkToSettings"> </v-btn>
  </v-app-bar>

  <v-navigation-drawer
    location="right"
    :width="400"
    v-if="!hiddenErrors && errors.length"
  >
    <v-alert
      type="error"
      v-for="(err, idx) in errors.toReversed()"
      closable
      :key="err.id"
      @click:close="eraseError(err.id)"
      :title="err.title"
      :text="err.message"
    ></v-alert>
  </v-navigation-drawer>

  <v-navigation-drawer permanent :width="200">
    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="[code, locale] in locales"
        prepend-icon="mdi-translate"
        :title="code"
        :value="code"
        @click="linkToLocaleEditor(code)"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <router-view></router-view>
  </v-main>

  <locale-creator
    v-model:dialog="showLocaleCreator"
    @submit="createLocale"
  ></locale-creator>
</template>

<script setup lang="ts">
import { fs } from '@tauri-apps/api';
import { isNil, uniqueId } from 'lodash';
import { basename } from 'path-browserify';
import { selectFiles } from '../utils/file';
import { isDir } from '../utils/invoke';
import { Gettext } from '../utils/gettext';
import type { CreateLocaleForm } from '../components/LocaleCreator.vue';
import { onKeyStroke } from '@vueuse/core';
import useGettext from '../stores/gettext';
import useProject from '../stores/project';

interface ErrorMessage {
  id: string;
  title: string;
  message: string;
}
const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();

const showLocaleCreator = ref(false);
const hiddenErrors = ref(false);
const loading = ref(false);
const project = useProject();
const gettext = useGettext();
const locales = computed(() => {
  return gettext.value.locales;
});
const errors = ref<ErrorMessage[]>([]);

const createMenuOptions = [
  {
    title: $t('action.add_locale.create_from_template'),
    action: () => {
      showLocaleCreator.value = true;
    },
  },
  {
    title: $t('action.add_locale.import_from_file'),
    action: addLocaleFromFile,
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
    const dump = gettext.value.dump();
  },
  {
    dedupe: true,
  }
);

function eraseError(id: string) {
  errors.value = errors.value.filter((err) => err.id !== id);
}

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
      errors.value.push({
        id: uniqueId(),
        title: $t('error.failed_to_import_locale'),
        message: $t('error.file_not_found_', { path: file }),
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
        errors.value.push({
          id: uniqueId(),
          title: $t('error.failed_to_import_locale'),
          message: $t('error.invalid_po_file', {
            path,
          }),
        });
      }
    }
  });
}

async function loadPot(path: string) {
  loading.value = true;
  const text = await fs.readTextFile(path);
  if ((gettext.value = Gettext.parse({ path, text }))) {
    project.name = basename(path);
    project.path = path;
  }
  Promise.all(
    // read all modules
    gettext.value?.modules.map(async (module) => {
      if (!(await fs.exists(module))) {
        return;
      }
      return {
        path: module,
        text: await fs.readTextFile(module),
      };
    }) ?? []
  )
    .then((data) => {
      data.forEach((result) => {
        if (result) {
          const { path, text } = result;
          gettext.value?.importLocaleFromString(path, text);
        }
      });
    })
    .finally(() => {
      loading.value = false;
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
  console.log({ locale });

  return router.replace({
    name: 'editor-locale',
    params: {
      locale,
    },
  });
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
