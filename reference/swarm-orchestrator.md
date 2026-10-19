# 蜂群编排契约（Swarm Orchestrator Contract）

> 版本：v1.1
> 日期：2026-08-31
> 适用场景：多 agent 并行执行 architect-skills 评估时的任务分发、证据合并、冲突仲裁
> 变更：v1.1 新增 MISSING_AGENT 缺失告警条款（§5.1）、lenient 模式说明（§5.3）

---

## 一、设计目标

当前 architect-skills 为单 agent 深度评估设计。蜂群模式下，多 agent 并行执行时面临：
- **协调失效**：agent 结果丢失（如 Halley completed:null）
- **证据冲突**：不同 agent 对同一文件给出矛盾结论
- **口径不一致**：同一条件不同 agent 定级不同

本契约定义蜂群运行的标准协议，使 orchestrator 可自动化调度、聚合、仲裁。

---

## 二、任务分发规则

### 2.1 维度到 Agent 的映射

| 维度 | 默认代理 | 执行顺序 | 输入依赖 | 输出约束 |
|------|----------|----------|----------|----------|
| security | SecurityAgent | 第一批（并行） | Intake 建图结果 | 必须含行级证据 |
| data | DataAgent | 第一批（并行） | Intake 建图结果 | 必须含 schema/迁移证据 |
| test | TestAgent | 第一批（并行） | Intake 建图结果 + 代码变更范围 | 必须含验证命令 |
| net | NetAgent | 第一批（并行） | Intake 建图结果 | 必须含 API 契约证据 |
| design | DesignAgent | 第二批（依赖第一批） | Intake 建图结果 + 全部维度结论 | 最后执行，做全局调和 |
| review | ReviewAgent | 第一批（并行） | Intake 建图结果 | 必须含代码行级证据 |
| ops | OpsAgent | 第二批（依赖第一批） | Intake 建图结果 + 部署形态 | 必须含健康检查证据 |
| observability | ObservabilityAgent | 第二批（依赖第一批） | Intake 建图结果 + 运行态 | 必须含日志/指标证据 |
| cost | CostAgent | 第三批（依赖全局） | 全部维度结论 + 资源清单 | 必须含成本估算 |
| compliance | ComplianceAgent | 第三批（依赖全局） | 全部维度结论 + 数据处理清单 | 必须含合规映射 |
| workflow | WorkflowAgent | 第一批（并行） | Intake 建图结果 | 必须含流程图/工单证据 |
| agent | AgentAgent | 第一批（并行） | Intake 建图结果 | 必须含状态机证据 |
| git | GitAgent | 第一批（并行） | Intake 建图结果 | 必须含分支/提交证据 |
| docs | DocsAgent | 第一批（并行） | Intake 建图结果 | 必须含文档入口证据 |
| frontend | FrontendAgent | 第一批（并行） | Intake 建图结果 | 必须含组件边界证据 |

### 2.2 DAG 依赖图

```
Phase 1 (并行): security, data, test, net, review, workflow, agent, git, docs, frontend
       │
       ▼
Phase 2 (依赖 Phase 1): design, ops, observability
       │
       ▼
Phase 3 (依赖全局): cost, compliance
       │
       ▼
Phase 4 (聚合): renderer 生成 L2 报告
```

**依赖规则**：
- Phase 2 的 agent 可以读取 Phase 1 的全部输出作为输入
- Phase 3 的 agent 可以读取所有前置阶段的输出
- 任一 Phase 1 agent 失败（timeout/completed:null）→ 不阻塞其他 agent，但该维标为 `unknown`

---

## 三、证据合并协议

### 3.1 统一输出格式

所有 agent 必须输出符合 `reference/agent-output-schema.json` 的 JSON。

### 3.2 证据去重规则

当多个 agent 引用同一文件同一行时：

1. **同一维度内去重**：同一 agent 对同一行的多条发现，合并为一条（取最高 risk_level）
2. **跨维度去重**：不同 agent 对同一行的发现，保留所有视角，标记 `MULTI_DIM`
3. **证据冲突时**：若两个 agent 对同一行的 risk_level 差异 ≥2 级（如 critical vs medium），标记 `CONFLICT_EVIDENCE`

