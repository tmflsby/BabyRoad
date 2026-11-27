<script lang="ts" setup>
import type { DataNode } from 'antdv-next/dist/tree';

import type { Recordable } from '@vben/types';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { createRole, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemRoleApi.SystemRole>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const permissions = ref<DataNode[]>([]);
const loadingPermissions = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer<null | SystemRoleApi.SystemRole>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<SystemRoleApi.RoleFormModel>();
    drawerApi.lock();
    // 按后端 DTO 白名单构造载荷：menuIds 归一化为整数并去重，
    // 为空时不下发(后端 @ArrayNotEmpty 拒空数组，且未传则不重置菜单)；
    // 备注空字符串归一化为 undefined
    const menuIds = [
      ...new Set(
        (values.menuIds ?? [])
          .map((menuId) => Number(menuId))
          .filter((n) => !Number.isNaN(n)),
      ),
    ];
    const payload: SystemRoleApi.RoleFormModel = {
      isEnabled: values.isEnabled,
      remark: values.remark || undefined,
      roleKey: values.roleKey,
      roleName: values.roleName,
      sortOrder: values.sortOrder,
      ...(menuIds.length > 0 ? { menuIds } : {}),
    };
    (id.value ? updateRole(id.value, payload) : createRole(payload))
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
      formApi.reset();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        formData.value = undefined;
        id.value = undefined;
      }

      if (permissions.value.length === 0) {
        await loadPermissions();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

defineExpose({ drawerApi });

/**
 * 授权菜单树过滤：剔除未启用(isEnabled !== 1)与隐藏(meta.hideInMenu)的菜单，
 * 父级被剔除时其整棵子级一并剔除（父级已不可见，子级不应单独授权）；
 * 返回新树，不修改接口原始数据
 */
function filterEnabledVisibleMenus(
  menus: Recordable<any>[],
): Recordable<any>[] {
  const result: Recordable<any>[] = [];
  for (const menu of menus) {
    const enabled = Number(menu?.isEnabled) === 1;
    const hidden = menu?.meta?.hideInMenu === true;
    if (!enabled || hidden) continue;
    const children = Array.isArray(menu.children)
      ? filterEnabledVisibleMenus(menu.children)
      : undefined;
    result.push({
      ...menu,
      ...(children?.length ? { children } : { children: undefined }),
    });
  }
  return result;
}

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    const res = await getMenuList();
    permissions.value = filterEnabledVisibleMenus(
      res as unknown as Recordable<any>[],
    ) as unknown as DataNode[];
  } finally {
    loadingPermissions.value = false;
  }
}

/** 菜单展示名称：优先 meta.title(可为多语言key)，回落到后端 menuName */
function getMenuNodeLabel(menu: Recordable<any>) {
  const title = menu?.meta?.title;
  return title ? $t(title) : (menu?.menuName ?? '');
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  // 按钮类型(F)与后端 menuType 取值对齐
  if (node.value?.menuType === 'F') {
    classes.push('inline-flex');
  }

  return classes.join(' ');
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form>
      <template #menuIds="slotProps">
        <Spin :spinning="loadingPermissions" :classes="{ root: 'w-full' }">
          <Tree
            :tree-data="permissions"
            multiple
            bordered
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            v-bind="slotProps.componentProps"
            value-field="id"
            label-field="menuName"
            icon-field="meta.icon"
          >
            <template #node="{ value }">
              <IconifyIcon v-if="value.meta?.icon" :icon="value.meta.icon" />
              {{ getMenuNodeLabel(value) }}
            </template>
          </Tree>
        </Spin>
      </template>
    </Form>
  </Drawer>
</template>
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    @apply ml-5 hidden;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    @apply ml-5 flex flex-auto justify-end;
  }
}
</style>
