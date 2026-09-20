// ============================================================
// DS Galaxy — AI Engineering demos (registered into visuals.js)
// ============================================================
import { registerVisual, TAU, grid, points, xy, axes, label } from "./visuals.js";

function ticker(canvas, draw) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  let raf = 0, stop = false;
  const t0 = performance.now();
  (function frame() {
    if (stop) return;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, (performance.now() - t0) / 1000);
    raf = requestAnimationFrame(frame);
  })();
  return { stop() { stop = true; cancelAnimationFrame(raf); } };
}

// 1. TOKENIZATION — text becomes tokens becomes numbers
registerVisual("llm-tokens", {
  title: "Tokens & Next-Token Prediction",
  note: "An LLM reads text as tokens and repeatedly predicts the most likely next one — that's all generation is.",
  build(canvas) {
    const seq = ["The", "cat", "sat", "on", "the", "mat", "."];
    const cands = [["mat", 0.54], ["floor", 0.22], ["roof", 0.11], ["table", 0.07], ["moon", 0.03]];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const upto = 1 + (Math.floor(t * 1.1) % seq.length);
      seq.slice(0, upto).forEach((tk, i) => {
        ctx.fillStyle = "rgba(142,162,255,0.7)";
        ctx.beginPath(); ctx.roundRect(24 + i * 78, h * 0.22, 70, 32, 7); ctx.fill();
        label(ctx, tk, 24 + i * 78 + 35, h * 0.22 + 20, "#fff", "center");
        label(ctx, `#${1013 + i * 37}`, 24 + i * 78 + 35, h * 0.22 - 6, "rgba(200,215,255,0.5)", "center");
      });
      const nx = 24 + upto * 78;
      if (nx < w - 90) {
        ctx.fillStyle = "rgba(255,209,102,0.9)";
        ctx.beginPath(); ctx.roundRect(nx, h * 0.22, 70, 32, 7); ctx.fill();
        label(ctx, "?", nx + 35, h * 0.22 + 21, "#0a0e1e", "center");
        const phase = (t % 2.6) / 2.6;
        cands.forEach(([c, p], i) => {
          const on = phase > 0.25 + i * 0.09;
          const by = h * 0.62 + i * 30;
          ctx.fillStyle = on ? (i === 0 ? "rgba(74,222,128,0.85)" : "rgba(108,140,255,0.4)") : "rgba(120,140,255,0.12)";
          ctx.fillRect(w * 0.42, by - 12, p * (w * 0.5), 22);
          label(ctx, `${c}  ${(p * 100).toFixed(0)}%`, w * 0.42 + 8, by + 3, on ? "#fff" : "rgba(220,228,255,0.35)");
        });
        label(ctx, "P(next token | everything so far)", w * 0.42, h * 0.62 - 24, "#ffd166");
      }
      label(ctx, "subword tokens: 'unbelievable' → 'un' + 'believ' + 'able'", w / 2, h - 12, "rgba(220,228,255,0.6)", "center");
    });
  },
});

// 2. LLM TRAINING — pretrain → SFT → RLHF
registerVisual("llm-training", {
  title: "How LLMs Are Trained",
  note: "Three stages: pretrain on the internet, supervised fine-tuning on demos, RLHF on human preferences.",
  build(canvas) {
    const stages = [
      { n: "1 · Pretraining", d: "predict next token on trillions of tokens — learns language + facts", c: "#8ea2ff" },
      { n: "2 · SFT", d: "fine-tune on curated question→answer demos — learns to follow instructions", c: "#4ade80" },
      { n: "3 · RLHF / DPO", d: "humans rank outputs; the model is nudged toward preferred replies", c: "#ffd166" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const stage = Math.min(3, Math.floor(t / 2) + 1);
      stages.forEach((s, i) => {
        const on = stage > i;
        const x = 40 + i * ((w - 120) / 3), bw = (w - 160) / 3;
        ctx.fillStyle = on ? s.c : "rgba(120,140,255,0.1)";
        ctx.globalAlpha = on ? 0.8 : 1;
        ctx.beginPath(); ctx.roundRect(x, h * 0.3, bw, 84, 10); ctx.fill();
        ctx.globalAlpha = 1;
        label(ctx, s.n, x + bw / 2, h * 0.3 + 30, on ? "#0a0e1e" : "rgba(220,228,255,0.4)", "center");
        ctx.font = "10px Inter, sans-serif";
        // wrap description
        const words = s.d.split(" ");
        let line = "", ly = h * 0.3 + 48;
        words.forEach((wd) => {
          if ((line + wd).length > 24) { label(ctx, line, x + bw / 2, ly, on ? "rgba(10,14,30,0.85)" : "rgba(220,228,255,0.35)", "center"); line = ""; ly += 13; }
          line += wd + " ";
        });
        label(ctx, line, x + bw / 2, ly, on ? "rgba(10,14,30,0.85)" : "rgba(220,228,255,0.35)", "center");
        if (i < 2 && on) label(ctx, "→", x + bw + 12, h * 0.3 + 44, "#ffd166", "center");
      });
      label(ctx, stage >= 3 ? "result: a helpful assistant, not just an autocomplete" : `stage ${Math.min(stage, 3)} / 3…`, w / 2, h - 20, "#ffd166", "center");
    });
  },
});

