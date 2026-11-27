<script lang="ts" setup>
import type { SystemDeptApi, SystemUserApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenDrawer, VbenDescriptions } from '@vben/common-ui';

import { getDeptList } from '#/api';
import { $t } from '#/locales';

import { useDescriptionItems } from '../data';

const detailData = ref<SystemUserApi.SystemUser>();
const deptName = ref<string>();

const items = computed(() =>
  useDescriptionItems(detailData.value, deptName.value),
);

// 部门树模块级缓存，避免每次打开详情都重复请求
let deptListCache: SystemDeptApi.SystemDept[] | null = null;

/** 在部门树中递归查找指定 ID 的部门名称 */
function findDeptName(
  list: SystemDeptApi.SystemDept[],
  deptId: string,
): string | undefined {
  for (const dept of list) {
    if (String(dept.id) === deptId) {
      return dept.deptName;
    }
    const found = dept.children?.length
      ? findDeptName(dept.children, deptId)
      : undefined;
    if (found) {
      return found;
    }
  }
  return undefined;
}

async function resolveDeptName(deptId: unknown): Promise<string | undefined> {
  if (deptId === null || deptId === undefined || deptId === '') {
    return undefined;
  }
  deptListCache ??= await getDeptList();
  return findDeptName(deptListCache, String(deptId));
}

const [Drawer, drawerApi] = useVbenDrawer<SystemUserApi.SystemUser>({
  async onOpenChange(isOpen) {
    if (isOpen) {
      detailData.value = drawerApi.getData();
      deptName.value = await resolveDeptName(detailData.value?.deptId);
    }
  },
});

defineExpose({ drawerApi });
</script>
<template>
  <Drawer :footer="false" :title="$t('common.detail')">
    <VbenDescriptions bordered :column="1" :items="items" />
  </Drawer>
</template>
