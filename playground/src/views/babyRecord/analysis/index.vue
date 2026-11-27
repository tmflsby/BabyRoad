<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ComputedRef } from 'vue';

import type { ECOption } from '@vben/plugins/echarts';

import type {
  BabyProfile,
  GrowthMetric,
  GrowthRangePreset,
  RangePreset,
} from './data';

import type { BabyRecordAnalysisApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { message, RadioGroup, Space, Tooltip } from 'antdv-next';

import {
  getAnalysisOverview,
  getDiaperAnalysis,
  getFeedingAnalysis,
  getGrowthAnalysis,
  getSleepAnalysis,
} from '#/api';
import { $t } from '#/locales';
import { createDateRangeCodec } from '#/utils/date-range-codec';

import {
  buildDateAxis,
  buildDiaperTrendOption,
  buildDiaperTypeOption,
  buildFeedingHourOption,
  buildFeedingTrendOption,
  buildFeedingTypeOption,
  buildGrowthTrendOption,
  buildSleepQualityOption,
  buildSleepTrendOption,
  buildStoolColorOption,
  buildStoolTextureOption,
  growthMetricOptions,
  growthRangePresetOptions,
  MAX_RANGE_DAYS,
  presetRange,
  readBabyProfile,
  writeBabyProfile,
} from './data';
import ChartPanel from './modules/chart-panel.vue';
import OverviewCards from './modules/overview-cards.vue';
import Toolbar from './modules/toolbar.vue';

/** 区间编码用的表单值结构（RangePicker 值 → startDate/endDate） */
interface RangeFormValues extends Record<string, unknown> {
  range?: [Dayjs, Dayjs];
}

const rangeCodec = createDateRangeCodec<RangeFormValues>()({
  endField: 'endDate',
  // 统计接口按日期区间聚合，YYYY-MM-DD 即可
  format: 'YYYY-MM-DD',
  rangeField: 'range',
  startField: 'startDate',
});

const preset = ref<RangePreset>('7');
const customRange = ref<[Dayjs, Dayjs]>();
const babyProfile = ref<BabyProfile>(readBabyProfile());
const growthMetric = ref<GrowthMetric>('weight');
/** 成长记录频次远低于其他三项，因此用独立长区间，不受顶部区间约束 */
const growthPreset = ref<GrowthRangePreset>('90');

/** 档案说明图标，与工具条保持一致 */
const HelpIcon = createIconifyIcon('mdi:help-circle-outline');

/** 当前生效区间：快捷档优先，自定义档取用户选择的区间 */
const resolvedRange = computed<[Dayjs, Dayjs]>(() => {
  if (preset.value === 'custom' && customRange.value) {
    return customRange.value;
  }
  const days = Number(preset.value);
  return presetRange(Number.isNaN(days) ? 7 : days);
});

/** 下发后端的查询参数（DTO 白名单仅 startDate/endDate） */
const queryParams = computed<BabyRecordAnalysisApi.DateRangeParams>(() => {
  const { endDate, startDate } = rangeCodec.encode({
    range: resolvedRange.value,
  });
  return { endDate: endDate!, startDate: startDate! };
});

/** 按日补齐的类目轴，供趋势图对齐使用 */
const dateAxis = computed(() =>
  buildDateAxis(queryParams.value.startDate, queryParams.value.endDate),
);

/** 成长趋势的独立区间参数 */
const growthParams = computed<BabyRecordAnalysisApi.DateRangeParams>(() => {
  const [start, end] = presetRange(Number(growthPreset.value));
  return {
    endDate: end.format('YYYY-MM-DD'),
    startDate: start.format('YYYY-MM-DD'),
  };
});

/**
 * 统计查询：区间变化自动重取
 * queryFn 用箭头函数包装，避免直接传 API 函数导致可选参数破坏重载匹配
 * retry 关闭：统计接口尚未实现时，重试会把 5 个卡片的错误提示放大成 15 次
 * @param name 接口标识，进入 queryKey
 * @param fetcher 取数函数
 * @param params 查询参数来源，默认跟随顶部统计区间
 */
function useAnalysisQuery<TData>(
  name: string,
  fetcher: (params: BabyRecordAnalysisApi.DateRangeParams) => Promise<TData>,
  params: ComputedRef<BabyRecordAnalysisApi.DateRangeParams> = queryParams,
) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetcher(params.value),
    queryKey: computed(() => ['babyRecord', 'analysis', name, params.value]),
    retry: false,
  });
}

const {
  data: overviewData,
  isError: overviewError,
  isFetching: overviewLoading,
} = useAnalysisQuery('overview', getAnalysisOverview);

const {
  data: sleepData,
  isError: sleepError,
  isFetching: sleepLoading,
} = useAnalysisQuery('sleep', getSleepAnalysis);

const {
  data: feedingData,
  isError: feedingError,
  isFetching: feedingLoading,
} = useAnalysisQuery('feeding', getFeedingAnalysis);

const {
  data: diaperData,
  isError: diaperError,
  isFetching: diaperLoading,
} = useAnalysisQuery('diaper', getDiaperAnalysis);

const {
  data: growthData,
  isError: growthError,
  isFetching: growthLoading,
} = useAnalysisQuery('growth', getGrowthAnalysis, growthParams);

