<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BabyGrowthRecordApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteGrowthRecord, getGrowthRecordList } from '#/api';
import { $t } from '#/locales';
import { createDateRangeCodec } from '#/utils/date-range-codec';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

/** 查询表单值：记录日期区间为 RangePicker，提交时编码为 startDate/endDate */
interface GrowthSearchFormValues extends Record<string, unknown> {
  recordDate?: [Dayjs, Dayjs];
}

const growthSearchCodec = createDateRangeCodec<GrowthSearchFormValues>()({
  endField: 'endDate',
  rangeField: 'recordDate',
  startField: 'startDate',
});

type GrowthSearchSubmitValues = ReturnType<typeof growthSearchCodec.encode>;

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    codec: growthSearchCodec,
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: GrowthSearchSubmitValues) => {
          // 后端返回 {list,total,page,pageSize}，映射为 vxe-grid 需要的 items/total
          const { list, total } = await getGrowthRecordList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          return { items: list, total };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<BabyGrowthRecordApi.GrowthRecord>,
});

function onActionClick(
  e: OnActionClickParams<BabyGrowthRecordApi.GrowthRecord>,
) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
  }
}

function onEdit(row: BabyGrowthRecordApi.GrowthRecord) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: BabyGrowthRecordApi.GrowthRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteGrowthRecord(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.id]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData(null).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('babyRecord.growth.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('babyRecord.growth.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
