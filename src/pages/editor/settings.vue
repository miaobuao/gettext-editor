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
import type { Locale } from '../../utils/gettext';
import type { DataTableColumns } from 'naive-ui';
import { NButton } from 'naive-ui';
import useGettext from '../../stores/gettext';
const { t } = useI18n();
const menuOptions = [['settings.modules', 'modules']].map(([label, key]) => ({
  label: t(label),
  key,
}));
const container = ref();
const { height: containerHeight } = useElementSize(container);
const tab = ref(menuOptions[0].key);
const gettext = useGettext();

const createColumns = ({
  remove,
}: {
  remove: (row: Locale) => void;
}): DataTableColumns<Locale> => {
  return [
    {
      title: '#',
      key: 'no',
      width: 60,
      resizable: true,
      minWidth: 50,
    },
    {
      title: 'locale',
      key: 'code',
      minWidth: 100,
      resizable: true,
    },
    {
      title: 'path',
      key: 'path',
      minWidth: 300,
      resizable: true,
    },
    {
      title: 'Action',
      key: 'actions',
      render(row) {
        return h(
          NButton,
          {
            strong: true,
            tertiary: true,
            size: 'small',
            onClick: () => remove(row),
          },
          { default: () => 'remove' }
        );
      },
    },
  ];
};

let data = computed(() =>
  [...gettext.value.locales.values()].map((locale, no) => ({ ...locale, no }))
);

const columns = createColumns({
  remove(row: Locale) {
    console.log(row);
  },
});
</script>
