import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 构造育儿记录子路由：动态 import 必须写成静态字面量（Vite 依赖字符串前缀静态分析），
 * 因此仅将重复的 meta/命名结构收敛到该工厂函数中
 */
function createRecordRoute(
  path: string,
  name: string,
  titleKey: string,
  icon: string,
  loader: () => Promise<{ default: Component }>,
): RouteRecordRaw {
  return {
    path,
    name,
    meta: {
      icon,
      title: $t(titleKey),
    },
    component: loader,
  };
}

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:baby-carriage',
      order: 9996,
      title: $t('babyRecord.title'),
    },
    name: 'BabyRecord',
    path: '/babyRecord',
    children: [
      createRecordRoute(
        'analysis',
        'BabyRecordAnalysis',
        'babyRecord.analysis.title',
        'mdi:chart-line',
        () => import('#/views/babyRecord/analysis/index.vue'),
      ),
      createRecordRoute(
        'feedingRecord',
        'BabyFeedingRecord',
        'babyRecord.feeding.title',
        'mdi:baby-bottle',
        () => import('#/views/babyRecord/feedingRecord/list.vue'),
      ),
      createRecordRoute(
        'sleepRecord',
        'BabySleepRecord',
        'babyRecord.sleep.title',
        'mdi:sleep',
        () => import('#/views/babyRecord/sleepRecord/list.vue'),
      ),
      createRecordRoute(
        'diaperRecord',
        'BabyDiaperRecord',
        'babyRecord.diaper.title',
        'mdi:diaper-outline',
        () => import('#/views/babyRecord/diaperRecord/list.vue'),
      ),
      createRecordRoute(
        'growthRecord',
        'BabyGrowthRecord',
        'babyRecord.growth.title',
        'mdi:ruler-square',
        () => import('#/views/babyRecord/growthRecord/list.vue'),
      ),
    ],
  },
];

export default routes;
