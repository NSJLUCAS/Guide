# Guide

当前 Guide 源码：[NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)。

Guide Hub 是网站和服务导航门户的 Rust 后端，内嵌现有管理后台与同级 `navigation-theme` 的公开导航主题。

完整功能、构建步骤和兼容注意事项见[项目 README](../README.md)。从完整源码结构构建，先生成 `web-admin/dist` 与 `../navigation-theme/dist`，再在此目录运行 `cargo build --release`。二进制为 `guide-hub`；新数据库默认 `guide.db`，已有数据库必须按[安装与升级说明](../docs/deployment/INSTALL.md)选择。

当前源码版本为 `1.0.0`，尚未创建 v1.0.0 tag 或正式 GitHub Release，下载将在发布后提供；没有在线安装源。原自动更新保持关闭，`install-hub.sh` 不执行安装。

## 应急密码与恢复

管理员可以通过 GitHub OAuth 或本实例自己的应急密码登录；没有官方统一或万能应急密码。首次启动独立随机生成并输出密码，数据库保存 Argon2id hash；登录后在“安全”页面可以设为自己的应急密码。

忘记时通过 SSH/终端执行 `guide-hub --db <实际数据库路径> --reset-password`，取得新随机应急密码。该命令删除全部旧 session、保留 GitHub OAuth 配置、不启动 HTTP 服务，不接受明文密码参数。首次/reset 输出可能进入 systemd journal / Docker logs，改密前视为敏感日志。详细说明见[应急密码与账号恢复](../docs/deployment/AUTH_RECOVERY.md)。

Guide is based on monitor-probe/monitor and is distributed under the terms of the MIT License.

原 [MIT License](LICENSE) 和 `Copyright (c) 2026 stqfdyr` 完整保留；详细上游信息见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。
