import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BabySleepRecordApi } from '#/api';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

import { formatDateTime, formatDuration, useEnumOptions } from '../shared';

/** 睡眠类型：1-小睡 2-夜睡（与后端 sleep_record.sleep_type 对齐） */
export function sleepTypeOptions() {
  return useEnumOptions(
    'sleep',
    [
      { key: 'nap', value: 1 },
      { key: 'night', value: 2 },
    ],
    ['blue', 'purple'],
  );
}

/** 睡眠质量：1-好 2-一般 3-差（与后端 sleep_record.quality 对齐，null 表示未评价） */
export function qualityOptions() {
  return useEnumOptions(
    'sleep',
    [
      { key: 'good', value: 1 },
      { key: 'normal', value: 2 },
      { key: 'bad', value: 3 },
    ],
    ['success', 'warning', 'error'],
  );
}

/**
 * 获取编辑表单的字段配置
 * 字段与后端 CreateSleepRecordDto/UpdateSleepRecordDto 保持一致；
 * duration 由后端依据入睡/醒来时间计算，不开放录入
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        showTime: true,
      },
      fieldName: 'startTime',
      label: $t('babyRecord.sleep.startTime'),
      rules: 'required',
    },
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        showTime: true,
      },
      fieldName: 'endTime',
      help: $t('babyRecord.sleep.notAwakeHelp'),
      label: $t('babyRecord.sleep.endTime'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: qualityOptions(),
      },
      fieldName: 'quality',
      label: $t('babyRecord.sleep.quality'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: sleepTypeOptions(),
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'sleepType',
      label: $t('babyRecord.sleep.sleepType'),
      rules: 'required',
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
          $t('ui.formRules.maxLength', [
            $t('babyRecord.common.remark'),
            500,
          ]),
        )
        .or(z.literal(''))
        .optional(),
    },
  ];
}

/**
 * 获取列表查询表单的字段配置
 * 查询参数与后端 QuerySleepRecordDto 白名单对齐（时间区间编码为 startTime/endTime）
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: sleepTypeOptions(),
      },
      fieldName: 'sleepType',
      label: $t('babyRecord.sleep.sleepType'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: qualityOptions(),
      },
      fieldName: 'quality',
      label: $t('babyRecord.sleep.quality'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        showTime: true,
      },
      fieldName: 'startTime',
      label: $t('babyRecord.sleep.timeRange'),
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
export function useColumns<T = BabySleepRecordApi.SleepRecord>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'startTime',
      formatter: 'formatDateTime',
      title: $t('babyRecord.sleep.startTime'),
      width: 180,
    },
    {
      // 未醒时后端返回 null，表格展示为空占位符；有值时与入睡时间同样按日期时间格式化
      field: 'endTime',
      formatter: ({ cellValue }: { cellValue: any }) =>
        formatDateTime(cellValue),
      title: $t('babyRecord.sleep.endTime'),
      width: 180,
    },
    {
      field: 'duration',
      formatter: ({ cellValue }: { cellValue: any }) =>
        formatDuration(cellValue),
      title: $t('babyRecord.sleep.duration'),
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: qualityOptions(),
      },
      field: 'quality',
      title: $t('babyRecord.sleep.quality'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: sleepTypeOptions(),
      },
      field: 'sleepType',
      title: $t('babyRecord.sleep.sleepType'),
      width: 100,
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
          nameTitle: $t('babyRecord.sleep.name'),
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