### 3.3 置信度聚合

| 场景 | 聚合规则 |
|------|----------|
| 两个 high confidence 结论一致 | 保持 high，增强可信度 |
| 一个 high 一个 medium 结论一致 | 降为 medium（存在视角盲区） |
| 两个 high 结论矛盾 | 标记 CONFLICT，触发仲裁 |
| 任一 unknown | 该发现整体标为 unknown，入「待复核」 |

---

## 四、冲突仲裁规则

### 4.1 冲突类型

| 类型ID | 冲突描述 | 示例 |
|--------|----------|------|
| C-DESIGN-TEST | 设计建议与测试建议矛盾 | design 建议合并模块，test 建议拆分模块 |
| C-SECURITY-OPS | 安全要求与运维可行性矛盾 | security 要求强制 MFA，ops 认为影响灰度发布 |
| C-COST-RELIABILITY | 成本与可靠性矛盾 | cost 建议降配，reliability 要求冗余 |
| C-DATA-COMPLIANCE | 数据设计与合规矛盾 | data 建议集中存储，compliance 要求数据驻留 |
| C-EVIDENCE | 同一证据不同解读 | 两个 agent 对同一 god-file 定级不同 |

### 4.2 仲裁优先级（降序）

1. **安全维度一票否决**：security agent 定 critical → 无论其他维度怎么说不，整项目阻塞。security 的 high 在与其他维度冲突时优先。
2. **证据优先于推断**：有行级证据的 agent > 只有推断的 agent。若都有证据，看 evidence 的直接程度（代码行 > 配置文件 > 设计文档）。
3. **耦合度优先于单维最优**：design agent 和 test agent 冲突时，按"最小破坏现有代码"原则调和。若破坏性相同，按"可回滚性"优先。
4. **SLO 优先于成本**：涉及线上可用性的冲突，reliability/ops 优先于 cost。
5. **合规优先于功能**：涉及 GDPR/数据驻留/审计的冲突，compliance 优先于 data/ops。
6. **人工决策兜底**：上述规则无法调和时，标记为 `NEED_HUMAN_DECISION`，不自动选边。报告显式列出冲突双方的理由和证据，等待人工裁决。

### 4.3 仲裁输出格式

```json
{
  "conflict_id": "C-DESIGN-TEST-001",
  "type": "C-DESIGN-TEST",
  "agents": ["DesignAgent", "TestAgent"],
  "dimension_a": {
    "agent": "DesignAgent",
    "suggestion": "合并 orchestrator 与 controller",
    "evidence": "orchestrator.go:312",
    "risk_level": "medium",
    "confidence": "high"
  },
  "dimension_b": {
    "agent": "TestAgent",
    "suggestion": "拆分 orchestrator 与 controller",
    "evidence": "orchestrator_test.go:45",
    "risk_level": "medium",
    "confidence": "high"
  },
  "arbitration": {
    "winner": null,
    "reason": "双方均有行级证据，破坏性评估相当，触发规则6兜底",
    "resolution": "NEED_HUMAN_DECISION",
    "fallback": "保持现状，在 ADR-XXX 中记录决策"
  }
}
```

---

## 五、故障处理规则

### 5.1 MISSING_AGENT 缺失告警（v1.1 新增）

> 本条款解决 loop-dev 实证问题：Halley `completed:null` 导致设计维度静默缺失，用户误以为设计审查通过。

**触发条件**（任一满足即触发）：
- agent 输出 `status: "timeout"`
- agent 输出 `status: "failed"`
- orchestrator 等待 agent 返回超时且无任何输出
- agent 返回的输出不符合 `agent-output-schema.json` 且无法自动修复

**处理规则**：

