# P2.1 architect-design — orchestrator.py god-file 拆分提案

> 评估对象：`loop-dev` (`codex/w0-w2` @ ee574f0, 工作树 clean)
> god-file：`loop-engine/orchestrator.py` ≈ 3868 行(LF 规范) / 190 KB
> 触发 skill：`architect-design`（主），交汇 `architect-review`/`architect-test`/`architect-workflow`
> 量化口径：`reference/risk-grading-scheme.md §一`（high① = 单文件 >800 行 god-file）
> 证据口径：全部 file:line 为本会话以 python + Select-String 复核的实读锚点（已校正交接里的 3830→3868 误差）。

---

## 1. 结论

**范式判决：混合范式 = 模式2「按状态机步骤」为主 + 模式1「按职责正交」为辅。**

依据 architect-design 范式选择判据「先看它为什么大」：
- 它因**步骤多**（OODA 七步 × 回合 × resume 子步）而大 → **模式2**：先抽出每 step 的无状态 handler，编排器(run/run_once)只留"iter/异常/退出条件 + 步骤列表驱动"，体积验降目标 <300 行。
- 同时 Orchestrator god-class 因**管的事多**（配置加载 / 熔断状态 / L2 元分析 / doctor·review·status / 状态·handoff·报告 / 缺陷产出）而大 → 在编排器之外按**模式1**拆 3-5 个职责类/模块。

**核心利好（本会话新证，直接降低风险）**：OODASteps 类已是**纯无状态**——
`self.` 计数 = 0、无 Orchestrator 实例回引、无 `_log` 引用、所有外部依赖均为**函数级延迟 import**的 loop-engine 同辈模块（`adapters.task_runner`/`verifier`）。这是教科书式模式2「每步 handler 输入→输出契约不跨步读状态」的现成成果。**B1（整类搬移）几乎零语义风险**。

**拆分序列（GREEN-first，每片门禁实跑 pytest+coverage 才提交）**：
`A`(纯搬运infra) → `B1`(OODASteps 整类搬) → `B2`(细分 ooda_pipeline 为阶段模块+facade) → `C1`(配置/加载器提取) → `C2..C5`(Orchestrator god-class 按职责拆，逐片蜂群评估后实施)。

**P2.1 落地标准**：每片在门禁绿下提交；P2.1 至少完成 A+B1+B2+C1，并使 **Orchestrator 类 < 1500 行**（解除 high① 单类阈值）；若 C2..C5 剩余体量导致 orchestrator.py 仍 >800 行，剩余计入 P2.2 并在 KB/ADR 标注，不在 P2.1 勉强并仓促。

---

## 2. 证据（file:line，本会话实读复核）

### 2.1 god-file 体积（high①）
- `orchestrator.py` ≈3868 行(LF) / 194503 B / 189.9KB → 触发 **high①**：>800 ×4.8倍、>30KB ×6.3倍。
- 次大文件 `memory_store.py` 1410 行；orchestrator 远离群体 → 跨项目沉淀基线确认 god-file 离群。

### 2.2 类/方法行界（grep + python 复核）
| 单元 | 行界(1-based) | 行数 | 拆分去向 |
|---|---|---|---|
| `StatusBar` | class L68–~221 | ~154 → `status_bar.py` |
| `_Tee` | L223–~245 | ~23 → `log_tee.py` |
| `_RunLock` | L247–~296(__init__ L250 / __enter__ L255 / __exit__ L271) | ~50 → `run_lock.py` |
| `PROJECT_ROOT` L298 = `_HERE.parent`（模块全局，保留可访问） |
| `OODASteps` | class L305–1211 | ~907 → `ooda_pipeline.py`（B1 整搬；B2 细分）|
| `Orchestrator` | class L1226–~3651 | ~2426 → god-class 按 模式1 拆 C1..C5 |
| 模块函数 | `build_orchestrator` L3667 / `_show_history` L3679 / `_legacy_main` L3751 / `main` L3851 | 保留在 `orchestrator.py`(入口) |

