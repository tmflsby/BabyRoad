<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VbenFormSchema } from '#/adapter/form';
import type { BabyGrowthRecordApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createGrowthRecord, updateGrowthRecord } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

/** 表单控件值：记录日期为 Dayjs，提交前编码为后端要求的 ISO 8601 日期字符串 */
interface GrowthFormValues extends Record<string, unknown> {
  chestCircumference?: number;
  headCircumference?: number;
  height?: number;
  heightPercentile?: string;
  recordDate?: Dayjs;
  remark?: string;
  weight?: number;
  weightPercentile?: string;
}

const emits = defineEmits(['success']);

const formData = ref<BabyGrowthRecordApi.GrowthRecord>();

const [Form, formApi] = useVbenForm<GrowthFormValues>({
  schema: useFormSchema() as VbenFormSchema<GrowthFormValues>[],
  showDefaultActions: false,
});

const id = ref<string>();

const [Drawer, drawerApi] = useVbenDrawer<
  BabyGrowthRecordApi.GrowthRecord | null
>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    // 按后端 DTO 白名单构造载荷：未测的头围/胸围下发 null 以清空旧值，
    // 百分位与备注的空字符串归一化为不下发，避免后端 @IsString 校验歧义
    const payload: BabyGrowthRecordApi.CreateModel = {
      chestCircumference: values.chestCircumference ?? null,
      headCircumference: values.headCircumference ?? null,
      height: values.height!,
      heightPercentile: values.heightPercentile || undefined,
      recordDate: values.recordDate!.format('YYYY-MM-DD'),
      remark: values.remark || undefined,
      weight: values.weight!,
      weightPercentile: values.weightPercentile || undefined,
    };
    (id.value
      ? updateGrowthRecord(id.value, payload)
      : createGrowthRecord(payload))
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
          chestCircumference: data.chestCircumference ?? undefined,
          headCircumference: data.headCircumference ?? undefined,
          height: data.height,
          heightPercentile: data.heightPercentile ?? undefined,
          recordDate: data.recordDate ? dayjs(data.recordDate) : undefined,
          remark: data.remark,
          weight: data.weight,
          weightPercentile: data.weightPercentile ?? undefined,
        });
      }
    }
  },
});

defineExpose({ drawerApi });

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('babyRecord.growth.name'))
    : $t('common.create', $t('babyRecord.growth.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
