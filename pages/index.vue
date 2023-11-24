<template>
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
</template>

<script setup lang="ts">
import { invoke, fs } from '@tauri-apps/api';

const { t: $t } = useI18n();
const firstOpen = useState('firstOpen', () => true);

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

if (firstOpen.value) {
  firstOpen.value = false;
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
  if (!path.endsWith('.pot')) return;
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
