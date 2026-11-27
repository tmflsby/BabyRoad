import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

/**
 * 获取编辑表单的字段配置。如果没有使用多语言，可以直接export一个数组常量
 * 字段与后端 sys_dept 表(实体/CreateDeptDto/UpdateDeptDto)保持一致
 */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        class: 'w-full',
        labelField: 'deptName',
        valueField: 'id',
        childrenField: 'children',
      },
      fieldName: 'parentId',
      label: $t('system.dept.parentDept'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'deptName',
      label: $t('system.dept.deptName'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.dept.deptName'), 2]))
        .max(
          64,
          $t('ui.formRules.maxLength', [$t('system.dept.deptName'), 64]),
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
      label: $t('system.dept.sortOrder'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'leader',
      label: $t('system.dept.leader'),
      rules: z
        .string()
        .max(
          64,
          $t('ui.formRules.maxLength', [$t('system.dept.leader'), 64]),
        )
        .optional(),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 32,
      },
      fieldName: 'phone',
      label: $t('system.dept.phone'),
      // 与后端 DTO 的校验规则保持一致，允许为空
      rules: z
        .string()
        .regex(/^1[3-9]\d{9}$/, $t('system.dept.phoneFormat'))
        .or(z.literal(''))
        .optional(),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 128,
      },
      fieldName: 'email',
      label: $t('system.dept.email'),
      rules: z
        .string()
        .email($t('system.dept.emailFormat'))
        .or(z.literal(''))
        .optional(),
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
      label: $t('system.dept.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 500,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.dept.remark'),
      rules: z
        .string()
        .max(
          500,
          $t('ui.formRules.maxLength', [$t('system.dept.remark'), 500]),
        )
        .optional(),
    },
  ];
}

/**
 * 获取表格列配置
 * @description 使用函数的形式返回列数据而不是直接export一个Array常量，是为了响应语言切换时重新翻译表头
 * @param onActionClick 表格操作按钮点击事件
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemDeptApi.SystemDept>,
): VxeTableGridColumns<SystemDeptApi.SystemDept> {
  return [
    {
      align: 'left',
      field: 'deptName',
      fixed: 'left',
      title: $t('system.dept.deptName'),
      treeNode: true,
      width: 200,
    },
    {
      field: 'sortOrder',
      title: $t('system.dept.sortOrder'),
      width: 90,
    },
    {
      // CellTag 默认将 1/0 渲染为 启用/禁用，与后端 isEnabled 字段取值一致
      cellRender: { name: 'CellTag' },
      field: 'isEnabled',
      title: $t('system.dept.status'),
      width: 100,
    },
    {
      field: 'leader',
      title: $t('system.dept.leader'),
      width: 120,
    },
    {
      field: 'phone',
      title: $t('system.dept.phone'),
      width: 140,
    },
    {
      field: 'email',
      title: $t('system.dept.email'),
      width: 180,
    },
    {
      field: 'createTime',
      title: $t('system.dept.createTime'),
      formatter: 'formatDateTime',
      width: 180,
    },
    {
      field: 'remark',
      title: $t('system.dept.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'deptName',
          nameTitle: $t('system.dept.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: '新增下级',
          },
          'edit', // 默认的编辑按钮
          {
            code: 'delete', // 默认的删除按钮
            disabled: (row: SystemDeptApi.SystemDept) => {
              return !!(row.children && row.children.length > 0);
            },
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.dept.operation'),
      width: 200,
    },
  ];
}
