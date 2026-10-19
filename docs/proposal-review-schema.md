# 方案评审表字段落地（Proposal Review Schema）

> 关联：`docs/蜂群改造实施计划.md` 主线 1「输入即方案」（B4）
> 用途：定义蜂群在评代码**之前**先评审"用户提出的改造/项目方案"所用的结构化字段。供各维 agent、orchestrator、renderer 共用同一契约。
> 状态：工作草案 v0.1

---

## 一、顶层方案字段

| 字段 | 必填 | 含义 | 校验规则 |
|------|------|------|----------|
| `id` | 是 | 方案唯一标识（如 `PROP-001`） | 非空，格式 `PROP-\d{3}` |
| `target` | 是 | 目标（**可量化**） | 必须含可量化词（数量/延迟/错误率/覆盖）或显式写"非量化目标：..."并给 owner |
| `gap` | 是 | 现状→目标的差异 | 必须写出"现状是什么、缺什么"，禁止只写"提升体验" |
| `scope` | 否* | 改动文件/边界 | *范围不清时降级：标 `PROPOSAL_INCOMPLETE·低`，可并行补 |
| `migration` | 是 | 迁移/实施路径与阶段 | 必须有阶段划分（切成 ≥2 步或说明一次性切换理由） |
| `compat` | 是 | 兼容与回滚策略 | 必须回答"上线后旧行为如何 / 失败怎么退" |
| `acceptance` | 是 | 可运行验收标准 | 必须含可运行命令（node/pytest/git 等），否则视为空 |
| `owner` | 是 | 方案负责人 | 具名一人或明确角色 |
| `due` | 否 | 期限 | 选填；填写后作为复评节奏依据 |

> 规则：`target/gap/migration/compat/acceptance/owner` 六项任一为空 → `PROPOSAL_INCOMPLETE`（见 §三）。`scope` 为空不阻塞，仅标注提示。

---

## 二、JSON Schema（v0.1）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProposalReview",
  "type": "object",
  "required": ["id", "target", "gap", "migration", "compat", "acceptance", "owner"],
  "properties": {
    "id": { "type": "string", "pattern": "^PROP-\\d{3}$" },
    "target": { "type": "string", "minLength": 10 },
    "gap":    { "type": "string", "minLength": 10 },
    "scope":  { "type": "string" },
    "migration": { "type": "string", "minLength": 10 },
    "compat":    { "type": "string", "minLength": 10 },
    "acceptance": {
      "type": "array",
      "items": { "type": "object", "required": ["cmd", "pass_when"], "properties": {
        "cmd":       { "type": "string" },
        "pass_when": { "type": "string" }
      }}
    },
    "owner": { "type": "string" },
    "due":   { "type": "string", "format": "date" }
  }
}
```

**示例（完整，GREEN 基线）**：
```json
{
  "id": "PROP-001",
  "target": "把 orchestration 从 3628 行单文件降至 ≤600 行/文件，pytest 490 基线不回归",
  "gap": "现状 orchestrator.py 3628 行 god file 全塞 OODA 7-step；缺模块边界",
  "scope": "loop-engine/orchestrator.py + steps/{understand,...}.py + tests/",
  "migration": "阶段1拆 decide/act；阶段2拆 observe/verify；阶段3 learn 最后",
  "compat": "调度壳保留原 CLI；失败回滚 git revert 到 18f1038",
  "acceptance": [
    {"cmd":"git ls-files loop-engine | findstr orchestrator", "pass_when":"单文件 ≤600 行"},
    {"cmd":"python -m pytest -q", "pass_when":"490 基线通过，pre-existing 不增"}
  ],
  "owner": "cb-owner",
  "due": "2026-09-15"
}
```

**反例（不完整 → 应判 PROPOSAL_INCOMPLETE）**：
```json
{
  "id": "PROP-002",
  "target": "优化性能",                // 不可量化
  "gap": "现状还行",                   // 无差异分析
  "migration": "改一下",               // 无阶段
  "compat": "应该没问题",              // 无回滚
  "owner": ""                          // 无负责人
}
```

---

## 三、完整性判定与处罚

| 触发 | 标记 | 严重度 | 处理 |
|------|------|--------|------|
| 六必填项任一为空 / acceptance 无 cmd | `PROPOSAL_INCOMPLETE` | critical（大方案）/ medium（小改动） | renderer 先出"方案不完整"区块，**阻塞进入代码评全部维**，仅允许补方案 |
| `scope` 为空 | `PROPOSAL_INCOMPLETE·低` | low | 提示补充，不阻塞 |
| `target` 不可量化 | `PROPOSAL_INCOMPLETE·目标` | critical | 必须补量化或显式 owner 免责声明 |
| `compat` 无回滚 | `PROPOSAL_INCOMPLETE·回滚` | high | 必须补回滚路径，否则跳过该维代码评后仍不可判"通过" |

> 分级处理：小改动（scope 小、影响面小的方案）允许 `PROPOSAL_INCOMPLETE` 作为提示继续，避免挡住微创新；大方案必须补全后进入全维评审。

---

## 四、每维"方案层面该问的问题"对照表（样例，B4 落地时需扩全 15 维）

> 各维 agent 在评代码前，按本表先对方案提问。命中"缺失"即记该维的 PROPOSAL 缺口。

| 维度 | 方案层面必问 |
|------|-------------|
| design | 方案是否改变模块边界/依赖方向？迁移路径是否可增量？ |
| security | 方案是否触碰信任边界/密钥/权限？新增暴露面是否补机制而非口头规则？ |
| data | 方案是否改 schema/存储？迁移与回滚对数据一致性影响？ |
| test | 方案是否定义可运行验收命令？回归基线是否有量化兜底？ |
| ops | 方案上线形态（容器/systemd）与回滚路径是否明确？ |
| observability | 方案是否可被监控/追踪到？SLO 是否随变更更新？ |
| compliance | 方案是否涉及个人数据/驻留/保留期？删除请求路径是否仍在？ |
| cost | 方案是否引入新资源/供应商？预算与退出成本？ |

---

## 五、接入点

- **orchestrator（B5）**：分发任务前先校验方案六必填，缺失即 `PROPOSAL_INCOMPLETE`，只派"补方案"子任务，不派全维。
- **renderer（B2/B4）**：输出新增"方案完整性"区块；`PROPOSAL_INCOMPLETE` 作为与 `CONFLICT`、`MISSING_AGENT` 同级的强制标记位。
- **风险分级（B3）**：方案层缺口映射到 `risk-grading-scheme` 置信度 `unknown` 兜底。

> 📌 方案评审表定义六必填（target/gap/migration/compat/acceptance/owner）+ 可运行验收命令，缺失即 PROPOSAL_INCOMPLETE 并分级处理，各维 agent 先行对照"方案层面必问"清单，由 orchestrator 与 renderer 作为强制标记位接入。
