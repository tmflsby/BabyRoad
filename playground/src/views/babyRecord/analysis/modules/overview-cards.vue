<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import type { BabyRecordAnalysisApi } from '#/api';

import { computed } from 'vue';

import { AnalysisOverview } from '@vben/common-ui';

import { Card, Empty, Spin } from 'antdv-next';

import { $t } from '#/locales';

import { orDash, summarizeGrowth, toHours } from '../data';

interface Props {
  /** 概览统计数据（喂奶/睡眠/尿布），未就绪时为空 */
  data?: BabyRecordAnalysisApi.Overview;
  /** 概览接口报错（含尚未实现） */
  error?: boolean;
  /** 成长趋势明细，成长概览块由它派生并跟随成长独立区间 */
  growth?: BabyRecordAnalysisApi.GrowthItem[];
  /** 取数中 */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: undefined,
  error: false,
  growth: undefined,
  loading: false,
});

/** 成长概览：取成长独立区间的明细派生，避免顶部短区间下永远为空 */
const growthSummary = computed(() => summarizeGrowth(props.growth ?? []));

/** 概览主数字卡：喂奶、睡眠、尿布、成长各一张 */
const items = computed<AnalysisOverviewItem[]>(() => {
  const data = props.data;
  if (!data) {
    return [];
  }
  return [
    {
      icon: 'mdi:baby-bottle',
      title: $t('babyRecord.analysis.overviewFeeding'),
      totalTitle: $t('babyRecord.analysis.overviewFeedingTotal'),
      totalValue: data.feeding.totalAmount ?? 0,
      value: data.feeding.count,
    },
    {
      icon: 'mdi:sleep',
      title: $t('babyRecord.analysis.overviewSleep'),
      totalTitle: $t('babyRecord.analysis.overviewSleepTotal'),
      totalValue: data.sleep.count,
      value: toHours(data.sleep.totalDuration),
    },
    {
      icon: 'mdi:diaper-outline',
      title: $t('babyRecord.analysis.overviewDiaper'),
      totalTitle: $t('babyRecord.analysis.overviewDiaperTotal'),
      totalValue: data.diaper.stoolCount,
      value: data.diaper.count,
    },
    {
      icon: 'mdi:ruler-square',
      title: $t('babyRecord.analysis.overviewGrowth'),
      totalTitle: $t('babyRecord.analysis.overviewGrowthTotal'),
      totalValue: growthSummary.value.latestHeight ?? 0,
      value: growthSummary.value.latestWeight ?? 0,
    },
  ];
});

/** 小时数文本：后端返回 null（无有效时长）时展示 `-` */
function hoursText(minutes: null | number | undefined): string {
  return minutes === null || minutes === undefined
    ? '-'
    : `${toHours(minutes)} ${$t('babyRecord.analysis.hours')}`;
}

/** 概览补充指标：主卡放不下但看板需要的均值/净增 */
const chips = computed(() => {
  const data = props.data;
  if (!data) {
    return [];
  }
  return [
    {
      label: $t('babyRecord.analysis.avgDuration'),
      value: hoursText(data.sleep.avgDuration),
    },
    {
      label: $t('babyRecord.analysis.unfinished'),
      value: orDash(data.sleep.unfinishedCount),
    },
    {
      label: $t('babyRecord.analysis.avgAmount'),
      value: `${orDash(data.feeding.avgAmount)} ml`,
    },
    {
      label: $t('babyRecord.analysis.weightGain'),
      value: `${orDash(growthSummary.value.weightGain)} kg`,
    },
    {
      label: $t('babyRecord.analysis.heightGain'),
      value: `${orDash(growthSummary.value.heightGain)} cm`,
    },
    {
      label: $t('babyRecord.analysis.recordCount'),
      value: orDash(growthSummary.value.recordCount),
    },
  ];
});
</script>

<template>
  <Spin :spinning="loading">
    <Empty
      v-if="error || !data"
      :description="
        error
          ? $t('babyRecord.analysis.errorTip')
          : $t('babyRecord.analysis.emptyTip')
      "
      class="py-10"
    />
    <div v-else>
      <AnalysisOverview :items="items" />
      <Card class="mt-4" size="small">
        <div class="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div v-for="chip in chips" :key="chip.label" class="flex gap-2">
            <span class="opacity-70">{{ chip.label }}</span>
            <span class="font-medium">{{ chip.value }}</span>
          </div>
        </div>
      </Card>
    </div>
  </Spin>
</template>