### 2.3 OODASteps「纯净可整搬」硬证据（B1 决策依据）
- `self.` 出现次数 = 0；无 `orch._*`/`orchestrator._*` 实例回引；`_log` 出现 0 次。
- 14 个 staticmethod（step-first-arg 是数据而非 self）：`_ensure_understand` L310 / `_observe` L363 / `_orient` L407 / `_decide` L489 / `_act_with_retry` L524 / `_act` L579 / `_verify_legacy` L817 / `_verify` L876 / `_verify_assertions` L889 / `_run_callback` L962 / `_verify_regression` L993 / `_resolve_field` L1041 / `_learn` L1071（含 7 步外溢的 verify/learn 工具方法）。
- 外部依赖全部**函数级延迟 import**：`adapters.task_runner`(TaskInput/TaskResult/BacktestRunner/normalize_task_result；L601/L732/L1085) / `verifier.Verifier` L878 / `subprocess`(L627/L976/L1000) / `importlib` L687 / `concurrent.futures` L941 / `shlex` L628 / `re` L916 —— 均为 loop-engine 同辈模块，靠 `_HERE` 上 sys.path 解析；无模块顶 import 绑定。
→ B1 = 0-self / 0-logger / 0-回引 / 仅延迟同辈 import 的纯搬运；新文件仅需**防御性地把自己目录补进 sys.path**（独立 import 也可用），不引循环依赖。

### 2.4 OODA 状态机 + dispatch 机制（模式2 与 红线 依据）
- `run_once` L1402 为回合级 OODA 状态机驱动器：`fast` → L1422 `return self._run_once_legacy(signals)`（fail-closed dispatch 回落旧路径）；7-step 由 `_STEP_INDEX`(L61) 驱动 `if _STEP_INDEX["X"] <= _done_idx: pass # restored else: <execute>` + `_save_step` checkpoint（W1-RESUME-01 Slice3 步级续跑）。
- `run` L2520(~224行) 为外层连续循环 + resume 恢复（run_id/circuit/pool_hash mismatch 校验，调用 `resume_guard.compute_pool_hash/pool_matches/run_id`）+ run-level circuit transition 审计。
- `run_once` ~373 行 >300 行模式2 编排器目标体量 → 验降要点之一（C6 抽步级 checkpoint 续跑 plumbing 可缩，但属高风险，置 C 后）。

### 2.5 Orchestrator god-class 能力分组（模式1 拆类候选）
- 构造/IO: `__init__` L1227 / `_interactive_confirm` L1373 / `generate_signals` L1389 / `_load_pool` L1395
- 编排主循环: `run` L2520 / `run_once` L1402 / `_run_once_legacy` L1775 / `meta_analyze` L1826 / `_meta_analyze_legacy` L1831 / `run_parallel` L1975 / `_safe_run_component` L2011(static)
- L2 元分析: `_l2_auto_suggest` L1924+legacy L1927 / `_l2_read_progress` L2296+legacy L2301 / `_l2_check_triggers` L2323+legacy L2327 / `_l2_health_check` L2363+legacy L2366 / `_l2_verify_suggestions` L2450+legacy L2453
- doctor/review: `doctor` L2027 / `status` L2129 / `review` L2232
- 熔断状态: `_stage_circuit_transition` L2744 / `_flush_circuit_transition` L2754 / `_checkpoint_payload` L2787 / `_check_contract_limits` L2834 / `_check_scope_violation` L2868 / `_all_criteria_met` L2879
- 缺陷产出: `_produce_problems` L2895 / `_produce_defect_report` L2990 / `_classify_defect` L3079(static)
- 状态/handoff/报告: `_report_context` L3150 / `_write_state_md` L3161+legacy L3164 / `_recover_state` L3214+legacy L3217 / `_write_handoff` L3236+legacy L3239 / `_read_handoff` L3260+legacy L3263 / `_stop_diagnosis` L3274+legacy L3277 / `_archive_run` L3329+legacy L3332 / `_next_steps` L3634+legacy L3637 / `_check_scope` L3414 / `_load_task_file` L3454 / `_load_project` L3478 / `reset` L3651

