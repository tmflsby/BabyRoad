import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BabyGrowthRecordApi } from '#/api';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

/** 体格指标的取值上限（与后端 DTO 的 DECIMAL(5,2) 范围一致） */
const MAX_MEASURE = 999.99;

/** 数值型体格字段的校验规则（可空字段允许不填） */
function measureRules(label: string, required = false) {
  const schema = z
    .number()
    .min(
      0,
      $t('babyRecord.common.rangeTip', [label, 0, MAX_MEASURE]),
    )
    .max(
      MAX_MEASURE,
      $t('babyRecord.common.rangeTip', [label, 0, MAX_MEASURE]),
    );
  return required ? schema : schema.nullable().optional();
}

/** 文本型字段（百分位）的校验规则 */
function textRules(label: string, max = 20) {
  return z
    .string()
    .max(max, $t('ui.formRules.maxLength', [label, max]))
    .or(z.literal(''))
    .optional();
}

/**
 * 获取编辑表单的字段配置
 * 字段与后端 CreateGrowthRecordDto/UpdateGrowthRecordDto 保持一致
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
      },
      fieldName: 'recordDate',
      label: $t('babyRecord.growth.recordDate'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: MAX_MEASURE,
        min: 0,
        precision: 2,
      },
      fieldName: 'weight',
      label: $t('babyRecord.growth.weight'),
      rules: measureRules($t('babyRecord.growth.weight'), true),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: MAX_MEASURE,
        min: 0,
        precision: 2,
      },
      fieldName: 'height',
      label: $t('babyRecord.growth.height'),
      rules: measureRules($t('babyRecord.growth.height'), true),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: MAX_MEASURE,
        min: 0,
        precision: 2,
      },
      fieldName: 'headCircumference',
      label: $t('babyRecord.growth.headCircumference'),
      rules: measureRules($t('babyRecord.growth.headCircumference')),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: MAX_MEASURE,
        min: 0,
        precision: 2,
      },
      fieldName: 'chestCircumference',
      label: $t('babyRecord.growth.chestCircumference'),
      rules: measureRules($t('babyRecord.growth.chestCircumference')),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 20,
      },
      fieldName: 'weightPercentile',
      label: $t('babyRecord.growth.weightPercentile'),
      rules: textRules($t('babyRecord.growth.weightPercentile')),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 20,
      },
      fieldName: 'heightPercentile',
      label: $t('babyRecord.growth.heightPercentile'),
      rules: textRules($t('babyRecord.growth.heightPercentile')),
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
      rules: textRules($t('babyRecord.common.remark'), 500),
    },
  ];
}

/**
 * 获取列表查询表单的字段配置
 * 查询参数与后端 QueryGrowthRecordDto 白名单对齐（日期区间编码为 startDate/endDate）
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RangePicker',
      fieldName: 'recordDate',
      label: $t('babyRecord.growth.dateRange'),
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
export function useColumns<T = BabyGrowthRecordApi.GrowthRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'recordDate',
      title: $t('babyRecord.growth.recordDate'),
      width: 130,
    },
    {
      field: 'weight',
      formatter: ({ cellValue }: { cellValue: any }) =>
        `${cellValue} kg`,
      title: $t('babyRecord.growth.weight'),
      width: 110,
    },
    {
      field: 'height',
      formatter: ({ cellValue }: { cellValue: any }) =>
        `${cellValue} cm`,
      title: $t('babyRecord.growth.height'),
      width: 110,
    },
    {
      field: 'headCircumference',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue ?? '-',
      title: $t('babyRecord.growth.headCircumference'),
      width: 110,
    },
    {
      field: 'chestCircumference',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue ?? '-',
      title: $t('babyRecord.growth.chestCircumference'),
      width: 110,
    },
    {
      field: 'weightPercentile',
      formatter: ({ cellValue }: { cellValue: any }) => cellValue ?? '-',
      title: $t('babyRecord.growth.weightPercentile'),
      width: 130,
    },
    {
      field: 'heightPercentile',
      formatter: ({ cellValue }: { cellValue: any }) => cellValue ?? '-',
      title: $t('babyRecord.growth.heightPercentile'),
      width: 130,
    },
    {
      field: 'remark',
      minWidth: 160,
      title: $t('babyRecord.common.remark'),
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: $t('babyRecord.growth.name'),
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
