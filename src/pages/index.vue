<template>
  <v-app>
    <v-main class="vertical-center">
      <v-item-group selected-class="bg-primary ">
        <v-container class="horizontal-center container">
          <v-row>
            <v-col v-for="n in openMethods" :key="n.title">
              <v-item>
                <v-card class="align-center" @click="n.action">
                  <div class="text-center pa-10">
                    <v-icon size="100" :icon="n.icon"></v-icon>
                  </div>
                  <div class="text-center">
                    {{ n.title }}
                  </div>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-container>
      </v-item-group>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { fs } from '@tauri-apps/api';
import { isNil } from 'lodash-es';
import { getCwd, isDir, getInputPath } from '../utils/invoke';
import { selectSingleFile } from '../utils/file';
import useConfig from '../stores/config';
const { t: $t } = useI18n();
const config = useConfig();

if (config.visitIndexTime++ === 0) {
  openFromEnv();
}

const openMethods = [
  {
    title: $t('action.open_from_file'),
    icon: 'mdi-file-outline',
    action: async () => {
      const target = await selectSingleFile();
      if (target) {
        routerToEditor(target);
      }
    },
  },
  {
    title: $t('action.open_from_env'),
    icon: 'mdi-folder-outline',
    action: openFromEnv,
  },
];

async function openFromEnv() {
  const path = (await getInputPath()) ?? (await getCwd());
  if (await fs.exists(path)) {
    isDir(path)
      .then(async () => {
        const entires = await fs
          .readDir(path)
          .then((files) => files.filter((file) => file.name?.endsWith('.pot')));
        if (entires.length === 1) {
          routerToEditor(entires[0].path);
        } else {
          const file = await selectSingleFile({ defaultPath: path });
          if (file) routerToEditor(file);
        }
      })
      .catch(() => {
        routerToEditor(path);
        return;
      });
  } else {
    const file = await selectSingleFile();
    if (file) routerToEditor(file);
  }
}
const router = useRouter();
function routerToEditor(path: string) {
  if (isNil(path) || path.length === 0) {
    return;
  }
  router.push({
    name: 'editor',
    query: {
      path,
    },
  });
}
</script>

<style scoped>
.vertical-center {
  display: flex;
  justify-content: center;
  flex-direction: column;
}
.horizontal-center {
  margin: 0 auto;
}
.container {
  max-width: 600px;
}
</style>
