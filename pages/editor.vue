<template>
  <v-navigation-drawer permanent :width="150">
    <v-list-item :title="project?.name">
      <template #append>
        <v-menu>
          <template v-slot:activator="{ props: menu }">
            <v-btn
              density="compact"
              size="small"
              icon="mdi-plus"
              flat
              v-bind="menu"
            >
            </v-btn>
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

        <v-btn
          density="compact"
          size="small"
          icon="mdi-cog-outline"
          flat
          @click="linkToSettings"
        >
        </v-btn>
      </template>
    </v-list-item>

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
</template>

<script setup lang="ts">
import { fs, dialog } from '@tauri-apps/api';
import { isNil } from 'lodash';
import { dirname, basename, extname, join } from 'path-browserify';

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const project = useProject();
const gettext = useGettext();
const locales = useLocales();

const createMenuOptions = [
  {
    title: $t('action.add_locale.create_from_template'),
    action: addLocaleFromTemplate,
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

async function addLocaleFromTemplate() {}
async function addLocaleFromFile() {
  const target = await selectSingleFile();
  if (isNil(target) || !(await fs.exists(target))) {
    return;
  }
  const text = await fs.readTextFile(target);
  const locale = gettext.value?.importLocaleFromString(target, text);
  if (isNil(locale)) {
    // TODO: show error
  }
}

async function loadPot(path: string) {
  loading.value = true;
  const text = await fs.readTextFile(path);
  if ((gettext.value = Gettext.parse(text))) {
    project.value = {
      name: basename(path),
      path,
    };
  }
  Promise.all(
    // read all modules
    gettext.value?.modules.map(async (module) => {
      module = join(dirname(path), module);
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
  const tgt = 'editor';
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
</script>
