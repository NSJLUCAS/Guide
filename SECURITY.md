# Guide Security Policy

## 私下报告漏洞

Guide 自有仓库为 [NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)。如仓库已启用 GitHub private vulnerability reporting，请通过 [Report a vulnerability](https://github.com/NSJLUCAS/Guide/security/advisories/new) 私下报告。此链接不代表该功能已启用；入口不可用时按下方方式联系维护者。

如果该入口未启用，可在 [Guide Issues](https://github.com/NSJLUCAS/Guide/issues) 提交一个不含漏洞细节和敏感信息的 issue，请维护者提供私下沟通方式；取得私下渠道后再发送复现步骤。不要在公开 issue、PR、截图或日志中提交密码、token、Cookie、session、OAuth Client Secret、SSH 私钥、数据库或真实服务器配置。

私下报告请包含受影响版本、影响范围、最小复现步骤及脱敏环境信息。披露时间由报告者和维护者协商；此项目尚无承诺的响应 SLA。当前已发布支持版本为 [v1.0.0](https://github.com/NSJLUCAS/Guide/releases/tag/v1.0.0)；本分支准备的 v1.1.0 尚未发布，其安装器下载命令须等正式发布后使用。

## 自托管管理员

- 保护 `guide.db`、SQLite WAL/SHM、备份及日志的权限。数据库除服务配置外还可能包含 OAuth secret 和会话信息，不得作为公共安装模板。
- 首次运行生成本实例独立的随机应急密码，数据库仅保存该密码的 Argon2id hash。立即登录后台“安全”页面修改初始密码。
- 首次/reset 输出可能进入 systemd/Docker 或终端日志；密码修改前这些记录属于敏感信息。
- 应急密码重置要求服务器/容器执行权限及实际数据库读写权限：`guide-hub --db <guide.db路径> --reset-password`。重置使全部旧 session 失效，保留 GitHub OAuth 配置。
- 通过 HTTPS 访问后台；升级前备份数据库，公开资料中只使用脱敏示例。
- 使用官方安装器前按安装说明校验 SHA，并核对旧实例的真实 DB/systemd 配置；“未识别实例”不等于“没有旧数据”。不要为接入 updater 重置旧密码或初始化第二个数据库。

详细步骤见 [安装说明](docs/deployment/INSTALL.md) 和 [账号恢复](docs/deployment/AUTH_RECOVERY.md)。
