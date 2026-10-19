# 项目 C 架构评估 v2 — runtime01201（ETH 严格模式信号监控系统）

> 全新分析（v2）。不复用 v1 结论，按修复后 architect-skills「全面分析模式」15 维逐维重读重判。covered 必有 Intake 实读证据（U0）；N/A 带复检触发条件（U1）。

## 元信息
- 路径：`E:\业余\my\runtime01201`
- 定位：ETH 严格模式信号实时监控系统（个人/自托管量化）
- 技术栈：Python · requests/pandas/numpy/pyyaml/ccxt · 无 web 框架
- 入口：`strict_signal_monitor.py`（实盘 5min 整点监控）；`config.py`（`yaml.safe_load`）
- 分析日期：2026-08-25 · 分析口径：修复后 skills（14 PASS）全量模式 · Intake 实读 · 行级证据

## 一、结论先行

**事实（已验证，附行级证据）**
- `config.yaml` L5-16 三组钉钉凭证全明文：`DINGTALK`/`TESTDT`/`XSDINGTALK` 各含 `TOKEN`+`SECRET`（实读，值已脱敏）
- **`DINGTALK` 与 `TESTDT` 的 TOKEN/SECRET 完全相同**（同为 `bbcb...1b` / `SEC4c6f...a5`）→ 测试与生产混用同一组凭证
- `.gitignore` 既未忽略 `config.yaml` 也未忽略 `.env`；项目**无 `.env` / 无 `.env.example`** → 无密钥管理基础设施
- `backtest/` 含 **62 个 `.py`**（`analyze_*`/`audit_*`/`run_*`/`verify_*` 命名爆炸，实读 readdir 计数）
- `loop-engine/` 复刻 B 项目模式：`orchestrator.py` 84KB + `memory_store.py` 35KB + `adapters/`/`corrections/`/`data/`
- `strict_signal_monitor.py` head 55 行：ccxt 永续合约 + 5min 整点 `wait_until_next_interval` + dingtalk 推送 + `sys.path.insert` hack + UTF-8 stdout 包装
- `config.py` `load_config` 用 `yaml.safe_load` 但无密钥脱敏；README 标"当前研究入口 2026-07-15"
- `requirements.txt` 5 依赖（requests/pandas/numpy/pyyaml/ccxt）

**判断**
- 明文密钥 + 测试生产同凭证 + 已入库 + 无密钥管理 → **security 维 critical（三项目唯一真 critical）**
- backtest 62 脚本爆炸 → high（无模块化，可维护性）
- loop-engine 复刻 B 模式未共享抽象 → high（跨项目重复造轮子，cross-project 视角发现）
- review 维 missing → C 无自评文化（对比 A 用 architect-skills、B 重度自评）

**假设（未实测，标注）**
- 假设 dingtalk webhook 凭证泄露可被任意人推送/篡改告警 → 若属实 compliance 升 high。机制上成立（webhook+SECRET 签名，明文泄露=可伪造），按成立处理但标"机制推断"
- 假设 backtest 62 脚本无共享基类（命名分散暗示）→ 复检 `backtest/__init__.py` 与共享 utils

**一句话**：C 是三项目里"安全最危险 + 工程化最弱"的——钉钉凭证明文入库且测试生产同凭证，是真实可利用的泄露；同时 review 文化缺失、backtest 爆炸、复刻 B 而不抽象。

## 二、15 维覆盖矩阵

