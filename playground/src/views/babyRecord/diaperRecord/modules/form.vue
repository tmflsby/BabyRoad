<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VbenFormSchema } from '#/adapter/form';
import type { BabyDiaperRecordApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createDiaperRecord, updateDiaperRecord } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

/** 表单控件值：更换时间为 Dayjs，提交前编码为后端要求的 ISO 8601 字符串 */
interface DiaperFormValues extends Record<string, unknown> {
  changeTime?: Dayjs;
  diaperType?: number;
  remark?: string;
  stoolColor?: number;
  stoolTexture?: number;
  urineAmount?: number;
  urineColor?: number;
}

const emits = defineEmits(['success']);

const formData = ref<BabyDiaperRecordApi.DiaperRecord>();

const [Form, formApi] = useVbenForm<DiaperFormValues>({
  schema: useFormSchema() as VbenFormSchema<DiaperFormValues>[],
  showDefaultActions: false,
});

const id = ref<string>();

/** 是否含小便成分（1-小便 3-混合） */
function hasUrine(diaperType: number) {
  return diaperType === 1 || diaperType === 3;
}

/** 是否含大便成分（2-大便 3-混合） */
function hasStool(diaperType: number) {
  return diaperType === 2 || diaperType === 3;
}

const [Drawer, drawerApi] = useVbenDrawer<
  BabyDiaperRecordApi.DiaperRecord | null
>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    const diaperType = values.diaperType!;
    // 按后端 DTO 白名单构造载荷：与类型不匹配的一侧字段下发 null，
    // 使小便改大便（或反之）时后端能清空另一侧的旧值；
    // 备注空字符串归一化为不下发
    const payload: BabyDiaperRecordApi.CreateModel = {
      changeTime: values.changeTime!.format('YYYY-MM-DDTHH:mm:ss'),
      diaperType,
      remark: values.remark || undefined,
      stoolColor: hasStool(diaperType) ? values.stoolColor ?? null : null,
      stoolTexture: hasStool(diaperType) ? values.stoolTexture ?? null : null,
      urineAmount: hasUrine(diaperType) ? values.urineAmount ?? null : null,
      urineColor: hasUrine(diaperType) ? values.urineColor ?? null : null,
    };
    (id.value
      ? updateDiaperRecord(id.value, payload)
      : createDiaperRecord(payload))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData();
      formData.value = data ?? undefined;
      id.value = data?.id;
      formApi.reset();

      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues({
          changeTime: data.changeTime ? dayjs(data.changeTime) : undefined,
          diaperType: data.diaperType,
          remark: data.remark,
          stoolColor: data.stoolColor ?? undefined,
          stoolTexture: data.stoolTexture ?? undefined,
          urineAmount: data.urineAmount ?? undefined,
          urineColor: data.urineColor ?? undefined,
        });
      }
    }
  },
});

defineExpose({ drawerApi });

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('babyRecord.diaper.name'))
    : $t('common.create', $t('babyRecord.diaper.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
