// ============================================================
// DS Galaxy — Learning Galaxies engine. Renders any curriculum
// (ML, Maths&Stats, RAG, Deep Learning, AI) as a constellation
// map where every lesson opens a live animated demo.
// Hyperspace warp in and out; full back navigation everywhere.
// ============================================================

import { mountVisual } from "./visuals.js";
import "./visuals-maths.js";
import "./visuals-rag.js";
import "./visuals-dl.js";
import "./visuals-ai.js";
import { ML } from "./curriculum-ml.js";
import { MATHS, RAG } from "./curriculum-extra.js";
import { DL, AI } from "./curriculum-extra2.js";

export const GALAXIES = [ML, MATHS, RAG, DL, AI];

function flatten(g) {
  const lessons = [];
  const ringOf = [];
  g.rings.forEach((r, ri) =>
    r.lessons.forEach((L) => {
      lessons.push(L);
      ringOf.push(ri);
    })
  );
  return { lessons, ringOf };
}

const FLAT = new Map(GALAXIES.map((g) => [g.id, flatten(g)]));

// ---------- state ----------
let overlay, warpCv, home, mapCv, lessonEl;
let warpStop = null, mapStop = null, demoStop = null;
let cur = GALAXIES[0]; // current galaxy config
let flat = FLAT.get(cur.id);
let curLesson = 0, view = "home", entered = false;

function storeKey() {
  return `dsgalaxy.gal.${cur.id}.done`;
}
function doneSet() {
  try {
    const raw = localStorage.getItem(storeKey());
    if (raw !== null) return new Set(JSON.parse(raw));
    // legacy migration: ML progress saved under the old key
    if (cur.id === "ml") {
      const legacy = localStorage.getItem("dsgalaxy.ml.done");
      if (legacy) return new Set(JSON.parse(legacy));
    }
  } catch { /* ignore */ }
  return new Set();
}
function saveDone(set) {
  localStorage.setItem(storeKey(), JSON.stringify([...set]));
}
function progressCount() {
  const done = doneSet();
  let n = 0;
  flat.lessons.forEach((l) => { if (done.has(l.demo)) n++; });
  return n;
}

// ---------- hyperspace warp (wall-clock based) ----------
const WARP_MS = 2400;
function runWarp(cb) {
  const ctx = warpCv.getContext("2d");
  const w = (warpCv.width = innerWidth);
  const h = (warpCv.height = innerHeight);
  const stars = Array.from({ length: 260 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: Math.random() * Math.max(w, h) * 0.6,
    s: 0.4 + Math.random() * 1.2,
  }));
  const t0 = performance.now();
  let raf = 0, iv = 0, finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearInterval(iv);
    warpStop = null;
    cb && cb();
  }

  function frame() {
    if (finished) return;
    const p = Math.min(1, (performance.now() - t0) / WARP_MS);
    const speed = p < 0.62 ? p / 0.62 : Math.max(0, 1 - (p - 0.62) / 0.38);
    ctx.fillStyle = `rgba(2,4,14,${p < 0.62 ? 0.35 : 0.22})`;
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (const st of stars) {
      const r0 = st.r;
      st.r += st.s * speed * 26;
      if (st.r > Math.max(w, h) * 0.75) { st.r = Math.random() * 40; st.a = Math.random() * Math.PI * 2; }
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(st.a) * r0, cy + Math.sin(st.a) * r0);
      ctx.lineTo(cx + Math.cos(st.a) * st.r, cy + Math.sin(st.a) * st.r);
      ctx.strokeStyle = `rgba(190,205,255,${0.15 + speed * 0.75})`;
      ctx.lineWidth = st.s * (0.6 + speed * 2.2);
      ctx.stroke();
    }
    if (p >= 0.64 && p < 0.7) {
      ctx.fillStyle = "rgba(235,240,255,0.85)";
      ctx.fillRect(0, 0, w, h);
    }
    if (p >= 1) finish();
    else raf = requestAnimationFrame(frame);
  }
  frame();
  iv = setInterval(frame, 90); // safety net when rAF is throttled
  warpStop = () => { finished = true; cancelAnimationFrame(raf); clearInterval(iv); };
}

// ---------- galaxy map ----------
function mapDims() {
  const rect = mapCv.getBoundingClientRect();
  return { W: rect.width, H: rect.height };
}

function ringFractions() {
  const n = cur.rings.length;
  return cur.rings.map((_, i) => 0.16 + (n === 1 ? 0 : (i * 0.28) / (n - 1)));
}

function nodePositions() {
  const { W, H } = mapDims();
  const cx = W / 2, cy = H / 2;
  const fr = ringFractions();
  const out = [];
  let idx = 0;
  cur.rings.forEach((ring, ri) => {
    const count = ring.lessons.length;
    const rot = -Math.PI / 2 + ri * 0.5;
    for (let i = 0; i < count; i++) {
      const a = rot + (i / count) * Math.PI * 2;
      out.push({
        idx: idx++,
        x: cx + Math.cos(a) * Math.min(W, H) * fr[ri],
        y: cy + Math.sin(a) * Math.min(W, H) * fr[ri],
        ring: ri,
      });
    }
  });
  return out;
}