### 2.6 对外契约（拆分后必须不变，否则红）
- tests 直接 import：`Orchestrator`(多文件) / `OODASteps`(test_act_orient_chain·test_loop_new·test_v2_p1p2·test_wave3_boundaries·test_final_5) / `StatusBar`(test_final_5) / `_Tee`·`_RunLock`(单文件) / `main`(test_migration_rehearsal)。
- 类属性契约：`Orchestrator._safe_run_component`(test 拿引用) / `Orchestrator._interactive_confirm`(test monkeypatch) / `Orchestrator.run_parallel`(test 断言签名+`inspect.getsource` 含 "multiprocessing" → **run_parallel 实体源须留在可取源处**，迁模块需复核 getsource 是否仍命中)。
- `cli_router` 经 `CliDependencies.build_orchestrator` 注入（**非硬 import** orchestrator）→ 对 `orchestrator` 模块对外耦合仅限这几个符号，迁模块只要 re-export 即低风险。
- 模块全局须保持可访问：`_STEP_ORDER` L60 / `_STEP_INDEX` L61 / `_log` L41 / `_HERE` L50 / `PROJECT_ROOT` L298。
- **反契约**：`_ACTIVE_INSPECT_WORK_DIR` / `_set_active_inspect_work_dir` 必须**保持已移除**（test_runtime_containment·test_inspection_service 断言其不存在，fail-closed 已 purge）→ 迁移绝不复活它们。

### 2.7 已知遗留（不阻 P2.1，合规登记）
- W1-STORE-01 并发 flake(xfail 暂隔)：`test_concurrent_writers_settle_with_busy_timeout` 负载下 `database is locked`。follow-up=app 重试 + 统一接缝(`migrations/base.py` 6 处裸 `sqlite3.connect`)。
- P3.2 余项：golden≥20 / parametrize / 阈值 70→80 / conftest·pythonpath 收敛 / CI(无 remote)。

---

## 3. 风险分级（依据 `reference/risk-grading-scheme.md §一`，禁主观词，取最高命中）

| 维度 | 等级 | 触发条件引用 | 响应时间 |
|---|---|---|---|
| 可维护性 | **high①** | 单文件 >800 行 god-file（orchestrator.py ≈3868×4.8）；单类 >1500 行（Orchestrator ≈2426） | 7d |
| 可靠性 | medium | `run_once` 单函数 ~373 行 >50 行内部治理基线；dispatch=fast→legacy 双路径需成对迁移 | 30d |
| 运维 | medium④ | 文档缺统一入口（god-file 顶部 docstring 尚可，但拆后模块无 README/索引） | 30d |
| 文档 | medium② | 拆分无 ADR 跟进 | 30d |
| 安全 | low | 不涉密钥/凭证/数据损坏/暴露面 | 季度 |

- 修复验证标准（必填）：本节任一片完成后须给**可运行验证命令 + 通过条件**（见 §4 每片末尾）；仅"我改了/已调通"不算完成。

---

## 4. 下一步（分片路线图，每片独立门禁、可验证、附响应时间）

> 统一验证命令（每片实施完毕后必跑）：
> `cd E:\业余\my\loop-dev; ..\.venv\Scripts\python.exe scripts\run_gate.py`
> 通过条件 = **353 passed + 1 xfailed + coverage ≥ 64(fail_under) + 本地 3 探针全过 + bypass 面明示**（~60s）。docs-only commit 可 SKIP。

### Slice A — 纯搬运 infra 类（低风险，先验证搬移+re-export+门禁机制）
- A1 `loop-engine/status_bar.py` ← `StatusBar` L68–~221（render_flow/render_summary/final 等 UI 渲染，纯）。
- A2 `loop-engine/run_lock.py` ← `_RunLock` L247–~296（文件锁，纯）。
- A3 `loop-engine/log_tee.py` ← `_Tee` L223–~245（logging tee，纯）。
- 机制：三类原样搬入新文件；`orchestrator.py` 顶端 `from status_bar import StatusBar; from run_lock import _RunLock; from log_tee import _Tee`（re-export shim 保 tests/外部 import 不断）。
- 目标扫描：orchestrator.py ↓~227 行（3868→~3641）。
- 验证命令：`run_gate.py`；额外定向 `python tests/test_final_5.py`(触达 StatusBar)。
- 通过条件：门禁 353 passed+1 xfailed/coverage≥64；`from orchestrator import StatusBar,_Tee,_RunLock` 仍可 import；orchestrator.py 无 `class StatusBar/_Tee/_RunLock` 定义残留。
- 响应时间：7d 内随 P2.1。