| 步骤 | 动作 | 责任方 |
|------|------|--------|
| 1 | orchestrator 将该维标记为 `unknown`，不阻塞其他 agent | orchestrator |
| 2 | renderer 在报告顶部输出 `🚨 MISSING_AGENT` 告警区块，列出失联维度/代理/原因 | renderer |
| 3 | renderer 在维度覆盖矩阵中该维标 `missing ⚠️失联` | renderer |
| 4 | renderer 在「待复核项」中增加「Agent 失联/失败」子章节 | renderer |
| 5 | **整方案门禁判定为 `BLOCKED`，不得判"通过"或"条件通过"** | renderer |
| 6 | 报告结论叙述段仍保留 LLM 的原始叙述，但顶部门禁横幅明确阻断 | renderer |

**恢复路径**：
- 重新运行缺失维度的 agent
- 或人工补评该维度后，重新聚合生成报告
- 缺失维度补齐前，该方案版本不得视为已评估通过

---

### 5.2 Agent 超时

| 超时场景 | 处理方式 | 输出 |
|----------|----------|------|
| Phase 1 agent 超时 | 标记该维为 `unknown`，继续执行其他 agent | `{status:"timeout", findings:[], coverage:{status:"missing", reason:"agent 超时"}}` |
| Phase 2 agent 超时 | 若依赖的 Phase 1 已完成，用 Phase 1 输出推断；否则标 `unknown` | 同上 |
| renderer 聚合超时 | 输出已聚合部分，缺失部分标为「聚合未完成」 | 部分报告 + 超时说明 |

> **注意**：agent 超时是 MISSING_AGENT 的一种具体表现，按 §5.1 处理。

---

### 5.3 Agent 输出 malformed（v1.1 更新 lenient 模式）

| 故障场景 | strict 模式（默认） | lenient 模式（`--lenient`） |
|----------|---------------------|----------------------------|
| JSON 语法错误 | throw Error，不生成报告 | 记录警告，继续渲染 |
| 缺必填字段 | throw Error，提示缺失字段名 | 记录警告，该 finding 标为 INVALID |
| 非法枚举值 | 该 finding 标为 `INVALID`，入「待复核」 | 同上（降级处理，不阻断） |
| 空 findings 数组 | 允许，但 coverage.status 不能为 covered | 同上 |

> **lenient 模式用途**：兼容存量单代理评估数据、金样回归过渡期间使用。新蜂群评估应使用 strict 模式。

---

## 六、与现有组件的关系

| 组件 | 关系 |
|------|------|
| `architect-router/SKILL.md` | Router 负责"用户意图 → 单个 atom"，本契约负责"多 atom → 蜂群编排" |
| `reference/agent-output-schema.json` | 本契约的执行依赖 schema，schema 是本契约的数据契约 |
| `reference/risk-grading-scheme.md` | 本契约的仲裁规则引用 scheme 的触发条件编号 |
| `scripts/render-report.cjs` | renderer 是本契约的最终聚合器，负责执行证据去重、冲突检测、报告生成 |
| `scripts/regression-guard.cjs` | 金样回归脚本验证蜂群输出的定级口径是否与历史一致 |

---

## 七、使用方式

### 7.1 对于 Orchestrator 开发者

1. 按 §2 DAG 图调度 agent 执行
2. 收集所有 agent 输出，校验是否符合 `agent-output-schema.json`
3. 按 §3 合并证据，按 §4 仲裁冲突
4. **按 §5.1 检测 MISSING_AGENT，触发阻断逻辑**
5. 调用 `render-report.cjs` 生成最终报告

### 7.2 对于 Atom Agent 开发者

1. 每个 atom agent 只评估一个维度，不跨维度下结论
2. 输出严格符合 `agent-output-schema.json`
3. 发现与其他维度相关时，在 `related_dimensions` 字段标注，不直接下跨维结论
4. 无法评估时显式标记 `confidence: unknown`，不默认跳过
5. **超时或失败时必须输出 `status: "timeout"` 或 `status: "failed"`，供 MISSING_AGENT 检测**

### 7.3 对于 Renderer 开发者

1. 拒绝任何不符合 schema 的输入（strict mode），或记录警告（`--lenient`）
2. ** MISSING_AGENT 必须阻断通过判定，不可静默忽略**
3. 空 section 时输出占位符并告警，不假装通过
4. 冲突标记必须显式出现在报告中，不能静默调和
