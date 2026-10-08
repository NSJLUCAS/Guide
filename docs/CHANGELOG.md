# 更新日志

正式版本和更新日志统一维护在 [GitHub Releases](https://github.com/NSJLUCAS/Guide/releases)。查看[最新稳定版本及 Release Notes](https://github.com/NSJLUCAS/Guide/releases/latest)；今后的发版无需向本文件重复追加记录。

## 仓库历史记录

以下保留迁移前已有的更新记录，不再作为持续维护的版本来源。各版本正式说明以对应 GitHub Release 为准。

### [1.1.0](https://github.com/NSJLUCAS/Guide/releases/tag/v1.1.0)

已正式发布；以下为原仓库中的功能摘要。

- Guide 官方一键安装器 `install-guide.sh`，仅使用 NSJLUCAS/Guide 正式更新源。
- `guide-update` 一键升级，`--check` 严格只读检查当前与最新正式版本，不自动降级。
- 自动 SHA-256 校验归档与安装器，双校验来源一致；归档七成员白名单与候选版本预检。
- 停服后安全备份真实数据库及 WAL/SHM、旧二进制；保留原权限和 ownership。
- 新版启动失败自动整体回滚二进制与数据库，保留失败状态供排查。
- 安装器先校验 SHA 再自更新；首次安装生成本实例独立应急密码。
- 支持 Linux x86_64 GNU/glibc + systemd，要求 Python 3.8+ 和 curl。
- 支持已有 v1.0.0 `guide.service` 首次接入，无需预先存在 updater；保留自定义路径、systemd 配置、OAuth、Service、图标库和密码。可识别的未纳管实例拒绝首次安装；其他部署按文档人工迁移。
- 数据库 schema 保持 13，既有前端功能、认证和兼容协议保持。

### [1.0.0](https://github.com/NSJLUCAS/Guide/releases/tag/v1.0.0)

Guide 首个公开版本。

- 支持网站与服务导航管理
- 支持分类、排序、公开/私有及启用状态
- 支持在线状态检测与响应时间
- 支持自定义图标库、网站 favicon 和手动图标
- 支持 standard、compact、minimal 三种卡片样式
- 支持 GitHub OAuth 与应急密码登录
- 支持深色模式与响应式布局
- 使用 SQLite 存储配置
- 支持 Linux x86_64 部署
