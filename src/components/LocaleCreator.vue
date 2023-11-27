<template>
  <v-dialog :max-width="500" scrollable persistent ke v-model="dialog">
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ $t('action.add_locale.create_from_template') }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-text-field
              v-model="code"
              :rules="codeRules"
              :label="$t('common.locale')"
              variant="outlined"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              v-model="dir"
              :label="$t('common.path')"
              :rules="dirRules"
              variant="outlined"
            >
              <template #prepend-inner>
                <v-btn
                  icon="mdi-folder-outline"
                  flat
                  @click="onSelectDir"
                ></v-btn>
              </template>
            </v-text-field>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="primary" variant="text" @click="submit">
          {{ $t('common.ok') }}
        </v-btn>
        <v-btn color="primary" variant="text" @click="closeDialog">
          {{ $t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { fs } from '@tauri-apps/api';
import { useVModel } from '@vueuse/core';
import { join } from 'path-browserify';
import { useI18n } from 'vue-i18n';
import useGettext from '../stores/gettext';
import { getCwd, isDir } from '../utils/invoke';
import { selectSingleDir } from '../utils/file';

export interface CreateLocaleForm {
  code: string;
  path: string;
}
const props = defineProps<{
  dialog: boolean;
}>();
const emits = defineEmits<{
  (e: 'update:dialog', value: boolean): void;
  (e: 'submit', value: CreateLocaleForm): void;
}>();
const dialog = useVModel(props, 'dialog', emits);
const { t } = useI18n();
const gettext = useGettext();

const dirRules = [
  (value: string) => !!value || t('error.field_required'),
  async (value: string) =>
    (await fs.exists(value)) || t('error.path_not_exist'),
  async (value: string) =>
    (await isDir(value)) || t('error.reuqires_dir_instead_of_file'),
];
const codeRules = [
  (value: string) => !!value || t('error.field_required'),
  (value: string) =>
    !gettext.value.locales.has(value) || t('error.locale_already_exists'),
];

const code = ref('');
const dir = ref('');
const form = ref();

watch(
  () => props.dialog,
  (value) => {
    if (value) {
      getCwd().then((path) => {
        dir.value = path;
      });
    }
  }
);

async function submit() {
  if (form.value) {
    const { valid } = await form.value.validate();
    if (valid) {
      const path = join(dir.value, `${code.value}.po`);
      emits('submit', {
        code: code.value,
        path,
      });
      closeDialog();
    }
  }
}

function closeDialog() {
  dialog.value = false;
  dir.value = '';
  code.value = '';
}
async function onSelectDir() {
  const target = await selectSingleDir();
  if (target) {
    dir.value = target;
  }
}
</script>
