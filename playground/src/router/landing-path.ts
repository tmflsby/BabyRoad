/**
 * 登录后落地页解析
 *
 * 后端在 /auth/login 与 /user/info 中都会下发 homePath，登录后应恒定落到该地址；
 * preferences.app.defaultHomePath（/dashboard）只是「后端没下发 homePath 时」的兜底首页。
 * 历史实现把两处兜底入口排在了 homePath 之前：根路由 '/' 重定向得到的 defaultHomePath，
 * 以及登出/超时回跳时在登录页 URL 上留下的 redirect=defaultHomePath，
 * 于是同一账号有时落 homePath、有时落 /dashboard。
 * 这里把优先级收敛成单一函数，供 store 与路由守卫共同使用，避免两处规则再次分叉。
 */

interface LandingPathOptions {
  /** 偏好设置的默认首页，仅在既无 homePath 又无真实深链时兜底 */
  defaultHomePath: string;
  /** /auth/login 下发的 homePath */
  loginHomePath?: null | string;
  /** 登录页 URL 上的 redirect 参数（可能仍是编码态，由本函数负责解码） */
  redirect?: unknown;
  /** 本次导航的目标地址（to.fullPath） */
  target?: string;
  /** /user/info 下发的 homePath */
  userInfoHomePath?: null | string;
}

/** 取 fullPath 的路径部分，忽略 query 与 hash，便于与兜底入口做等值比较 */
function getPath(fullPath: string): string {
  return fullPath.split('?')[0]?.split('#')[0] ?? '';
}

/**
 * '/' 与 defaultHomePath 都只代表「进入应用时的兜底入口」，不是用户主动指定的目标，
 * 命中时必须让位给后端下发的 homePath。
 */
function isFallbackEntry(path: string, defaultHomePath: string): boolean {
  return path === '/' || path === defaultHomePath;
}

/** 判断某个导航地址是否只是兜底入口（忽略 query 与 hash） */
function isDefaultHomeEntry(
  fullPath: string,
  defaultHomePath: string,
): boolean {
  return isFallbackEntry(getPath(fullPath), defaultHomePath);
}

/**
 * redirect 参数可能被重复编码或含非法转义，解码失败时按原值处理，
 * 不能让 URIError 打断整个导航。
 */
function safeDecode(value: string): string {
  if (!value.includes('%')) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** 读取 redirect 查询参数（可能是数组），只取第一个字符串值 */
function readRedirect(redirect: unknown): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;
  return typeof value === 'string' ? value : '';
}

/**
 * 解析本次应落地的路由地址。
 * 优先级：真实深链 redirect > 非兜底入口的导航目标 > homePath > defaultHomePath
 */
function resolveLandingPath(options: LandingPathOptions): string {
  const { defaultHomePath, loginHomePath, redirect, target, userInfoHomePath } =
    options;

  // 两个接口下发的是同一个值，任一存在即可用；登录接口的值更早到手
  const homePath = loginHomePath || userInfoHomePath || '';

  // 未登录访问某页被拦截时留下的深链，登录后仍应回到该页
  const redirectPath = safeDecode(readRedirect(redirect));
  if (
    redirectPath &&
    !isFallbackEntry(getPath(redirectPath), defaultHomePath)
  ) {
    return redirectPath;
  }

  // 其次保留本次导航的真实目标（例如刷新时停留在业务页面）
  const targetPath = target ?? '';
  if (targetPath && !isFallbackEntry(getPath(targetPath), defaultHomePath)) {
    return targetPath;
  }

  // 兜底入口一律改跳后端 homePath，两者都没有才用 defaultHomePath
  return homePath || defaultHomePath;
}

export { isDefaultHomeEntry, resolveLandingPath };