### Slice B1 — OODASteps 整类搬入 `ooda_pipeline.py`（低-中风险，核心模式2 提取）
- 整搬 `OODASteps` L305–1211 到 `loop-engine/ooda_pipeline.py`（**逐字搬**，不改方法体）。
- `orchestrator.py`：`from ooda_pipeline import OODASteps`（re-export)；确保 ooda_pipeline.py 顶端**防御性** `sys.path.insert(0, str(Path(__file__).resolve().parent))` 以让延迟同辈 import 独立可用。
- 目标扫描：orchestrator.py ↓~907 行（~3641→~2734）；解除 OODASteps 这段 god-file；但 ooda_pipeline.py 907 行仍>800(high①) → **B2 解决**。
- 验证命令：`run_gate.py`；定向 `python tests/test_act_orient_chain.py tests/test_loop_new.py`（直 import OODASteps）。
- 通过条件：门禁绿；`from orchestrator import OODASteps` 与 `from ooda_pipeline import OODASteps` 同一对象；`inspect.getsource(OODASteps._act)` 命中 ooda_pipeline 源（断言无"拆调用断链")。
- 响应时间：7d 内。

### Slice B2 — 细分 `ooda_pipeline.py` 为阶段模块 + facade（中风险，解除 high①）
- 建立 `loop-engine/ooda/` 包，按模式2「每 phase 一个 handler 模块」拆：
  - `ooda/perceive.py` ← `_ensure_understand`+`_observe`+`_orient`(L310–488)
  - `ooda/act_ru.py` ← `_decide`+`_act_with_retry`+`_act`+`_run_callback`(L489–992)
  - `ooda/verify.py` ← `_verify_legacy`+`_verify`+`_verify_assertions`+`_verify_regression`+`_resolve_field`(L817–1070)
  - `ooda/learn.py` ← `_learn`(L1071–1211)
- `ooda/pipeline.py` 内保留 `OODASteps` 为 facade：staticmethod 改为一行 delegate 到阶段模块函数（**保签名/保 tests `OODASteps._observe` 调用面**）。
- **预置蜂群评估点**：阶段切分是否制造浅模块（接口/实现比）？facade delegate 是否过度透传？act.py ~370 行是否再需内拆 `_act`？——B2 实施前由蜂群红队裁定（见第 5 节）。
- 目标扫描：ooda_pipeline.py < 300 行(facade)；各阶段模块 < 400 行；解除 ooda_pipeline 的 high①。
- 验证命令：`run_gate.py`；定向 `tests/test_act_orient_chain.py`（链路契约）。
- 通过条件：门禁绿；每阶段模块 import 可单测；`inspect.getsource(OODASteps._learn)` 仍可取源（落在 learn.py）。
- 响应时间：7d 内。

### Slice C1 — 配置/任务/池加载器提取（中风险，Orchestrator 减负低入口）
- 抽 `generate_signals` L1389 / `_load_pool` L1395 / `_load_task_file` L3454 / `_load_project` L3478 / `_interactive_confirm` L1373 为 `loop-engine/project_loader.py` **纯函数**（入参 config/paths，返回数据，**不持 self**）；Orchestrator 方法变薄包装（保方法名调用序 → cli_router/契约不变）。
- **不碰 `__init__`**（最高风险入口），仅把 init 调用的"加载"部分委托纯函数。
- 目标扫描：Orchestrator ↓~250 行。
- 验证命令：`run_gate.py`；定向 `tests/test_loop.py tests/test_orchestrator_boundaries.py`。
- 通过条件：门禁绿；`Orchestrator._interactive_confirm`/`generate_signals` 签名与 run_parallel 同样须类上可取；手工 `python orchestrator.py --doctor` 不退化。
- 响应时间：7d 内。

