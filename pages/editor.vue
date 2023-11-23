<template>
  <v-navigation-drawer permanent :width="150">
    <v-list-item :title="project?.name">
      <template #append>
        <v-menu>
          <template v-slot:activator="{ props: menu }">
            <v-btn size="small" icon="mdi-plus" flat v-bind="menu"> </v-btn>
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
      </template>
    </v-list-item>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="locale in localeList"
        prepend-icon="mdi-translate"
        :title="locale.code"
        :value="locale.path"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <router-view></router-view>
  </v-main>
</template>

<script setup lang="ts">
import { fs } from '@tauri-apps/api';
import { isNil } from 'lodash';
import { dirname, basename, extname, join } from 'path-browserify';

const { t: $t } = useI18n();
const route = useRoute();

const loading = ref(false);
const project = useProject();
const template = usePOTemplate();
const headBlock = computed(() => {
  return template.value.msg.at(0);
});
const localePathLoadFailed = reactive<Set<string>>(new Set());
const head = computed({
  get: () => template.value.msg.at(0),
  set: (value) => {
    if (isNil(value)) return;
    template.value.msg.splice(0, 1, value);
  },
});
const locales = useLocales();
const localeList = computed(() => {
  return Object.keys(locales.value).map((code) => locales.value[code]);
});
const createMenuOptions = [
  {
    title: $t('action.add_locale.create_from_template'),
    action: () => {},
  },
  {
    title: $t('action.add_locale.import_from_file'),
    action: () => {},
  },
];
watch(
  () => route.query.path,
  async (path) => {
    loadPot(path as string);
  },
  {
    immediate: true,
  }
);

async function loadPot(path: string) {
  loading.value = true;
  const text = await fs.readTextFile(path);
  const temp = gettextMsgsParser(text);
  if (isNil(temp)) {
    onPotParseFailed();
    return;
  }
  template.value = temp;
  project.value = {
    name: basename(path),
    path,
  };
  localePathLoadFailed.clear();
  Promise.all(
    headBlock.value?.modules.map((module_path: string) => {
      module_path = join(dirname(path), module_path);
      return loadLocale(module_path)
        .then((locale) => {
          locales.value[locale.code] = locale;
        })
        .catch(() => {
          localePathLoadFailed.add(module_path);
        });
    }) ?? []
  ).finally(() => {
    loading.value = false;
  });
}

function loadLocale(path: string) {
  return new Promise<Locale>(async (resolve, reject) => {
    if (await fs.exists(path)) {
      const text = await fs.readTextFile(path);
      const msgs = gettextMsgsParser(text);
      if (isNil(msgs)) {
        reject();
      } else {
        const locale: Locale = {
          code: basename(path, extname(path)),
          path,
          msgs: msgs.msg,
        };
        resolve(locale);
      }
    } else {
      reject();
    }
  });
}

function onPotParseFailed() {}
</script>
