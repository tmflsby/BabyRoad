<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VbenFormSchema } from '#/adapter/form';
import type { BabySleepRecordApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createSleepRecord, updateSleepRecord } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

/** 表单控件值：日期时间为 Dayjs，提交前统一编码为后端要求的 ISO 8601 字符串 */
interface SleepFormValues extends Record<string, unknown> {
  endTime?: Dayjs;
  quality?: number;
  remark?: string;
  sleepType?: number;
  startTime?: Dayjs;
}

const emits = defineEmits(['success']);

const formData = ref<BabySleepRecordApi.SleepRecord>();

const [Form, formApi] = useVbenForm<SleepFormValues>({
  schema: useFormSchema() as VbenFormSchema<SleepFormValues>[],
  showDefaultActions: false,
});

const id = ref<string>();

/** 日期时间控件值为 Dayjs，后端 DTO 要求 ISO 8601 字符串 */
function toIso(value?: Dayjs) {
  return value?.format('YYYY-MM-DDTHH:mm:ss');
}

/** 后端返回的时间字符串回填为 Dayjs，供 DatePicker 展示 */
function toDayjs(value: null | string | undefined) {
  return value ? dayjs(value) : undefined;
}

const [Drawer, drawerApi] = useVbenDrawer<
  BabySleepRecordApi.SleepRecord | null
>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    // 按后端 DTO 白名单构造载荷：duration 由后端依据入睡/醒来时间计算，不下发；
    // 醒来时间为空（未醒）时省略 endTime；备注空字符串归一化为不下发
    const endTime = toIso(values.endTime);
    const payload: BabySleepRecordApi.CreateModel = {
      quality: values.quality ?? null,
      remark: values.remark || undefined,
      sleepType: values.sleepType,
      startTime: toIso(values.startTime)!,
    };
    // 未醒时不下发 endTime，避免覆盖后端已有的醒来时间
    if (endTime) {
      payload.endTime = endTime;
    }
    (id.value
      ? updateSleepRecord(id.value, payload)
      : createSleepRecord(payload))
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
          endTime: toDayjs(data.endTime),
          quality: data.quality ?? undefined,
          remark: data.remark,
          sleepType: data.sleepType,
          startTime: toDayjs(data.startTime),
        });
      }
    }
  },
});

defineExpose({ drawerApi });

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('babyRecord.sleep.name'))
    : $t('common.create', $t('babyRecord.sleep.name'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