### Slice C2–C5 — Orchestrator 按职责拆（中-高风险，逐片蜂群评估后实施，P2.1 范围内尽力，溢出转 P2.2）
- C2 熔断状态: `_stage/_flush_circuit_transition` L2744/L2754 / `_checkpoint_payload` L2787 / `_check_contract_limits` L2834 / `_check_scope_violation` L2868 / `_all_criteria_met` L2879 → `circuit_state.py`(小对象持 circuit/store/event_log 引用 或 mixin)。**零语义改 fetch/写 EventLog append-only 审计**。
- C3 L2 元分析: `meta_analyze`+`_meta_analyze_legacy` L1826/L1831 / `_l2_*`(+legacy L1927/L2301/L2327/L2366/L2453) → `l2_meta.py` mixin。**成对搬**，保 dispatch；先核 Orchestrator._l2_* 是否已薄包 l2_analyzer（若是则低风险）。
- C4 状态/handoff/报告: `_report_context` L3150 / `_write_state_md`+legacy L3161/L3164 / `_recover_state`+legacy L3214/L3217 / `_write_handoff`+legacy L3236/L3239 / `_read_handoff`+legacy L3260/L3263 / `_stop_diagnosis`+legacy L3274/L3277 / `_archive_run`+legacy L3329/L3332 / `_next_steps`+legacy L3634/L3637 / `_check_scope` L3414 / `_produce_problems` L2895 / `_produce_defect_report` L2990 / `_classify_defect` L3079 → `run_state.py` mixin。**持 store/work_dir，高风险**。
- C5 doctor/review/status: doctor L2027 / status L2129 / review L2232 → `orch_cli_cmds.py` mixin（公开 CLI 面，薄包装为主）。**`Orchestrator.run_parallel` 源须含 multiprocessing，迁出需复核 inspect.getsource 命中点**，倾向保留在 Orchestrator。
- 每片：验证命令 `run_gate.py` + 定向 tests；通过条件=门禁绿+目标函数签名/类属性契约不变。
- 响应时间：7d 起（若风险上升，按片转 P2.2 并 KB/ADR 登记剩余体量）。

### 收口（每完成一片或 P2.1 结束）
- 交叉引用 `[[architect-review]]` 12 层审计 / `[[architect-docs]]` 写 ADR-006 god-file 拆分。
- effectiveness-check 文档 + `git tag`(annotated) + KB `loop-dev开发进度跟进-*.md` 追加（heredoc→Out-File utf8→python 读法）。

---

## 5. 蜂群 4-lens 红队（实施前裁定，待执行）

> 蜂群 sub-agent 须显式 codebase=loop-dev；4 镜：Pauli=data / Dalton=design / Euclid=red-team(+test-lens)。

红队焦点（每条给通过/驳回/改建议）：
1. **B2 阶段切分是否造浅模块**：接口方法数 vs 实现行数；perceive/learn 是否太薄需并入相邻模块。
2. **循环依赖**：ooda 包 → adapters/verifier（同辈）方向；project_loader/circuit_state/run_state → domain，禁反向到 web；确认无新 domain→infra 反转。
3. **契约不变量破坏**：`run_parallel` `inspect.getsource` multiprocessing 命中；`_safe_run_component`/`_interactive_confirm` 类属性；`OODASteps.*` / `StatusBar/_Tee/_RunLock` re-export；`_ACTIVE_INSPECT_WORK_DIR` 仍未复活。
4. **OODA 状态泄漏/浅迁移**：B1 后 run_once 调 `OODASteps._observe(...)` 仍传显式入参（无 self/无读跨步状态）；C2 抽熔断后 `on_transition` → EventLog append-only 审计时序不变；C4 抽 state 后 resume(`_resume_at`/`store.save_checkpoint`) 时序不变。
5. **dispatch 双路径成对**：~15 对 `X/_X_legacy` 拆分必须成对迁移，不得 dedupe/合并；fast→legacy(L1422) 回落语义不变。

折叠裁定：蜂群逐 await → 主 agent 折叠为"最终拆分序列 + 每片预置修正"，再门禁下逐片实现。

---

