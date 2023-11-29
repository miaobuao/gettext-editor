<template>
  <v-dialog :max-width="500" scrollable persistent ke v-model="show">
    <v-card>
      <v-card-title>
        <span class="text-h5">
          {{ $t('action.create_msg_id') }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-text-field
              autofocus
              v-model="id"
              :rules="idRules"
              label="Msg ID"
              variant="outlined"
            ></v-text-field>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="primary" variant="text" @click="submit">
          {{ $t('common.ok') }}
        </v-btn>
        <v-btn color="primary" variant="text" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import useGettext from '../stores/gettext';

const props = defineProps<{
  show: boolean;
}>();

const emits = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();
const show = useVModel(props, 'show', emits);
const { t } = useI18n();
const gettext = useGettext();

const idRules = [
  (value: string) => !!value || t('error.field_required'),
  (value: string) =>
    gettext.value.filterMsgId({
      id: value,
    }).length === 0 || t('error.locale_already_exists'),
];

const form = ref();
const id = ref('');

async function submit() {
  if (form.value) {
    const { valid } = await form.value.validate();
    if (valid) {
      gettext.value.appendMsgId({
        id: id.value,
      });
      close();
    }
  }
}

function close() {
  show.value = false;
  id.value = '';
}
</script>
