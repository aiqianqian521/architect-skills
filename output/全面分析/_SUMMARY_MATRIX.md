# 架构评估全面分析汇总矩阵

> 生成时间：2026-09-14T15:00:43.176842
> 评估项目数：21
> 评估维度：17 维

## 总体统计

| 指标 | 数值 |
|---|---|
| 项目总数 | 21 |
| Findings 总数 | 138 |
| Critical 总数 | 16 |
| High 总数 | 9 |
| BLOCKED | 11 |
| NEED_REVIEW | 1 |
| PASSED | 9 |

## 项目概览

| # | 项目 | 文件数 | 代码行 | 语言 | 发现数 | C | H | M | L | 判定 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 01-codex | 7,142 | 1,956,809 | python, javascript/typescript | 8 | 1 | 0 | 3 | 4 | BLOCKED |
| 2 | ChatUI-master | 433 | 24,266 | javascript/typescript | 5 | 0 | 0 | 2 | 3 | PASSED |
| 3 | LibreChat-main | 4,855 | 1,450,913 | python, javascript/typescript, go | 5 | 0 | 0 | 1 | 4 | PASSED |
| 4 | NextChat-main | 411 | 100,499 | javascript/typescript | 4 | 0 | 0 | 1 | 3 | PASSED |
| 5 | TencentDB-Agent-Memory | 990 | 495,637 | python, javascript/typescript | 7 | 1 | 1 | 1 | 4 | BLOCKED |
| 6 | UI-TARS-main | 27 | 39,041 | python | 5 | 1 | 0 | 3 | 1 | BLOCKED |
| 7 | adk-python-main | 2,558 | 696,891 | python, javascript/typescript | 11 | 2 | 2 | 1 | 6 | BLOCKED |
| 8 | agentscope-main | 997 | 304,806 | python, javascript/typescript | 9 | 2 | 1 | 2 | 4 | BLOCKED |
| 9 | autogen-main | 1,807 | 266,910 | python, javascript/typescript | 9 | 2 | 1 | 1 | 5 | BLOCKED |
| 10 | codex-main | 7,141 | 1,956,808 | python, javascript/typescript | 7 | 1 | 0 | 2 | 4 | BLOCKED |
| 11 | coze-loop-main | 5,458 | 2,212,919 | python, javascript/typescript, go | 5 | 0 | 0 | 2 | 3 | PASSED |
| 12 | coze-studio-main | 15,034 | 2,168,165 | python, javascript/typescript, go | 6 | 0 | 0 | 2 | 4 | PASSED |
| 13 | deepseek-harness-master | 5,300 | 767,581 | python, javascript/typescript | 5 | 1 | 0 | 1 | 3 | BLOCKED |
| 14 | deer-flow-main | 2,532 | 834,095 | python, javascript/typescript | 9 | 2 | 1 | 1 | 5 | BLOCKED |
| 15 | eino-main | 360 | 161,376 | go | 5 | 0 | 0 | 2 | 3 | PASSED |
| 16 | lobehub-canary | 15,738 | 5,175,867 | javascript/typescript | 5 | 0 | 0 | 1 | 4 | PASSED |
| 17 | open-webui-main | 5,045 | 1,066,283 | python, javascript/typescript | 11 | 2 | 2 | 2 | 5 | BLOCKED |
| 18 | qwen-code-main | 7,452 | 4,089,659 | python, javascript/typescript, java | 6 | 1 | 0 | 1 | 4 | BLOCKED |
| 19 | x-main | 1,148 | 195,125 | javascript/typescript | 5 | 0 | 0 | 2 | 3 | PASSED |
| 20 | 架构师skill-GitHub下载包 | 6 | 2,983 | — | 5 | 0 | 0 | 3 | 2 | PASSED |
| 21 | 架构师skill项目采集包 | 6 | 2,912 | python | 6 | 0 | 1 | 3 | 2 | NEED_REVIEW |

## 维度覆盖热力图

| 维度 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 总计 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| design | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| review | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| data | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 7 |
| test | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 2 |
| workflow | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 21 |
| agent | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 5 |
| git | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 6 |
| docs | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 4 |
| net | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| security | 1 | 0 | 0 | 0 | 1 | 1 | 3 | 2 | 2 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 17 |
| ops | 2 | 2 | 1 | 1 | 1 | 2 | 1 | 2 | 1 | 2 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 1 | 2 | 2 | 2 | 30 |
| observability | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 18 |
| cost | 0 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 11 |
| compliance | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| frontend | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 13 |
| plugin | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| router | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**图例**：序号对应项目概览表中的 # 列
- 1: 01-codex
- 2: ChatUI-master
- 3: LibreChat-main
- 4: NextChat-main
- 5: TencentDB-Agent-Memory
- 6: UI-TARS-main
- 7: adk-python-main
- 8: agentscope-main
- 9: autogen-main
- 10: codex-main
- 11: coze-loop-main
- 12: coze-studio-main
- 13: deepseek-harness-master
- 14: deer-flow-main
- 15: eino-main
- 16: lobehub-canary
- 17: open-webui-main
- 18: qwen-code-main
- 19: x-main
- 20: 架构师skill-GitHub下载包
- 21: 架构师skill项目采集包

## 风险排名（按 Critical + High 排序）

| 排名 | 项目 | Critical | High | 主要风险维度 |
|---|---|---|---|---|
| 1 | adk-python-main | 2 | 2 | data, workflow, agent, git, security |
| 2 | open-webui-main | 2 | 2 | data, test, workflow, agent, net |
| 3 | agentscope-main | 2 | 1 | data, workflow, agent, security, ops |
| 4 | autogen-main | 2 | 1 | data, workflow, agent, security, ops |
| 5 | deer-flow-main | 2 | 1 | data, workflow, agent, git, security |
| 6 | TencentDB-Agent-Memory | 1 | 1 | test, workflow, security, ops, observability |
| 7 | 01-codex | 1 | 0 | data, workflow, git, security, ops |
| 8 | codex-main | 1 | 0 | data, workflow, security, ops, observability |
| 9 | qwen-code-main | 1 | 0 | workflow, security, ops, observability, cost |
| 10 | UI-TARS-main | 1 | 0 | workflow, git, security, ops |
| 11 | deepseek-harness-master | 1 | 0 | workflow, security, ops, observability, frontend |
| 12 | 架构师skill项目采集包 | 0 | 1 | design, workflow, git, docs, ops |
| 13 | coze-studio-main | 0 | 0 | design, workflow, docs, ops, observability |
| 14 | ChatUI-master | 0 | 0 | workflow, ops, observability, frontend |
| 15 | LibreChat-main | 0 | 0 | workflow, ops, observability, cost, frontend |
| 16 | coze-loop-main | 0 | 0 | design, workflow, ops, observability, cost |
| 17 | eino-main | 0 | 0 | workflow, docs, ops, observability |
| 18 | lobehub-canary | 0 | 0 | workflow, ops, observability, cost, frontend |
| 19 | x-main | 0 | 0 | workflow, ops, observability, frontend |
| 20 | 架构师skill-GitHub下载包 | 0 | 0 | workflow, git, docs, ops |
| 21 | NextChat-main | 0 | 0 | workflow, ops, observability, cost |

---
*汇总由 architect-skills 蜂群评估引擎自动生成*