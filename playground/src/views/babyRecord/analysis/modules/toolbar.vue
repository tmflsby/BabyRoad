<script lang="ts" setup>
import type { RadioChangeEvent } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import type { BabyProfile, RangePreset } from '../data';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  DatePicker,
  DateRangePicker,
  Flex,
  RadioGroup,
  Select,
  Space,
  Tooltip,
} from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

import { rangePresetOptions } from '../data';

interface Props {
  /** 当前快捷档 */
  preset: RangePreset;
  /** 当前生效区间（含快捷档换算结果），用于区间选择器回显 */
  resolvedRange: [Dayjs, Dayjs];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  presetChange: [value: RangePreset];
  rangeChange: [value: [Dayjs, Dayjs]];
}>();

/** 宝宝档案由父级 v-model 持有并本地记忆 */
const profile = defineModel<BabyProfile>('profile', { required: true });

/** 档案说明的触发图标，避免裸字符与文本基线不齐 */
const HelpIcon = createIconifyIcon('mdi:help-circle-outline');

const presetOptions = computed(() => rangePresetOptions());

const sexOptions = computed(() => [
  { label: $t('babyRecord.analysis.boy'), value: 'boy' },
  { label: $t('babyRecord.analysis.girl'), value: 'girl' },
]);

const birthdayValue = computed(() =>
  profile.value.birthday ? dayjs(profile.value.birthday) : null,
);

/** 出生日期不允许晚于今天 */
function disabledBirthday(current: Dayjs) {
  return current && current > dayjs().endOf('day');
}

function onPresetChange(event: RadioChangeEvent) {
  emit('presetChange', event.target.value as RangePreset);
}

/** DatePicker 类控件的 change 回调同时给到值与格式化字符串，取后者回填文本日期 */
function toDateString(dateString: string | string[]): string {
  return (Array.isArray(dateString) ? dateString[0] : dateString) ?? '';
}

function onRangeChange(_value: unknown, dateStrings: string | string[]) {
  const [start, end] = Array.isArray(dateStrings) ? dateStrings : [];
  if (!start || !end) {
    return;
  }
  emit('rangeChange', [dayjs(start), dayjs(end)]);
}

function onBirthdayChange(_value: unknown, dateString: string | string[]) {
  profile.value = { ...profile.value, birthday: toDateString(dateString) };
}

function onSexChange(value: unknown) {
  profile.value = {
    ...profile.value,
    sex: value === 'boy' || value === 'girl' ? value : '',
  };
}
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <Space wrap>
      <span class="text-sm opacity-70">
        {{ $t('babyRecord.analysis.rangeLabel') }}
      </span>
      <RadioGroup
        button-style="solid"
        :options="presetOptions"
        option-type="button"
        size="middle"
        :value="props.preset"
        @change="onPresetChange"
      />
      <DateRangePicker
        :allow-clear="false"
        :value="props.resolvedRange"
        @change="onRangeChange"
      />
    </Space>
    <Flex align="center" gap="small" wrap>
      <span class="text-sm opacity-70">
        {{ $t('babyRecord.analysis.babyBirthday') }}
      </span>
      <DatePicker
        :disabled-date="disabledBirthday"
        :placeholder="$t('ui.placeholder.select')"
        :value="birthdayValue"
        size="middle"
        @change="onBirthdayChange"
      />
      <span class="text-sm opacity-70">
        {{ $t('babyRecord.analysis.babyGender') }}
      </span>
      <Select
        :allow-clear="true"
        :options="sexOptions"
        :placeholder="$t('ui.placeholder.select')"
        :value="profile.sex || undefined"
        class="w-24"
        size="middle"
        @change="onSexChange"
      />
      <Tooltip :title="$t('babyRecord.analysis.profileTip')">
        <HelpIcon class="size-4 cursor-help opacity-60" />
      </Tooltip>
    </Flex>
  </div>
</template>
