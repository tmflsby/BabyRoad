import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BabyDiaperRecordApi } from '#/api';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { useEnumOptions } from '../shared';

/** 尿布类型：1-小便 2-大便 3-混合（与后端 diaper_record.diaper_type 对齐） */
export function diaperTypeOptions() {
  return useEnumOptions(
    'diaper',
    [
      { key: 'urine', value: 1 },
      { key: 'stool', value: 2 },
      { key: 'mixed', value: 3 },
    ],
    ['cyan', 'orange', 'purple'],
  );
}

/** 小便量：1-少(微湿) 2-中(半满) 3-多(沉甸甸) */
export function urineAmountOptions() {
  return useEnumOptions('diaper', [
    { key: 'amountLow', value: 1 },
    { key: 'amountMid', value: 2 },
    { key: 'amountHigh', value: 3 },
  ]);
}

/** 小便颜色：1-清亮 2-浅黄 3-深黄 4-粉红/砖红(结晶) */
export function urineColorOptions() {
  return useEnumOptions('diaper', [
    { key: 'urineClear', value: 1 },
    { key: 'urineLightYellow', value: 2 },
    { key: 'urineDarkYellow', value: 3 },
    { key: 'urinePink', value: 4 },
  ]);
}

/** 大便颜色：1-黄/金黄 2-绿/黄绿 3-黑/墨绿 4-灰白/陶土色 5-红/带血 6-其他 */
export function stoolColorOptions() {
  return useEnumOptions('diaper', [
    { key: 'stoolYellow', value: 1 },
    { key: 'stoolGreen', value: 2 },
    { key: 'stoolBlack', value: 3 },
    { key: 'stoolPale', value: 4 },
    { key: 'stoolRed', value: 5 },
    { key: 'other', value: 6 },
  ]);
}

/** 大便性状：1-稀水样 2-糊状/软膏 3-成型软便 4-干硬颗粒 5-泡沫状 6-粘液状 7-其他 */
export function stoolTextureOptions() {
  return useEnumOptions('diaper', [
    { key: 'watery', value: 1 },
    { key: 'paste', value: 2 },
    { key: 'formed', value: 3 },
    { key: 'hard', value: 4 },
    { key: 'foam', value: 5 },
    { key: 'mucus', value: 6 },
    { key: 'other', value: 7 },
  ]);
}

/** 含小便成分（小便/混合） */
function hasUrine(values: Record<string, any>) {
  return values.diaperType === 1 || values.diaperType === 3;
}

/** 含大便成分（大便/混合） */
function hasStool(values: Record<string, any>) {
  return values.diaperType === 2 || values.diaperType === 3;
}

/**
 * 获取编辑表单的字段配置
 * 字段与后端 CreateDiaperRecordDto/UpdateDiaperRecordDto 保持一致；
 * 小便相关字段仅在类型为小便/混合时录入，大便相关字段仅在类型为大便/混合时录入
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        showTime: true,
      },
      fieldName: 'changeTime',
      label: $t('babyRecord.diaper.changeTime'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: diaperTypeOptions(),
        optionType: 'button',
      },
      fieldName: 'diaperType',
      label: $t('babyRecord.diaper.diaperType'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: urineAmountOptions(),
      },
      dependencies: {
        if: hasUrine,
        triggerFields: ['diaperType'],
      },
      fieldName: 'urineAmount',
      label: $t('babyRecord.diaper.urineAmount'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: urineColorOptions(),
      },
      dependencies: {
        if: hasUrine,
        triggerFields: ['diaperType'],
      },
      fieldName: 'urineColor',
      label: $t('babyRecord.diaper.urineColor'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: stoolColorOptions(),
      },
      dependencies: {
        if: hasStool,
        triggerFields: ['diaperType'],
      },
      fieldName: 'stoolColor',
      label: $t('babyRecord.diaper.stoolColor'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: stoolTextureOptions(),
      },
      dependencies: {
        if: hasStool,
        triggerFields: ['diaperType'],
      },
      fieldName: 'stoolTexture',
      label: $t('babyRecord.diaper.stoolTexture'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 500,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('babyRecord.common.remark'),
      rules: z
        .string()
        .max(
          500,
          $t('ui.formRules.maxLength', [$t('babyRecord.common.remark'), 500]),
        )
        .or(z.literal(''))
        .optional(),
    },
  ];
}

/**
 * 获取列表查询表单的字段配置
 * 查询参数与后端 QueryDiaperRecordDto 白名单对齐
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: diaperTypeOptions(),
      },
      fieldName: 'diaperType',
      label: $t('babyRecord.diaper.diaperType'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: urineAmountOptions(),
      },
      fieldName: 'urineAmount',
      label: $t('babyRecord.diaper.urineAmount'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: urineColorOptions(),
      },
      fieldName: 'urineColor',
      label: $t('babyRecord.diaper.urineColor'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: stoolColorOptions(),
      },
      fieldName: 'stoolColor',
      label: $t('babyRecord.diaper.stoolColor'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: stoolTextureOptions(),
      },
      fieldName: 'stoolTexture',
      label: $t('babyRecord.diaper.stoolTexture'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        showTime: true,
      },
      fieldName: 'startTime',
      label: $t('babyRecord.diaper.timeRange'),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('babyRecord.common.remark'),
    },
  ];
}

/**
 * 表格列配置
 * @param onActionClick 操作按钮点击回调
 */
export function useColumns<T = BabyDiaperRecordApi.DiaperRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'changeTime',
      formatter: 'formatDateTime',
      title: $t('babyRecord.diaper.changeTime'),
      width: 180,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: diaperTypeOptions(),
      },
      field: 'diaperType',
      title: $t('babyRecord.diaper.diaperType'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: urineAmountOptions(),
      },
      field: 'urineAmount',
      title: $t('babyRecord.diaper.urineAmount'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: urineColorOptions(),
      },
      field: 'urineColor',
      title: $t('babyRecord.diaper.urineColor'),
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: stoolColorOptions(),
      },
      field: 'stoolColor',
      title: $t('babyRecord.diaper.stoolColor'),
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: stoolTextureOptions(),
      },
      field: 'stoolTexture',
      title: $t('babyRecord.diaper.stoolTexture'),
      width: 120,
    },
    {
      field: 'remark',
      minWidth: 160,
      title: $t('babyRecord.common.remark'),
    },
    {
      field: 'createTime',
      formatter: 'formatDateTime',
      title: $t('babyRecord.common.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: $t('babyRecord.diaper.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('babyRecord.common.operation'),
      width: 160,
    },
  ];
}
