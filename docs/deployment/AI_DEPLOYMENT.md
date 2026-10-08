# Guide AI 部署指南

供 AI 助手执行部署前读取。正式版本、Release Notes 和附件统一以 [GitHub Releases](https://github.com/NSJLUCAS/Guide/releases) 为准；默认部署[最新稳定版本](https://github.com/NSJLUCAS/Guide/releases/latest)，不要把仓库历史记录中的版本当作当前版本。

## 获取版本和文档

- 先阅读 [INSTALL.md](INSTALL.md)、[SECURITY.md](../../SECURITY.md)、[AUTH_RECOVERY.md](AUTH_RECOVERY.md) 和目标 Release Notes，核对安装、安全与兼容要求。
- 从 latest 页面确认最新稳定 Release；不默认使用 main 源码、预发布版或上游项目资产。
- 安装器入口：[install-guide.sh](https://github.com/NSJLUCAS/Guide/releases/latest/download/install-guide.sh)；SHA 清单：[sha256sums.txt](https://github.com/NSJLUCAS/Guide/releases/latest/download/sha256sums.txt)。执行 INSTALL 中的完整下载、校验步骤，不直接把 curl 输出送给 shell。
- 手动部署入口：[GNU x86_64 归档](https://github.com/NSJLUCAS/Guide/releases/latest/download/guide-linux-x86_64.tar.gz)和[独立 SHA 文件](https://github.com/NSJLUCAS/Guide/releases/latest/download/guide-linux-x86_64.tar.gz.sha256)，按 INSTALL 校验两个 SHA 来源。
- latest 下载期间可能切换；校验失败立即停止，在新的空目录重新下载整组文件。安装器内部会解析稳定 tag 并固定该 tag 下载后续资产；不要取消版本校验或禁止降级检查。
- 只有用户明确要求固定历史版本时，才从对应 Release 获取同一 tag 的归档与校验文件，先确认兼容要求，再按 INSTALL 手动部署。固定下载某版安装器不会固定 Hub 版本，安装器运行时仍选择 latest 稳定版。不要从本文推断当前产品版本或 schema。
- v1.0.0 是历史附件例外：仅有归档及独立 `.sha256`，没有安装器或汇总清单；按 INSTALL 的历史例外校验并手动部署，不能伪造缺少的资产。

## 执行前检查

1. 展示简短编号计划，先只读检查系统、CPU 架构、glibc、systemd、依赖及旧 Guide 实例。
2. 官方安装器仅支持 Linux x86_64 GNU/glibc + systemd，依赖与路径约束以 INSTALL 为准；不在 ARM、musl、容器或 OpenRC 中强行执行。
3. 核实旧服务、unit/drop-in、实际 binary、DB/WAL/SHM、监听地址、用户权限和独立一致性备份。未识别实例不代表没有旧数据。
4. 已有实例先按 INSTALL 的“从 v1.0.0 首次接入 updater”章节执行只读 `--check`，确认显示原版本；不能运行首次安装代码块初始化第二个实例。无法自动接管时遵循人工迁移说明。
5. 涉及删除数据、重装系统、SSH 登录方式、防火墙关键规则或磁盘格式化，先获得用户确认。每个重要阶段说明当前操作，修改后验证结果。

## 执行和验收

按 INSTALL 使用经过校验的官方安装器，或已有 `guide-update`。升级短暂停服并备份真实 DB/WAL/SHM 与旧 binary；保留既有配置与认证，不为升级调用密码重置。

验证 `guide-update --check`、实际 binary 版本、systemd 状态、原 DB 路径、后台登录、原 Service/分类/图标配置及代理访问。首次安装登录后修改本实例随机应急密码，不在公开输出中留下密码、数据库或 OAuth secret。

升级失败遵循 INSTALL 的完整 binary + DB/WAL/SHM 恢复步骤；SIGKILL、断电或磁盘故障不保证自动恢复。真实安装、旧部署升级和整机重启恢复只能根据实际执行证据报告，不把附件可下载或 mock 测试当作真机验收。

## 可选：HTTPS 域名与反向代理

仅在用户需要域名访问时执行。先确认用户控制的域名、DNS 管理权限、是否启用 Cloudflare 代理，以及现有 Nginx/Caddy 的管理方式。以下 `guide.example.com` 为匿名示例，执行时使用用户提供的域名，不把真实域名、IP、证书私钥或 DNS token 写入公开文档和日志。

1. **只读检查冲突。** 核对 DNS 的 A/AAAA 记录、实际路由、80/443 监听进程、现有站点及同名域名配置、证书覆盖范围/有效期/续期方式，以及 Guide 的真实监听地址。默认同机上游为 `http://127.0.0.1:28080`；代理位于另一台机器或网络命名空间时，先核实可达的上游，不能直接套用 loopback 地址，也不要为反代把 Guide 明文后台开放到公网。
2. **展示最小变更并确认。** 优先复用现有代理，只增加或调整目标域名的站点；不覆盖整个配置、不停用其他服务、不安装第二个代理争抢端口。备份相关配置并给出回退方式。修改现有服务、已有站点、共享证书、DNS/Cloudflare 设置前，说明影响范围并取得用户确认；更改防火墙关键规则等高风险操作仍须单独确认。没有代理时，先与用户确定采用 Nginx 还是 Caddy，再安装配置。
3. **选择证书方案。** 优先复用覆盖目标域名且有效的证书，并核对私钥权限、完整证书链与自动续期。需要新证书时使用适合当前 DNS/代理拓扑的 ACME 验证流程；HTTP/TLS 验证须检查所需端口和路由，DNS 验证须有对应 provider 支持与最小权限凭据。不要公开 token，也不要通过临时停用其他网站来抢占验证端口。Caddy 使用自动 HTTPS 时保留可写、持久的证书数据目录；显式加载证书时另行核对续期安排。
4. **接入现有代理。** Nginx 在目标域名的 HTTPS `server` 中配置证书与反代，将 `location /` 的 `proxy_pass` 指向真实 Guide 上游，保留请求路径、Host 和正确的转发协议头；管理/API 请求不要套用公共页面缓存。Caddy 在目标域名站点使用 `reverse_proxy` 指向该上游，可使用其自动 HTTPS 或明确加载已有证书。保留 `/admin/`、`/api/` 和可选 OAuth 回调路径，不擅自改为子路径部署；HTTPS/HTTP 重定向在目标站点配置，避免循环。参考 [Nginx 反代](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)、[Nginx HTTPS](https://nginx.org/en/docs/http/configuring_https_servers.html)、[Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) 和[自动 HTTPS](https://caddyserver.com/docs/automatic-https)。
5. **Cloudflare 可选接入。** 启用代理时，先确认源站 443 可从 Cloudflare 访问，且源站证书未过期、域名匹配并由受信任公共 CA 或 Cloudflare Origin CA 签发，再使用 [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)。检查设置作用于整个 zone 还是单个主机，避免影响其他域名；实际修改前取得确认。Full (strict) 验证的是 Cloudflare 到源站代理的 TLS，代理到同机 loopback Guide 可继续使用 HTTP。使用 [Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) 时，浏览器通常不信任其证书，关闭 Cloudflare 代理后的直连需改用公共受信任证书或另行配置客户端信任；不要以 Flexible、关闭校验或 `curl -k` 掩盖证书错误。
6. **校验后平滑应用。** 用现有服务的配置路径和权限运行检查：Nginx 用 `nginx -t`；Caddy 用 `caddy validate --config <实际配置路径>`，Caddyfile 格式须指定 `--adapter caddyfile`。检查通过并完成上述确认后，按既有服务管理方式平滑 reload，随后检查状态和错误日志。失败时恢复本轮相关配置并重新校验，不重置 Guide 数据库或密码。
7. **验收整个访问链路。** 先检查实际 Guide 上游，再检查源站 HTTPS 的 SNI/域名匹配和证书链，最后通过目标域名检查有效 HTTPS、预期 HTTP 跳转、首页、`/admin/` 登录及 `/api/public-config`；检查无重定向循环和混合内容、原站点仍可访问、证书续期已安排。Cloudflare Origin CA 的源站测试需显式使用相应 CA 信任，再验证经 Cloudflare 的浏览器访问。用户启用 OAuth 时核对回调为 `https://guide.example.com/api/auth/github/callback`（替换域名），变更既有 OAuth App 配置前确认。仅根据实际结果报告，不能仅凭代理服务 active 就声称部署成功。

HTTPS 检查还须核对原实例是否显式配置 `--site` 及其协议/域名。显式 `--site http://...` 会优先于代理转发协议头，使登录 Cookie 不带 Secure；需要调整为目标 HTTPS 地址时，先说明 Guide 服务配置变更并取得确认，保留原 DB 和其他参数。未配置 `--site` 时核实代理发送正确的 `X-Forwarded-Proto`。验收 HTTPS 登录 Cookie 的 Secure 属性时不要记录或公开 Cookie 值。

## 维护规则

本文和 [llms.txt](../../llms.txt) 使用 latest 稳定入口，不随普通发版修改。只有安装、安全、兼容或操作规则变化时更新对应文档。版本号只在现有构建元数据中维护，沿用 Release workflow 的一致性检查。
