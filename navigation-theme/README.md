# Guide navigation theme

当前 Guide 源码：[NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)。

Guide 的网站导航主题，使用 React、Vite、Tailwind CSS 和 shadcn/ui。正式版本与更新说明见 [GitHub Releases](https://github.com/NSJLUCAS/Guide/releases/latest)；支持网站分类、搜索、状态卡片及 standard、compact、minimal 三种卡片样式。

## 本地开发与构建

在本目录执行：

```powershell
npm ci
$env:GUIDE_HUB = "http://127.0.0.1:9911"
npm run dev
```

Vite 将同源 `/api` 请求代理到 `GUIDE_HUB`。未设置时默认使用 `http://127.0.0.1:9911`；为兼容已有开发环境，仍接受旧的 `MONITOR_HUB`，但 `GUIDE_HUB` 优先。

```powershell
npm run lint
npm test
npm run build
```

构建结果在 `dist/`。单元测试覆盖数字格式化、API 边界、网站数据转换、安全链接和卡片样式。当前生产页面浏览器测试位于 `tests/public.browser.cjs`，使用拦截的本地 API 与图片测试数据；运行时设置 `NAVIGATION_PREVIEW` 为本地生产预览地址，然后执行 `node tests/public.browser.cjs`。可用 `PUBLIC_SCREENSHOTS` 指定新的截图输出目录；可选的 standard 卡片基线比较使用 `PUBLIC_STANDARD_BASELINE`，设置 `PUBLIC_CAPTURE_BASELINE=1` 可采集基线。

## 内置主题与自定义主题

当前 `theme.json` 的短名 `navigation` 是 Guide 内置主题的保留标识，Hub 会拒绝同名外部主题。修改本主题后，先构建 `dist/`，再重新构建和替换 `guide-hub`，新静态资源会随二进制内嵌。不能通过复制一个外部 `navigation/` 目录覆盖内置主题。

如果另做独立的自定义主题，请使用非保留短名（例如 `guide-custom`），同步修改其 `theme.json` 中的 `short`，再将 manifest 与构建产物放入同名目录：

```text
<themes-dir>/guide-custom/
├── theme.json
└── dist/
    ├── index.html
    └── assets/
```

将 `<themes-dir>` 作为 Guide Hub 的 `--themes` 路径，在后台「主题」页选择该自定义主题。目录名必须与 manifest 的 `short` 一致；自定义主题可额外包含自己的 `preview.png`。默认 Guide 部署只需已内嵌主题的 Hub 二进制。

## 当前页面 API

生产导航页面使用同源只读接口：

| 接口 | 用途 |
|---|---|
| `GET /api/services` | 获取可公开访问的网站及其状态 |
| `GET /api/public-config` | 获取后台保存的卡片样式 `cardStyle` |

网站响应是数组，每项包括 `id`、`name`、`url`、`description`、`category`、`icon`、`status`、`responseMs`、`checkedAt` 和 `checkEnabled`。网站状态支持 `online`、`offline`、`unknown` 和 `unchecked`。无效或过期的检测数据按未知状态显示，HTTPS 图标加载失败时显示本地备用图标。

网站数据在请求完成后每 30 秒刷新。卡片样式每 5 秒读取，并在窗口获得焦点、恢复可见或收到后台外观保存广播时刷新。公开页面只展示公开数据；管理写入通过 `/admin/` 后台完成，由 Hub 验证登录状态。

后台与公开页共用当前浏览器的浅色/深色偏好。未知页面路径由 Hub 回落到主题的 `dist/index.html`；`/admin/*` 由 Hub 的内置后台处理。

## 来源与许可

本主题基于 stqfdyr 的 [Monitor 默认主题](https://github.com/monitor-probe/monitor-theme-default) 修改为 Guide 网站导航主题。上游名称和链接仅用于来源说明，`theme.json` 的作者保留为 `stqfdyr`。

MIT，完整许可与原始版权声明见 [LICENSE](./LICENSE)。
