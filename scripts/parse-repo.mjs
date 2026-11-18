import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("ai-repo-raw.md", "utf8");
const lines = raw.split(/\r?\n/);

const SKIP_SECTIONS = new Set([
  "Table of Contents",
  "Must Know",
  "License",
  "Prepared and maintained by the **Founder** of [Outcome School](https://outcomeschool.com): Amit Shekhar",
  "Follow Amit Shekhar",
  "Follow Outcome School",
]);

// Markdown link/text cleanup
function clean(t) {
  return t
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [text](url) -> text
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

const repoSections = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  const h3 = line.match(/^### (.+)$/);
  if (h3) {
    const title = clean(h3[1]);
    if (SKIP_SECTIONS.has(title) || title.startsWith("Follow")) {
      current = null;
      continue;
    }
    current = { title, source: "AI Engineering Repo", questions: [] };
    repoSections.push(current);
    continue;
  }

  if (!current) continue;

  // Question: top-level bullet "- What is ...?"
  const qm = line.match(/^- (.+)$/);
  if (qm) {
    const text = clean(qm[1]);
    if (!text || /^(Prepared|Learn about|Follow)/.test(text)) continue;
    // Look ahead for an indented "- Answer: ..." line
    let answer = null;
    let link = null;
    if (i + 1 < lines.length) {
      const am = lines[i + 1].match(/^\s+- Answer: (.+)$/);
      if (am) {
        const lm = am[1].match(/\((https?:[^)]+)\)/);
        link = lm ? lm[1] : null;
        answer = clean(am[1]);
      }
    }
    current.questions.push({ text, answer, link });
  }
}

console.log(`Repo parse: ${repoSections.length} sections`);
let total = 0;
for (const s of repoSections) {
  total += s.questions.length;
  console.log(`  ${s.title.padEnd(48)} ${s.questions.length} q`);
}
console.log(`Total repo questions: ${total}`);

// ---------- Merge with existing galaxy dataset ----------
const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));

// Remap repo questions into galaxy format, continuing global ids
let nextId = 1056;
const OFFSET = 100000; // ids for repo questions to avoid collision
const mergedSections = repoSections.map((s, si) => ({
  id: 100 + si, // keep separate id space: 101..115
  title: s.title,
  intro: "From the AI Engineering Interview Questions repository (Outcome School).",
  source: "repo",
  questions: s.questions.map((q, qi) => ({
    id: String(OFFSET + (si + 1) * 1000 + qi + 1),
    num: qi + 1,
    text: q.text,
    note: q.answer && q.link ? `Reference: ${q.answer}` : q.answer || null,
    refLink: q.link || null,
  })),
}));

bank.sections.push(...mergedSections);
writeFileSync("src/data/questions.json", JSON.stringify(bank, null, 1));

const grand = bank.sections.reduce((n, s) => n + s.questions.length, 0);
console.log(
  `Merged: ${bank.sections.length} total sections, ${grand} total questions.`
);
