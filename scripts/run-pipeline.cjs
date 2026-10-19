
// run-pipeline.cjs - run the unified architect-review pipeline over all registered projects.
// Reads pipeline.config.json (add a project = add one row). For each project:
//   swarm eval JSON -> adapt -> render(template) -> validate -> write deliverable.
// Prints a summary table incl. quality signals surfaced by the template gates.
//
// usage: node scripts/run-pipeline.cjs [--once <projectName>]  (default: all)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
function stripBom(s){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }
const cfg = JSON.parse(stripBom(fs.readFileSync(path.join(ROOT, "pipeline.config.json"), "utf8")));
const { adapt } = require("./swarm-to-template.cjs");
const { render } = require(path.join(cfg.templateRoot, "scripts", "render.cjs"));
const { validateFile } = require(path.join(cfg.templateRoot, "scripts", "validate.mjs"));

const LO = { critical:4, high:3, medium:2, low:1 };
function extractMeta(md){
  const m = md.match(/swarm review found (\d+) findings \(critical=(\d+), high=(\d+)\)/);
  const cov = (md.match(/covered=(\d+) partial=(\d+) N\/A=(\d+) missing=(\d+)/)||[]).slice(1);
  return { nf: m?m[1]:"?", cr: m?m[2]:"0", hi: m?m[3]:"0", cov: cov.length?cov.join("/"):"-" };
}

function runProject(p){
  const fixture = path.join(ROOT, cfg.fixtureBase || "", p.fixture);
  let raw;
  try { raw = JSON.parse(stripBom(fs.readFileSync(fixture, "utf8"))); }
  catch(e){ console.error("  [SKIP] cannot read fixture "+fixture+" ("+e.message+")"); return null; }
  raw.project = p.name; raw.family = p.family || "architect";
  const input = adapt(raw);
  const tpl = p.template || cfg.defaultTemplate;
  let md; try { md = render(input, { template: tpl }); } catch(e){ console.error("  [SKIP] render failed: "+e.message); return null; }
  fs.mkdirSync(path.dirname(p.out), { recursive: true });
  fs.writeFileSync(p.out, md, "utf8");
  const r = validateFile(p.out, { template: tpl });
  const meta = extractMeta(md);
  return { name: p.name, out: p.out, meta, errs: r.errs.length, warns: r.warns, pass: r.errs.length===0 };
}

function main(){
  const once = (()=>{ const i=process.argv.indexOf("--once"); return (i!==-1&&process.argv[i+1])?process.argv[i+1]:null; })();
  const projects = once ? cfg.projects.filter(p=>p.name===once) : cfg.projects;
  if(!projects.length){ console.error("no projects to run"+(once?" (name not found: "+once+")":"")); process.exit(2); }
  const rows = [];
  for(const p of projects){ console.log("[pipeline] "+p.name); rows.push(runProject(p)); }
  console.log("\n=== SUMMARY ===");
  console.log("project | findings | critical | high | coverage | errs | warns");
  for(const r of rows){
    if(!r){ console.log("(skip) | - | - | - | - | - | -"); continue; }
    console.log(`${r.name} | ${r.meta.nf} | ${r.meta.cr} | ${r.meta.hi} | ${r.meta.cov} | ${r.errs} | ${r.warns.length}`);
  }
  const failed = rows.filter(r=>r && !r.pass);
  console.log("\n" + (failed.length? ("FAILED: "+failed.map(f=>f.name).join(",")) : "ALL PASS (exit 0)"));
  process.exit(failed.length?1:0);
}
main();
