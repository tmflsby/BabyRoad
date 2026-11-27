<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BabyDiaperRecordApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDiaperRecord, getDiaperRecordList } from '#/api';
import { $t } from '#/locales';
import { createDateRangeCodec } from '#/utils/date-range-codec';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

/** 查询表单值：更换时间区间为 RangePicker，提交时编码为 startTime/endTime */
interface DiaperSearchFormValues extends Record<string, unknown> {
  startTime?: [Dayjs, Dayjs];
}

const diaperSearchCodec = createDateRangeCodec<DiaperSearchFormValues>()({
  endField: 'endTime',
  // 后端更换时间区间为 datetime，下发到分秒，避免单日区间被压缩成 00:00
  format: 'YYYY-MM-DDTHH:mm:ss',
  rangeField: 'startTime',
  startField: 'startTime',
});

type DiaperSearchSubmitValues = ReturnType<typeof diaperSearchCodec.encode>;

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    codec: diaperSearchCodec,
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: DiaperSearchSubmitValues) => {
          // 后端返回 {list,total,page,pageSize}，映射为 vxe-grid 需要的 items/total
          const { list, total } = await getDiaperRecordList({
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
  } as VxeTableGridOptions<BabyDiaperRecordApi.DiaperRecord>,
});

function onActionClick(
  e: OnActionClickParams<BabyDiaperRecordApi.DiaperRecord>,
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

function onEdit(row: BabyDiaperRecordApi.DiaperRecord) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: BabyDiaperRecordApi.DiaperRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteDiaperRecord(row.id)
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
    <Grid :table-title="$t('babyRecord.diaper.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('babyRecord.diaper.name')]) }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
