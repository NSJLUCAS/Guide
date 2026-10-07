# Guide 应急密码与账号恢复

Guide 管理员可以使用 GitHub OAuth，或当前 Guide 实例自己的应急密码登录。应急密码用于 GitHub OAuth 不可用时进入后台；没有官方统一密码或万能应急密码，也不依赖邮箱找回。

## 首次安装

数据库没有应急密码 hash 时，首次启动独立随机生成 24 位应急密码，并在标准输出显示 `Emergency password: ...`。数据库只保存带随机盐的 Argon2id hash，不保存明文密码。已有 hash 的正常重启不会重新生成；读取认证设置失败会使启动失败，不会重置认证状态。

使用该实例的应急密码登录 `/admin`，在“安全”页面设置自己的新应急密码（沿用现有至少 12 位规则）。GitHub OAuth 配置可以继续使用。应急密码不会自动过期，也没有强制首次改密步骤，建议部署后立即修改。

## 忘记密码：在服务器终端重置

使用有权限读写实际数据库及其目录的系统用户，通过 SSH/终端执行：

```sh
guide-hub --db /实际路径/guide.db --reset-password
```

命令生成新的随机应急密码，替换 Argon2id hash，并在同一个事务中删除全部旧 session。它不删除 GitHub OAuth 配置，不启动 HTTP 服务，也不需要旧密码。数据库必须已经存在；请确认 `--db` 与运行服务使用的数据库一致。不要删除数据库或手工修改 hash。

按仓库 systemd 示例部署时，可以使用（按实际安装位置调整）：

```sh
sudo -u guide /opt/guide/guide-hub --db /var/lib/guide/guide.db --reset-password
```

Docker 镜像内无需 shell，可以直接执行二进制：

```sh
docker exec <容器名> /guide-hub --db /data/guide.db --reset-password
```

运行中的 Hub 每次认证读取数据库，因此重置通常无需重启。用输出的新应急密码登录后，可以再次在“安全”页面设为自己的密码。CLI 不接受明文新密码参数，避免密码进入 shell history 或进程 argv。

## 会话与 GitHub OAuth

网页改应急密码同样替换 hash 并删除全部旧 session；当前浏览器按原设计取得一个新 session，其他旧 session 失效。CLI 重置不为浏览器签发新 session。已配置且获准的 GitHub 用户仍可重新登录；如 GitHub 账号本身有风险，应另行处理授权配置。

应急密码登录在 Argon2 校验后，创建 session 时原子确认数据库当前 hash 仍与校验的 hash 相同，避免重置前通过的旧密码请求在重置后留下新 session。

没有匿名网页/API“忘记密码”入口。网页修改密码仅允许已认证管理员；忘记密码且不能通过 GitHub 登录时使用服务器终端恢复。

## 输出、日志和部署保护

首次生成或 CLI reset 输出的随机应急密码可能进入 systemd journal、Docker logs、终端记录或重定向文件。**在该密码被修改前，这些记录应视为敏感信息。**首次正常启动只输出一次，不代表日志副本不存在；`GUIDE_LOG` 不会屏蔽标准输出中的密码。

保留密码输出用于恢复，请限制日志和数据库/备份的访问权限，部署后及时修改初始密码。使用 HTTPS 访问后台，避免密码和 Cookie 通过明文网络传输。复制已初始化的数据库会同时复制其凭据和配置，不应作为公共安装模板。
