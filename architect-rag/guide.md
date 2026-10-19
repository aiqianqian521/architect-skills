# architect-rag 判断力指南（Guide）

> 单atom调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 
eference/risk-grading-scheme.md 量化口径判定。

---

## 核心概念

RAG系统的三个核心问题：
1. **检索质量**：是否找回了最相关的上下文？
2. **融合策略**：多路检索结果如何合并排序？
3. **分层架构**：不同类型记忆如何组织（mental_models > observations > raw_facts）？

---

## 4路并行检索（对标 Hindsight）

### 架构总览

`
                    query
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Semantic Vector  BM25 Keyword  Graph Activation  Temporal Graph
   (pgvector HNSW)  (PostgreSQL   (spreading       (time-proximity
                     tsquery)      activation)       links)
        │             │             │                │
        ▼             ▼             ▼                ▼
   ┌────────────────────────────────────────────────────┐
   │         Reciprocal Rank Fusion (RRF)               │
   │   score = Σ 1/(k + rank_i)  across all 4 arms     │
   └────────────────────────────────────────────────────┘
                           │
                           ▼
   ┌────────────────────────────────────────────────────┐
   │         Cross-encoder Reranking                    │
   └────────────────────────────────────────────────────┘
                           │
                           ▼
   ┌────────────────────────────────────────────────────┐
   │         MMR Diversity Filter                       │
   │   λ·relevance - (1-λ)·max_similarity_to_selected   │
   └────────────────────────────────────────────────────┘
`

### 4条检索路径详解

**1. Semantic Vector (pgvector HNSW)**
- 真实embedding模型（via LiteLLM），非 bigram-hash
- HNSW 索引实现亚毫秒级近似最近邻搜索
- 适合：语义相似但不共享关键词的文档

**2. BM25 Keyword (PostgreSQL tsquery)**
- 全文搜索引擎，精确匹配关键词
- 适合：精确术语、代码符号、实体名称
- 零依赖即可实现（统计算法，只需文本+词频）

**3. Graph Activation (Spreading Activation)**
- 基于知识图谱的激活扩散算法
- 从一个实体出发，沿关系边扩散激活相邻实体
- 沿4种边类型扩散：temporal links | semantic links | entity links | causal links
- 每跳衰减（decay factor），activation 超过阈值的节点加入结果
- 适合：发现间接关联的上下文

**4. Temporal Graph (Time-proximity links)**
- 基于时间邻近度的图检索
- 最近相关的记忆被优先检索
- 适合：时间敏感的任务上下文

### RRF融合公式

`
RRF_score(d) = Σ_{r in R} 1/(k + rank_r(d))
`

- k=60（标准值），防止单路极低排名被过度惩罚
- 优势：无需调参，各路评分尺度无关

**实现范式（双路RRF）**：

`python
def rrf_fusion(arm_scores: list[list[tuple[str, float]]], k=60) -> list[tuple[str, float]]:
    """
    arm_scores: 每路检索的 [(doc_id, score), ...]，按分数降序排列
    返回融合后的 [(doc_id, rrf_score), ...]
    """
    rrf = {}
    for arm in arm_scores:
        for rank, (doc_id, _) in enumerate(arm, start=1):
            rrf[doc_id] = rrf.get(doc_id, 0) + 1.0 / (k + rank)
    return sorted(rrf.items(), key=lambda x: -x[1])
`

### Cross-encoder Reranking

- 对融合后的候选列表，用 cross-encoder 模型逐对精细打分
- 比 bi-encoder 更准确（考虑 query-document 交互），但更慢
- 只在 top-N 候选项上运行（通常 top-100）
- 轻量替代：LLM-based rerank（用一个短 prompt 让 LLM 排序 top-K）

### MMR 多样性过滤

`
MMR = λ·relevance_score - (1-λ)·max_similarity(d, already_selected)
`

- λ=0.7：偏向相关性
- 防止返回高度重复的内容
- 贪心算法实现，复杂度 O(n*k)

`python
def mmr_select(candidates, scores, top_k, lambda_param=0.7, sim_fn=None):
    """从候选集中选择 top_k 个多样性+相关性的文档"""
    if sim_fn is None:
        sim_fn = lambda a, b: cosine_similarity(a, b)
    selected = []
    for _ in range(top_k):
        mmr_scores = []
        for i, cand in enumerate(candidates):
            rel = scores[i]
            div = max([sim_fn(cand, selected[j]) for j in range(len(selected))], default=0)
            mmr_scores.append(lambda_param * rel - (1 - lambda_param) * div)
        best = max(range(len(candidates)), key=lambda i: mmr_scores[i])
        selected.append(candidates.pop(best))
    return selected
`

---

## 分层检索架构

`
mental_models (最高优先级, 40% token预算)
  └── observations (中等优先级, 35% token预算)
      └── raw_facts (最低优先级, 25% token预算)
`

**原则**：
- **mental_models**：用户确认的持久化认知，不可被自动删除
  - 来源：用户策展 + LLM从observations中提炼
  - 特征：结构化内容（structured_content），可配置刷新间隔
- **observations**：系统自动总结的模式和规律
  - 来源：Consolidation从raw facts自动合成
  - 特征：去重+矛盾标记+provenance链（source_memory_ids）
- **raw_facts**：原始对话和事件记录
  - 来源：retain()直接写入
  - 特征：entity_labels, temporal periods, tags
  - 4种链接类型: temporal / semantic / entity / causal

