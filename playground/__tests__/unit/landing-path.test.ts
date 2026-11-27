import { describe, expect, it } from 'vitest';

import { resolveLandingPath } from '../../src/router/landing-path';

const DEFAULT_HOME_PATH = '/dashboard';
// 后端 /auth/login 与 /user/info 下发的 homePath
const HOME_PATH = '/dashboard/analytics';

describe('login landing path resolver', () => {
  it('uses homePath instead of the default home entry', () => {
    // 进入应用根路由 '/' 会被重定向到 defaultHomePath，此时必须改跳 homePath
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        target: DEFAULT_HOME_PATH,
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);

    // 登录接口的 homePath 更早到手，同样生效
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        loginHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);
  });

  it('does not let a redirect back to the default home entry win', () => {
    // 登出/超时回登录页时会带上 redirect=/dashboard，不应覆盖 homePath
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: encodeURIComponent(DEFAULT_HOME_PATH),
        target: HOME_PATH,
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);

    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: '/',
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);
  });

  it('keeps a real deep link carried by redirect or by the target', () => {
    // 未登录访问业务页被拦截，登录后仍应回到该页（query 需一并保留）
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: encodeURIComponent('/system/user?id=1'),
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe('/system/user?id=1');

    // 刷新时停留在业务页，目标地址原样保留
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        target: '/system/user?id=1',
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe('/system/user?id=1');
  });

  it('falls back to the default home path when homePath is absent', () => {
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        target: DEFAULT_HOME_PATH,
      }),
    ).toBe(DEFAULT_HOME_PATH);

    // homePath 与 defaultHomePath 相同时不产生额外跳转差异
    expect(
      resolveLandingPath({
        defaultHomePath: HOME_PATH,
        target: '/',
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);
  });

  it('tolerates malformed redirect values', () => {
    // 含非法转义的 redirect 不能抛 URIError 打断导航
    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: '/system/user?id=%zz',
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe('/system/user?id=%zz');

    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: ['%2Fsystem%2Fuser', '%2Fother'],
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe('/system/user');

    expect(
      resolveLandingPath({
        defaultHomePath: DEFAULT_HOME_PATH,
        redirect: undefined,
        target: HOME_PATH,
        userInfoHomePath: HOME_PATH,
      }),
    ).toBe(HOME_PATH);
  });
});