// 3. TEMPERATURE — sampling randomness
registerVisual("temperature", {
  title: "Temperature & Sampling",
  note: "Temperature reshapes the probability distribution: 0 = always the safest token, high = creative chaos.",
  build(canvas) {
    const toks = ["delicious", "tasty", "yummy", "scrumptious", "purple"];
    const base = [0.55, 0.25, 0.12, 0.06, 0.02];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const temp = 0.2 + ((Math.sin(t * 0.5) + 1) / 2) * 1.8;
      const scaled = base.map((p) => Math.pow(p, 1 / temp));
      const Z = scaled.reduce((a, b) => a + b, 0);
      label(ctx, `temperature = ${temp.toFixed(2)}`, w / 2, 24, "#ffd166", "center");
      scaled.forEach((s, i) => {
        const p = s / Z, y = 52 + i * 40;
        ctx.fillStyle = i === 0 ? "rgba(74,222,128,0.85)" : "rgba(108,140,255,0.45)";
        ctx.fillRect(60, y, p * (w - 140), 26);
        label(ctx, toks[i], 56, y + 17, "rgba(235,240,255,0.9)", "right");
        label(ctx, `${(p * 100).toFixed(1)}%`, 66 + p * (w - 140), y + 17, "#fff");
      });
      label(ctx, temp < 0.6 ? "focused & predictable — good for facts, code, extraction" : temp > 1.4 ? "wild & creative — more mistakes, more surprise" : "balanced — general chat territory", w / 2, h - 14, "#ffd166", "center");
    });
  },
});

// 4. CONTEXT WINDOW — a finite budget
registerVisual("context-window", {
  title: "Context Windows",
  note: "The model can only attend to what fits in its window — old messages fall out, not 'forgotten' but absent.",
  build(canvas) {
    const turns = ["sys", "u1", "a1", "u2", "a2", "u3", "a3", "u4"];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const shift = Math.floor(t / 1.6) % 4;
      const bw = (w - 120) / 8;
      label(ctx, "context window", 30, h * 0.30, "#ffd166");
      ctx.strokeStyle = "rgba(255,209,102,0.7)"; ctx.lineWidth = 2;
      ctx.strokeRect(30, h * 0.34, w - 60, 64);
      turns.slice(shift).forEach((tk, i) => {
        const inWin = i < 6;
        const x = 40 + i * bw;
        ctx.fillStyle = tk === "sys" ? "rgba(142,162,255,0.7)" : tk[0] === "u" ? "rgba(74,222,128,0.6)" : "rgba(108,140,255,0.6)";
        ctx.globalAlpha = inWin ? 1 : 0.22;
        ctx.beginPath(); ctx.roundRect(x, h * 0.38, bw - 6, 56, 7); ctx.fill();
        ctx.globalAlpha = 1;
        label(ctx, tk, x + (bw - 6) / 2, h * 0.38 + 32, "#fff", "center");
        if (!inWin) { label(ctx, "✕", x + (bw - 6) / 2, h * 0.38 + 18, "#ff6b8b", "center"); }
      });
      const win = turns.slice(shift, shift + 6).join(" ");
      label(ctx, `model sees: [ ${win} ]`, w / 2, h * 0.62, "rgba(235,240,255,0.85)", "center");
      label(ctx, shift > 0 ? "earliest turn left the window — the model literally cannot see it" : "everything still fits…", w / 2, h - 20, shift > 0 ? "#ff6b8b" : "#4ade80", "center");
    });
  },
});

