import { readFileSync, writeFileSync } from "node:fs";

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
const answers = JSON.parse(readFileSync("src/data/answers-ai.json", "utf8"));
const N = Object.keys(answers).length;
if (N < 100) {
  console.error(`answers file looks wrong (${N} entries) — refusing to run.`);
  process.exit(1);
}

const repoSections = bank.sections.filter((s) => s.source === "repo");

// id -> section title, straight from the bank (no arithmetic guessing)
const sectionOfId = new Map();
for (const s of repoSections) for (const q of s.questions) sectionOfId.set(q.id, s.title);

// Fallback for original authoring keys (1001xxx etc.): prefix -> section title.
// Longest prefixes first so 10011x wins over 1001x.
const PREFIX_SECTION = [
  ["10014", "Behavioral and Scenario-Based Questions"],
  ["10013", "Coding and Practical Implementation"],
  ["10012", "AI Infrastructure and Scalability"],
  ["10011", "Multimodal AI"],
  ["1001", "LLM Fundamentals"],
  ["1002", "Prompt Engineering"],
  ["1003", "Retrieval-Augmented Generation (RAG)"],
  ["1004", "AI Agents and Agentic Systems"],
  ["1005", "Fine-Tuning and Model Adaptation"],
  ["1006", "Vector Databases and Embeddings"],
  ["1007", "AI System Design"],
  ["1008", "LLMOps and Production AI"],
  ["1009", "Evaluation and Testing"],
];
// These Evaluation-prefixed keys are actually Safety topics
const SAFETY_KEYS = new Set(["1009006", "1009007", "1009008", "1009009", "1009010"]);
const safetyTitle = repoSections.find((s) => /Safety/i.test(s.title))?.title;
function sectionForKey(key) {
  if (sectionOfId.has(key)) return sectionOfId.get(key);
  if (SAFETY_KEYS.has(key)) return safetyTitle;
  const pre = PREFIX_SECTION.find(([p]) => key.startsWith(p));
  return pre?.[1];
}

const STOP = new Set(
  "a an and are as at be by for from has have how i in is it its of on or that the this to was what when where which who why will with vs do does did not you your we they he she can could should would about into over between more most other some such only own same than too very if".split(" ")
);
function toks(t) {
  return t.toLowerCase().replace(/√/g, "sqrt ").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
function bigrams(arr) {
  const s = new Set();
  for (let i = 0; i < arr.length - 1; i++) s.add(arr[i] + "_" + arr[i + 1]);
  return s;
}

const pools = new Map();
for (const s of repoSections) {
  pools.set(
    s.title,
    s.questions.map((q) => ({ id: q.id, text: q.text, toks: toks(q.text), bg: bigrams(toks(q.text)) }))
  );
}
const idfBySection = new Map();
for (const [title, pool] of pools) {
  const df = {};
  for (const q of pool) for (const t of new Set(q.toks)) df[t] = (df[t] || 0) + 1;
  const n = pool.length;
  idfBySection.set(title, Object.fromEntries(Object.entries(df).map(([t, c]) => [t, Math.log(1 + n / c)])));
}

const candidates = [];
for (const [key, text] of Object.entries(answers)) {
  const sectionTitle = sectionForKey(key);
  if (!sectionTitle || !pools.has(sectionTitle)) {
    console.error("UNKNOWN question id / section for key:", key);
    continue;
  }
  const pool = pools.get(sectionTitle);
  const idf = idfBySection.get(sectionTitle);
  const atoks = toks(text);
  const aset = new Set(atoks);
  const abg = bigrams(atoks);
  for (const q of pool) {
    let termScore = 0;
    for (const t of q.toks) if (aset.has(t)) termScore += idf[t] || 0.5;
    termScore /= Math.sqrt(q.toks.length);
    let bg = 0;
    for (const b of q.bg) if (abg.has(b)) bg += 1;
    bg /= Math.sqrt(Math.max(1, q.bg.length));
    candidates.push({ from: key, to: q.id, qtext: q.text, score: termScore + 0.8 * bg });
  }
}
candidates.sort((a, b) => b.score - a.score);

const newHome = new Map(); // oldKey -> newId
const takenQ = new Set();
const takenK = new Set();
for (const c of candidates) {
  if (takenK.has(c.from) || takenQ.has(c.to)) continue;
  // only move if clearly better than staying put
  takenK.add(c.from);
  takenQ.add(c.to);
  newHome.set(c.from, c.to);
}

const out = {};
for (const [key, text] of Object.entries(answers)) out[newHome.get(key) || key] = text;

const ids = new Set(bank.sections.flatMap((s) => s.questions.map((q) => q.id)));
const bad = Object.keys(out).filter((k) => !ids.has(k));
const moved = [...newHome.entries()].filter(([k, v]) => k !== v);
console.log(`answers: ${N} -> assigned: ${Object.keys(out).length}, moved: ${moved.length}, bad ids: ${bad.length}`);
if (bad.length || Object.keys(out).length !== N) {
  console.error("ABORT: not writing file — incomplete mapping.");
  process.exit(1);
}
writeFileSync("src/data/answers-ai.json", JSON.stringify(out, null, 1));
console.log("written. sample moves:");
moved.slice(0, 10).forEach(([k, v]) => console.log(`  ${k} -> ${v}  ${sectionOfId.get(v)}: ${bank.sections.flatMap(s=>s.questions).find(q=>q.id===v).text.slice(0,60)}`));
