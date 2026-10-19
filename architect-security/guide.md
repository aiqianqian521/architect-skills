# architect-security 判断力指南（Guide）

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径判定，不得只给结论不分级、不得只分级不给下一步。
>
> ⚠️ **蜂群模式（场景 B）附加门禁**：每个 finding 的 `id` 字段必须引用本 guide 或 contract 中的具体原则/反模式 ID（如 `SEC-03`、`核心原则·2`）。未引用原则 ID 的 finding → renderer 标为 `unreferenced`，confidence 强制降级为 `low`。
>
> ⚠️ 本 skill 覆盖常见架构安全模式，不替代专业渗透测试、合规审计或供应链扫描。

---

## 核心原则

### 1. 认证与授权（原则 ID：`核心原则·1`）

```
认证（Authentication） = 你是谁？
授权（Authorization）    = 你能做什么？

模式决策树:
├─ 用户系统已存在 → 接入现有认证（OAuth2/OIDC/SAML）
├─ 新系统 + Web → JWT (Access Token 短期 + Refresh Token 长期)
├─ 新系统 + 服务间 → API Key + HMAC 签名
├─ 本地脚本 → 环境变量 + 文件权限
└─ Agent 调用 → Token + Scope 限制
```

**反模式 ID**：`反模式·1·A` —— 将认证结果缓存在全局变量中，跨请求复用。
**反模式 ID**：`反模式·1·B` —— 授权检查只在入口做一次，后续内部调用不再校验。

### 2. 输入校验铁律（原则 ID：`核心原则·2`）

```
[ ] 所有外部输入必须校验（包括配置文件、环境变量、JSON payload）
[ ] 校验 = 白名单优先（允许什么）而非黑名单（禁止什么）
[ ] 校验失败 = 拒绝 + 日志记录（不静默丢弃）
[ ] 校验在入口处做，后续代码可信任数据
[ ] SQL 参数化（永远不拼接 SQL 字符串）
```

**反模式 ID**：`反模式·2·A` —— 用正则黑名单过滤 XSS（如 `replace(/<script>/g, '')`），绕过方式无穷多。
**反模式 ID**：`反模式·2·B` —— 校验失败返回 200 但 body 为空，前端误以为成功。

```python
# 反模式·2·C：字符串拼接 SQL（注入风险）
cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")

# 正确：参数化查询
cursor.execute("SELECT * FROM users WHERE name = ?", (name,))
```

### 3. 密钥管理（原则 ID：`核心原则·3`）

```
[ ] 密钥永远不硬编码在代码中
[ ] 密钥永远不提交到 git
[ ] 开发/测试/生产使用不同密钥
[ ] 密钥轮换机制（定期更换）
[ ] 最小权限原则（每个密钥只授权必要操作）
```

**反模式 ID**：`反模式·3·A` —— 把密钥存在 `config.json` 里提交到仓库，后续只改 `.gitignore` 不清历史。

存储方案：
| 环境 | 密钥存储 | 说明 |
|------|---------|------|
| 本地开发 | `.env` 文件（在 .gitignore 中） | 不提交 |
| CI/CD | GitHub Secrets / GitLab Variables | 加密存储 |
| 生产 | Secret Manager（Vault/AWS KMS） | 审计 + 自动轮换 |

### 4. 沙箱隔离（原则 ID：`核心原则·4`）

```
隔离级别（从低到高）:
├─ Docker 容器         ← 进程级隔离，防止文件系统污染
├─ Landlock/seccomp   ← 系统调用过滤，限制可执行操作
├─ VM 级别             ← 完全隔离，但开销大
└─ 网络隔离            ← 限制出站/入站连接
```

对 Agent 系统的特别考虑：
- 子进程/subprocess 应在隔离环境中运行
- 限制文件系统访问范围（chroot/namespace）
- 限制网络访问（仅允许白名单域名）

### 5. 常见边界攻击面（原则 ID：`核心原则·5`）

除了认证和 SQL 注入，还要对所有外部输入检查以下边界：

| 攻击面 | 强制措施 | 反模式 ID |
|--------|---------|----------|
| SSRF | URL 解析后只允许 HTTPS + allow-list 主机；解析并拒绝私网、回环、link-local 和重定向到内网的地址 | `反模式·5·A` —— 仅校验 URL scheme，未解析 IP 地址 |
| 路径穿越 | 使用固定根目录 + `resolve()` 后做目录前缀校验；禁止用户输入直接拼接路径 | `反模式·5·B` —— `path.join(base, userInput)` 未校验最终结果是否在 base 下 |
| 命令注入 | 优先调用库 API；必须执行子进程时使用参数数组、固定 executable、无 shell 拼接和资源限制 | `反模式·5·C` —— `subprocess.run(f"cmd {userInput}", shell=True)` |
| Webhook 重放 | 校验签名、时间窗和 nonce/idempotency key；拒绝过期或重复事件 | `反模式·5·D` —— 仅校验签名，不检查时间窗和重放 |
| 依赖/供应链 | 锁定版本和哈希，审查 transitive dependency，CI 中做 secret/CVE 扫描 | `反模式·5·E` —— `pip install package` 无版本锁定 |
| 日志泄露 | 统一脱敏 token、密码、身份证明和完整 payload；审计日志保留 who/when/what/result | `反模式·5·F` —— 日志直接打印 `request.body` 含密码 |

