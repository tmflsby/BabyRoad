import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useDictStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';
import { isDefaultHomeEntry, resolveLandingPath } from './landing-path';

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      void startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行
    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      void stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();
    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        // 已登录却停在登录页（刷新、后退、直接输入地址）时 userInfo 可能尚未拉取，
        // 缺少 homePath 会让落地页退化成 /dashboard，这里补拉一次用户信息保证恒定落 homePath。
        // 拉取失败（token 失效等）不阻断本次跳转，按无 homePath 的旧逻辑兜底
        const userInfo =
          userStore.userInfo ??
          (await authStore.fetchUserInfo().catch(() => null));
        return resolveLandingPath({
          defaultHomePath: preferences.app.defaultHomePath,
          redirect: to.query.redirect,
          userInfoHomePath: userInfo?.homePath,
        });
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      const homePath = userStore.userInfo?.homePath;
      // 会话内访问根路由 '/'（面包屑首页、Logo）同样会重定向到 defaultHomePath，
      // 后端另有 homePath 时一并改跳 homePath，与登录后的落地页保持一致。
      // homePath 与 defaultHomePath 重合时必须放行，否则守卫自己会造成无限重定向
      if (
        homePath &&
        homePath !== to.path &&
        isDefaultHomeEntry(to.path, preferences.app.defaultHomePath)
      ) {
        return { path: homePath, replace: true };
      }
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      // 则会在菜单中显示，但是访问会被重定向到403
      routes: accessRoutes,
    });

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);

    // 预加载字典（版本校验），不阻塞路由跳转
    useDictStore()
      .loadAllDicts()
      .catch((error) => {
        console.error('Failed to preload dictionaries:', error);
      });

    // 落地页统一交给 resolveLandingPath：真实深链优先，根路由 '/' 与 defaultHomePath
    // 这两个兜底入口都让位给后端下发的 homePath，避免登录后随机落到 /dashboard
    const redirectPath = resolveLandingPath({
      defaultHomePath: preferences.app.defaultHomePath,
      redirect: from.query.redirect,
      target: to.fullPath,
      userInfoHomePath: userInfo.homePath,
    });

    return {
      ...router.resolve(redirectPath),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
