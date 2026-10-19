# architect-skills 蜂群改造后修复评估（post-repair evaluation）

> 关联：`output/golden/INDEX.md`「修复后反评」锚点。
> 对象：修复 `docs/改造后遗留问题清单.md` 中 P1–P11 中已处理的脚本/工具/文档层问题（R1→R2）。
> 日期：2026-08-31

## 修复实测矩阵

| 编号 | 问题 | 修复动作 | 涉及文件 | 验证 |
|------|------|---------|---------|------|
| P1 | PROPOSAL 门禁误用（评估现有项目被误判） | 增加 assessment/review 双模式，mode 感知 computeVerdict | scripts/render-report.cjs | L1 T5 通过：assessment 模式不再出现 PROPOSAL_INCOMPLETE |
| P2 | narrative 四段空且静默 | 缺失给出 NARRATIVE_MISSING 显式警告 | scripts/render-report.cjs | L1 T6 通过 |
| P3 | N/A 维被标 missing | 增加 N/A 判定 + 未评审 vs missing 语义区分 | scripts/render-report.cjs | L1 T8 通过 |
| P4 | ① 架构地图恒占位 | deriveArchMap 从 agent.meta.files_read 自动推导 | scripts/render-report.cjs | L1 T7 通过 |
| P5 | 契约分层仅 1/16 | validate-contracts 增加试点模式（缺 contract=WARN），--require-all 强制全量 | scripts/validate-contracts.mjs | 试点模式 exit 0 / require-all exit 1(15 errors，诚实标注未铺开) |
| P6 | L1 单测不存在 | 新增 tests/run-l1-tests.mjs，锚定 T1–T8 断言 | tests/run-l1-tests.mjs | 17 passed / 0 failed |
| P7 | 覆盖状态枚举不一致 | 统一 covered/partial/missing/N/A/未评审 口径并标注说明 | scripts/render-report.cjs | L1 T8 通过 |
| P8 | 门禁横幅与正文自相矛盾 | 横幅标注模式，assessment 模式注明"proposal 非必填" | scripts/render-report.cjs | 手工复核通过 |
| P10 | 金样/回归基线断链 | 生成 output/golden/swarm-eval-baseline.json（锚定三项目发现） | output/golden/swarm-eval-baseline.json | regression-guard 对基线自对照 0 漂移 |
| P11 | 错误信息前缀重复 | 移除 throw 消息前缀，保留 CLI catch 一次 | scripts/render-report.cjs | L1 T1 通过（前缀仅一次） |

## 未在本轮修复（需独立立项或用户决策）

| 编号 | 问题 | 原因 | 建议 |
|------|------|------|------|
| P9 | 迭代跟踪表双份（docs/ vs output/） | 涉及数据归档约定变更，需与用户确认唯一落位 | 建议统一到 output/{项目}/iteration-tracker.md |
| P5-全量 | 其余 15 个 atom 的 contract.json/guide.md 作者 | 领域内容量大、需逐个读懂各 atom SKILL.md，不宜盲目生成 | 作为独立"契约铺开"项目，逐个 atom 落地并过 validate-contracts --require-all |
| P2-严格 | review 模式 narrative 缺失是否 throw | 当前仅警告；是否在 review 模式强制必填需要产品口径决策 | 可按需加严格的 narrative 必填门禁 |

## 结论

脚本/工具层 10 项问题已修复并有 17 条 L1 断言锁定（防回归）。剩余的 P9 归档约定与 P5 契约全量铺开属独立工作项，不在本轮脚本修复范围内。

> 📌 修复后反评：render-report.cjs 与 validate-contracts.mjs 的 P1/P2/P3/P4/P5/P7/P8/P11 已修复并通过 17 条 L1 断言，P10 基线已生成可跑 regression-guard；P9（跟踪表双源）与 P5 全量铺开需另行决策。
