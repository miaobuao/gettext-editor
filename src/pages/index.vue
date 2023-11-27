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
import { invoke, fs } from '@tauri-apps/api';
import { isNil } from 'lodash-es';
import { getCwd } from '../utils/invoke';
import { selectSingleFile } from '../utils/file';
import useProject from '../stores/project';

const { t: $t } = useI18n();
// const firstOpen = useState('firstOpen', () => true);
const project = useProject();

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

if (project.firstOpen) {
  project.firstOpen = false;
  openFromEnv();
}

function openFromEnv() {
  invoke<string>('get_input_path').then(async (path) => {
    path = path ?? (await getCwd());
    if (await fs.exists(path)) {
      if (await invoke('is_dir', { path })) {
        const entires = await fs
          .readDir(path)
          .then((files) => files.filter((file) => file.name?.endsWith('.pot')));
        if (entires.length === 1) {
          routerToEditor(entires[0].path);
        } else {
          const file = await selectSingleFile({ defaultPath: path });
          if (file) routerToEditor(file);
        }
      } else {
        routerToEditor(path);
        return;
      }
    } else {
      const file = await selectSingleFile();
      if (file) routerToEditor(file);
    }
  });
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