function drawMap() {
  const ctx = mapCv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const { W, H } = mapDims();
  if (mapCv.width !== Math.round(W * dpr)) {
    mapCv.width = Math.round(W * dpr); mapCv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const done = doneSet();
  const nodes = nodePositions();
  const cx = W / 2, cy = H / 2;

  function frame() {
    const t = performance.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    // background stars
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 97) % W), sy = ((i * 53) % H);
      const tw = 0.25 + 0.2 * Math.sin(t * 2 + i);
      ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,255,${tw})`; ctx.fill();
    }
    // rings
    ringFractions().forEach((f) => {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.min(W, H) * f, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,140,255,0.14)";
      ctx.lineWidth = 1; ctx.stroke();
    });
    // connecting path
    ctx.beginPath();
    nodes.forEach((n, i) => (i ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y)));
    ctx.strokeStyle = "rgba(160,175,255,0.25)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
    // nodes
    const R = Math.max(13, Math.min(W, H) * (0.052 - 0.004 * flat.lessons.length / 10));
    nodes.forEach((n) => {
      const L = flat.lessons[n.idx];
      const isDone = done.has(L.demo);
      const isCur = n.idx === curLesson;
      const pulse = isCur ? 3 * Math.sin(t * 3) : 0;
      const glow = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, R * 2.4);
      glow.addColorStop(0, isDone ? "rgba(255,209,102,0.35)" : isCur ? "rgba(74,222,128,0.4)" : "rgba(108,140,255,0.22)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(n.x, n.y, R * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, R + pulse, 0, Math.PI * 2);
      ctx.fillStyle = isDone ? "#ffd166" : isCur ? "#4ade80" : "#24304f";
      ctx.fill();
      ctx.strokeStyle = isDone ? "#ffd166" : isCur ? "#4ade80" : "rgba(160,175,255,0.55)";
      ctx.lineWidth = isCur ? 2.5 : 1.4; ctx.stroke();
      ctx.fillStyle = isDone ? "#241a02" : "rgba(235,240,255,0.92)";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(n.idx + 1), n.x, n.y + 4);
      if (isDone) {
        ctx.fillStyle = "#241a02";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("✓", n.x + R - 2, n.y - R + 6);
      }
    });
    // center sun + ring labels
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    const sg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 18);
    sg.addColorStop(0, "#fff"); sg.addColorStop(1, "rgba(255,209,102,0)");
    ctx.fillStyle = sg; ctx.fill();
    ringFractions().forEach((f, i) => {
      ctx.fillStyle = "rgba(200,215,255,0.4)";
      ctx.textAlign = "center";
      ctx.fillText(cur.rings[i].label, cx, cy - Math.min(W, H) * f - 6);
    });
    mapStop = requestAnimationFrame(frame);
  }
  if (mapStop) cancelAnimationFrame(mapStop);
  frame();
}

function hitNode(ev) {
  const rect = mapCv.getBoundingClientRect();
  const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
  const { W, H } = mapDims();
  const R = Math.max(13, Math.min(W, H) * 0.045) + 8;
  let best = null, bd = R;
  for (const n of nodePositions()) {
    const d = Math.hypot(n.x - mx, n.y - my);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// ---------- lesson view ----------
function openLesson(idx) {
  curLesson = idx;
  const L = flat.lessons[idx];
  view = "lesson";
  home.style.display = "none";
  lessonEl.style.display = "flex";
  lessonEl.querySelector("#ml-tag").textContent = cur.rings[flat.ringOf[idx]].label;
  lessonEl.querySelector("#ml-title").textContent = `${idx + 1}. ${L.title}`;
  const box = lessonEl.querySelector("#ml-demo");
  box.innerHTML = "";
  if (demoStop) { try { demoStop.stop?.(); } catch { /* noop */ } demoStop = null; }
  const card = document.createElement("div");
  card.className = "vsl-card";
  box.appendChild(card);
  const inst = mountVisual(card, L.demo);
  demoStop = inst && typeof inst.stop === "function" ? inst : null;
  lessonEl.querySelector("#ml-blurb").textContent = L.blurb;
  const ul = lessonEl.querySelector("#ml-points");
  ul.innerHTML = "";
  L.points.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    ul.appendChild(li);
  });
  lessonEl.querySelector("#ml-interview").textContent = L.interview;
  lessonEl.querySelector("#ml-count").textContent = `${idx + 1} / ${flat.lessons.length}`;
  const done = doneSet();
  done.add(L.demo);
  saveDone(done);
  const prev = lessonEl.querySelector("#ml-prev");
  const next = lessonEl.querySelector("#ml-next");
  prev.disabled = idx === 0;
  next.textContent = idx === flat.lessons.length - 1 ? "Finish ✓" : "Next lesson";
  next.disabled = false;
}

function backToMap() {
  view = "home";
  if (demoStop) { try { demoStop.stop?.(); } catch { /* noop */ } demoStop = null; }
  lessonEl.style.display = "none";
  home.style.display = "flex";
  updateHeader();
  drawMap();
}

function updateHeader() {
  const p = progressCount();
  home.querySelector("#ml-galaxy-name").textContent = cur.name;
  home.querySelector("#ml-tagline").textContent = cur.tagline;
  home.querySelector("#ml-progress").textContent =
    `${p} of ${flat.lessons.length} mastered — keep going, the galaxy lights up as you learn`;
  const list = home.querySelector("#ml-list");
  list.innerHTML = "";
  flat.lessons.forEach((L, i) => {
    const b = document.createElement("button");
    b.className = "chip" + (doneSet().has(L.demo) ? " done" : "") + (i === curLesson ? " cur" : "");
    b.textContent = `${i + 1}. ${L.title}`;
    b.addEventListener("click", () => openLesson(i));
    list.appendChild(b);
  });
}

// ---------- open / close ----------
function configureGalaxy(g) {
  cur = g;
  flat = FLAT.get(g.id);
  curLesson = 0;
}

export function openGalaxy(id) {
  const g = GALAXIES.find((x) => x.id === id) || GALAXIES[0];
  if (!overlay) build();
  configureGalaxy(g);
  entered = true;
  overlay.style.display = "block";
  home.style.display = "none";
  lessonEl.style.display = "none";
  warpCv.style.display = "block";
  warpCv.style.opacity = "1";
  runWarp(() => {
    warpCv.style.transition = "opacity 0.5s";
    warpCv.style.opacity = "0";
    setTimeout(() => { warpCv.style.display = "none"; }, 520);
    view = "home";
    home.style.display = "flex";
    updateHeader();
    drawMap();
  });
}

export function closeGalaxy() {
  if (demoStop) { try { demoStop.stop?.(); } catch { /* noop */ } demoStop = null; }
  if (mapStop) { cancelAnimationFrame(mapStop); mapStop = null; }
  warpCv.style.display = "block";
  warpCv.style.opacity = "1";
  runWarp(() => {
    overlay.style.display = "none";
    warpCv.style.display = "none";
    entered = false;
  });
}

function build() {
  overlay = document.createElement("div");
  overlay.id = "mlgalaxy";
  overlay.innerHTML = `
    <canvas id="ml-warp"></canvas>
    <div id="ml-home">
      <button class="tbtn" id="ml-close">← Back to DS Galaxy</button>
      <div class="ml-head">
        <h2 id="ml-galaxy-name"></h2>
        <p id="ml-tagline"></p>
        <p id="ml-progress"></p>
      </div>
      <canvas id="ml-map"></canvas>
      <p class="ml-hint">Click any glowing lesson star — numbers follow the learning path. Gold stars are mastered.</p>
      <div id="ml-list"></div>
    </div>
    <div id="ml-lesson">
      <button class="tbtn" id="ml-back">← All lessons</button>
      <span class="tag" id="ml-tag">Lesson</span>
      <h3 id="ml-title"></h3>
      <div class="ml-scroll">
        <div id="ml-demo"></div>
        <p id="ml-blurb"></p>
        <div class="ml-cols">
          <div>
            <div class="ml-label">Key points</div>
            <ul id="ml-points"></ul>
          </div>
          <div>
            <div class="ml-label">Say it in an interview</div>
            <p id="ml-interview" class="ml-quote"></p>
          </div>
        </div>
        <div class="qnav">
          <button class="tbtn" id="ml-prev">Prev</button>
          <span class="qcount" id="ml-count"></span>
          <button class="tbtn" id="ml-next">Next lesson</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  warpCv = overlay.querySelector("#ml-warp");
  home = overlay.querySelector("#ml-home");
  mapCv = overlay.querySelector("#ml-map");
  lessonEl = overlay.querySelector("#ml-lesson");

  overlay.querySelector("#ml-close").addEventListener("click", closeGalaxy);
  overlay.querySelector("#ml-back").addEventListener("click", backToMap);
  overlay.querySelector("#ml-prev").addEventListener("click", () =>
    openLesson(Math.max(0, curLesson - 1)));
  overlay.querySelector("#ml-next").addEventListener("click", () => {
    if (curLesson === flat.lessons.length - 1) backToMap();
    else openLesson(Math.min(flat.lessons.length - 1, curLesson + 1));
  });
  mapCv.addEventListener("click", (e) => {
    const n = hitNode(e);
    if (n) openLesson(n.idx);
  });
  window.addEventListener("keydown", (e) => {
    if (!entered || overlay.style.display === "none") return;
    if (e.key === "Escape") (view === "lesson" ? backToMap : closeGalaxy)();
  });
  window.addEventListener("resize", () => {
    if (overlay.style.display !== "none" && view === "home") drawMap();
  });
}
