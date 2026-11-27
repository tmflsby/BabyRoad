<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm, z } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemUserApi.SystemUser>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref<string>();

const [Drawer, drawerApi] = useVbenDrawer<null | SystemUserApi.SystemUser>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues<SystemUserApi.UserFormModel>();
    drawerApi.lock();
    const isEdit = !!id.value;
    // 按后端 DTO 字段构造载荷：编辑时不提交 username；password 留空表示不修改；
    // 空字符串归一化为 undefined；roleIds 传整型数组(后端 @IsInt({each}))
    const payload: SystemUserApi.UserFormModel = {
      deptId: values.deptId === '' ? undefined : values.deptId,
      email: values.email || undefined,
      gender: values.gender,
      isEnabled: values.isEnabled,
      nickname: values.nickname || undefined,
      phone: values.phone || undefined,
      remark: values.remark || undefined,
      roleIds: (values.roleIds ?? []).map(Number),
      ...(isEdit ? {} : { username: values.username }),
      ...(values.password ? { password: values.password } : {}),
    };
    (isEdit ? updateUser(id.value!, payload) : createUser(payload))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData();
      formData.value = data ?? undefined;
      id.value = data?.id;
      formApi.reset();

      // 编辑时：登录账号不允许修改；密码放宽为可选，留空表示不修改
      await formApi.updateSchema([
        {
          componentProps: { disabled: !!data },
          fieldName: 'username',
        },
        {
          componentProps: {
            placeholder: data ? $t('system.user.passwordKeepTip') : undefined,
          },
          fieldName: 'password',
          rules: data
            ? z
                .string()
                .min(
                  6,
                  $t('ui.formRules.minLength', [
                    $t('system.user.password'),
                    6,
                  ]),
                )
                .or(z.literal(''))
                .optional()
            : 'required',
        },
      ]);

      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        // 后端 bigint 序列化为字符串，而角色选项 value 为 number，
        // roleIds 转成 number 才能匹配到角色名称标签
        formApi.setValues({
          ...data,
          roleIds: (data.roleIds ?? []).map(Number),
        });
      }
    }
  },
});

defineExpose({ drawerApi });

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.user.username'))
    : $t('common.create', $t('system.user.username'));
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