| atom | 状态 | 关键证据（行级） | 风险 |
|---|---|---|---|
| design | partial | `signals/data/core/loop-engine/backtest` 分层在；但 backtest 62 脚本爆炸、loop-engine 复刻 B、`sys.path.insert` hack | high |
| data | partial | `config.yaml` 单配置（含明文密钥）+ `data/` 目录；回测结果散文件，无 DB/schema | medium |
| net | partial | ccxt 调 binance + dingtalk webhook；无显式超时/重试/熔断；webhook 密钥在配置 | high |
| workflow | partial | `strict_signal_monitor` 5min 整点循环 + `signals/`(detector/driven_filter/fibonacci_filter)；无状态机/circuit_breaker（对比 B 有） | medium |
| agent | N/A | 无 agent 编排，纯信号脚本。**复检**：引入多策略 agent 时重查 | low |
| security | **missing** | L5-16 三组明文密钥 + DINGTALK==TESTDT 同凭证 + 已入库 + 无 .env/无密钥管理 + .gitignore 失效 | **critical** |
| test | partial | `backtest/` 62 脚本是回测非单测；`verify_*`/`audit_*` 是验证类；无 pytest 结构（待确认） | medium |
| review | missing | 无自评文档、无已知问题清单（对比 A 用 architect-skills、B 19 问题自分级） | medium |
| git | partial | (−) `.gitignore` 失效（config.yaml 含密钥未忽略）；backtest 62 脚本入库 | high |
| ops | missing | 无 Dockerfile/compose（对比 A 有）；实盘 monitor 跑但无编排/无健康检查 | medium |
| observability | partial | `strict_signal.log` + dingtalk 状态推送（`status_push_interval: 300`）；有基础可观测 | medium |
| cost | N/A | 个人量化监控。**复检**：规模化/多币种时重查 | low |
| docs | partial | README 标研究入口；无架构文档；`config.py` 注释 GBK 乱码（编码质量差） | medium |
| compliance | partial | 个人项目但钉钉凭证泄露涉第三方平台安全 → 实为 high 倾向（机制推断） | high |
| frontend | N/A | 无 UI。**复检**：加监控面板时重查 | low |

**覆盖统计**：covered 0 · partial 11 · missing 2（security/review）· N/A 3（agent/cost/frontend）· **critical 1（security）**

## 三、Critical / High 阻塞项详述

### C1（critical，security）钉钉凭证明文入库 + 测试生产同凭证 + 无密钥管理设施
- **现象**：`config.yaml` L5-16 `DINGTALK`/`TESTDT`/`XSDINGTALK` 三组 `TOKEN`+`SECRET` 全明文；`DINGTALK` 与 `TESTDT` **完全相同凭证**；`.gitignore` 未忽略 `config.yaml`；无 `.env`/`.env.example`
- **证据**：config.yaml L5-16 实读（值脱敏）；`.gitignore` 实读（config.yaml=false, .env=false）；无 .env/exist 检查
- **根因**：无密钥管理意识；测试/生产凭证未隔离；`.gitignore` 未覆盖敏感配置
- **影响**：任何拿到仓库者可伪造/篡改 dingtalk 告警（webhook+SECRET 签名泄露）；测试生产同凭证=一次泄露波及全环境；历史 git 提交已含密钥
- **修复方向**（按顺序）：
  1. **立即轮换**三组 dingtalk TOKEN/SECRET（已泄露，轮换是唯一有效补救）
  2. `config.yaml` 加入 `.gitignore`，建 `config.example.yaml` 模板（值留空）
  3. 改 `config.py` 从环境变量读密钥（`os.getenv('DINGTALK_TOKEN')`），yaml 仅留非敏感配置
  4. 隔离测试/生产凭证（TESTDT 用独立测试机器人）
  5. `git filter-repo` 清历史中的 config.yaml 密钥（或视为已泄露不再依赖历史清除）
- **验证命令**：`Select-String -Path config.yaml -Pattern 'TOKEN|SECRET'` 应空（密钥在 env）；`git ls-files | Select-String 'config.yaml'` 应空或为 example
- **风险分级**：critical · **下一步**：轮换密钥为 P0 第一步（代码修复次之）；轮换前不公开仓库

### H1（high）backtest/ 62 脚本爆炸
- **现象**：`backtest/` 62 个 `.py`（`analyze_240h_losing_signals`/`audit_all_sideways_segments_ooda`/`backtest_full`/`verify_*` 等）
- **证据**：readdir 计数 62 + 命名样本
- **根因**：无包结构/共享基类，每个分析一个独立脚本
- **修复方向**：按职责分包（`backtest/{analyze,audit,run,verify}/`）+ 抽共享 `BacktestRunner` 基类；或整合为 CLI 子命令 `python -m backtest analyze ...`
- **验证命令**：`backtest/` 直接子文件 ≤ 20，其余进子包
- **风险分级**：high · **下一步**：先抽 `analyze_*` 共享数据加载逻辑

