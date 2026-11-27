<script lang="ts" setup>
import type { EchartsUIType, ECOption } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card, Empty, Spin } from 'antdv-next';

import { $t } from '#/locales';

interface Props {
  /** 统计接口报错（含尚未实现）时展示错误空态 */
  error?: boolean;
  /** 图表高度 */
  height?: string;
  /** 取数中 */
  loading?: boolean;
  /** 图表配置；为空表示无数据，展示空态 */
  option?: ECOption;
  /** 卡片标题 */
  title: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: false,
  height: '320px',
  loading: false,
  option: undefined,
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 图表容器随 v-if 挂载，需等 DOM 更新后再渲染，否则拿不到容器尺寸
watch(
  () => props.option,
  (option) => {
    if (!option) {
      return;
    }
    void nextTick(() => {
      renderEcharts(option);
    });
  },
  { immediate: true },
);
</script>

<template>
  <Card size="small" :title="title">
    <template v-if="$slots.extra" #extra>
      <slot name="extra"></slot>
    </template>
    <Spin :spinning="loading">
      <Empty
        v-if="error || !option"
        :description="
          error
            ? $t('babyRecord.analysis.errorTip')
            : $t('babyRecord.analysis.emptyTip')
        "
        class="py-10"
      />
      <EchartsUI v-else ref="chartRef" :height="height" />
    </Spin>
  </Card>
</template>
