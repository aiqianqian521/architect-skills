#!/usr/bin/env node
// L1 单元测试（P6）：利用 tests/fixtures/ 校验 render-report.cjs 的关键行为
// 用法：node tests/run-l1-tests.mjs
import { createRequire } from "module";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const renderer = require("../scripts/render-report.cjs");
const { renderL2Report } = renderer;
const __dirname = dirname(fileURLToPath(import.meta.url));
const fx = (n) => join(__dirname, "fixtures", n);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`); }
}

const load = (n) => JSON.parse(readFileSync(fx(n), "utf8"));

console.log("\n[L1·T1] strict 拒绝 malformed agent 输出");
try {
  renderL2Report(load("swarm-output-broken.mock.json"), {});
  check("strict broken 应 throw", false);
} catch (e) {
  check("strict broken 抛错", /agent 输出不符/.test(e.message));
  check("P11 前缀不重复", (e.message.match(/RENDERER_REJECT/g) || []).length === 0);
}

console.log("\n[L1·T2] lenient 落盘且附警告");
{
  const md = renderL2Report(load("swarm-output-broken.mock.json"), { lenient: true });
  check("lenient 产出报告", md.includes("# 架构评估报告"));
  check("lenient 含警告块", md.includes("Lenient 模式警告"));
}

console.log("\n[L1·T3] review 模式 proposal 完整");
{
  const md = renderL2Report(load("swarm-output-proposal.mock.json"), { mode: "review" });
  check("渲染成功", md.includes("# 架构评估报告"));
  check("含方案信息", md.includes("方案信息"));
}

console.log("\n[L1·T4] review 模式 proposal 不完整 -> PROPOSAL_INCOMPLETE");
{
  const md = renderL2Report(load("swarm-output-incomplete-proposal.mock.json"), { mode: "review" });
  check("命中门禁", md.includes("PROPOSAL_INCOMPLETE"));
}

console.log("\n[L1·T5] P1: assessment 模式(无 proposal)不被误判 PROPOSAL_INCOMPLETE");
for (const n of ["eval-cspm-agent.json", "eval-loop-dev.json", "eval-deepseek-harness.json"]) {
  const md = renderL2Report(load(n)); // mode 默认 assessment
  check(`${n} 不出现 PROPOSAL_INCOMPLETE`, !md.includes("PROPOSAL_INCOMPLETE"));
  check(`${n} 标注 assessment 模式`, md.includes("模式：assessment"));
}

console.log("\n[L1·T6] P2: narrative 缺失给出 NARRATIVE_MISSING 告警");
{
  const md = renderL2Report(load("eval-loop-dev.json"));
  check("含完整性警告", md.includes("NARRATIVE_MISSING"));
}

console.log("\n[L1·T7] P4: 架构地图从 agent meta 自动推导");
{
  const md = renderL2Report(load("eval-cspm-agent.json"));
  check("不再是占位符", !md.includes("（由评估者据 Intake 建图填写"));
  check("包含推导的目录条目", !md.includes("（待补：据 Intake 建图）"));
  check("架构地图含推断角色或模块名", /项目根目录|模块|源码|测试|文档/.test(md));
}

console.log("\n[L1·T8] P3/P7: 未评审维度显示为 未评审 而非 misleading missing");
{
  const md = renderL2Report(load("eval-loop-dev.json"));
  check("含未评审维度", md.includes("未评审"));
}


console.log("\n[L1·T9] P0: \u672a\u77e5 type \u4e0d\u62d2\u6536\uff0c\u800c\u662f\u5f52\u5165 type_unknown \u5f85\u4eba\u5de5\u5f52\u6863");
{
  const input = {
    project: "type-unknown-test",
    agents: [{
      agent: "Bacon", dimension: "test", evaluatedAt: "2026-08-31T00:00:00Z", status: "completed",
      findings: [{
        id: "U1", type: "monkey_patch", evidence: "lib/x.go:10 monkey patches net/http",
        file_line: "lib/x.go:10", risk_level: "high", confidence: "high",
        next_step: "replace with seam injection", verify_command: "go test ./...", rollback: "git revert"
      }],
      coverage: { status: "covered" },
      meta: { files_read: ["lib/x.go"] }
    }]
  };
  // strict mode should NOT throw even though monkey_patch is now in recommended set.
  // To prove unknown-type tolerance, use a genuinely unknown type:
  input.agents[0].findings[0].type = "totally_custom_type_zzz";
  let md = renderL2Report(input, {}); // strict
  check("strict \u4e0d\u629b\u9519\uff08type \u5f00\u653e\u5b57\u7b26\u4e32\uff09", typeof md === "string");
  check("\u5165\u56de\u62a5\u544a type\u539f\u59cb\u503c", md.includes("totally_custom_type_zzz"));
  check("\u6807\u8bb0 type_unknown \u5f85\u590d\u6838\u533a", md.includes("type_unknown"));
}

console.log("\n[L1·T10] P2: --strict-narrative \u65f6 narrative \u7f3a\u5931\u62d2\u7edd");
{
  const input = load("eval-loop-dev.json"); // narratives \u7f3a\u5931
  try {
    renderL2Report(input, { strictNarrative: true });
    check("strict-narrative \u5e94\u629b\u9519", false);
  } catch (e) {
    check("strict-narrative \u629b\u9519 NARRATIVE_STRICT", /NARRATIVE_STRICT/.test(e.message));
  }
}

console.log("\n[L1·T11] P0: \u65b0\u589e\u63a8\u8350 type \u4ecd\u53d7\u652f\u6301\uff08monkey_patch/missing_coverage/dup_code\uff09");
{
  const input = {
    project: "recommended-types-test",
    agents: [{
      agent: "Bacon", dimension: "design", evaluatedAt: "2026-08-31T00:00:00Z", status: "completed",
      findings: [
        { id: "R1", type: "monkey_patch", evidence: "a", risk_level: "medium", confidence: "high", next_step: "s" },
        { id: "R2", type: "missing_coverage", evidence: "a", risk_level: "medium", confidence: "high", next_step: "s" },
        { id: "R3", type: "dup_code", evidence: "a", risk_level: "low", confidence: "high", next_step: "s" }
      ],
      coverage: { status: "covered" }, meta: { files_read: [] }
    }]
  };
  const md = renderL2Report(input, {});
  check("strict \u65b0 type \u4e0d\u62d2\u6536", typeof md === "string" && !md.includes("agent \u8f93\u51fa\u4e0d\u7b26\u5408"));
}

console.log("\n[L1·T12] P4: inferDirRole 规则推断正确性");
{
  const input = {
    project: "dir-role-test",
    agents: [{
      agent: "Bacon", dimension: "design", evaluatedAt: "2026-08-31T00:00:00Z", status: "completed",
      findings: [{ id: "D1", type: "god_file", evidence: "src/core/engine.ts:120 超过800行", file_line: "src/core/engine.ts:120", risk_level: "high", confidence: "high", next_step: "拆分模块", verify_command: "npm test", rollback: "git revert" }],
      coverage: { status: "covered" },
      meta: { files_read: ["src/core/engine.ts", "tests/unit/core.test.ts", "docs/API.md", "deploy/k8s.yaml", "scripts/build.sh"] }
    }]
  };
  const md = renderL2Report(input, {});
  check("inferDirRole 推断 src/core → 业务/核心源码", md.includes("业务/核心源码"));
  check("inferDirRole 推断 tests/ → 测试与质量门禁", md.includes("测试与质量门禁"));
  check("inferDirRole 推断 docs/ → 文档与入口", md.includes("文档与入口"));
  check("inferDirRole 推断 deploy/ → 部署与运维", md.includes("部署与运维"));
  check("inferDirRole 推断 scripts/ → 构建与工具脚本", md.includes("构建与工具脚本"));
  check("架构地图不再含硬编码待补", !md.includes("（待补：据 Intake 建图）"));
}

console.log("\n[L1·T13] P4: meta.dir_roles 显式覆盖推断");
{
  const input = {
    project: "dir-role-override-test",
    agents: [{
      agent: "Bacon", dimension: "design", evaluatedAt: "2026-08-31T00:00:00Z", status: "completed",
      findings: [{ id: "D1", type: "god_file", evidence: "src/core/engine.ts:120", file_line: "src/core/engine.ts:120", risk_level: "high", confidence: "high", next_step: "拆分", verify_command: "npm test", rollback: "git revert" }],
      coverage: { status: "covered" },
      meta: { files_read: ["src/core/engine.ts"], dir_roles: { "src/core": "引擎核心（人工标注）" } }
    }]
  };
  const md = renderL2Report(input, {});
  check("dir_roles 显式覆盖生效", md.includes("引擎核心（人工标注）"));
}

console.log("\n[L1·T14] B6: critical/high 缺 rollback 标记不完整");
{
  const input = {
    project: "remediation-test",
    agents: [{
      agent: "Bacon", dimension: "security", evaluatedAt: "2026-08-31T00:00:00Z", status: "completed",
      findings: [
        { id: "S1", type: "hardcoded_secret", evidence: "config/secrets.yaml:3", file_line: "config/secrets.yaml:3", risk_level: "critical", confidence: "high", next_step: "迁往 Vault", verify_command: "vault status", rollback: "git revert" },
        { id: "S2", type: "missing_validation", evidence: "api/auth.ts:45", file_line: "api/auth.ts:45", risk_level: "high", confidence: "medium", next_step: "加校验", verify_command: "npm test" }
      ],
      coverage: { status: "covered" }, meta: { files_read: [] }
    }]
  };
  const md = renderL2Report(input, {});
  check("S1 rollback 完整不标记", !md.includes("S1（critical · security） · ⚠️矫正项不完整"));
  check("S2 缺 rollback 标记不完整", md.includes("⚠️矫正项不完整"));
}

console.log(`\n----------------------------------------`);
console.log(`L1 结果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