安全默认值应是 deny-by-default。任何"为了兼容先放开"的例外都必须有过期日期、owner 和回收验证。

---

## 检查清单（带原则 ID 引用）

```
[ ] SEC-01 是否区分了认证和授权？ → 没有: 先确认"谁"（认证），再确认"能做什么"（授权）
[ ] SEC-02 所有外部输入是否经过白名单校验？ → 未校验: 在入口处加 validate() 函数
[ ] SEC-03 SQL 查询是否使用参数化？ → 拼接: 搜索 f-string/format 中带 SQL 的代码，改为 ?
[ ] SEC-04 密钥是否硬编码/提交到 git？ → 已提交: git filter-branch 清除历史 + 立即轮换密钥
[ ] SEC-05 关键操作是否有审计日志？ → 无日志: 记录 who/when/what/result + 不可篡改
[ ] SEC-06 默认权限是否最小化？ → 默认开放: 改为 deny-by-default + 显式 allow
[ ] SEC-10 [策略 vs 机制] 密钥/令牌/合规规则是否走 enforceable 机制(env/.gitignore/CI 扫描/secret manager)而非仅口头规则？ → 只有文档: 把每条规则映射到可强制机制(.gitignore 命中/CI secret 扫描 fail/env 注入)；无机制项标 high + 登记人工复核与 owner
```

---

## 常见问题修复指南

### 密钥泄露 → 紧急轮换（修复 ID：`修复·1`）

1. 立即在密钥管理系统生成新密钥
2. 更新所有引用旧密钥的配置
3. 废弃旧密钥（revoke/delete）
4. git filter-branch 清除历史（如已提交）
5. 评估泄露影响范围（谁可能看到了？需要通知谁？）

### 输入校验缺失 → 加层层防护（修复 ID：`修复·2`）

1. 识别所有外部输入入口（CLI args、配置文件、JSON payload、环境变量）
2. 在每个入口添加白名单校验函数
3. 校验失败返回明确错误（不吞掉）
4. 对特殊字符做转义（HTML/Shell/SQL）

### 规则只在文档里（策略 vs 机制）（修复 ID：`修复·3`）

1. 列出项目里所有"政策性规则"（如"不提交真实密钥""生产 deny-by-default""保留期 30 天"）。
2. 为每条规则找 enforceable 机制：密钥 → env + .gitignore + CI secret 扫描；权限 → 代码中间件默认 deny；删除 → 自动化 + 审计。
3. 无法机制化的标 high，登记 owner 与人工复核周期。
4. **验证**：`git check-ignore -v config.yaml` 命中；CI 对泄漏密钥 fail；无"仅口头规则无对应执行点"残留。

---

## 威胁建模速查（STRIDE）

| 威胁 | 含义 | 检查 | 关联原则 ID |
|------|------|------|------------|
| **S**poofing | 身份伪造 | 认证机制是否存在？可否绕过？ | `核心原则·1` |
| **T**ampering | 数据篡改 | 数据完整性校验？签名/哈希？ | `核心原则·2` |
| **R**epudiation | 抵赖 | 关键操作是否有不可篡改的审计日志？ | `核心原则·5`·日志泄露 |
| **I**nformation Disclosure | 信息泄露 | 敏感数据是否加密存储/传输？ | `核心原则·3` |
| **D**enial of Service | 拒绝服务 | 是否有 rate limit/circuit breaker？ | `核心原则·5` |
| **E**levation of Privilege | 权限提升 | 权限检查是否在每次操作前执行？ | `核心原则·1` |

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。

---

## 交叉引用

- API 安全传输 → 参见 [[architect-net]]
- 数据加密存储 → 参见 [[architect-data]]
- Agent 权限控制 → 参见 [[architect-agent]]
- 安全审查 → 参见 [[architect-review]]
- Git 密钥泄露处理 → 参见 [[architect-git]]

---

> 📌 本 guide 保留 architect-security 的判断力（原则、反模式、修复路径、STRIDE 映射）。蜂群模式下，agent 输出必须引用本 guide 中的原则 ID 或反模式 ID；未引用的 finding 将被 renderer 标为 `unreferenced`，confidence 强制降级。场景 A 单原子设计咨询不受此限制，仍走完整 guide 自由发挥。
