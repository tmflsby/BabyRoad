import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BabyFeedingRecordApi } from '#/api';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { formatDuration, formatWithUnit, useEnumOptions } from '../shared';

/** 喂奶类型：1-母乳 2-配方奶 3-混合（与后端 feeding_record.feed_type 对齐） */
export function feedTypeOptions() {
  return useEnumOptions(
    'feeding',
    [
      { key: 'breast', value: 1 },
      { key: 'formula', value: 2 },
      { key: 'mixed', value: 3 },
    ],
    ['green', 'blue', 'orange'],
  );
}

/** 母乳侧：1-左 2-右 3-双侧（与后端 feeding_record.side 对齐） */
export function sideOptions() {
  return useEnumOptions(
    'feeding',
    [
      { key: 'left', value: 1 },
      { key: 'right', value: 2 },
      { key: 'both', value: 3 },
    ],
    ['cyan', 'magenta', 'geekblue'],
  );
}

/**
 * 获取编辑表单的字段配置
 * 字段与后端 CreateFeedingRecordDto/UpdateFeedingRecordDto 保持一致
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        showTime: true,
      },
      fieldName: 'feedTime',
      label: $t('babyRecord.feeding.feedTime'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: feedTypeOptions(),
      },
      fieldName: 'feedType',
      label: $t('babyRecord.feeding.feedType'),
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: sideOptions(),
      },
      dependencies: {
        // 仅母乳/混合需要记录哺乳侧别
        if: (values) => values.feedType === 1 || values.feedType === 3,
        triggerFields: ['feedType'],
      },
      fieldName: 'side',
      label: $t('babyRecord.feeding.side'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: 1440,
        min: 0,
        precision: 0,
      },
      fieldName: 'duration',
      label: $t('babyRecord.feeding.duration'),
      // 与后端 DTO 一致：0-1440 分钟的整数
      rules: z
        .number()
        .min(
          0,
          $t('babyRecord.common.rangeTip', [
            $t('babyRecord.feeding.duration'),
            0,
            1440,
          ]),
        )
        .max(
          1440,
          $t('babyRecord.common.rangeTip', [
            $t('babyRecord.feeding.duration'),
            0,
            1440,
          ]),
        )
        .nullable()
        .optional(),
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: 9999.9,
        min: 0,
        precision: 1,
      },
      fieldName: 'amount',
      label: $t('babyRecord.feeding.amount'),
      // 与后端 DTO 一致：DECIMAL(6,1)，范围 0-9999.9
      rules: z
        .number()
        .min(
          0,
          $t('babyRecord.common.rangeTip', [
            $t('babyRecord.feeding.amount'),
            0,
            9999.9,
          ]),
        )
        .max(
          9999.9,
          $t('babyRecord.common.rangeTip', [
            $t('babyRecord.feeding.amount'),
            0,
            9999.9,
          ]),
        )
        .nullable()
        .optional(),
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
 * 查询参数与后端 QueryFeedingRecordDto 白名单对齐
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: feedTypeOptions(),
      },
      fieldName: 'feedType',
      label: $t('babyRecord.feeding.feedType'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: sideOptions(),
      },
      fieldName: 'side',
      label: $t('babyRecord.feeding.side'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        showTime: true,
      },
      fieldName: 'startTime',
      label: $t('babyRecord.feeding.timeRange'),
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
export function useColumns<T = BabyFeedingRecordApi.FeedingRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'feedTime',
      formatter: 'formatDateTime',
      title: $t('babyRecord.feeding.feedTime'),
      width: 180,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: feedTypeOptions(),
      },
      field: 'feedType',
      title: $t('babyRecord.feeding.feedType'),
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: sideOptions(),
      },
      field: 'side',
      title: $t('babyRecord.feeding.side'),
      width: 100,
    },
    {
      field: 'duration',
      formatter: ({ cellValue }: { cellValue: any }) =>
        formatDuration(cellValue),
      title: $t('babyRecord.feeding.duration'),
      width: 120,
    },
    {
      field: 'amount',
      formatter: ({ cellValue }: { cellValue: any }) =>
        formatWithUnit(cellValue, 'ml'),
      title: $t('babyRecord.feeding.amount'),
      width: 110,
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
          nameTitle: $t('babyRecord.feeding.name'),
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
