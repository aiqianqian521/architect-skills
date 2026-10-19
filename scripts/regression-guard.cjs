#!/usr/bin/env node
// regression-guard.cjs
// 金样回归守护：对比当前蜂群评估输出与历史 golden sample，检测口径漂移
// 用法：node scripts/regression-guard.cjs --baseline output/golden/swarm-eval-baseline.json --current current-eval.json

const fs = require("fs");
const path = require("path");

// ---- 漂移检测规则 ----
const DRIFT_RULES = [
  {
    id: "DRIFT-01",
    name: "定级漂移",
    check: (base, curr) => base.risk_level !== curr.risk_level,
    severity: "high",
    message: (base, curr, key) =>
      `[${key}] 定级漂移: ${base.risk_level} → ${curr.risk_level}`
  },
  {
    id: "DRIFT-02",
    name: "置信度退化",
    check: (base, curr) => {
      const levels = { high: 3, medium: 2, low: 1, unknown: 0 };
      return levels[curr.confidence] < levels[base.confidence];
    },
    severity: "medium",
    message: (base, curr, key) =>
      `[${key}] 置信度退化: ${base.confidence} → ${curr.confidence}`
  },
  {
    id: "DRIFT-03",
    name: "发现遗漏",
    check: null, // 特殊处理：基线有但当前无
    severity: "high",
    message: (base, key) =>
      `[${key}] 发现遗漏: 基线存在但当前评估缺失`
  },
  {
    id: "DRIFT-04",
    name: "新增发现",
    check: null, // 特殊处理：当前有但基线无
    severity: "low",
    message: (curr, key) =>
      `[${key}] 新增发现: ${curr.risk_level} · ${curr.confidence}`
  },
  {
    id: "DRIFT-05",
    name: "触发条件引用变更",
    check: (base, curr) =>
      base.risk_scheme_ref &&
      curr.risk_scheme_ref &&
      base.risk_scheme_ref !== curr.risk_scheme_ref,
    severity: "medium",
    message: (base, curr, key) =>
      `[${key}] 触发条件引用变更: "${base.risk_scheme_ref}" → "${curr.risk_scheme_ref}"`
  }
];

// ---- 核心逻辑 ----
function flattenFindings(agentOutputs) {
  const map = new Map();
  for (const agent of agentOutputs) {
    for (const f of agent.findings) {
      // key: dimension + id 唯一标识一个发现
      const key = `${agent.dimension}::${f.id}`;
      map.set(key, {
        ...f,
        _agent: agent.agent,
        _dimension: agent.dimension
      });
    }
  }
  return map;
}

function compareFindings(baseMap, currentMap) {
  const drifts = [];

  // 检查遗漏 + 变更
  for (const [key, baseFinding] of baseMap) {
    if (!currentMap.has(key)) {
      const rule = DRIFT_RULES.find(r => r.id === "DRIFT-03");
      drifts.push({
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        key,
        message: rule.message(baseFinding, key),
        base: baseFinding,
        current: null
      });
      continue;
    }

    const currFinding = currentMap.get(key);
    for (const rule of DRIFT_RULES) {
      if (rule.check && rule.check(baseFinding, currFinding)) {
        drifts.push({
          rule_id: rule.id,
          rule_name: rule.name,
          severity: rule.severity,
          key,
          message: rule.message(baseFinding, currFinding, key),
          base: baseFinding,
          current: currFinding
        });
      }
    }
  }

  // 检查新增
  for (const [key, currFinding] of currentMap) {
    if (!baseMap.has(key)) {
      const rule = DRIFT_RULES.find(r => r.id === "DRIFT-04");
      drifts.push({
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        key,
        message: rule.message(currFinding, key),
        base: null,
        current: currFinding
      });
    }
  }

  return drifts;
}