const sleepTrendOption = computed<ECOption | undefined>(() =>
  sleepData.value
    ? buildSleepTrendOption(sleepData.value, dateAxis.value)
    : undefined,
);
const sleepQualityOption = computed<ECOption | undefined>(() =>
  sleepData.value ? buildSleepQualityOption(sleepData.value) : undefined,
);
const feedingTrendOption = computed<ECOption | undefined>(() =>
  feedingData.value
    ? buildFeedingTrendOption(feedingData.value, dateAxis.value)
    : undefined,
);
const feedingTypeOption = computed<ECOption | undefined>(() =>
  feedingData.value ? buildFeedingTypeOption(feedingData.value) : undefined,
);
const feedingHourOption = computed<ECOption | undefined>(() =>
  feedingData.value ? buildFeedingHourOption(feedingData.value) : undefined,
);
const diaperTrendOption = computed<ECOption | undefined>(() =>
  diaperData.value
    ? buildDiaperTrendOption(diaperData.value, dateAxis.value)
    : undefined,
);
const diaperTypeOption = computed<ECOption | undefined>(() =>
  diaperData.value ? buildDiaperTypeOption(diaperData.value) : undefined,
);
const stoolColorOption = computed<ECOption | undefined>(() =>
  diaperData.value ? buildStoolColorOption(diaperData.value) : undefined,
);
const stoolTextureOption = computed<ECOption | undefined>(() =>
  diaperData.value ? buildStoolTextureOption(diaperData.value) : undefined,
);
const growthOption = computed<ECOption | undefined>(() =>
  growthData.value
    ? buildGrowthTrendOption(
        growthData.value,
        growthMetric.value,
        babyProfile.value,
      )
    : undefined,
);

function onPresetChange(value: RangePreset) {
  preset.value = value;
}

/** 自定义区间：超出跨度上限时提示并忽略本次选择 */
function onRangeChange(next: [Dayjs, Dayjs]) {
  const span = next[1].diff(next[0], 'day') + 1;
  if (span > MAX_RANGE_DAYS) {
    message.warning(
      $t('babyRecord.analysis.rangeLimitTip', [MAX_RANGE_DAYS, span]),
    );
    return;
  }
  customRange.value = next;
  preset.value = 'custom';
}

// 宝宝档案仅本地记忆，不进入任何请求参数
watch(babyProfile, (profile) => writeBabyProfile(profile), { deep: true });
</script>

<template>
  <div class="p-5">
    <Toolbar
      v-model:profile="babyProfile"
      :preset="preset"
      :resolved-range="resolvedRange"
      @preset-change="onPresetChange"
      @range-change="onRangeChange"
    />

    <OverviewCards
      :data="overviewData"
      :error="overviewError"
      :growth="growthData?.list"
      :loading="overviewLoading || growthLoading"
    />

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <ChartPanel
        :error="sleepError"
        :loading="sleepLoading"
        :option="sleepTrendOption"
        :title="$t('babyRecord.analysis.sleepTrend')"
      />
      <ChartPanel
        :error="sleepError"
        :loading="sleepLoading"
        :option="sleepQualityOption"
        :title="$t('babyRecord.analysis.sleepQuality')"
      />
      <ChartPanel
        :error="feedingError"
        :loading="feedingLoading"
        :option="feedingTrendOption"
        :title="$t('babyRecord.analysis.feedingTrend')"
      />
      <ChartPanel
        :error="feedingError"
        :loading="feedingLoading"
        :option="feedingTypeOption"
        :title="$t('babyRecord.analysis.feedingType')"
      />
      <ChartPanel
        :error="feedingError"
        :loading="feedingLoading"
        :option="feedingHourOption"
        :title="$t('babyRecord.analysis.feedingHour')"
      />
      <ChartPanel
        :error="diaperError"
        :loading="diaperLoading"
        :option="diaperTrendOption"
        :title="$t('babyRecord.analysis.diaperTrend')"
      />
      <ChartPanel
        :error="diaperError"
        :loading="diaperLoading"
        :option="diaperTypeOption"
        :title="$t('babyRecord.analysis.diaperType')"
      />
      <ChartPanel
        :error="diaperError"
        :loading="diaperLoading"
        :option="stoolColorOption"
        :title="$t('babyRecord.analysis.stoolColor')"
      />
      <ChartPanel
        :error="diaperError"
        :loading="diaperLoading"
        :option="stoolTextureOption"
        :title="$t('babyRecord.analysis.stoolTexture')"
      />
      <ChartPanel
        class="lg:col-span-2 xl:col-span-3"
        :error="growthError"
        height="380px"
        :loading="growthLoading"
        :option="growthOption"
        :title="$t('babyRecord.analysis.growthTrend')"
      >
        <template #extra>
          <Space wrap>
            <RadioGroup
              button-style="solid"
              :options="growthRangePresetOptions()"
              option-type="button"
              size="small"
              v-model:value="growthPreset"
            />
            <Tooltip :title="$t('babyRecord.analysis.growthRangeTip')">
              <HelpIcon class="size-4 cursor-help opacity-60" />
            </Tooltip>
            <RadioGroup
              v-model:value="growthMetric"
              button-style="solid"
              :options="growthMetricOptions()"
              option-type="button"
              size="small"
            />
          </Space>
        </template>
      </ChartPanel>
    </div>
  </div>
</template>