## 附：本提案与上轮(prior report 2026-08-25) 关系
- 沿用 prior「god-file 拆分按模式2 状态机为主」结论；本次以 god-file method-level 实读锚点 + 0-self/0-logger 硬证 **将 B1 从"候选"升级为"低风险纯搬运"**，并补全对外契约清单与反契约(`_ACTIVE_INSPECT_WORK_DIR`)，给出可执行分片与统一门禁命令。
# 6. 折叠裁定（蜂群 4-lens 红队 -> 主 agent 折叠）- 2026-08-30

三镜裁定均"有条件通过"(design=Dalton/test=Euclid/data=Pauli)。蜂群亲自实跑门禁确认 353+1xpassed/64.17%/跑后 git status 全清(只读零改)。折入硬纠正后最终序列与约束如下。

## 6.1 接受的纠正
1. **行号基线 = 3830**(非提案 3868；Get-Content+handoff+蜂群三方实证)。实施每片按当时 HEAD 实读重算锚点，勿照搬提案 L 数。
2. **14 个死 _legacy 当活 dispatch 是错的**(data-lens)：全仓 _legacy 唯一活调用 = run_once L1421-1422 -> _run_once_legacy(fast=not enable_ooda 回落)；其余 14 个(含 _legacy_main/_meta_analyze_legacy/5x _l2_*_legacy/7x state-handoff _legacy/_verify_legacy)零调用、无 getattr 动态分发、无 import *。-> 新增 **Slice D：死 legacy purge**(P3.2 coverage 证 0% 命中后删，加反探针 assert not [n for n in dir(Orchestrator) if n endswith _legacy and n != _run_once_legacy])。保 run_once/_run_once_legacy 成对、main 留、_verify_legacy 随 B1 删、_legacy_main 删。
3. **B1 漏 PROJECT_ROOT 源**(data-lens)：OODASteps L969(_run_callback)/L1010(_verify_regression) 裸引 PROJECT_ROOT(L298=_HERE.parent)。-> ooda_pipeline.py 顶须 _HERE=Path(__file__).resolve().parent; PROJECT_ROOT=_HERE.parent + sys.path.insert(0,_HERE)；及 B1 门确认 L969/L1010 命中或补定向探针。
4. **C2 = mixin 非"小对象持引用"**(test-lens)：_breaker_log/_pending_circuit_transition/circuit/store 须留 self 属性(test_circuit_breaker L121/144/150 monkeypatch+restore-replay 断言)；搬方法体到 circuit_state mixin，调用点(L1292 on_transition 绑定、save_checkpoint 后 _flush)留 run()/orchestrator 原位。
5. **C1/C4 保 self.方法可被 monkeypatch**：C1 只抽 generate_signals/_load_pool/_load_task_file/_load_project 为纯函数，_interactive_confirm 留 self 读 self.interactive 薄包装(test_v2_p1p2 L182)；C4 _produce_defect_report/_produce_problems 须留 self 方法(test_resume_step L201-248 monkeypatch)。C4 多为已 return self.reporter.* 薄包装 + legacy(随 D 删)。
6. **B2 按方法集切非连续行号**：_run_callback@L969 重定位到 act.py；perceive=understand+observe+orient / act=decide+act_with_retry+act+_run_callback / verify=_verify+_verify_assertions+_verify_regression+_resolve_field / learn=_learn；_act 内拆子方法(>50行)但 act.py 不二拆；perceive/learn 是深模块(深非浅)保留。**facade OODASteps 强制保留 <=1 句 delegate**(test_resume_step/idempotency 用 30+ 处 OODASteps._act_with_retry 等替换 = monkeypatch 注入缝)，禁改 module-函数模式(critical③ 破 W1-RESUME-01 幂等)。
7. **__file__ 主 parser 须物理留 orchestrator.py**(test_ltwo L362-367 扫 add_argument+min-win-rate)：main() argparse 不可迁出；build_orchestrator/_show_history/_legacy_main(随 D 删)可动 -> 影响 P2.2 cli_main 边界。
8. **反契约 = 3 符号**：_ACTIVE_INSPECT_WORK_DIR / _set_active_inspect_work_dir / _inspect_runs 须保持不存在(提案原列 2，补 _inspect_runs)。
9. **新模块 logger = getLogger("loop-engine")**(test_resume_step L367-389 捕获 pool_hash 警告由 module _log 发)，勿 getLogger(__name__)。
10. **staticmethod 计数 = 13 非14**(data-lens)：run_one@L903 是 _verify_assertions 内嵌闭包非 staticmethod。
11. **venv 路径订正**：pre-commit = exec ../loop/.venv/Scripts/python.exe scripts/run_gate.py(兄弟 loop 仓 venv，蜂群验 pytest9.1.1/cov7.16)；提案 §4 写 .. venv 误。
12. **_ENGINE latent bug**(data-lens)：L1993 run_parallel worker _run_one 闭包引 _ENGINE(全仓定义 0 次) -> NameError 被每窗 except 吞成静默全 error。follow-up = 修 _ENGINE -> _HERE(L50==loop-engine 即意图)，非 P2.1 拆分项；P3 可 monkeypatch Pool 跑一次 run_parallel 顺带暴露。

