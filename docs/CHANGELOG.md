# Guide Changelog

## 1.0.0

当前源码版本为1.0.0；本条整理第一版已完成能力，不表示v1.0.0 tag、GitHub Release或二进制下载已经发布。

- Guide品牌迁移：独立guide-hub后端、Guide管理后台和导航主题；保留monitor-probe上游来源、基线SHA及原MIT/第三方声明。
- Service导航管理：添加、编辑、删除和排序，分类、public/private、启用及检测开关；在线状态和响应时间展示。
- 安全目标校验与SSRF防护：保留HTTPS、DNS/IP目标校验及检测安全边界，schema13和既有数据迁移兼容。
- 多图标库配置和安全favicon自动发现候选；新实例默认空图标库，已有配置保留。Guide移除内置品牌Logo，缺省和旧品牌键使用通用Globe，用户HTTPS图片保持可用。
- standard、compact、minimal三种卡片模式，深浅色和响应式布局。
- GitHub OAuth及本实例应急密码；Auth hardening包含初始化读取错误处理、条件会话签发、网页改密和CLI随机reset后的旧session失效。
- 统一开源源码仓库；source-map-js漏洞已修复。维护者接受react-remove-scroll-bar@2.3.8精确许可证据未完整核验风险，未伪造正文。
- 既有Linux x86_64 GNU Release流程包含版本一致性检查、两前端及全量Rust验证、白名单打包和SHA-256；正式tag与Release尚未发布。
