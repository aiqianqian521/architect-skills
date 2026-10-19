# architect-ops 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 部署与运行架构

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则

### 1. 发布路径可验证

代码提交 → 自动测试 → 构建不可变产物 → 预发布验证 → 小流量发布 → 指标确认 → 全量或回滚。每一步都要有命令、责任人和通过阈值。

### 2. 健康检查分层

- liveness 只回答进程是否还能工作，不检查外部依赖。
- readiness 回答实例是否能接收流量，必须检查关键依赖和迁移状态。
- startup 保护慢启动服务，避免被 liveness 过早杀死。

### 3. 回滚优先于英雄式修复

应用、配置和数据库迁移都必须有可执行回滚路径。数据库使用 expand-contract；禁止把不可逆删除和发布绑定在一个窗口。

### 4. 环境与产物可追溯

配置通过环境/密钥管理注入；镜像和依赖锁版本；发布记录 commit、构建摘要、配置版本、迁移版本和操作者。

## 检查清单

```text
[ ] 是否有 CI 最小门禁（lint、unit、integration、security scan）？ | 未通过时: 加 CI 配置并把这四类门禁作为合并必要条件；缺类先补该类再串门禁。
[ ] 是否有 health/readiness/startup 检查和超时？ | 未通过时: 实现 liveness(进程)/readiness(依赖+迁移)/startup(慢启动)三探针并设超时；缺探针即补并接编排器。
[ ] 是否有 staging 或等价隔离环境？ | 未通过时: 建 staging 或 namespace 隔离环境与生产同构；无隔离即标 high（生产直发风险）。
[ ] 是否支持 rolling/blue-green/canary 中至少一种可回滚策略？ | 未通过时: 选一种(rolling 最易)接入部署系统；纯替换式发布即补可回滚策略+回滚命令。
[ ] 数据库迁移是否与应用发布兼容并可恢复？ | 未通过时: 用 expand-contract 拆迁移，发布与不可逆删除不绑同一窗口；写回滚命令并演练。
[ ] 是否记录版本、配置、迁移和回滚证据？ | 未通过时: 发布记录写 commit/build/配置版本/迁移版本/操作者；无记录即接发布日志自动化。
[ ] 容器是否非 root、无 secrets、固定基础镜像版本？ | 未通过时: Dockerfile USER 非 root、secrets 走 env/secret manager、基础镜像钉版本(含 digest)；浮动 latest 即钉版本。
```

## 常见问题修复指南

### 发布后无法快速回滚

1. 为每次发布保存不可变 artifact digest 和配置版本。
2. 为应用、配置、迁移分别定义回滚命令和负责人。
3. 在隔离环境演练一次，记录恢复耗时和失败点。
4. 将回滚演练加入发布前检查。
5. **验证**：在隔离环境触发一次回滚，记录 RTO<RPO 目标；回滚命令幂等且可无人值守执行。

### 容器以 root 跑且基础镜像用 latest

1. 审查 Dockerfile 是否 USER root、是否 FROM 无 digest 的 latest 标签。
2. 改 USER 非 root、base 钉到具体版本+digest（如 python:3.12.10-slim@sha256:...）。
3. secrets 全部移出镜像/层，改 env 或 secret manager 注入。
4. **验证**：docker inspect 见 USER 非 root、base 带 digest；trivy/grype 扫描无高危已知 CVE；无 secret 落镜像层。

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。
## 交叉引用

- 发布审查 → [[architect-review]]
- 网络健康与超时 → [[architect-net]]
- 数据迁移回滚 → [[architect-data]]
- 安全容器与密钥 → [[architect-security]]
- 变更记录 → [[architect-git]], [[architect-docs]]
