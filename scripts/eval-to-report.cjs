
// eval-to-report.cjs - one-shot: swarm/fleet eval JSON -> unified templated report + validate gate.
// Bridges architect-skills (swarm output) into the declarative template framework
// (ai-skill-output-template). One command produces a validated, standardized deliverable.
//
// usage:
//   node scripts/eval-to-report.cjs <eval.json> --project <name> --out <report.md> [--family architect]
//   optionally: --template <id> (default architect.single-report), --strict (treat WARN blocking? no: print)
const fs = require("fs");
const path = require("path");
const { adapt } = require("./swarm-to-template.cjs");
const TPL_PKG = process.env.AI_TEMPLATE_ROOT || path.resolve(__dirname, "../../../ai-skill-output-template");
const { render } = require(path.join(TPL_PKG, "scripts", "render.cjs"));
const { validateFile } = require(path.join(TPL_PKG, "scripts", "validate.mjs"));

function stripBom(s){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

function main(){
  const args = process.argv.slice(2);
  const inputPath = args[0];
  if(!inputPath){ console.error("usage: node scripts/eval-to-report.cjs <eval.json> --project <name> --out <report.md> [--family x] [--template id]"); process.exit(2); }
  const read = (flag) => { const i = args.indexOf(flag); return (i!==-1 && args[i+1]) ? args[i+1] : undefined; };
  const project = read("--project");
  const family = read("--family") || "architect";
  const tplId = read("--template") || "architect.single-report";
  const outPath = read("--out") || (project ? ("output/"+family+"/"+project+"/report.md") : "output/report.md");

  let raw;
  try { raw = JSON.parse(stripBom(fs.readFileSync(inputPath,"utf8"))); }
  catch(e){ console.error("read/parse failed: "+e.message); process.exit(2); }
  if(project) raw.project = project;
  raw.family = family;

  const input = adapt(raw);
  let md;
  try { md = render(input, { template: tplId }); }
  catch(e){ console.error("render failed: "+e.message); process.exit(3); }

  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  fs.writeFileSync(outPath, md, "utf8");
  console.log("report rendered -> "+outPath);

  // validate gate
  const r = validateFile(outPath, { template: tplId });
  for(const w of r.warns) console.log("WARN " + w);
  if(r.errs.length){ r.errs.forEach(e=>console.error("ERR "+e)); console.error("REPORT FAILED VALIDATION"); process.exit(1); }
  console.log("validated under template ["+(r.template||tplId)+"]");
  if(r.warns.length) console.log("note: "+r.warns.length+" non-blocking quality hint(s) surfaced by the template gates.");
}
main();