// 5. PROMPTING PATTERNS — zero-shot / few-shot / CoT
registerVisual("prompting", {
  title: "Prompting Patterns",
  note: "Same model, different prompts, wildly different results: examples and reasoning steps are leverage.",
  build(canvas) {
    const modes = [
      { n: "Zero-shot", d: ["Classify: 'Great phone!'"], res: "→ sentiment: positive", c: "#8ea2ff" },
      { n: "Few-shot", d: ["'Broke in a day' → negative", "'Worth every rupee' → positive", "Classify: 'Great phone!'"], res: "→ sentiment: positive (confident)", c: "#4ade80" },
      { n: "Chain-of-thought", d: ["Think step by step:", "1) 'great' is praise…"], res: "→ positive, with reasoning shown", c: "#ffd166" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const mi = Math.floor(t / 2.4) % 3;
      modes.forEach((m, i) => {
        const x = 36 + i * ((w - 100) / 3), bw = (w - 140) / 3;
        const on = i === mi;
        ctx.strokeStyle = on ? m.c : "rgba(120,140,255,0.25)"; ctx.lineWidth = on ? 2 : 1;
        ctx.strokeRect(x, h * 0.2, bw, h * 0.55);
        label(ctx, m.n, x + bw / 2, h * 0.2 + 22, on ? m.c : "rgba(220,228,255,0.5)", "center");
        m.d.forEach((dd, j) => {
          ctx.fillStyle = on ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
          ctx.beginPath(); ctx.roundRect(x + 10, h * 0.2 + 36 + j * 40, bw - 20, 32, 6); ctx.fill();
          label(ctx, dd, x + 18, h * 0.2 + 56 + j * 40, on ? "rgba(235,240,255,0.9)" : "rgba(220,228,255,0.35)");
        });
        if (on) {
          ctx.fillStyle = "rgba(74,222,128,0.18)";
          ctx.beginPath(); ctx.roundRect(x + 10, h * 0.2 + h * 0.55 - 44, bw - 20, 32, 6); ctx.fill();
          label(ctx, m.res, x + bw / 2, h * 0.2 + h * 0.55 - 24, "#4ade80", "center");
        }
      });
      label(ctx, "few-shot = show examples · CoT = ask for reasoning steps · system prompts set the rules", w / 2, h - 14, "rgba(220,228,255,0.65)", "center");
    });
  },
});

// 6. AGENTS — the think → act → observe loop
registerVisual("agents", {
  title: "AI Agents & Tool Use",
  note: "An agent loops: reason about the goal, call a tool, read the result, repeat until done.",
  build(canvas) {
    const loop = ["🧠 Think", "🔧 Act (tool call)", "👁 Observe result"];
    const trace = ["Need today's weather → call weather()",
      "Got: '28°C, sunny' → user asked in °F → call convert()",
      "Got: '82°F' → enough to answer ✔"];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cx = w / 2, cy = h * 0.42, R = 62;
      const phase = Math.floor(t * 1.2) % 3;
      const angs = [-Math.PI / 2, Math.PI / 6, Math.PI - Math.PI / 6];
      angs.forEach((a, i) => {
        const x = cx + Math.cos(a) * R * 1.5, y = cy + Math.sin(a) * R * 0.9;
        const on = i === phase;
        ctx.beginPath(); ctx.arc(x, y, on ? 26 : 20, 0, TAU);
        ctx.fillStyle = on ? "rgba(255,209,102,0.9)" : "rgba(120,140,255,0.25)"; ctx.fill();
        label(ctx, loop[i], x, y + 4, on ? "#0a0e1e" : "rgba(220,228,255,0.6)", "center");
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, TAU);
        ctx.strokeStyle = "rgba(255,209,102,0.25)"; ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      });
      label(ctx, "AGENT", cx, cy - 4, "#ffd166", "center");
      label(ctx, "LLM + loop + tools", cx, cy + 12, "rgba(220,228,255,0.6)", "center");
      trace.forEach((tr, i) => {
        const on = phase >= i;
        label(ctx, tr, 24, h - 52 + i * 17, on ? "rgba(74,222,128,0.9)" : "rgba(220,228,255,0.3)");
      });
      label(ctx, "tools = search, code, DB, APIs — the model decides when and how to call them", w / 2, h - 10, "rgba(220,228,255,0.6)", "center");
    });
  },
});

