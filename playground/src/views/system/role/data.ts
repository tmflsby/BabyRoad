import type { DescriptionsItemType } from '@vben/common-ui';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api';

import { h } from 'vue';

import { Tag } from 'antdv-next';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

/**
 * 获取编辑表单的字段配置
 * 字段与后端 sys_role 实体(CreateRoleDto/UpdateRoleDto)保持一致
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'roleName',
      label: $t('system.role.roleName'),
      // 与后端 DTO 保持一致：角色名称长度 2-64
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.role.roleName'), 2]))
        .max(64, $t('ui.formRules.maxLength', [$t('system.role.roleName'), 64])),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
      fieldName: 'roleKey',
      label: $t('system.role.roleKey'),
      // 与后端 DTO 保持一致：字母开头，仅允许字母、数字、下划线、冒号和逗号
      rules: z
        .string()
        .regex(
          /^[a-zA-Z][a-zA-Z0-9_:,]*$/,
          $t('system.role.roleKeyFormat'),
        ),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 0,
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: $t('system.role.sortOrder'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'isEnabled',
      label: $t('system.role.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 500,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.role.remark'),
      rules: z
        .string()
        .max(
          500,
          $t('ui.formRules.maxLength', [$t('system.role.remark'), 500]),
        )
        .or(z.literal(''))
        .optional(),
    },
    {
      // 菜单授权：通过自定义插槽渲染 Tree，v-model 绑定到 menuIds
      component: 'Input',
      fieldName: 'menuIds',
      formItemClass: 'items-start',
      label: $t('system.role.setPermissions'),
      modelPropName: 'modelValue',
    },
  ];
}

/**
 * 获取列表查询表单的字段配置
 * 查询参数与后端 QueryRoleDto 白名单对齐
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'roleName',
      label: $t('system.role.roleName'),
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: $t('system.role.roleKey'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'isEnabled',
      label: $t('system.role.status'),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.role.createTime'),
    },
  ];
}

/**
 * 角色详情描述列表项
 * 备注等字段不在表格列展示，统一在详情抽屉中呈现
 * @param row 角色数据
 */
export function useDescriptionItems(
  row?: SystemRoleApi.SystemRole,
): DescriptionsItemType[] {
  const enabled = row?.isEnabled === 1;
  return [
    { label: $t('system.role.roleName'), content: row?.roleName },
    { label: $t('system.role.roleKey'), content: row?.roleKey },
    { label: $t('system.role.sortOrder'), content: row?.sortOrder },
    {
      label: $t('system.role.status'),
      content: () =>
        h(
          Tag,
          {
            color: enabled ? 'success' : 'error',
          },
          {
            default: () =>
              enabled ? $t('common.enabled') : $t('common.disabled'),
          },
        ),
    },
    { label: $t('system.role.createTime'), content: row?.createTime },
    { label: $t('system.role.remark'), content: row?.remark },
  ];
}

export function useColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridColumns {
  // 表格仅展示核心列，备注等字段在详情抽屉中展示
  return [
    {
      field: 'roleName',
      title: $t('system.role.roleName'),
    },
    {
      field: 'roleKey',
      title: $t('system.role.roleKey'),
    },
    {
      field: 'sortOrder',
      title: $t('system.role.sortOrder'),
      width: 100,
    },
    {
      // 状态开关/标签绑定后端 isEnabled 字段(1-启用, 0-禁用)
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'isEnabled',
      title: $t('system.role.status'),
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      formatter: 'formatDateTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'roleName',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      // 操作列含 详情/编辑/删除 三个按钮，适当加宽
    },
  ];
}
