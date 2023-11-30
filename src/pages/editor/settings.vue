<template>
  <n-layout style="height: calc(100vh - 64px)">
    <n-layout has-sider class="h-full overflow-y-auto">
      <n-layout-sider bordered :width="150" :native-scrollbar="false">
        <v-tabs v-model="tab" direction="vertical" color="primary">
          <v-tab v-for="opt in menuOptions" :value="opt.key">
            {{ opt.label }}
          </v-tab>
        </v-tabs>
      </n-layout-sider>
      <n-layout class="overflow-y-auto" ref="container">
        <v-window v-model="tab" class="h-full">
          <v-window-item value="modules" class="h-full">
            <v-card flat class="h-full">
              <n-data-table
                :bordered="false"
                :single-line="false"
                :columns="columns"
                :data="data"
                virtual-scroll
                :max-height="containerHeight"
              />
            </v-card>
          </v-window-item>
        </v-window>
      </n-layout>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import EditableText from '../../components/EditableText.vue';
import { convertPathToCode, type Locale } from '../../utils/gettext';
import { NButton, NIcon, type DataTableColumns } from 'naive-ui';
import { TrashOutline } from '@vicons/ionicons5';
import useGettext from '../../stores/gettext';
import { selectSingleDir } from '../../utils/file';
const { t } = useI18n();
const menuOptions = [['settings.modules', 'modules']].map(([label, key]) => ({
  label: t(label),
  key,
}));
const container = ref();
const { height: containerHeight } = useElementSize(container);
const tab = ref(menuOptions[0].key);
const gettext = useGettext();

const columns = ((): DataTableColumns<Locale> => {
  return [
    {
      title: t('common.locale'),
      key: 'code',
      width: 80,
      resizable: true,
      render(row) {
        return h(EditableText, {
          value: row.code,
          'onUpdate:value': (code) => {
            gettext.value.updateLocale(row.code, {
              code,
            });
          },
        });
      },
    },
    {
      title: t('common.path'),
      key: 'path',
      width: 200,
      resizable: true,
      render(row) {
        return h(
          NButton,
          {
            text: true,
            class: 'whitespace-normal break-all',
            onClick() {
              selectDirForModule(row.code);
            },
          },
          {
            default: row.path,
          }
        );
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      align: 'center',
      resizable: true,
      width: 80,
      render(row) {
        return removeModuleBtn(row.path);
      },
    },
  ];
})();

function removeModuleBtn(path: string) {
  return h(NButton, {
    text: true,
    size: 'small',
    renderIcon() {
      return h(NIcon, null, {
        default: () => h(TrashOutline),
      });
    },
    onClick: () => removeLocale(path),
  });
}

function removeLocale(path: string) {
  gettext.value.removeLocale(convertPathToCode(path));
  gettext.value.removeModule(path);
}

async function selectDirForModule(localeCode: string) {
  const dir = await selectSingleDir();
  if (dir) {
    await gettext.value.updateLocale(localeCode, {
      path: dir,
    });
  }
}

let data = computed(() =>
  [...gettext.value.modules].map((path) => {
    return {
      path,
      code: convertPathToCode(path),
    };
  })
);
</script>