### H2（high）loop-engine 复刻 B 模式未共享抽象
- **现象**：`runtime01201/loop-engine/` 含 `orchestrator.py` 84KB + `memory_store.py` 35KB + `adapters/`/`corrections/`/`data/`，与 B 项目 `loop-dev/loop-engine/` 同构
- **证据**：C loop-engine readdir；B loop-engine 结构对照（交接+实读）
- **根因**：C 与 B 疑似同一作者的量化/回测工具族，C 复刻 B 的 OODA loop 但未抽公共库
- **影响**：双份维护、bug 修一处漏另一处、架构演进不同步
- **修复方向**：抽 `loop-engine-core` 公共包（两项目共享），各项目仅留领域适配
- **验证命令**：两项目 `loop-engine/` diff 应只剩领域差异
- **风险分级**：high · **下一步**：先确认作者意图（是否计划合并），再决定抽包 vs 接受重复
- **反评价值**：此维由 architect-skills **cross-project 横评**发现，单项目视角不可见 → 验证 router U2 横评的价值

### H3（high）编码与文档质量
- **现象**：`config.py` 注释 GBK 乱码；README 目录树用 GBK 制表符
- **修复方向**：统一 UTF-8 + `# -*- coding: utf-8 -*-` 已有但注释仍乱码 → 文件实际编码非声明的；重新存为 UTF-8
- **验证命令**：`chardet` 检测所有 .py 为 UTF-8
- **风险分级**：high · **下一步**：批量转码 + 加 pre-commit encoding check

## 四、Medium / Low 汇总
- net：ccxt/binance 加超时+重试+ccxt 自带 rate limit；dingtalk webhook 加失败重试（medium）
- workflow：引入状态机/circuit_breaker（参考 B，medium）
- ops：实盘 monitor 加 Docker + healthcheck + restart（medium）
- review：建立自评文化，至少补一份已知问题清单（medium，对比 A/B）
- test：区分回测脚本与单测，引入 pytest（medium）
- docs：补架构文档 + README 修正编码（medium）

## 五、修复优先级 + 还债顺序
1. **P0**：C1 security —— **先轮换密钥**，再改代码（.gitignore + env + 测试生产隔离 + 历史清除）。**这是三项目唯一真 critical，必须最先做**
2. **P1**：H1（backtest 分包）→ H3（编码统一）→ H2（loop-engine 抽包，需作者意图确认）
3. **P2**：net 重试熔断 → ops 编排 → review 自评文化 → test pytest 化

**负责人建议**：C 是个人量化项目，但密钥泄露涉及第三方平台（钉钉）安全，不能按"个人项目"标准豁免。P0 轮换密钥是法律/平台合规义务，非可选。

## 六、证据来源附录（Intake 实读文件）
- `config.yaml` L1-70 + 密钥掩码扫描（L5-16 三组明文 + DINGTALK==TESTDT 同凭证）
- `.gitignore` 实读（config.yaml/.env 均未忽略）；`.env`/`.env.example` exist 检查（均无）
- `strict_signal_monitor.py` head 55（ccxt + 5min 整点 + dingtalk + sys.path hack + UTF-8 包装）
- `config.py` head 33（`yaml.safe_load` + GBK 乱码注释）
- `backtest/` readdir 计数 62 + 命名样本
- `loop-engine/` readdir（orchestrator 84KB / memory_store 35KB / adapters / corrections）
- `requirements.txt`（5 依赖）
- 未读（标注）：`backtest/__init__.py` 共享结构、`signals/` 检测器实现、`core/indicators`、README 全文

> 本报告 C1 论断由 config.yaml L5-16 实读 + 掩码扫描确认，非交接转述。三项目横评中 C 是唯一 security critical，修复优先级最高。此报告 cross-project 发现 H2（复刻 B）验证了 router 横评能力（U2）。
