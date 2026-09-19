import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("questionbank-raw.txt", "latin1");

// Build line list, tracking which lines are at the top of a PDF page.
const SKIP_EXACT = new Set([
  "Master Data Scientist Interview Question Bank",
  "Sumit Sir Notes",
  // Known sub-headers that would otherwise be mistaken for answer prose
  "Python OOP",
  "Core Python",
  "SQL Fundamentals",
  "SQL Interview Problems",
]);

const lines = [];
for (const page of src.split("\f")) {
  let first = true;
  for (const rawLine of page.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    lines.push({ text: line, pageTop: first });
    first = false;
  }
}

const sections = [];
let current = null;
let lastSectionNum = 0;
let lastQuestionNum = 0;
let lastGlobalQ = 0; // never reset: detects numbering restart (section 47)

const SECTION_RE = /^(\d{1,2})\. (.+)$/;
const isLikelyTitle = (t) =>
  t.length >= 3 &&
  t.length <= 60 &&
  /^[A-Z0-9]/.test(t) &&
  !t.endsWith("?") &&
  !t.endsWith(".") &&
  !t.endsWith(":") &&
  !t.endsWith(",") &&
  !t.endsWith(":");

for (let i = 0; i < lines.length; i++) {
  const { text: line, pageTop } = lines[i];
  if (SKIP_EXACT.has(line)) continue;

  const m = line.match(SECTION_RE);
  if (m) {
    const num = parseInt(m[1], 10);
    const title = m[2].trim();
    // Section headers: strictly increasing, small numbers, title-like text.
    if (
      num > lastSectionNum &&
      num <= 50 &&
      num - lastSectionNum <= 2 &&
      isLikelyTitle(title)
    ) {
      current = {
        id: num,
        title,
        intro: null,
        questions: [],
      };
      sections.push(current);
      lastSectionNum = num;
      lastQuestionNum = 0;
      continue;
    }
  }

  if (!current) continue;

  // Section intro: prose directly after the header, before any question.
  // Must not start with a digit (3-digit question numbers fail SECTION_RE
  // and would otherwise be swallowed here), and must read like prose.
  if (
    current.questions.length === 0 &&
    current.intro === null &&
    !/^\d/.test(line) &&
    line.length >= 30 &&
    line.includes(" ")
  ) {
    current.intro = line;
    continue;
  }

  const qm = line.match(/^(\d+)\.\s*(.*)$/);
  if (qm) {
    const num = parseInt(qm[1], 10);
    let text = qm[2].trim();
    // Continuation: question text wrapped onto the next line
    if (!text && i + 1 < lines.length) {
      const nxt = lines[i + 1].text;
      if (!/^\d+\.\s/.test(nxt)) {
        text = nxt;
        i++;
      }
    }
    // Last section restarts numbering; make ids unique
    let id;
    if (num <= lastGlobalQ) {
      id = `s${current.id}-${num}`;
    } else {
      id = String(num);
      lastGlobalQ = num;
    }
    current.questions.push({ id, num, text, note: null });
    lastQuestionNum = num;
    continue;
  }

  // Prose handling:
  //  - lowercase start = wrapped question text (PDF line break) -> append
  //  - otherwise = note attached to the most recent question, but skip short
  //    title-like lines at the top of a page (leftover page headers)
  const q = current.questions[current.questions.length - 1];
  if (q && /^[a-z]/.test(line)) {
    // Lowercase line: a wrapped question only if the question text looks
    // incomplete (no terminal punctuation). Otherwise it continues/starts
    // the note prose for this question.
    const incomplete = !/[.?!]$/.test(q.text) || q.text.length < 25;
    if (incomplete && q.note === null) {
      q.text = `${q.text} ${line}`;
    } else {
      q.note = q.note ? `${q.note} ${line}` : line;
    }
    continue;
  }
  if (pageTop && line.length <= 40 && !/[.?!:]$/.test(line)) continue;
  if (q) {
    q.note = q.note ? `${q.note} ${line}` : line;
  }
}

for (const s of sections) {
  if (s.questions.length === 0) {
    console.warn(`[warn] section #${s.id} ${s.title} has no questions`);
  }
}

const totalQ = sections.reduce((n, s) => n + s.questions.length, 0);
const totalN = sections.reduce(
  (n, s) => n + s.questions.filter((q) => q.note).length,
  0
);

mkdirSync("src/data", { recursive: true });
writeFileSync(
  "src/data/questions.json",
  JSON.stringify({ title: "Master Data Scientist Interview Question Bank", sections }, null, 1)
);

console.log(`Parsed ${sections.length} sections, ${totalQ} questions, ${totalN} with notes.`);
for (const s of sections) {
  console.log(
    `${String(s.id).padStart(2)}. ${s.title.padEnd(50)} ${String(s.questions.length).padStart(3)} q  [${s.questions[0]?.id}…${s.questions[s.questions.length - 1]?.id}]`
  );
}
