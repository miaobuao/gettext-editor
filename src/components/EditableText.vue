<template>
  <n-popconfirm @positive-click="update">
    <template #trigger>
      <n-button class="text-h6" text>
        {{ value }}
      </n-button>
    </template>
    <n-input v-model:value="editing"></n-input>
  </n-popconfirm>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string;
}>();
const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();
const editing = ref('');
watch(
  () => props.value,
  (cur) => {
    editing.value = cur;
  },
  {
    immediate: true,
  }
);
function update() {
  emit('update:value', editing.value);
}
</script>
