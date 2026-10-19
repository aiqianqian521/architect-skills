# architect-plugin 判断力指南（Guide）

> 单 atom 调用硬规则：交付必须含四件套——结论 / 证据（行级）/ 风险分级 / 下一步。
> 风险分级按 `reference/risk-grading-scheme.md` 量化口径判定。

# 插件化与软插拔架构设计

> 单 atom 调用硬规则: 交付含四件套(结论/证据行级/风险分级/下一步). 风险分级按 reference/risk-grading-scheme.md, 骨架参见 [[architect-router]]#原子风险分级与下一步骨架.

## 0. 灵魂理念(必读, 否则等于没这维度)

**不什么都自研, 让别人开发, 我们只做适配 / 兼容 / 加载。** 插件化的灵魂 = 把"可变能力"从核心剥离成可独立安装 / 卸载 / 热替换的第三方单元, 核心只保留"不可变的调度骨架 + 插件契约"。判断一个系统是否真插件化, 不是看它有没有"插件"二字, 而看用户 / 第三方能否"放包即用"——不改核心代码、不重新编译、只放一个符合 manifest 的包到约定目录就生效。

> 这是本维度的存在理由: architect-design 的端口-适配器讲"适配器可替换", 但适配器仍是核心自己写; architect-plugin 讲"适配器由第三方写、核心只加载"。两者互补, 不替代。

## 1. 核心原则

### 1.1 软插拔(第三方可安装)
- 硬插拔 = 改核心代码加能力; 软插拔 = 放包即用, 核心零改动
- 铁律: 新增一种第三方能力(RAG / WebUI / 某 Filter / 某 Skill / 某交易所), 核心代码改动行数应 = 0, 只动 plugins/ 目录 + roster 配置
- 反模式: "支持插件"但每加一个插件要改 orchestrator / 加 if-else 分支

### 1.2 Plugin Manifest 契约
- 每插件包一个 manifest 声明: id / 版本 / 入口(entry) / 依赖(inject) / 扩展点注册 / immediately|lazy
- manifest = 插件的加载契约, 核心只扫 manifest 不读插件内部
- 统一入口形状(如 plugin.py 的 register()), 符合形状才被纯度门覆盖

### 1.3 注册 vs 物化分离(load ≠ materialize)
- 加载插件 = 只注册 factory(声明"我有这能力"), 不立即执行副作用
- 物化 = 首次实际调用时才运行 factory 实现
- 好处: 无加载排序依赖; 启动快; 按需物化省资源; 失败隔离(注册成功 ≠ 物化成功)

### 1.4 扩展点(Extension Points)
- 核心明确暴露扩展点: hook / 命令 / tool / slot / 事件 / 过滤器
- 插件通过扩展点接入, 不直接调核心内部
- 扩展点契约稳定(版本化), 核心实现可变; 扩展点是核心与第三方的边界

### 1.5 插件隔离与纯度门
- 插件↔插件禁止直接依赖(value import), 须走 service / 事件 / 共享 context
- 纯度门: 构建期检查插件只通过扩展点交互, 无跨插件内部耦合
- 失败隔离: 一个插件物化失败不阻塞其他(注册期 fail-loud, 物化期隔离)

### 1.6 生命周期
- 挂载(load 注册) → 激活(activate 物化 + 接扩展点) → 暂停(deactivate) → 卸载(unload 清 factory + 副作用) → 热重载(invalidate → reload)
- 卸载要清副作用(注册的命令 / tool / 样式 / 监听 / 定时器)
- 热重载: 开发态高频诉求, 生产态可选

### 1.7 Roster 组合决策
- 哪些插件 mount 进某部署 = roster 配置决策, 非包属性
- 包声明 manifest ≠ 该部署启用它; discovery-by-scan 不能决定 mount
- 一个插件包可被多个部署以不同 roster 组合

### 1.8 Upgrade-Law(plain → plugin)
- 能力默认 plain(核心内置), 只有当"消费方式切到依赖注入 / 扩展点"时才升级为 plugin
- 不为插件化而插件化: 核心 / 无扩展需求 / 启动必需底座应保持 plain
- 升级触发: 出现 ≥2 实现 / 第三方要开发 / 用户要自定义

## 2. 检查清单(每项含未通过修复操作)

