# BabyRoad 全栈项目

本项目以 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 为前端基础，在其 monorepo 中集成 BabyRoad 育儿记录后端。前端基于 Vue 3、TypeScript、Vite 和 Ant Design Vue；后端基于 NestJS、TypeORM 与 MySQL。

## 功能模块

- Vben Admin 管理后台：登录认证、仪表盘、用户及系统管理等基础能力。
- 育儿记录 API：支持喂养、睡眠、尿布及生长记录，并提供相关分析接口。
- Monorepo 工作区：统一管理前端应用、后端服务和共享包。

## 环境要求

- Node.js `^22.18.0` 或 `^24.12.0`
- pnpm `>=11.0.0`（仓库锁定版本为 `pnpm@11.16.0`）
- MySQL

## 安装

```bash
pnpm install
```

后端默认连接本机 MySQL：`127.0.0.1:3306`，数据库名为 `baby-road`。数据库用户名和密码从当前用户主目录下的 `.mysql/user.json` 读取。运行后端前，请创建该文件并配置 MySQL 账号，例如：

```json
{
  "username": "你的 MySQL 用户名",
  "password": "你的 MySQL 密码"
}
```

Windows 路径为 `%USERPROFILE%\.mysql\user.json`；macOS/Linux 路径为 `~/.mysql/user.json`。请自行准备 `baby-road` 数据库及所需表结构。连接地址和数据库名目前配置在 `apps/server/src/app.module.ts`。

## 本地开发

同时启动前端 Playground 和后端 API：

```bash
pnpm dev:fullstack
```

也可以分别启动：

```bash
# 前端 Playground
pnpm dev:play

# NestJS 后端（默认监听 3000 端口）
pnpm dev:server
```

后端 API 使用 `/api` 前缀。前端的开发环境 API 地址配置在 `apps/web-antd/.env.development`。

## 构建

```bash
# 构建前端 Playground
pnpm build:play

# 构建后端
pnpm build:server

# 执行仓库中的前后端构建脚本
pnpm build:fullstack
```

## 目录结构

```text
apps/
  server/       NestJS 后端及育儿记录 API
  web-antd/     Ant Design Vue 应用
  web-ele/      Element Plus 应用
  web-naive/    Naive UI 应用
  web-tdesign/  TDesign 应用
  web-antdv-next/ Ant Design Vue Next 应用
packages/       前端共享组件、工具和业务包
playground/     Vben 前端开发入口
```

## Vben Admin

本仓库前端基础来自 [vbenjs/vue-vben-admin](https://github.com/vbenjs/vue-vben-admin)。Vben Admin 是一个基于 Vue 3、Vite 和 TypeScript 的后台管理系统框架；有关其框架能力和使用方式，请参考 [Vben Admin 文档](https://doc.vben.pro/)。

## 许可证

前端基础项目采用 MIT 许可证，详见仓库中的 `LICENSE` 文件。新增后端代码的许可信息请以对应代码及仓库声明为准。