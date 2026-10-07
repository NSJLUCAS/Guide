# Guide 安装、持久化与升级

当前源码版本为 **Guide v1.0.0**。尚未创建 v1.0.0 tag 或 GitHub Release，下载链接将在发布后提供。源码仓库为 [NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)，尚未提供正式二进制下载；以下先说明已有源码构建部署，再说明未来 Linux x86_64 包的使用方式。没有一键安装命令。

## 构建或解包

源码需要 Linux、Rust 1.99.0、Node.js 24/npm、`sh` 及 C 编译工具（bundled SQLite 编译需要）。完整源码必须有同级 `guide/` 与 `navigation-theme/`。按项目 README 或 CONTRIBUTING 先执行两个前端的 `npm ci/lint/test/build`，再在 `guide/` 执行 `cargo fmt --all --check`、完整 `cargo test`、`cargo build --release`。输出为 `guide/target/release/guide-hub`。

未来正式包为 `guide-linux-x86_64.tar.gz`，同时提供 `.sha256` 文件；文件都下载完成后，在同一目录验证和解包：

```sh
sha256sum --check guide-linux-x86_64.tar.gz.sha256
tar -xzf guide-linux-x86_64.tar.gz
```

未来 workflow 使用 Ubuntu 22.04、`x86_64-unknown-linux-gnu`。需要兼容的 Linux x86_64/glibc；不承诺旧发行版、Alpine/musl、ARM 或 Windows 支持。二进制已经内嵌管理后台和导航主题，部署默认页面不需要另带 `dist/` 或运行 Node.js。可选自定义主题才需要外部主题目录。

## 首次运行

安装到可执行位置（如 `/opt/guide/guide-hub`），为服务用户准备可写的持久目录（如 `/var/lib/guide`）。数据库文件和目录必须属于实际服务用户；不使用源码或解包目录存储生产数据库。

手动启动示例，先只监听本机，通过本机浏览器或已配置的 HTTPS 反向代理访问：

```sh
/opt/guide/guide-hub --listen 127.0.0.1:28080 --db /var/lib/guide/guide.db
```

Guide 使用 SQLite，首次运行没有已保存密码 hash 时会输出 `Emergency password: ...`。这是本实例独立的随机密码，不存在 Guide 官方万能密码。访问 `/admin/` 用该密码登录，立即在“安全”页面设置自己的应急密码（至少 12 位）。数据库仅保存应急密码的 Argon2id hash；不要共享初始化后的数据库。

首次密码可能进入终端、systemd journal 或 Docker logs；密码修改前这些记录属于敏感信息。没有强制自动改密或密码自动过期，管理员需要自己完成修改。

systemd 示例见同目录 [guide.service](guide.service)。使用前手动准备 `guide` 用户/组、安装二进制、创建数据库目录并设置权限；调整 `ExecStart`、`User`、`WorkingDirectory`、`ReadWritePaths` 使路径一致，再按自己的运维流程安装该 unit。该文件不会自动安装或启动服务。不要让反向代理之外的公网直接访问明文后台。

## GitHub OAuth（可选）

不配置 GitHub OAuth 也可以用应急密码登录。需要 OAuth 时，先在自己的 GitHub 账号创建 OAuth App，然后在 Guide 后台“安全”页面配置 Client ID、Client Secret 和允许登录的 GitHub 用户名（逗号分隔）。回调地址为：

```text
https://guide.example.com/api/auth/github/callback
```

将示例域名替换为自己的实际 HTTPS 地址，按后台显示的回调地址配置 OAuth App。白名单为空会拒绝所有 GitHub 用户，不会放行所有人。OAuth secret 保存在实例数据库中，数据库和备份都要保护。Guide 不提供官方共享 OAuth 凭据。

## 忘记应急密码

通过 SSH/服务器终端，以有权读写数据库及目录的用户执行：

```sh
guide-hub --db <guide.db路径> --reset-password
```

把占位符替换为正在运行实例的实际数据库路径。CLI 生成并输出新的随机密码，原子替换 hash、删除全部旧 session，保留 GitHub OAuth 配置；不会启动 HTTP 服务。数据库必须已经存在，不能用新空库恢复旧实例。登录后再到“安全”页面修改密码。更多步骤见 [AUTH_RECOVERY.md](AUTH_RECOVERY.md)。

## 持久化、备份和升级

数据库必须持久化；不要随二进制或容器替换而删除 `guide.db`。有旧实例时明确传 `--db`；仅有旧默认 `monitor.db` 时保留兼容使用，两种默认文件同时存在必须显式指定。不要手动改名或把一个活动 WAL 库的主文件单独复制。

当前后台菜单没有“数据”入口。管理员登录后可在同一浏览器打开实例的 `/api/db/backup` 下载一致性备份；该现有接口要求管理员 session，不是匿名下载。备份含凭据与配置，按敏感文件保存。也可以在停止服务后完整备份数据库及当时仍存在的 `-wal`/`-shm` 文件。仅复制运行中的 `guide.db` 可能遗漏 WAL 中的已提交数据。记录实际数据库路径，验证备份可恢复。

升级前先备份数据库和自定义主题目录，保存旧二进制。停止旧服务，替换二进制，再用同一数据库路径启动；启动时执行现有 schema migration。确认能登录、服务配置/检测/卡片样式正常后再结束维护。回退到旧二进制前先确认它是否支持已升级 schema；必要时停止服务并从升级前备份恢复，不假定旧代码能读取新 schema。

## 升级兼容

为兼容已有部署，保留 `monitor_session` / `monitor_oauth_state` Cookie 名称、旧 `monitor.db` 检测、`MONITOR_LOG` 和 `MONITOR_HUB` 别名，以及外部 `monitor-agent` 协议与既有服务名称。`GUIDE_LOG` / `GUIDE_HUB` 优先使用；这些旧名称不会启用上游自动更新或下载服务。

读取旧的默认站点名称时展示 Guide；用户自定义名称和数据库值保留。已有 systemd 路径、Docker 挂载和数据库不会被自动改名或迁移。复用旧数据库时显式传入实际 `--db` 路径；自建兼容容器若仍挂载旧数据库，可明确使用 `/guide-hub --db /data/monitor.db`，避免误指向新空库。

## Docker 注意事项

Guide 当前没有已发布的官方镜像。源码中保留的 scratch Dockerfile 需要另行构建的 **musl** 二进制，未来此 GNU release 包不能直接塞入 scratch 镜像。使用前须自行验证所构建的镜像。

如自行部署兼容镜像，必须把实际数据库目录挂载到持久 volume/bind mount，设置容器服务用户的写权限；镜像约定数据库是 `/data/guide.db`，二进制是 `/guide-hub`。备份/升级同样需要保护该持久目录。首次随机密码可能在 `docker logs <容器名>` 中。容器恢复命令为 `docker exec <容器名> /guide-hub --db /data/guide.db --reset-password`；需要容器执行权限，reset 后旧 session 全部失效且 OAuth 配置保留。
