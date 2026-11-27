<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VbenFormSchema } from '#/adapter/form';
import type { BabyFeedingRecordApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createFeedingRecord, updateFeedingRecord } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

/** 表单控件值：喂奶时间为 Dayjs，提交前编码为后端要求的 ISO 8601 字符串 */
interface FeedingFormValues extends Record<string, unknown> {
  amount?: number;
  duration?: number;
  feedTime?: Dayjs;
  feedType?: number;
  remark?: string;
  side?: number;
}

const emits = defineEmits(['success']);

const formData = ref<BabyFeedingRecordApi.FeedingRecord>();

const [Form, formApi] = useVbenForm<FeedingFormValues>({
  schema: useFormSchema() as VbenFormSchema<FeedingFormValues>[],
  showDefaultActions: false,
});

const id = ref<string>();

const [Drawer, drawerApi] = useVbenDrawer<
  BabyFeedingRecordApi.FeedingRecord | null
>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    // 按后端 DTO 白名单构造载荷：可选数值为空时下发 null 以清空记录值；
    // 备注空字符串归一化为不下发，避免 @IsString 之外的空值语义歧义
    const payload: BabyFeedingRecordApi.CreateModel = {
      amount: values.amount ?? null,
      duration: values.duration ?? null,
      feedTime: values.feedTime!.format('YYYY-MM-DDTHH:mm:ss'),
      feedType: values.feedType!,
      remark: values.remark || undefined,
      side: values.side ?? null,
    };
    (id.value
      ? updateFeedingRecord(id.value, payload)
      : createFeedingRecord(payload))
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
          amount: data.amount ?? undefined,
          duration: data.duration ?? undefined,
          feedTime: data.feedTime ? dayjs(data.feedTime) : undefined,
          feedType: data.feedType,
          remark: data.remark,
          side: data.side ?? undefined,
        });
      }
    }
  },
});

defineExpose({ drawerApi });

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('babyRecord.feeding.name'))
    : $t('common.create', $t('babyRecord.feeding.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
