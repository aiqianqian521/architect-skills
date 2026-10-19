
const fs = require("fs");
const path = require("path");
function stripBom(s){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }
const LO = { critical:4, high:3, medium:2, low:1, "":0 };
function best(xs){ return xs.reduce((a,b)=> (LO[String(b||"")]||0) > (LO[String(a||"")]||0) ? b : a); }
function deriveArchMap(agents){
  const out = []; const seen = {};
  const push = (dir, evidence, role) => { if(dir && !seen[dir]){ seen[dir]=1; out.push({dir, role: role||"(pending Intake map)", evidence}); } };
  for(const a of agents){
    const norm = x => String(x).replace(/\\/g,"/");
    for(const f of (a.meta&&a.meta.files_read)||[]){
      const n = norm(f); const dir = n.includes("/")? n.slice(0,n.lastIndexOf("/")) : "./";
      push(dir, f, "(pending Intake map)");
    }
    for(const f of (a.findings)||[]){
      if(f.file_line){ const n=norm(f.file_line); const dir=n.includes("/")? n.slice(0,n.lastIndexOf("/")) : "./"; push(dir, f.file_line, "(pending Intake map)"); }
    }
  }
  return out.slice(0,15);
}
function adapt(input){
  const agents = input.agents || [];
  const dimMap = {}, skillMap = {}, findings = [], blocks = [];
  for(const a of agents){
    const dim = a.dimension;
    (a.findings||[]).forEach(f=>{
      findings.push({ id:f.id, level:f.risk_level, title:(f.type||"finding")+" @ "+String(f.evidence||"").slice(0,40), scheme:f.risk_scheme_ref||"", detail:((f.evidence||"")+" | next: "+(f.next_step||"")) });
      if((f.risk_level||"")==="critical" || (f.risk_level||"")==="high"){
        blocks.push({ id:f.id, level:f.risk_level, scheme:f.risk_scheme_ref||"", title:f.type||f.id, phenomenon:f.evidence||"", rootCause:(a.agent||"?")+" finding", impact:"see risk scheme", fixOrder:f.next_step||"", verify:f.verify_command||"" });
      }
    });
    const lvls = (a.findings||[]).map(f=>f.risk_level||"").filter(Boolean);
    const cov = a.coverage && a.coverage.status ? a.coverage.status : ((a.findings||[]).length ? "covered" : "missing");
    dimMap[dim] = { dim, status: cov, evidence: ((a.meta&&a.meta.files_read)||[]).join(", ") || ((a.findings&&a.findings[0]&&a.findings[0].evidence)||""), risk: lvls.length?best(lvls):"", trigger: (a.findings||[]).map(f=>f.risk_scheme_ref).filter(Boolean).join("; ") };
    if((a.findings||[]).length){
      skillMap[dim] = { skill:(a.agent||dim)+"("+dim+")", principle:"swarm dimension: "+dim, evidence:(a.findings||[]).map(f=>(f.id+": "+f.evidence)).join(" || "), risk: lvls.length?best(lvls):"", scheme:(a.findings||[]).map(f=>f.risk_scheme_ref).filter(Boolean).join("; "), nextStep:(a.findings||[]).map(f=>f.next_step).filter(Boolean).join("; ") };
    }
  }
  return {
    family: input.family || "architect", skillName: input.skillName || "architect-security",
    project: input.project, evaluatedAt: input.evaluatedAt, title: input.title || ("architecture-eval-"+ (input.project||"project")),
    status: input.status || "covered",
    archMap: (input.archMap && input.archMap.length) ? input.archMap.map(a=>({dir:a.dir||a, role:a.role||"(pending Intake map)", evidence:String(a.evidence||a.files||"")})) : deriveArchMap(agents),
    dimensions: Object.values(dimMap), findings, skillAnalyses: Object.values(skillMap), blockers: blocks,
    narratives: narr(findings, blocks)
  };
}
function narr(findings, blocks){
  const crit = blocks.filter(b=>b.level==="critical"), high = blocks.filter(b=>b.level==="high");
  let summary = "swarm review found "+findings.length+" findings (critical="+crit.length+", high="+high.length+").";
  if(crit.length) summary += " Blocked by: "+crit.map(c=>c.id).join(",")+".";
  else if(high.length) summary += " Has high items to close this iteration.";
  else summary += " No critical/high blockers; pass.";
  const keyFindings = findings.slice(0,6).map(f=>"- "+f.id+" ["+f.level+"] "+f.title).join("\n") || "- none.";
  const hardening = crit.concat(high).length ? "Prioritize closing: "+crit.concat(high).map(b=>b.id+" -> "+b.fixOrder).join("; ") : "Maintain baseline, keep monitoring.";
  const nextSteps = blocks.length ? blocks.map(b=>"- "+b.id+" "+b.fixOrder).join("\n") : "- Re-evaluate next iteration.";
  return { summary, keyFindings, hardening, nextSteps };
}
if(require.main === module){
  const args = process.argv.slice(2);
  const arg = args[0];
  if(!arg){ console.error("usage: node scripts/swarm-to-template.cjs <input.json> [--out f.json] [--family x] [--project y]"); process.exit(2); }
  let input; try { input = JSON.parse(stripBom(fs.readFileSync(arg,"utf8"))); } catch(e){ console.error("read/parse failed: "+e.message); process.exit(2); }
  const fi = args.indexOf("--family"); if(fi!==-1) input.family = args[fi+1];
  const pi = args.indexOf("--project"); if(pi!==-1) input.project = args[pi+1];
  const out = adapt(input);
  const oi = args.indexOf("--out");
  if(oi!==-1 && args[oi+1]){ fs.writeFileSync(args[oi+1], JSON.stringify(out,null,2), "utf8"); console.log("adapted -> "+args[oi+1]); }
  else process.stdout.write(JSON.stringify(out,null,2));
}
module.exports = { adapt };
