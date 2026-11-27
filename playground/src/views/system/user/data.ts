import type { DescriptionsItemType } from '@vben/common-ui';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api';

import { h } from 'vue';

import { useDictStore } from '@vben/stores';

import { Tag } from 'antdv-next';

import { z } from '#/adapter/form';
import { getDeptList, getRoleList } from '#/api';
import { $t } from '#/locales';

const USER_GENDER_CODE = 'user_gender';

/**
 * 获取角色选项：后端 /system/role/list 返回分页 {list,total}，不传分页参数则返回全部；
 * 角色名称字段为 roleName，id 为 bigint(接口返回字符串)，
 * 后端 roleIds 声明为整型数组且无类型转换，此处统一转为 number
 */
async function getRoleOptions() {
  const res: any = await getRoleList({});
  const rows = Array.isArray(res) ? res : (res?.list ?? []);
  return rows.map((role: any) => ({
    label: role.roleName,
    value: Number(role.id),
  }));
}

/**
 * 获取编辑表单的字段配置
 * 字段与后端 sys_user 表(实体/CreateUserDto/UpdateUserDto)保持一致
 */
export function useFormSchema(): VbenFormSchema[] {
  const dictStore = useDictStore();
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: {
        maxlength: 32,
      },
      fieldName: 'password',
      label: $t('system.user.password'),
      // 与后端 DTO 保持一致：密码长度不少于6位；编辑时由表单动态放宽为可选
      rules: z
        .string()
        .min(6, $t('ui.formRules.minLength', [$t('system.user.password'), 6])),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'nickname',
      label: $t('system.user.nickname'),
      rules: z
        .string()
        .max(
          64,
          $t('ui.formRules.maxLength', [$t('system.user.nickname'), 64]),
        )
        .or(z.literal(''))
        .optional(),
    },
    {
      // 性别：后端实体/DTO 同步拓展中，随表单一起提交
      component: 'RadioGroup',
      componentProps: () => ({
        buttonStyle: 'solid',
        options: dictStore.getDictSync(USER_GENDER_CODE),
        optionType: 'button',
      }),
      fieldName: 'gender',
      label: $t('system.user.gender'),
    },
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
      fieldName: 'deptId',
      label: $t('system.user.dept'),
    },
    {
      // 关联角色：创建时必选(后端 ArrayNotEmpty)，编辑时传入则全量重置用户角色
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRoleOptions,
        class: 'w-full',
        maxTagCount: 'responsive',
        mode: 'multiple',
      },
      fieldName: 'roleIds',
      label: $t('system.user.roles'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 32,
      },
      fieldName: 'phone',
      label: $t('system.user.phone'),
      // 与后端 DTO 的校验规则保持一致，允许为空
      rules: z
        .string()
        .regex(/^1[3-9]\d{9}$/, $t('system.user.phoneFormat'))
        .or(z.literal(''))
        .optional(),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 128,
      },
      fieldName: 'email',
      label: $t('system.user.email'),
      rules: z
        .string()
        .email($t('system.user.emailFormat'))
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
      label: $t('system.user.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 500,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.user.remark'),
      rules: z
        .string()
        .max(
          500,
          $t('ui.formRules.maxLength', [$t('system.user.remark'), 500]),
        )
        .or(z.literal(''))
        .optional(),
    },
  ];
}

/**
 * 获取列表查询表单的字段配置
 * gender/remark/createTime 等参数照常下发，后端 QueryUserDto 同步拓展支持
 */
export function useGridFormSchema(): VbenFormSchema[] {
  const dictStore = useDictStore();
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.nickname'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: () => dictStore.getDict(USER_GENDER_CODE),
        class: 'w-full',
      },
      fieldName: 'gender',
      label: $t('system.user.gender'),
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
      label: $t('system.user.status'),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('system.user.remark'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.user.createTime'),
    },
  ];
}

/**
 * 用户详情描述列表项
 * @param row 用户数据
 * @param deptName 部门ID对应的名称映射(由详情抽屉查询部门树后传入)
 */
export function useDescriptionItems(
  row?: SystemUserApi.SystemUser,
  deptName?: string,
): DescriptionsItemType[] {
  const dictStore = useDictStore();
  const enabled = row?.isEnabled === 1;
  return [
    { label: $t('system.user.username'), content: row?.username },
    { label: $t('system.user.nickname'), content: row?.nickname },
    {
      label: $t('system.user.gender'),
      content: dictStore.getDictLabel(USER_GENDER_CODE, row?.gender) ?? undefined,
    },
    { label: $t('system.user.dept'), content: deptName ?? row?.deptId },
    {
      label: $t('system.user.roles'),
      content: () =>
        row?.roles && row.roles.length > 0
          ? h(
              'div',
              { class: 'flex flex-wrap gap-1' },
              row.roles.map((role) =>
                h(Tag, { color: 'blue', key: role.id }, { default: () => role.roleName }),
              ),
            )
          : '-',
    },
    { label: $t('system.user.phone'), content: row?.phone },
    { label: $t('system.user.email'), content: row?.email },
    {
      label: $t('system.user.status'),
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
    { label: $t('system.user.createTime'), content: row?.createTime },
    { label: $t('system.user.remark'), content: row?.remark },
  ];
}

export function useColumns(
  onStatusChange?: (
    newStatus: any,
    row: SystemUserApi.SystemUser,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridColumns {
  // 表格仅展示核心列，性别/手机号/邮箱/备注等字段在详情抽屉中展示
  return [
    {
      field: 'username',
      title: $t('system.user.username'),
      width: 150,
    },
    {
      field: 'nickname',
      title: $t('system.user.nickname'),
      width: 150,
    },
    {
      // 关联角色：后端 list 行携带 roles 数组，展示角色名称
      field: 'roles',
      formatter: ({ cellValue }: { cellValue: any }) =>
        (cellValue ?? []).map((role: any) => role.roleName).join('、') || '-',
      minWidth: 160,
      title: $t('system.user.roles'),
    },
    {
      // 状态开关/标签绑定后端 isEnabled 字段(1-启用, 0-禁用)
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'isEnabled',
      title: $t('system.user.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      formatter: 'formatDateTime',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: $t('system.user.operation'),
      width: 180,
    },
  ];
}
