# architect-data 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 数据与存储设计

> ⚠️ **单 atom 调用硬规则（未经 Router 必读）**：交付必须含四件套——**结论 / 证据（行级）/ 风险分级 / 下一步**。风险分级按 `reference/risk-grading-scheme.md` 量化口径（critical/high/medium/low 触发条件+响应时间）判定，骨架参见 [[architect-router]]#原子风险分级与下一步骨架。不得只给结论不分级、不得只分级不给下一步。

## 核心原则

### 1. 迁移铁律（database-migrations）

```
[ ] 每次 schema 变更都是独立迁移
[ ] 已部署的迁移永远不可修改（只能追加新迁移）
[ ] DDL 和 DML 分离开
[ ] 迁移必须可逆（有 down/rollback）
[ ] 先用生产量级数据测试
[ ] 用 schema_version 表追踪版本（不要只靠 PRAGMA table_info）
```

### 2. 数据库选型决策树

```
数据特征？
├─ 需要 JOIN + 事务 + 复杂查询 → SQL (SQLite/PostgreSQL)
├─ 文档结构 + 嵌套数据      → Document DB (MongoDB)
├─ 简单 KV + 高并发         → Key-Value (Redis/DynamoDB)
├─ 时间戳查询 + 监控指标    → Time-Series (InfluxDB/TimescaleDB)
└─ 单机 + 零依赖            → SQLite（默认选择）
```

### 3. SQLite 最佳实践

```sql
-- 初始化必须设置
PRAGMA journal_mode=WAL;       -- 读写并发
PRAGMA foreign_keys=ON;        -- 外键约束
PRAGMA busy_timeout=5000;      -- 锁等待

-- 迁移
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now')),
    description TEXT
);
```

### 4. 存储策略

| 数据类型 | 存储位置 | 生命周期 |
|---------|---------|---------|
| 热数据（事件、当前轮次） | SQLite | 永久 |
| 温数据（历史轮次） | SQLite + 归档 | 30天 |
| 冷数据（旧运行日志） | JSONL → 压缩归档 | 1年 |
| 临时数据（subprocess I/O） | 本地磁盘 | 单次运行 |

### 5. 连接管理

```python
# 反模式：每次调用新建连接（44处 connect()）
def load_failure(self):
    with sqlite3.connect(self.db_path) as conn:  # 每次新连接！
        return conn.execute("SELECT ...")

# 推荐：共享连接 + WAL模式
class PatternStore:
    def __init__(self, db_path):
        self._conn = sqlite3.connect(db_path)
        self._conn.execute("PRAGMA journal_mode=WAL")
    
    def _execute(self, sql, params=()):
        with self._conn:  # 事务保护
            return self._conn.execute(sql, params)
```

### 6. 事务保护

```
[ ] 多语句写操作包裹在 BEGIN IMMEDIATE ... COMMIT
[ ] 跨表更新使用同一连接
[ ] 避免 SELECT + INSERT 竞态（用 UPSERT）
[ ] 数据导入用单事务批量提交
```

### Expand-Contract 迁移

生产环境的 schema 变更按“扩展 → 回填 → 切换 → 收缩”分阶段执行，应用和迁移必须在每一阶段都可回滚：

1. **Expand**：先新增可选列/表/索引，保持旧版本代码可运行。
2. **Backfill**：分批回填，限制批次大小和锁持有时间，记录进度并可重跑。
3. **Switch**：发布同时读写新旧字段，验证一致性后切换读取路径。
4. **Contract**：至少一个发布窗口后再删除旧字段/索引；删除前确认没有旧版本实例和查询仍在使用。

禁止在同一不可逆迁移中同时做大批量 DML、删除字段和改变约束。高流量表的索引创建必须评估锁行为，必要时使用数据库提供的 online/concurrent 选项。

### 备份恢复与 RPO/RTO

每个持久化数据集都要在设计阶段声明：

| 项目 | 必填内容 |
|------|---------|
| RPO | 最多允许丢失多少时间的数据 |
| RTO | 最多允许多久恢复服务 |
| 备份 | 频率、保留期、加密、跨区域/跨介质副本 |
| 恢复 | 最近一次实际恢复演练的日期、耗时、验证命令 |
| 完整性 | 校验和、行数/事件数、schema_version、外键检查 |

备份“存在”不等于可恢复。至少定期执行隔离环境恢复演练，并验证业务查询、权限和迁移链，而不只验证文件能够解压。

### 数据分类与生命周期

在 schema 或数据字典中标注 `public/internal/confidential/restricted`，为敏感字段定义加密、脱敏、访问审计和删除策略。热/温/冷数据的 TTL 必须与合规保留期一致；删除用户数据时同时清理索引、缓存、备份副本和派生数据，或明确合法保留例外。

## 检查清单

```
[ ] 是否每次调用都新建连接？（应该共享） → 新建连接: 在 __init__ 中创建 self._conn，所有方法复用
[ ] WAL 模式是否开启？ → 未开启: 执行 PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
[ ] 多语句写入是否有事务包裹？ → 无事务: 用 BEGIN IMMEDIATE ... COMMIT 包裹跨语句写入
[ ] Schema 迁移是否有版本追踪？ → 无追踪: 创建 schema_version 表，每次迁移追加一行
[ ] 是否有跨连接的数据不一致风险？ → 有风险: 确保相关写入使用同一连接+同一事务
[ ] 数据库选型是否匹配数据特征？ → 不匹配: 跑一遍上方的决策树，确认当前选型是否最优
```

## 常见问题修复指南

### SQLite 连接池化（44处独立连接 → 1个共享连接）
1. 在 `__init__` 中创建 `self._conn = sqlite3.connect(db_path)`
2. 添加 `self._conn.execute("PRAGMA journal_mode=WAL")` + `PRAGMA foreign_keys=ON`
3. 所有方法中的 `with sqlite3.connect(...) as conn:` 替换为 `self._conn.execute(sql, params)`
4. 多语句写入包裹在 `with self._conn:` 事务块中
5. 添加 `def close(self): self._conn.close()` 方法供清理时调用

### 数据不一致 → 加事务
1. 找到跨表写入代码（如 append_failure + update_round 同时）
2. 用 `self._conn.execute("BEGIN IMMEDIATE")` 开启事务
3. 执行所有写入语句
4. `self._conn.commit()` 或异常时 `rollback()`

> 风险分级与下一步骨架参见 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。
## 交叉引用
- 设计数据架构 → 参见 [[architect-design]]
- 审查数据质量 → 参见 [[architect-review]]
- 迁移测试 → 参见 [[architect-test]]
- ADR 记录选型 → 参见 [[architect-docs]]
