# Contributing to Guide

Guide 自有仓库：[NSJLUCAS/Guide](https://github.com/NSJLUCAS/Guide)；问题反馈：[Issues](https://github.com/NSJLUCAS/Guide/issues)；PR 提交到该仓库的 main。上游仓库仅用于 attribution 和来源参考。

Guide 使用 Rust、SQLite、React/TypeScript。请在完整源码根目录开发，保留同级 `guide/` 和 `navigation-theme/`。完整 Rust 验证需要 Linux、Rust 1.99.0、Node.js 24/npm 和 `sh`。Windows 目前受 Unix-only 信号入口限制，不能用前端通过代替 Linux Rust 测试。

先构建两个前端，Rust 会内嵌它们的静态资源：

```sh
cd guide/web-admin
npm ci
npm run lint
npm test
npm run build
cd ../../navigation-theme
npm ci
npm run lint
npm test
npm run build
cd ../guide
cargo fmt --all --check
cargo test
cargo build --release
```

CI 使用 `--locked` 确保检查已提交的锁文件。保留 `guide/Cargo.lock` 和两个 `package-lock.json`；依赖变更需说明原因并提交对应锁文件。

PR 请说明问题、改动效果和实际验证结果。不得绕过测试、删除失败测试、增加 skip/ignore 或用局部测试冒充完整测试。schema 修改必须包含 migration，并覆盖旧库升级和重复迁移；安全相关改动必须增加回归测试。不要提交数据库、密码、token、真实部署信息或本机缓存。

新增第三方代码、资源或依赖时核对许可，更新 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [许可清单](docs/DEPENDENCY_LICENSES.md)。漏洞依照 [SECURITY.md](SECURITY.md) 私下报告。

当前产品名称统一为 **Guide**。上游来源、许可证和必要兼容标识保留原名称，不做全局替换。

可选浏览器回归需要可用的 Playwright/Chromium。测试默认使用 `require('playwright')` 和 Playwright 管理的浏览器；也可用 `PLAYWRIGHT_MODULE` 指定自己的模块位置、`CHROME_PATH` 指定浏览器。不要在测试源码写入个人绝对路径。浏览器回归使用本地预览与拦截的测试数据，不连接真实实例。

可用 `gitleaks git --redact=100 --log-opts=--all` 检查 Git 历史，并用 `gitleaks dir . --redact=100` 检查工作目录。根 `.gitleaks.toml` 使用默认规则且不设置凭据例外。

两个本地生产预览启动后，设置 `SERVICE_ADMIN_PREVIEW`，执行 `node guide/web-admin/src/tests/open-source.browser.cjs` 验证空图库、自有库、手动 URL/favicon 与纯文字 OAuth 入口。服务浏览器回归还可通过后台的 `npm run test:browser` 运行；测试截图和日志不纳入版本管理。

## 发布与文档维护

GitHub Releases 是正式版本与更新日志的统一来源。每次发版只准备一份 Release Notes，说明变更、修复、兼容/安全注意事项及必要的迁移步骤；将其用于正式 Release 正文，不要求在仓库新增 `docs/releases/<版本>.md` 或重复追加 CHANGELOG。

产品版本仍需按现有构建系统同步维护 `guide/Cargo.toml`、`guide/Cargo.lock` 中 Guide package、两个前端的 `package.json`/`package-lock.json`（含 root package）及 `navigation-theme/theme.json`；Release workflow 校验 tag 与这些现有版本一致。不要新增文档版本常量、独立 VERSION 文件或额外的当前版本来源。

发版前按现有 CI/Release 流程验证代码、tag、四项资产与 SHA；保持稳定资产名称，确保 latest 指向预期的正式稳定版本，并验证 latest 下载和摘要。既有 Release/tag/附件不为文档维护而修改。Release workflow 使用 `--generate-notes` 生成初始正文，维护者仍须将准备好的 Release Notes 设置为正式正文并复核；这一步不需要新增仓库版本文档。

README、INSTALL、SECURITY、AI 部署指南和 llms.txt 使用长期描述及 latest 入口；CHANGELOG 只保留既有历史并指向 Releases。只有安装、下载资产约定、安全政策或兼容规则实际变化时，才修改对应文档；schema/迁移变化写入该版 Release Notes，并在影响长期部署规则时同步 INSTALL/AI 指南。第三方依赖或资源变化时仍须更新许可声明。
