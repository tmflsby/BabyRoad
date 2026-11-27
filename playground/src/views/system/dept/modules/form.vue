<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createDept, updateDept } from '#/api/system/dept';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemDeptApi.SystemDept>();
type DeptModalData =
  | null
  | SystemDeptApi.SystemDept
  | { parentId: SystemDeptApi.SystemDept['parentId'] };

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.dept.name')])
    : $t('ui.actionTitle.create', [$t('system.dept.name')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.reset();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal<DeptModalData>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<SystemDeptApi.DeptFormModel>();
      // 未选择上级部门时按顶级处理(parentId=0)；清空输入产生的空字符串会被
      // 后端 DTO 校验拒绝，统一转为 undefined
      const payload = { ...data, parentId: data.parentId ?? 0 };
      Object.keys(payload).forEach((key) => {
        const k = key as keyof typeof payload;
        if (payload[k] === '') {
          payload[k] = undefined as never;
        }
      });
      try {
        await (formData.value?.id
          ? updateDept(formData.value.id, payload)
          : createDept(payload));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      if (data) {
        formData.value = 'id' in data ? data : undefined;
        // 顶级部门 parentId 为 0(bigint 可能以字符串 '0' 返回)，上级选择框保持空白
        const formValues = {
          ...data,
          ...(Number(data.parentId) === 0 ? { parentId: undefined } : {}),
        };
        formApi.setValues(formValues);
      } else {
        formData.value = undefined;
        formApi.reset();
      }
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm">
          {{ $t('common.reset') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
