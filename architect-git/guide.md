# architect-git 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# Git 与版本控制

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body>
```

| Type | 含义 | 示例 |
|------|------|------|
| feat | 新功能 | feat(orchestrator): add L2 health check |
| fix | Bug修复 | fix(memory_store): transaction gap in append_failure |
| refactor | 重构（不改变行为） | refactor(adapter): eliminate global _SETTINGS |
| test | 测试 | test(event_log): add replay and filter tests |
| docs | 文档 | docs(architecture): update MCP layer description |
| chore | 杂务 | chore(config): remove duplicate max_rounds |

## 分支策略

| 策略 | 适用 | 流程 |
|------|------|------|
| **Trunk-Based** | 个人/小团队（推荐） | main + 短生命 feature 分支，日合并 |
| **GitHub Flow** | 有 PR 审查 | main + feature → PR → merge |
| **GitFlow** | 多版本并行 | main + develop + feature + release + hotfix（loop 项目不需要） |

**loop 项目推荐**: Trunk-Based — 在 master 上开发，重要改动开 feature 分支快速合并。

## 合并冲突解决

### 原则：基于意图解决，不是基于行选择
1. 找到冲突双方的原始 commit → 读 commit message 理解意图
2. 理解各自要解决什么问题
3. 综合双方意图写合并结果
4. 运行测试验证

### 流程
```bash
git merge/rebase → 冲突
git log --oneline <branch>  # 理解对方意图
# 手动解决冲突（基于意图）
# 运行测试
git add . && git merge --continue
```

## 常见操作

```bash
# 撤销未提交的改动
git checkout -- <file>        # 单文件
git stash                     # 暂存

# 修改最后一次提交（未 push）
git commit --amend -m "new message"

# 查看历史
git log --oneline -20
git log -p <file>             # 某文件的变更历史

# 分支操作
git checkout -b feature/xxx   # 新建并切换
git branch -d feature/xxx     # 删除已合并分支
```

## PR、发布与保护分支

提交规范解决“提交写什么”，但不能代替变更治理。对共享仓库至少启用：

- `main/master` 保护：禁止直接 push，要求 PR、至少一名审查者和绿色 CI。
- PR 描述必须包含 What、Why、How、Testing、迁移/回滚影响和破坏性变更。
- 变更按原子提交组织；生成文件、密钥、数据库文件和本地环境文件不得进入提交。
- 合并前确认工作树干净、目标分支已同步、冲突按意图解决，并重新运行关键路径测试。
- 发布使用不可变 tag/版本号；生产回滚优先 `revert` 或重新部署已验证版本，不对公共分支强推。

危险命令（`reset --hard`、批量删除、强制 push）必须明确目标、先做可恢复备份，并在共享分支上默认拒绝执行。

## 检查清单

```
[ ] 提交消息是否遵循 Conventional Commits 格式？ → 不符合: 用 <type>(<scope>): <subject> 重写
[ ] 一次提交是否只做一件事（feat和fix分开）？ → 混在一起: git reset HEAD~1 → 拆分为多个原子提交
[ ] 是否使用了合适的分支策略？ → 不合适: 小团队用 Trunk-Based，有 PR 审查用 GitHub Flow
[ ] 合并冲突是否基于意图（而非行选择）解决？ → 基于行选: 先读 git log 了解双方意图，再综合写合并结果
[ ] 合并后测试是否通过？ → 未验证: 跑完整测试套件 + lint 检查
[ ] .gitignore 是否排除了数据库文件、__pycache__、.venv？ → 缺失: 添加 *.db、__pycache__/、.venv/、*.pyc
```

## 常见问题修复指南

### 提交太乱 → 整理
1. `git log --oneline -20` 查看最近提交
2. `git rebase -i HEAD~N` 进入交互模式
3. squash 修复提交到主提交、reword 不清晰的 message
4. `git push --force-with-lease`（仅在自己的 feature 分支！）

### 合并冲突 → 基于意图解决
1. `git log --oneline <target-branch>..<source-branch>` 理解对方改了什么
2. 打开冲突文件，找到 `<<<<<<` 标记
3. 基于双方意图（而非行选择）写合并版本
4. 运行测试，确认合并后功能完整

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- 代码审查 → 参见 [[architect-review]]
- 项目文档 → 参见 [[architect-docs]]
- 开发流程 → 参见 [[architect-workflow]]
