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

## 维护规则

本文和 [llms.txt](../../llms.txt) 使用 latest 稳定入口，不随普通发版修改。只有安装、安全、兼容或操作规则变化时更新对应文档。版本号只在现有构建元数据中维护，沿用 Release workflow 的一致性检查。