function generateReport(baselineFile, currentFile, drifts) {
  const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentFile, "utf8"));

  let out = `# 金样回归报告\n\n`;
  out += `> 基线: ${path.basename(baselineFile)}\n`;
  out += `> 当前: ${path.basename(currentFile)}\n`;
  out += `> 生成时间: ${new Date().toISOString()}\n\n`;

  // 统计摘要
  const baseMap = flattenFindings(baseline.agents || []);
  const currMap = flattenFindings(current.agents || []);
  const highDrifts = drifts.filter(d => d.severity === "high");
  const mediumDrifts = drifts.filter(d => d.severity === "medium");
  const lowDrifts = drifts.filter(d => d.severity === "low");

  out += "## 统计摘要\n\n";
  out += `| 指标 | 数值 |\n|---|---|\n`;
  out += `| 基线发现数 | ${baseMap.size} |\n`;
  out += `| 当前发现数 | ${currMap.size} |\n`;
  out += `| 漂移总数 | ${drifts.length} |\n`;
  out += `| 高危漂移 | ${highDrifts.length} |\n`;
  out += `| 中危漂移 | ${mediumDrifts.length} |\n`;
  out += `| 低危漂移 | ${lowDrifts.length} |\n\n`;

  // 漂移详情
  if (drifts.length === 0) {
    out += "## 漂移详情\n\n✅ 无漂移。当前评估与基线口径完全一致。\n";
  } else {
    out += "## 漂移详情\n\n";
    const bySeverity = { high: [], medium: [], low: [] };
    for (const d of drifts) bySeverity[d.severity].push(d);

    for (const sev of ["high", "medium", "low"]) {
      if (bySeverity[sev].length === 0) continue;
      out += `### ${sev.toUpperCase()} 优先级\n\n`;
      for (const d of bySeverity[sev]) {
        out += `- **${d.rule_id}**（${d.rule_name}）\n`;
        out += `  - ${d.message}\n`;
        if (d.base && d.current) {
          out += `  - 基线: ${d.base.risk_level} / ${d.base.confidence}\n`;
          out += `  - 当前: ${d.current.risk_level} / ${d.current.confidence}\n`;
        }
        out += "\n";
      }
    }
  }

  // 维度覆盖对比
  out += "\n## 维度覆盖对比\n\n";
  out += "| 维度 | 基线状态 | 当前状态 | 漂移 |\n|---|---|---|---|\n";
  const allDims = new Set([
    ...Object.keys(baseline.coverage || {}),
    ...Object.keys(current.coverage || {})
  ]);
  for (const dim of allDims) {
    const baseStatus = baseline.coverage?.[dim]?.status || "missing";
    const currStatus = current.coverage?.[dim]?.status || "missing";
    const drifted = baseStatus !== currStatus ? "⚠️" : "✅";
    out += `| ${dim} | ${baseStatus} | ${currStatus} | ${drifted} |\n`;
  }

  // 门禁结论
  out += "\n## 门禁结论\n\n";
  if (highDrifts.length > 0) {
    out += `❌ **未通过**。存在 ${highDrifts.length} 个高危漂移，必须修复后才能上线。\n`;
  } else if (mediumDrifts.length > 0) {
    out += `⚠️ **条件通过**。存在 ${mediumDrifts.length} 个中危漂移，建议复核后上线。\n`;
  } else {
    out += `✅ **通过**。无高危/中危漂移，可上线。\n`;
  }

  return out;
}

// ---- CLI ----
function main() {
  const args = process.argv.slice(2);
  const baselineIdx = args.indexOf("--baseline");
  const currentIdx = args.indexOf("--current");
  const outIdx = args.indexOf("--out");

  if (baselineIdx === -1 || currentIdx === -1) {
    console.error("usage: node regression-guard.cjs --baseline <baseline.json> --current <current.json> [--out <report.md>]");
    console.error("");
    console.error("  baseline.json: 历史金样（格式同 swarm-output.json）");
    console.error("  current.json:  当前评估输出（格式同 swarm-output.json）");
    process.exit(2);
  }

  const baselineFile = args[baselineIdx + 1];
  const currentFile = args[currentIdx + 1];

  if (!fs.existsSync(baselineFile)) {
    console.error(`ERROR: 基线文件不存在: ${baselineFile}`);
    process.exit(3);
  }
  if (!fs.existsSync(currentFile)) {
    console.error(`ERROR: 当前文件不存在: ${currentFile}`);
    process.exit(3);
  }

  const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
  const current = JSON.parse(fs.readFileSync(currentFile, "utf8"));

  const baseMap = flattenFindings(baseline.agents || []);
  const currMap = flattenFindings(current.agents || []);
  const drifts = compareFindings(baseMap, currMap);

  const report = generateReport(baselineFile, currentFile, drifts);

  if (outIdx !== -1 && args[outIdx + 1]) {
    fs.mkdirSync(path.dirname(args[outIdx + 1]), { recursive: true });
    fs.writeFileSync(args[outIdx + 1], report, "utf8");
    console.log("report -> " + args[outIdx + 1]);
  } else {
    process.stdout.write(report);
  }

  // 门禁：high drift → exit 1
  const highDrifts = drifts.filter(d => d.severity === "high");
  if (highDrifts.length > 0) {
    console.error(`\nREGRESSION_GUARD_BLOCK: ${highDrifts.length} 个高危漂移`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { flattenFindings, compareFindings, generateReport, DRIFT_RULES };
