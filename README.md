# Guide

Guide 自有源码仓库：[NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)。问题反馈见 [Issues](https://github.com/NSJLUCAS/Guide/issues)，贡献说明见 [CONTRIBUTING.md](CONTRIBUTING.md)。

Guide 是一个网站与服务导航门户：用紧凑卡片查看服务、在线状态和响应时间，通过分类与搜索快速访问网站。

后端使用 Rust 和 SQLite，管理后台与导航主题使用 React/TypeScript。实例数据保存在 `guide.db`，两个前端静态资源内嵌到 `guide-hub`。

- Service 管理：添加、编辑、删除、排序，public/private、启用及检测开关。
- 在线状态与响应时间：固定安全检测，支持未知、未检测和过期状态。
- 分类：选择已有分类或随服务保存新分类。
- 多图标库：服务器保存配置，由管理员浏览器加载兼容 JSON。新实例的图库列表为空，管理员可自行添加 HTTPS 图标库地址；Guide 不捆绑第三方图标集合。
- 网站 favicon：管理员手动获取安全 HTTPS 候选，确认后填写图标地址。
- Guide 不内置网站品牌 Logo；未设置图标或历史品牌键使用通用 Globe，自定义 HTTPS 图片继续显示。
- 三种卡片模式：standard、compact、minimal；深浅色及响应式布局。

当前正式版本：**Guide v1.0.0**。自动安装和自动更新尚未提供。

## 官方安装与升级器（下一正式版本）

源码中的 `install-guide.sh` 正在验证，**已发布的 v1.0.0 没有此资产**。以下命令需等未来正式 Release 包含安装器与 `sha256sums.txt` 后使用；当前请按下方 v1.0.0 手动部署说明安装。真实 Linux/systemd/回滚验收尚待完成。

首次安装：

```sh
curl -fsSL https://github.com/NSJLUCAS/Guide/releases/latest/download/install-guide.sh -o install-guide.sh
chmod +x install-guide.sh
sudo ./install-guide.sh
```

安装后入口为 `/usr/local/sbin/guide-update`：

```sh
sudo guide-update          # 有新正式版本时升级
sudo guide-update --check  # 只读：当前版本、latest 版本和是否需要升级
```

安装器只支持 **Linux x86_64 GNU + systemd**，需要 Python 3.8+、curl、systemd 工具、runuser/useradd；不支持 ARM、Windows、Docker 内升级、Alpine/musl 或 OpenRC。默认监听 `127.0.0.1:28080`，请配置自己的 HTTPS 反向代理。

升级器先从现有 `guide.service` 确定实际数据库与监听地址，下载并完成 SHA-256、归档白名单和候选版本校验后才停服。停止服务后自动备份 DB 及仍存在的 WAL/SHM、旧二进制；失败时整体恢复旧二进制与升级前数据库。已有配置保留，现有 unit 不覆盖。详细范围、备份位置、路径限制和人工恢复见[安装说明](docs/deployment/INSTALL.md#官方安装与升级器下一正式版本)。

首版正式支持目标为 **Linux x86_64 GNU**。发布工作流使用 Ubuntu 22.04，以降低 glibc 构建基线；运行环境需要兼容的 glibc，不承诺 Alpine/musl 静态、ARM 或 Windows 支持。

## 下载

- [Guide v1.0.0 Release 页面](https://github.com/NSJLUCAS/Guide/releases/tag/v1.0.0)
- [Linux x86_64 GNU 压缩包](https://github.com/NSJLUCAS/Guide/releases/download/v1.0.0/guide-linux-x86_64.tar.gz)
- [SHA-256 校验文件](https://github.com/NSJLUCAS/Guide/releases/download/v1.0.0/guide-linux-x86_64.tar.gz.sha256)
- [安装说明](docs/deployment/INSTALL.md)

## 源码结构

```text
guide/               Rust Hub、管理后台、构建与兼容源码
navigation-theme/    Guide 公开导航主题
docs/                版本变更、许可清单和部署说明
.github/workflows/   main CI 与 v* tag Release 配置
README.md            功能与入门
LICENSE              原 MIT 及版权
THIRD_PARTY_NOTICES.md 上游与第三方资源声明
SECURITY.md          漏洞私下报告与自托管保护
CONTRIBUTING.md      开发与测试要求
```

## 从源码构建

需要 Linux、Rust 1.99.0、Node.js 24/npm、sh 及 C 编译工具。先构建两个前端，再构建 Hub；主题必须与 guide 同级，缺失时构建直接失败。Linux 为完整 Rust 验证平台，现有 Unix-only 入口尚不支持 Windows 构建。

```sh
cd navigation-theme
npm ci
npm run lint
npm test
npm run build
cd ../guide/web-admin
npm ci
npm run lint
npm test
npm run build
cd ..
cargo fmt --all --check
cargo test
cargo build --release
```

CI 执行两个前端的 lint/test/build、Rust 格式检查、完整 `cargo test --locked` 和 Linux release build。第三方许可与已知证据缺口见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

构建后的二进制为 `guide/target/release/guide-hub`。手动启动示例：

```sh
./guide/target/release/guide-hub --db /path/to/existing-or-new/guide.db
```

不要在升级时误指向新空库。新工作目录默认 `guide.db`；只有旧 `monitor.db` 时仍使用原文件；两者同时存在则必须明确 `--db`。不自动改名、复制数据库或移动 WAL。升级及兼容注意事项见[安装说明](docs/deployment/INSTALL.md)。

完整的首次启动、持久化、OAuth、备份与升级步骤见[安装部署说明](docs/deployment/INSTALL.md)。systemd 示例为[guide.service](docs/deployment/guide.service)，需管理员按实际路径和用户配置，未自动安装或启用。当前没有已发布的官方 Docker 镜像或一键安装源。

GitHub OAuth 是可选登录方式；先用应急密码登录后台“安全”页面，配置自己的 OAuth App Client ID、Client Secret 和用户名白名单。回调为 `https://你的域名/api/auth/github/callback`；空白名单拒绝所有 GitHub 用户。`guide.db`、备份和密码日志属于敏感数据，升级前先做一致性备份。

## 管理员登录与应急密码

Guide 支持 GitHub OAuth 和当前实例自己的应急密码；应急密码用于 GitHub OAuth 无法使用时登录，**不存在官方统一密码或万能应急密码**。首次启动在没有已保存 hash 时独立随机生成应急密码并输出，数据库只保存现有 Argon2id hash。登录 `/admin` 后，可以在“安全”页面设置自己的新应急密码。

忘记应急密码时，通过有数据库读写权限的服务器 SSH/终端执行：

```sh
guide-hub --db /实际路径/guide.db --reset-password
```

CLI 输出新的随机应急密码，不接受明文新密码参数，不启动 HTTP 服务；重置会使全部旧 session 失效，但不会删除 GitHub OAuth 配置。网页改密码也删除旧 session，并给当前浏览器签发新 session。不依赖邮箱恢复。

首次生成或 CLI reset 输出的密码可能被 systemd journal / Docker logs 或终端记录保存；密码修改前，这些日志应视为敏感信息。建议首次登录后立即改密。完整步骤、Docker/systemd 示例与权限说明见[应急密码与账号恢复](docs/deployment/AUTH_RECOVERY.md)。

## Acknowledgements

Guide 是基于 [monitor-probe/monitor](https://github.com/monitor-probe/monitor) 的二次开发项目；导航主题来源于 [monitor-probe/monitor-theme-default](https://github.com/monitor-probe/monitor-theme-default)。

Guide is based on monitor-probe/monitor and is distributed under the terms of the MIT License.

上游基线（来源提交，并非当前 Guide 提交）：Hub `42926e471d3eff6a84fc57f5d467bceb8619ce88`；主题 `84fbf59a9d74b57145883ff323c81447cb28baf6`。

原版权与 MIT 条款完整保留在 [LICENSE](LICENSE)、[guide/LICENSE](guide/LICENSE) 和 [navigation-theme/LICENSE](navigation-theme/LICENSE)。详细来源、版本与保留的兼容名称见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。原作者版权未替换为 Guide 作者。

## 开发、安全与发布

开发检查见 [CONTRIBUTING.md](CONTRIBUTING.md)，漏洞请按 [SECURITY.md](SECURITY.md) 私下报告。版本变更见 [CHANGELOG](docs/CHANGELOG.md)。CI 在 main push/PR 执行两前端完整检查、Rust fmt/全量测试/release build；`v*` tag 发布工作流重新验证版本、测试和构建，打包 Linux x86_64 制品及 SHA-256 并发布到 GitHub Releases。

Guide 的上游来源、原版权与第三方授权说明见本页的来源章节、[LICENSE](LICENSE) 和 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
