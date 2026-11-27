import os from 'os';
import fs from 'fs';
import path from 'path';

export function getMysqlUsernameAndPassword() {
  const homedir = os.homedir();
  const mysqlUserPath = path.resolve(homedir, '.mysql', 'user.json');
  const mysqlUser = JSON.parse(fs.readFileSync(mysqlUserPath).toString()) as {
    username: string;
    password: string;
  };
  const username = mysqlUser.username;
  const password = mysqlUser.password;
  return { username, password };
}

export function success<T>(data: T, msg: string) {
  return {
    code: 0,
    data,
    message: msg,
  };
}

export function error(msg: string) {
  return {
    code: -1,
    message: msg,
  };
}

export async function wrapperResponse<T>(value: T | Promise<T>, msg: string) {
  try {
    const data = await value;
    return success(data, msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return error(message);
  }
}

export function randomStr(strLength: number) {
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: strLength },
    () => str[Math.floor(Math.random() * str.length)],
  ).join('');
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * MySQL DECIMAL 列运行时以字符串返回，统一在读取时转为 number，
 * 便于前端直接参与计算与图表绑定（NULL/未赋值时保持原样）
 */
export const decimalTransformer = {
  to(value: number | null | undefined): number | null | undefined {
    return value;
  },
  from(value: string | null | undefined): number | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    return Number(value);
  },
};

/** 登录用户首页路径默认值，/login 与 /user/info 接口均返回该 homePath */
export const DEFAULT_HOME_PATH = '/dashboard/analytics';

/** 构建树时从节点上读取自身ID/父ID的取值函数（返回值统一归一化为 number） */
type KeyGetter<T> = (node: T) => unknown;

/** 通用树节点：在原始节点类型 N 上挂载子节点集合 */
export type TreeNode<N> = N & { children: TreeNode<N>[] };

/**
 * 将扁平节点列表组装为树形结构（通用版）
 * - idKey/parentKey：自定义读取自身ID与父级ID，内部统一 Number() 归一化，
 *   兼容 bigint 列运行时为字符串导致的类型不匹配问题；父ID查不到对应节点即视为根节点
 * - 叶子节点会移除空的 children 字段，简化返回结构
 * - N 为节点类型（需声明可选的 children 字段），不传时默认为输入类型挂载 children
 */
export function buildTree<N extends object, T extends N = N>(
  nodes: T[],
  idKey: KeyGetter<N>,
  parentKey: KeyGetter<N>,
): N[] {
  const nodeMap = new Map<number, TreeNode<N>>();
  nodes.forEach((node) =>
    nodeMap.set(Number(idKey(node)), { ...node, children: [] }),
  );

  const roots: TreeNode<N>[] = [];
  nodes.forEach((node) => {
    const current = nodeMap.get(Number(idKey(node))) as TreeNode<N>;
    const parent = nodeMap.get(Number(parentKey(node)));
    if (parent) {
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  });

  // 叶子节点无需保留空 children，简化返回结构
  const prune = (list: TreeNode<N>[]): void => {
    list.forEach((n) => {
      if (n.children && n.children.length > 0) {
        prune(n.children);
      } else {
        delete (n as { children?: TreeNode<N>[] }).children;
      }
    });
  };
  prune(roots);
  return roots;
}