## 6.2 最终拆分序列(门禁下逐片，每片 run_gate.py 绿 353+1xfailed+coverage>=64 才 commit)
A(纯搬运 StatusBar/_Tee/_RunLock + re-export) -> B1(OODASteps -> ooda_pipeline.py + PROJECT_ROOT + sys.path + facade re-export) -> B2(细分 ooda/ pkg perceive/act/verify/learn + facade<=1 句 delegate，_run_callback 重定位) -> **D(死 legacy purge + 反探针)** -> C1(project_loader 纯函数 + _interactive_confirm 保持 self) -> C2(circuit_state mixin，保 self._breaker_log 等) -> C3(l2_meta mixin，活 meta_analyze/_l2_*) -> C4(run_state mixin，保 self._produce_* monkeypatch + _archive_run containment assert_under_root) = **P2.1 STOP**(Orchestrator 类约 <1500、orchestrator.py 约 1422；文件 <800 不可达 -> P2.2)。C5(orch_cli_cmds mixin：doctor/review/status) 可选尾。

## 6.3 P2.2 续收(破 orchestrator.py < 800)
抽 run_once 步级 checkpoint plumbing(critical③ 独片，green umbrella + falsifiability) -> orchestrator-cpr.py(run_once 367 -> <300) + build_orchestrator/_show_history -> cli_main.py(main argparse 物理留 orchestrator)。W1-STORE-01 flake follow-up 顺带。

## 6.4 残留可维债(登记，不卡 P2.1)
- L725 from adapters.task_runner import BacktestRunner(具体依赖) SKILL §1 软违反(先前存在) -> P2.x 经 builder 注入。
- run_parallel 测试只 introspect 不执行 + getsource 耦合 "multiprocessing" 字面 -> P3 升级。
- W1-STORE-01 并发 flake / golden>=20 / parametrize / 70->80 / CI(无 remote 软门禁) -> 承继余项。

## 6.5 每片测试白名单(门禁之外定向，蜂群给定)
A: test_v2_p0(StatusBar)/test_loop(L436 tee,L504 run_lock)/test_final_5。
B1: test_execution_contracts/test_resume_idempotency/test_resume_step/test_runtime_containment/test_loop_new(L537 OODASteps._decide)/test_act_orient_chain。
B2: test_execution_contracts/test_resume_idempotency/test_resume_step/test_act_orient_chain(链路契约)。
C1: test_loop/test_orchestrator_boundaries/test_v2_p1p2(_interactive_confirm L182)/test_loop_new L362(__file__ min-win-rate)。
C2: test_circuit_breaker(L121/144/150 _breaker_log)/test_runtime_containment(L160 _safe_run_component)/test_resume_step(circuit.restore)。
C3: test_act_orient_chain/test_loop(review_scope L529)/test_orchestrator_boundaries。
C4: test_resume_step(L201-248 _produce_* monkeypatch)/test_resume_idempotency/test_runtime_containment(_archive_run containment)/test_resume。
C5: test_orchestrator_boundaries/test_v2_p1p2(L191-198 run_parallel getsource)/test_loop_new L362(test_loop_new __file__ parser)/test_loop。
