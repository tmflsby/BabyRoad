<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import { getPopupContainer } from '@vben/utils';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useVbenForm, z } from '#/adapter/form';
import {
  createMenu,
  getMenuList,
  isMenuNameExists,
  isMenuPathExists,
  SystemMenuApi,
  updateMenu,
} from '#/api/system/menu';
import { $t } from '#/locales';
import { componentKeys } from '#/router/routes';

import {
  getMenuTypeOptions,
  MENU_PATH_REGEX,
  MENU_PERMS_REGEX,
  MENU_URL_REGEX,
} from '../data';

const emit = defineEmits<{
  success: [];
}>();
const formData = ref<SystemMenuApi.SystemMenu>();
const titleSuffix = ref<string>();

type MenuDrawerData =
  | SystemMenuApi.SystemMenu
  | { parentId?: SystemMenuApi.SystemMenu['parentId'] };
type MenuSubmitValues = SystemMenuApi.MenuFormModel;
type MenuFormValues = {
  /** 内嵌(E)/外链(L)的链接地址，仅前端表单使用，提交时写入 meta.iframeSrc/meta.link */
  linkUrl?: string;
  [key: string]: any;
  meta?: SystemMenuApi.MenuMeta;
} & SystemMenuApi.MenuFormModel;

/** 判断当前菜单类型是否命中指定集合（表单值未填时返回 false） */
function isMenuType(
  values: Partial<MenuFormValues>,
  ...types: SystemMenuApi.MenuType[]
) {
  return types.includes(values.menuType as SystemMenuApi.MenuType);
}

/** 空字符串归一化为 undefined：后端 @IsOptional 不会跳过 ''，会被 DTO 的正则/长度校验拒绝 */
function blankToUndefined(value?: string) {
  return value === '' ? undefined : value;
}

/**
 * 上级菜单候选树：后端禁止将菜单挂到自身或其子孙节点下，此处提前剔除，
 * 避免用户提交后才收到 409
 */
function filterSelectableMenus(
  nodes: SystemMenuApi.SystemMenu[],
  excludeId?: string,
): SystemMenuApi.SystemMenu[] {
  if (!excludeId) {
    return nodes;
  }
  const prune = (
    list: SystemMenuApi.SystemMenu[],
  ): SystemMenuApi.SystemMenu[] =>
    list
      .filter((node) => String(node.id) !== String(excludeId))
      .map((node) => ({
        ...node,
        children: node.children ? prune(node.children) : undefined,
      }));
  return prune(nodes);
}

async function getParentMenuTree() {
  const list = await getMenuList();
  return filterSelectableMenus(list, formData.value?.id);
}

function encodeMenuFormValues(
  values: Readonly<MenuFormValues>,
): MenuSubmitValues {
  const meta: Record<string, unknown> & SystemMenuApi.MenuMeta = {
    ...values.meta,
  };
  // 内嵌(E)/外链(L)的链接地址由独立字段录入，分别写入 meta.iframeSrc/meta.link 以保留前端路由语义
  if (values.menuType === 'E') {
    meta.iframeSrc = values.linkUrl?.trim();
    Reflect.deleteProperty(meta, 'link');
  } else if (values.menuType === 'L') {
    meta.link = values.linkUrl?.trim();
    Reflect.deleteProperty(meta, 'iframeSrc');
  } else {
    Reflect.deleteProperty(meta, 'link');
    Reflect.deleteProperty(meta, 'iframeSrc');
  }
  // 清理 meta 中的空值，避免存入冗余字段
  Object.keys(meta).forEach((key) => {
    if (meta[key] === '' || meta[key] === undefined) {
      Reflect.deleteProperty(meta, key);
    }
  });

  // 严格按后端 CreateMenuDto/UpdateMenuDto 白名单构造载荷，
  // 未在下表中的字段一律不下发，防止 forbidNonWhitelisted 返回 400
  return {
    // 顶级菜单父ID为 0；bigint 在接口返回中可能是字符串，提交前统一转为数字
    parentId: Number(values.parentId ?? 0),
    menuType: values.menuType,
    menuName: values.menuName,
    sortOrder:
      values.sortOrder === null || values.sortOrder === undefined
        ? undefined
        : Number(values.sortOrder),
    // 按钮(F)无路由地址，且后端不接受空字符串，故不提交该字段
    path: isMenuType(values, 'F') ? undefined : blankToUndefined(values.path),
    // 页面组件仅菜单(C)使用，其余类型提交空串以清理历史值
    component: isMenuType(values, 'C')
      ? (blankToUndefined(values.component) ?? '')
      : '',
    perms: blankToUndefined(values.perms),
    meta,
    isEnabled: values.isEnabled,
    remark: values.remark ?? '',
  };
}