**关键设计**：prefer_observations=True 时，如果某 observation 来自某些 raw facts，则自动去重那些 raw facts，避免重复信息浪费 token。

### 与单层检索的差距

| 维度 | 单层检索（loop-dev dsh-rag-kb） | 分层检索（Hindsight） |
|------|-------------------------------|----------------------|
| 信息质量 | 原始片段，可能重复 + 矛盾 | 经过理解 + 合并 + 去重 |
| Token效率 | 大量冗余信息 | 每token信息密度高 |
| 认知层级 | 无分层 | 用户信念 > 系统模式 > 原始数据 |
| 新鲜度管理 | 无 | mental model staleness tracking + delta refresh |

---

## Consolidation（事实合并与去重）

LLM 驱动的后台合并流程：

1. **触发**：定时任务或事件驱动
2. **检索**：新事实到达 → 检索相似已有事实
3. **LLM判断**：合并 / 更新 / 新建 / 丢弃
4. **保留溯源**：
ew_fact → derived_from [old_fact_ids]
5. **矛盾处理**：记录冲突但标记不确定性，而非静默丢弃

**轻量替代**（零依赖）：
- 基于 embedding 相似度阈值合并（cosine > 0.85 → 合并）
- 基于 Jaccard 相似度的实体集合去重
- 注意：轻量方案无法处理矛盾信息，只能合并相似内容

---

## 嵌入质量评估

| 方案 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| 真实Embedding (via LiteLLM) | 语义准确，否定语义保留 | 需要API/模型，有成本 | 生产级检索 |
| Bigram-hash (384维) | 零依赖离线，确定性 | 语义精度低，否定丢失，"not good"≈"good" | 原型/离线环境 |
| Ollama 本地 | 隐私+离线，语义质量好 | 质量依赖本地模型，需GPU/内存 | 敏感数据/本地开发 |

**Bigram-hash 关键缺陷**：
- 基于字符 bigram 的哈希，无法理解语义
- "I like it" vs "I don't like it" 的高度相似 → 否定语义完全丢失
- 仅适合关键词级匹配，不适合语义理解

---

## 检查清单

`
[ ] RAG-01: 检索是否多路并行？（至少2路：语义+关键词）
    → 单路: 至少加BM25关键词检索作为第二路

[ ] RAG-02: 多路结果是否有融合策略？（RRF或其他）
    → 无融合: 实现RRF (k=60)

[ ] RAG-03: 是否分层检索？（mental_models > observations > raw_facts）
    → 单层: 实现三层分层，token预算 40/35/25

[ ] RAG-04: 是否有重排序？（cross-encoder或LLM rerank）
    → 无重排: 加cross-encoder或LLM-based rerank on top-N

[ ] RAG-05: 是否有去重/多样性机制？（MMR或dedup）
    → 无: 加MMR (λ=0.7) 防语义重复

[ ] RAG-06: 嵌入模型是否适合生产场景？（真实embedding vs bigram-hash）
    → 生产用bigram-hash: 评估语义精度，考虑迁移

[ ] RAG-07: 是否有Consolidation机制？（事实合并+去重+溯源链）
    → 无: 实现LLM驱动的合并，保留 new→derived_from [old_ids]

[ ] RAG-08: 是否有Graph检索？（激活扩散+时间图）
    → 无但场景需要: 加Entity Links + Spreading Activation
`

---

## 常见问题修复指南

### 单路检索 → 双路并行

1. 保留现有语义路（cosine/embedding）
2. 添加 BM25 关键词路（纯统计算法，零依赖）：
   - 分词 + IDF 计算 + 得分公式：IDF(qi) * (k1+1)*tf / (k1*((1-b)+b*dl/avgdl) + tf)
3. 实现 RRF 融合（k=60）
4. 验证：找一条精确术语查询，确认BM25路能兜底语义路的盲区

### 无分层 → 三层分层

1. 定义三种存储类型：mental_models / observations / 
aw_facts
2. 设置 token 预算分配：40% / 35% / 25%
3. 检索时先填满 mental_models 预算 → 再填 observations → 最后 raw_facts
4. 添加 prefer_observations 去重逻辑

### Bigram-hash → 真实 Embedding

1. 评估当前场景是否真的需要语义精度
2. 如果离线是硬约束 → 保持 bigram-hash + BM25 双路（阶段1）
3. 如果可以联网 → 集成 LiteLLM/Ollama（阶段3）
4. 过渡期双写（bigram-hash + 新embedding），待索引重建后切换

### 无MMR → MMR多样性过滤

1. 在现有 TopK 选择之后加 MMR 过滤
2. λ=0.7（偏相关性），或根据场景调整（λ=0.5 平衡，λ=0.3 偏多样性）
3. 相似度函数复用现有的 embedding cosine
4. 验证：构造一个含大量重复主题的文档集，确认 MMR 后返回内容不重复

> 风险分级与下一步骨架参考 [[architect-router]]#原子风险分级与下一步骨架。

> **修复验证标准（必填）**：本节任一修复完成后，须给出**可运行验证命令 + 通过条件**或可观测判据；仅"我改了/已调整"不算完成（对照 Router 交付协议第 3 步）。

## 交叉引用

- 数据 schema → [[architect-data]]
- 上下文预算 → [[architect-context]]
- Agent 记忆生命周期 → [[architect-agent]]
- 成本（embedding API 费用） → [[architect-cost]]
- 安全（MemoryDefense 内容安全） → [[architect-security]]