// 7. AI EVALS — grading model outputs systematically
registerVisual("ai-evals", {
  title: "Evals: Testing AI Systems",
  note: "A golden dataset + automatic grading = regression tests for prompts. Ship changes with confidence.",
  build(canvas) {
    const rows = [
      { q: "refund in 10 days?", exp: "30 days", got: "30 days", ok: true },
      { q: "shipping to Alaska?", exp: "5–7 days", got: "3–5 days", ok: false },
      { q: "warranty length?", exp: "12 months", got: "12 months", ok: true },
      { q: "return fee?", exp: "free", got: "free", ok: true },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      label(ctx, "golden set (questions + expected answers)", 24, 24, "#8ea2ff");
      let pass = 0;
      rows.forEach((r, i) => {
        const on = t > 0.8 + i * 0.8;
        if (on && r.ok) pass++;
        const y = 44 + i * 44;
        ctx.fillStyle = !on ? "rgba(255,255,255,0.04)" : r.ok ? "rgba(74,222,128,0.14)" : "rgba(255,107,139,0.16)";
        ctx.beginPath(); ctx.roundRect(24, y - 14, w - 48, 36, 8); ctx.fill();
        label(ctx, r.q, 38, y + 8, on ? "rgba(235,240,255,0.9)" : "rgba(220,228,255,0.3)");
        label(ctx, `expected: ${r.exp}`, w * 0.52, y + 8, on ? "rgba(200,215,255,0.7)" : "rgba(220,228,255,0.25)");
        label(ctx, `got: ${r.got}`, w * 0.72, y + 8, on ? (r.ok ? "#4ade80" : "#ff6b8b") : "rgba(220,228,255,0.25)");
        if (on) label(ctx, r.ok ? "✓ pass" : "✗ FAIL", w - 40, y + 8, r.ok ? "#4ade80" : "#ff6b8b", "right");
      });
      const shown = Math.min(rows.length, Math.floor(Math.max(0, t - 0.8) / 0.8) + 1);
      label(ctx, `score: ${Math.min(pass, shown)} / ${shown} — every prompt change reruns the suite`, w / 2, h - 12, "#ffd166", "center");
    });
  },
});

// 8. LLMOPS — from notebook to production loop
registerVisual("mlops", {
  title: "LLMOps: Shipping AI",
  note: "Production AI is a loop: version prompts, monitor drift and cost, cache, and feed failures back.",
  build(canvas) {
    const nodes = [
      { n: "App / users", c: "#8ea2ff" }, { n: "Cache", c: "#a78bfa" },
      { n: "Model API", c: "#4ade80" }, { n: "Logs & metrics", c: "#ffd166" },
      { n: "Eval + improve", c: "#ff6b8b" },
    ];
    const pos = nodes.map((_, i) => {
      const a = -Math.PI / 2 + (i / nodes.length) * TAU;
      return [w / 2 + Math.cos(a) * w * 0.30, h * 0.52 + Math.sin(a) * h * 0.30];
    });
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      pos.forEach(([x, y], i) => {
        const [x2, y2] = pos[(i + 1) % pos.length];
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(200,215,255,0.3)"; ctx.lineWidth = 1.4; ctx.stroke();
        // moving dot along the edge
        const p = (t * 0.5 + i / pos.length) % 1;
        ctx.beginPath(); ctx.arc(x + (x2 - x) * p, y + (y2 - y) * p, 3.4, 0, TAU);
        ctx.fillStyle = "#ffd166"; ctx.fill();
      });
      nodes.forEach((nd, i) => {
        const [x, y] = pos[i];
        ctx.beginPath(); ctx.arc(x, y, 24, 0, TAU);
        ctx.fillStyle = "rgba(10,14,32,0.95)"; ctx.fill();
        ctx.strokeStyle = nd.c; ctx.lineWidth = 2; ctx.stroke();
        label(ctx, nd.n, x, y + 4, nd.c, "center");
      });
      label(ctx, "monitor: latency · cost per request · hallucination rate · user thumbs-down", w / 2, h - 14, "#ffd166", "center");
    });
  },
});