function decodeMenuFormValues(
  values: Readonly<MenuSubmitValues>,
): MenuFormValues {
  return {
    ...values,
    // 顶级菜单 parentId 为 0(bigint 可能以字符串 '0' 返回)，上级选择框保持空白
    parentId: Number(values.parentId ?? 0) > 0 ? values.parentId : undefined,
    // 内嵌(E)/外链(L)的链接地址回读自 meta.iframeSrc/meta.link
    linkUrl: values.meta?.iframeSrc ?? values.meta?.link,
  };
}

const schema: VbenFormSchema<MenuFormValues>[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getMenuTypeOptions(),
      optionType: 'button',
    },
    defaultValue: 'C',
    fieldName: 'menuType',
    formItemClass: 'col-span-2 md:col-span-2',
    label: $t('system.menu.type'),
  },
  {
    component: 'Input',
    componentProps: {
      maxlength: 64,
    },
    fieldName: 'menuName',
    label: $t('system.menu.menuName'),
    // 长度与唯一性均与后端 DTO 保持一致：菜单名称全局不可重复，修改时传自身 id 排除自己
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.menuName'), 2]))
      .max(64, $t('ui.formRules.maxLength', [$t('system.menu.menuName'), 64]))
      .refine(
        async (value: string) => {
          return !(await isMenuNameExists(value, formData.value?.id));
        },
        {
          error: (issue) =>
            $t('ui.formRules.alreadyExists', [
              $t('system.menu.menuName'),
              issue.input,
            ]),
        },
      ),
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: getParentMenuTree,
      class: 'w-full',
      childrenField: 'children',
      filterTreeNode(input: string, node: Recordable<any>) {
        if (!input || input.length === 0) {
          return true;
        }
        const menuName: string = node.menuName ?? '';
        const title: string = node.meta?.title ?? '';
        return (
          menuName.includes(input) ||
          (title ? $t(title).includes(input) : false)
        );
      },
      getPopupContainer,
      // 选择框展示与后端字段对齐：标签取 menuName，值取 id
      labelField: 'menuName',
      showSearch: true,
      treeDefaultExpandAll: true,
      valueField: 'id',
    },
    fieldName: 'parentId',
    label: $t('system.menu.parent'),
    renderComponentContent() {
      return {
        treeTitleRender({
          label,
          meta,
        }: {
          label: string;
          meta: Recordable<any>;
        }) {
          const coms = [];
          if (!label) return '';
          if (meta?.icon) {
            coms.push(h(IconifyIcon, { class: 'size-4', icon: meta.icon }));
          }
          // 标题(meta.title，可为多语言key)优先展示，回落到菜单名称
          const text = meta?.title ? $t(meta.title) : label;
          coms.push(h('span', { class: '' }, text));
          return h('div', { class: 'flex items-center gap-1' }, coms);
        },
      };
    },
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
    label: $t('system.menu.sortOrder'),
  },
  {
    component: 'Input',
    componentProps() {
      // 不需要处理多语言时就无需这么做
      return {
        ...(titleSuffix.value && { addonAfter: titleSuffix.value }),
        onChange({ target: { value } }: { target: { value: string } }) {
          titleSuffix.value = value && $te(value) ? $t(value) : undefined;
        },
      };
    },
    fieldName: 'meta.title',
    label: $t('system.menu.menuTitle'),
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      maxlength: 255,
    },
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'path',
    label: $t('system.menu.path'),
    // 隐藏字段不参与校验，故此处规则只对目录/菜单/内嵌/外链生效
    rules: z
      .string()
      .regex(MENU_PATH_REGEX, $t('system.menu.pathFormat'))
      .refine(
        async (value: string) => {
          return !(await isMenuPathExists(value, formData.value?.id));
        },
        {
          error: (issue) =>
            $t('ui.formRules.alreadyExists', [
              $t('system.menu.path'),
              issue.input,
            ]),
        },
      ),
  },
  {
    component: 'Input',
    componentProps: {
      maxlength: 255,
      placeholder: 'https://example.com/page',
    },
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'E', 'L');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'linkUrl',
    formItemClass: 'col-span-2 md:col-span-1',
    label: $t('system.menu.linkSrc'),
    // 后端 meta 为自由 JSON 不校验链接，前端按 http(s):// 格式强约束，保证内嵌页/外链可正常打开
    rules: z
      .string()
      .min(1, $t('ui.formRules.required', [$t('system.menu.linkSrc')]))
      .regex(MENU_URL_REGEX, $t('system.menu.urlFormat')),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'C', 'E');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.activePath',
    help: $t('system.menu.activePathHelp'),
    label: $t('system.menu.activePath'),
    // 激活路径必须指向一个已存在的菜单，否则无意义
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.path'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.path'), 100]))
      .refine(async (value: string) => {
        return await isMenuPathExists(value, formData.value?.id);
      }, $t('system.menu.activePathMustExist'))
      .optional(),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.icon',
    label: $t('system.menu.icon'),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'M', 'C', 'E');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.activeIcon',
    label: $t('system.menu.activeIcon'),
  },
  {
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      options: componentKeys.map((v) => ({ value: v })),
    },
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'C');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'component',
    label: $t('system.menu.component'),
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      maxlength: 128,
    },
    dependencies: {
      // 仅按钮(F)的权限标识为必填，其余类型可填可不填（未填时为 undefined/空串，均放行）
      rules: (values) => {
        return isMenuType(values, 'F')
          ? z
              .string()
              .min(1, $t('ui.formRules.required', [$t('system.menu.authCode')]))
              .regex(MENU_PERMS_REGEX, $t('system.menu.permsFormat'))
          : z
              .string()
              .regex(MENU_PERMS_REGEX, $t('system.menu.permsFormat'))
              .or(z.literal(''))
              .optional();
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'perms',
    label: $t('system.menu.authCode'),
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
    label: $t('system.menu.status'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: [
        { label: $t('system.menu.badgeType.dot'), value: 'dot' },
        { label: $t('system.menu.badgeType.normal'), value: 'normal' },
      ],
    },
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.badgeType',
    label: $t('system.menu.badgeType.title'),
  },
  {
    component: 'Input',
    dependencies: {
      resolve: ({ values }) => {
        return {
          componentProps: {
            allowClear: true,
            class: 'w-full',
            disabled: values.meta?.badgeType !== 'normal',
          },
          show: !isMenuType(values, 'F'),
        };
      },
      triggerFields: ['meta.badgeType', 'menuType'],
    },
    fieldName: 'meta.badge',
    label: $t('system.menu.badge'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: SystemMenuApi.BadgeVariants.map((v) => ({
        label: v,
        value: v,
      })),
    },
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.badgeVariants',
    label: $t('system.menu.badgeVariants'),
  },
  {
    component: 'Divider',
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F', 'L');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'divider1',
    formItemClass: 'col-span-2 md:col-span-2 pb-0',
    hideLabel: true,
    renderComponentContent() {
      return {
        default: () => $t('system.menu.advancedSettings'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'C');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.keepAlive',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.keepAlive'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'C', 'E');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.affixTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.affixTab'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.hideInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return isMenuType(values, 'M', 'C');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.hideChildrenInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideChildrenInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F', 'L');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.hideInBreadcrumb',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInBreadcrumb'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !isMenuType(values, 'F', 'L');
      },
      triggerFields: ['menuType'],
    },
    fieldName: 'meta.hideInTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInTab'),
      };
    },
  },
  {
    component: 'Textarea',
    componentProps: {
      maxLength: 500,
      rows: 3,
      showCount: true,
    },
    fieldName: 'remark',
    formItemClass: 'col-span-2 md:col-span-2',
    label: $t('system.menu.remark'),
    rules: z
      .string()
      .max(500, $t('ui.formRules.maxLength', [$t('system.menu.remark'), 500]))
      .optional(),
  },
];

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  codec: {
    decode: decodeMenuFormValues,
    encode: encodeMenuFormValues,
  },
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});
const [Drawer, drawerApi] = useVbenDrawer<MenuDrawerData>({
  onConfirm: onSubmit,
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData();
      if (data && 'id' in data) {
        formData.value = data;
        await formApi.setSubmitValues(data);
        titleSuffix.value = formData.value.meta?.title
          ? $t(formData.value.meta.title)
          : '';
      } else {
        formData.value = undefined;
        formApi.reset();
        await formApi.setValues(data ?? {});
        titleSuffix.value = '';
      }
    }
  },
});

defineExpose({ drawerApi });

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    // getValues() 已经过 codec.encode，返回按后端 DTO 白名单构造的载荷
    const data = await formApi.getValues<MenuSubmitValues>();
    try {
      await (formData.value?.id
        ? updateMenu(formData.value.id, data)
        : createMenu(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.menu.name')])
    : $t('ui.actionTitle.create', [$t('system.menu.name')]),
);
</script>
<template>
  <Drawer class="w-full max-w-200" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
