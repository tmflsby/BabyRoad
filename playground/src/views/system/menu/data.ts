import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { $t } from '#/locales';

/**
 * 菜单类型选项
 * value 直接使用后端 menuType 的取值(M/C/F/E/L)，避免提交时被 DTO 正则校验拒绝
 */
export function getMenuTypeOptions() {
  return [
    {
      color: 'processing',
      label: $t('system.menu.typeCatalog'),
      value: 'M',
    },
    { color: 'default', label: $t('system.menu.typeMenu'), value: 'C' },
    { color: 'error', label: $t('system.menu.typeButton'), value: 'F' },
    {
      color: 'success',
      label: $t('system.menu.typeEmbedded'),
      value: 'E',
    },
    { color: 'warning', label: $t('system.menu.typeLink'), value: 'L' },
  ];
}

/**
 * 路由地址校验规则，与后端 CreateMenuDto/UpdateMenuDto 的 @Matches 保持一致：
 * 普通菜单以 / 开头，内嵌(E)/外链(L)为 http(s):// 地址，且不允许空格
 */
export const MENU_PATH_REGEX = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

/** 链接地址校验规则：必须以 http(s):// 开头且不含空格，用于内嵌(E)/外链(L)的链接地址字段 */
export const MENU_URL_REGEX = /^https?:\/\/\S+$/;

/** 权限标识校验规则，与后端 DTO 保持一致：字母开头，仅允许字母、数字、下划线、冒号和逗号 */
export const MENU_PERMS_REGEX = /^[a-zA-Z][a-zA-Z0-9_:,]*$/;

/**
 * 获取列表查询表单的字段配置
 * 查询参数与后端 QueryMenuDto 白名单对齐（该接口不分页，返回树形结构）
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'menuName',
      label: $t('system.menu.menuName'),
    },
    {
      component: 'Input',
      fieldName: 'path',
      label: $t('system.menu.path'),
    },
    {
      component: 'Input',
      fieldName: 'perms',
      label: $t('system.menu.authCode'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: getMenuTypeOptions(),
      },
      fieldName: 'menuType',
      label: $t('system.menu.type'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'isEnabled',
      label: $t('system.menu.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.menu.createTime'),
    },
  ];
}

/**
 * 获取表格列配置
 * @description 使用函数的形式返回列数据而不是直接export一个Array常量，是为了响应语言切换时重新翻译表头
 * @param onActionClick 表格操作按钮点击事件
 */
export function useColumns(
  onActionClick: OnActionClickFn<SystemMenuApi.SystemMenu>,
): VxeTableGridColumns<SystemMenuApi.SystemMenu> {
  return [
    {
      align: 'left',
      // 树节点列：表头为"标题"，单元格优先展示 meta.title(支持 i18n key)，无标题时回落 menuName
      field: 'menuName',
      fixed: 'left',
      slots: { default: 'title' },
      title: $t('system.menu.menuTitle'),
      treeNode: true,
      width: 250,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'menuType',
      title: $t('system.menu.type'),
      width: 100,
    },
    {
      field: 'sortOrder',
      title: $t('system.menu.sortOrder'),
      width: 90,
    },
    {
      field: 'perms',
      title: $t('system.menu.authCode'),
      width: 200,
    },
    {
      align: 'left',
      field: 'path',
      title: $t('system.menu.path'),
      width: 200,
    },
    {
      align: 'left',
      field: 'component',
      formatter: ({ row }) => {
        switch (row.menuType) {
          case 'C':
          case 'M': {
            return row.component ?? '';
          }
          case 'E': {
            return row.meta?.iframeSrc ?? '';
          }
          case 'L': {
            return row.meta?.link ?? '';
          }
          case 'F': {
            return '';
          }
        }
        return '';
      },
      minWidth: 200,
      title: $t('system.menu.component'),
    },
    {
      // CellTag 默认将 1/0 渲染为 启用/禁用，与后端 isEnabled 字段取值一致
      cellRender: { name: 'CellTag' },
      field: 'isEnabled',
      title: $t('system.menu.status'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'menuName',
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
            code: 'delete',
            // 后端存在下级菜单时禁止删除，前端同步置灰做双重保护
            disabled: (row: SystemMenuApi.SystemMenu) => {
              return !!(row.children && row.children.length > 0);
            },
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 200,
    },
  ];
}
