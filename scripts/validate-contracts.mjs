#!/usr/bin/env node
// validate-contracts.mjs
// 校验所有 atom 目录下的 contract.json 是否符合规范
// 用法：node scripts/validate-contracts.mjs [atom-dir...]
//   无参数时扫描所有 architect-*/ 目录

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const REQUIRED_CONTRACT_FIELDS = ["dimension", "checklist", "output_schema"];
const VALID_DIMENSIONS = new Set([
  "design", "review", "data", "test", "workflow",
  "agent", "git", "docs", "net", "security",
  "ops", "observability", "cost", "compliance", "frontend",
  "plugin", "router"
]);
const REQUIRED_OUTPUT_SCHEMA_FIELDS = ["required"];
const REQUIRED_CHECKLIST_ITEM_FIELDS = ["id", "rule"];

function error(atom, msg) {
  return { atom, type: "ERROR", message: msg };
}
function warn(atom, msg) {
  return { atom, type: "WARN", message: msg };
}

function validateContract(atomDir) {
  const atomName = path.basename(atomDir);
  const results = [];

  // 1. 检查目录结构
  const contractPath = path.join(atomDir, "contract.json");
  const guidePath = path.join(atomDir, "guide.md");
  const skillPath = path.join(atomDir, "SKILL.md");

  const requireAll = process.argv.includes("--require-all");
  if (!fs.existsSync(contractPath)) {
    if (requireAll) {
      results.push(error(atomName, `contract.json 缺失（--require-all 模式下必须全量拆分契约层）`));
    } else {
      results.push(warn(atomName, `contract.json 未铺开（试点期：仅 architect-security 已拆分；其余 pending）`));
      results.push(warn(atomName, `如需强制全量校验请加 --require-all`));
    }
    return results;
  }
  if (!fs.existsSync(guidePath)) {
    results.push(warn(atomName, `guide.md 缺失（建议拆分指南层）`));
  }
  if (!fs.existsSync(skillPath)) {
    results.push(error(atomName, `SKILL.md 缺失`));
  }

  // 2. 解析 contract.json
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  } catch (e) {
    results.push(error(atomName, `contract.json JSON 解析失败: ${e.message}`));
    return results;
  }

  // 3. 校验必填字段
  for (const field of REQUIRED_CONTRACT_FIELDS) {
    if (contract[field] === undefined) {
      results.push(error(atomName, `contract.json 缺少必填字段: ${field}`));
    }
  }

  // 4. 校验 dimension
  if (contract.dimension && !VALID_DIMENSIONS.has(contract.dimension)) {
    results.push(error(atomName, `contract.json dimension 非法: "${contract.dimension}"`));
  }

  // 5. 校验 checklist
  if (!Array.isArray(contract.checklist)) {
    results.push(error(atomName, `contract.json checklist 必须是数组`));
  } else if (contract.checklist.length === 0) {
    results.push(warn(atomName, `contract.json checklist 为空数组`));
  } else {
    for (let i = 0; i < contract.checklist.length; i++) {
      const item = contract.checklist[i];
      for (const field of REQUIRED_CHECKLIST_ITEM_FIELDS) {
        if (!item[field]) {
          results.push(error(atomName, `checklist[${i}] 缺少 ${field}`));
        }
      }
      if (item.severity_if_fail) {
        const valid = ["critical", "high", "medium", "low"];
        if (!valid.includes(item.severity_if_fail)) {
          results.push(error(atomName, `checklist[${i}].severity_if_fail 非法: "${item.severity_if_fail}"`));
        }
      }
    }
  }

  // 6. 校验 output_schema
  if (contract.output_schema) {
    if (!Array.isArray(contract.output_schema.required)) {
      results.push(error(atomName, `output_schema.required 必须是数组`));
    } else {
      const hasConfidence = contract.output_schema.required.includes("confidence");
      if (!hasConfidence) {
        results.push(error(atomName, `output_schema.required 必须包含 "confidence"（蜂群模式必填）`));
      }
    }
  }

  // 7. 校验 SKILL.md 是否引用 contract
  if (fs.existsSync(skillPath)) {
    const skillContent = fs.readFileSync(skillPath, "utf8");
    if (!skillContent.includes("contract.json")) {
      results.push(warn(atomName, `SKILL.md 未引用 contract.json`));
    }
  }

  return results;
}

function findAtomDirs() {
  const dirs = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith("architect-")) {
      dirs.push(path.join(ROOT, entry.name));
    }
  }
  return dirs;
}

// ---- 主入口 ----
const args = process.argv.slice(2);
const dirArgs = args.filter(a => !a.startsWith("--"));
const atomDirs = dirArgs.length > 0 ? dirArgs.map(a => path.resolve(a)) : findAtomDirs();

console.log(`扫描 ${atomDirs.length} 个 atom 目录...\n`);

let totalErrors = 0;
let totalWarns = 0;
const requireAll = process.argv.includes("--require-all");

for (const dir of atomDirs) {
  const results = validateContract(dir);
  if (results.length === 0) {
    console.log(`✅ ${path.basename(dir)}`);
  } else {
    console.log(`\n${path.basename(dir)}:`);
    for (const r of results) {
      const icon = r.type === "ERROR" ? "❌" : "⚠️";
      console.log(`  ${icon} ${r.message}`);
      if (r.type === "ERROR") totalErrors++;
      else totalWarns++;
    }
  }
}

console.log(`\n----------------------------------------`);
console.log(`总计: ${atomDirs.length} 个 atom, ${totalErrors} 个错误, ${totalWarns} 个警告${requireAll ? "（--require-all 强校验模式）" : "（试点模式）"}`);

if (totalErrors > 0) {
  console.log("\n❌ 校验未通过。请修复 ERROR 后重新运行。");
  process.exit(1);
} else if (totalWarns > 0) {
  console.log("\n⚠️ 校验通过，但有 WARN 建议处理。");
  process.exit(0);
} else {
  console.log("\n✅ 全部通过！");
  process.exit(0);
}
