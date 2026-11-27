<script lang="ts" setup>
import type { BreadcrumbStyleType } from '@vben/types';

import type { IBreadcrumb } from '@vben-core/shadcn-ui';

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';

import { VbenBreadcrumbView } from '@vben-core/shadcn-ui';

import { resolveBreadcrumbMatches } from './breadcrumb-routes';

interface Props {
  hideWhenOnlyOne?: boolean;
  showHome?: boolean;
  showIcon?: boolean;
  type?: BreadcrumbStyleType;
}

const props = withDefaults(defineProps<Props>(), {
  showHome: false,
  showIcon: false,
  type: 'normal',
});

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const breadcrumbs = computed((): IBreadcrumb[] => {
  const matched = resolveBreadcrumbMatches(route, (path) =>
    router.resolve(path),
  );

  const resultBreadcrumb: IBreadcrumb[] = [];

  for (const match of matched) {
    const { meta, path } = match;
    const { hideChildrenInMenu, hideInBreadcrumb, icon, name, title } =
      meta || {};
    if (hideInBreadcrumb || hideChildrenInMenu || !path) {
      continue;
    }

    resultBreadcrumb.push({
      icon,
      path: path || route.path,
      title: title ? $t((title || name) as string) : '',
    });
  }
  if (props.showHome) {
    resultBreadcrumb.unshift({
      icon: 'mdi:home-outline',
      isHome: true,
      path: '/',
    });
  }
  if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
    return [];
  }

  return resultBreadcrumb;
});

/**
 * 解析面包屑点击的目标路径：
 * 当点击的是目录（存在子菜单、自身一般无页面组件）时，
 * 逐级下钻到其下第一个子菜单直至叶子菜单，避免直接跳转目录路径导致无跳转/空白。
 * @param path 被点击的面包屑路径
 */
function resolveSelectTargetPath(path: string): string {
  let menu = accessStore.getMenuByPath(path);
  while (menu?.children?.length) {
    menu = menu.children[0];
  }
  return menu?.path ?? path;
}

function handleSelect(path: string) {
  router.push(resolveSelectTargetPath(path));
}
</script>
<template>
  <VbenBreadcrumbView
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    :style-type="type"
    class="ml-2"
    @select="handleSelect"
  />
</template>