| 检查项 | 未通过时修复操作 |
|---|---|
| 软插拔: 新增第三方能力核心改动=0? | ① 找每加一能力要改的核心文件 ② 抽扩展点+manifest加载 ③ 核心只依赖扩展点抽象不依赖具体插件 |
| Manifest契约: 有无插件声明契约? | ① 定义manifest schema(id/entry/inject/extension_points/version) ② 核心只读manifest不读插件源 ③ 缺manifest=非插件 |
| 注册vs物化: 加载是否立即执行副作用? | ① 入口改factory注册 ② 副作用移入factory闭包 ③ 首次调用才物化 |
| 扩展点: 核心暴露的扩展点是否明确稳定? | ① 列所有扩展点(hook/command/tool/slot/event) ② 每个写契约+版本 ③ 插件只经扩展点接入 |
| 隔离/纯度门: 插件间有无直接依赖? | ① 扫插件import图 ② 跨插件直接import→改走service/事件 ③ 构建期纯度门 |
| 生命周期: 能否卸载/热重载不残留? | ① 每插件记录注册的副作用 ② unload清这些 ③ 热重载invalidate→reload |
| 失败隔离: 一插件挂是否阻塞全局? | ① 物化期try/except隔离 ② 注册期fail-loud报哪个插件 ③ 坏插件不mask其他 |
| Roster: mount决策是否配置化? | ① 部署roster声明启哪些 ② discovery-by-scan不替roster ③ |

## 3. 适配性判据(哪些该插件化 / 哪些不该 — 决定不都自研)

### 该插件化(软插拔收益高, 让第三方开发)
- 可变能力: RAG检索 / 向量库选择 / Web UI主题 / 特定领域Filter / 某交易所适配 / 某模型接入 / Skill脚本 / 规则引擎规则 / 数据源连接器
- 判据: ① 该能力有多种实现/供应商 ② 用户会自定义/第三方会开发 ③ 核心不需要知道具体实现

### 不该插件化(应保持 plain 核心)
- 启动底座: 模块系统 / 插件loader自己 / 调度骨架 / 核心状态机 / 纯净组合根
- 无扩展需求: 一次性脚本 / 确定性算法核心 / 单一权威实现
- 判据: ① 它是其他插件的依赖底座 ② 没有多实现需求 ③ 插件化复杂度 > 收益

### borderline → 用 Upgrade-Law
- 当前 plain 但未来可能多实现: 先 plain, 消费切扩展点时再升级 plugin(留升级路径, 不提前插件化)

## 4. GitHub 项目学习注入机制(灵魂点提取, 跨项目复用)

学习第三方 GitHub 项目时, 提取其"插件化灵魂点"注入本体系, 而非照搬代码:

1. **是否插件化?**: 扫 manifest / plugin / extension / hook / market / packages 分包结构关键词
2. **是 → 提取**: 插件 manifest schema / 扩展点定义 / 加载模型(注册vs物化) / 隔离方式 / 生命周期 / roster 组合
3. **适配性判据分类**: 该项目能力哪些适合作为插件注入目标系统(适配兼容加载), 哪些不适合(自研或不接)
4. **沉淀**: 灵魂点模板 + 适配判据 → 架构师 docs(每项目一注入卡)
5. **铁律**: 不照搬代码, 提炼理念 + 契约 + 扩展点; 跨语言(Python/TS)只移理念不移实现; 注入前判"目标系统该不该插件化这能力"

### 可注入典型(参考源)
- DSH(cordis plugin-loader / client-plugin-loading-model / interception-extension-points / mcp-client-plugin)
- codex / coze-studio(插件市场) / vscode 系(扩展 API) / lobehub(插件) / open-webui

### 不可注入典型
- 纯算法库(无扩展点) / 单文件 CLI(无生态) / 无第三方扩展诉求的核心 / 强耦合一体式 monolith

## 5. 常见问题修复指南

### "支持插件"但每加插件要改核心(if-else 分支)
1. 列出核心里所有 if plugin_x / type== 分支
2. 每分支抽成扩展点注册(插件自注册, 核心只遍历已注册)
3. 核心改"遍历扩展点注册表"非"switch 具体插件"
4. 验证: 新增插件包只放目录+manifest, 核心 git diff = 0

### 插件加载即执行副作用(启动慢/失败连锁)
1. 入口改 factory: `def register(ctx): return PluginFactory(...)`
2. loader 只调 register 存 factory, 不执行 plugin body
3. 实际用时 `factory.materialize()` 才跑 body
4. 验证: 启动时间不随插件数线性增长; 坏插件注册不影响启动

### 插件间直接 import 耦合
1. 扫插件间 import 语句
2. A 需 B 能力 → 走核心暴露的 service / 事件, 不直接 import B
3. 纯度门脚本扫插件目录, 跨 import 报错
4. 验证: 卸载 B 不 crash A(A 延后物化或降级)

### 第三方插件信任与安全
1. 插件默认沙箱 / 受限权限(参考 [[architect-security]])
2. 可信插件白名单(roster 标 trusted) → 完整权限
3. 不可信插件 → 只读扩展点 / 无文件无网络
4. 验证: 不可信插件无法越权访问核心状态

## 交叉引用
- 端口-适配器 / 组合根(architect-plugin 是其第三方延伸) → [[architect-design]]
- Agent 扩展点 / 子 agent → [[architect-agent]]
- 安全隔离 / 沙箱(第三方插件信任) → [[architect-security]]
- 测试契约(插件 contract test) → [[architect-test]]
- 风险分级与下一步骨架 → [[architect-router]]#原子风险分级与下一步骨架
