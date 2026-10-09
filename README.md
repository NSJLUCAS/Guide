# Guide

文档：[guide-docs.pages.dev](https://guide-docs.pages.dev/) — 安装、配置、使用与维护。

## 特性

- 网站导航：卡片化管理常用网站与服务，支持分类、搜索和排序。
- 在线检测：展示网站状态与响应时间，区分在线、离线、检测受限、未知和未检测。
- 自定义外观：支持 HTTPS 图标库、网站 favicon、三种卡片样式及深浅色主题。
- 自托管：基于 Rust 和 SQLite，数据由自己掌握。
- 后台管理：支持网站与分类管理、独立应急密码及可选 GitHub OAuth 登录。

## 组成

| 仓库 / 模块 | 说明 |
| --- | --- |
| [Guide](https://github.com/NSJLUCAS/Guide) | 主项目，包含 Hub、管理后台与导航页面 |
| [guide/](guide/) | Rust Hub、SQLite、API 与管理后台 |
| [navigation-theme/](navigation-theme/) | React / TypeScript 公开导航页面 |
| [Guide-Docs](https://github.com/NSJLUCAS/Guide-Docs) | 独立官方文档站，托管于 Cloudflare Pages |

```text
Guide Hub（Rust + SQLite） ──▶ 管理后台 + 公开导航
```

基于 [monitor](https://github.com/monitor-probe/monitor) 和 [monitor-theme-default](https://github.com/monitor-probe/monitor-theme-default) 二次开发。原作者版权与 MIT 许可见 [LICENSE](LICENSE) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
