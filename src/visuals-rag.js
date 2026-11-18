// ============================================================
// DS Galaxy — RAG demos (registered into visuals.js)
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

function pill(ctx, text, x, y, color, align = "center") {
  ctx.font = "11px Inter, sans-serif";
  const tw = ctx.measureText(text).width + 14;
  const px = align === "center" ? x - tw / 2 : x;
  ctx.fillStyle = "rgba(10,14,32,0.85)";
  ctx.strokeStyle = color; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(px, y - 13, tw, 20, 9);
  ctx.fill(); ctx.stroke();
  label(ctx, text, px + tw / 2, y + 1, color, "center");
}

// 1. RAG PIPELINE — the whole flow, lit stage by stage
registerVisual("rag-pipeline", {
  title: "The RAG Pipeline",
  note: "Index time (top) vs query time (bottom): retrieve relevant chunks, stuff them into the prompt, generate.",
  build(canvas) {
    const stages = ["Documents", "→ Chunking", "→ Embeddings", "→ Vector DB"];
    const qstages = ["Query", "→ Embed", "→ Search top-k", "→ Augment prompt", "→ LLM ✦"];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const li = Math.floor(t * 1.1) % (stages.length + qstages.length);
      stages.forEach((s, i) => pill(ctx, s, 60 + i * ((w - 120) / 3), 40, i <= li ? "#8ea2ff" : "rgba(120,140,255,0.35)"));
      // arrows down
      ctx.beginPath(); ctx.moveTo(w * 0.85, 52); ctx.lineTo(w * 0.85, h - 88);
      ctx.strokeStyle = "rgba(255,209,102,0.5)"; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      pill(ctx, "vector store", w * 0.85, (52 + h - 88) / 2 + 24, "rgba(255,209,102,0.85)");
      qstages.forEach((s, i) => {
        const on = li >= stages.length + i;
        pill(ctx, s, 55 + i * ((w - 100) / 4), h - 62, on ? "#4ade80" : "rgba(74,222,128,0.3)");
      });
      label(ctx, "INDEXING (offline)", 20, 20, "rgba(200,215,255,0.5)");
      label(ctx, "RETRIEVAL + GENERATION (live)", 20, h - 88, "rgba(200,215,255,0.5)");
    });
  },
});

// 2. EMBEDDINGS — words with similar meaning cluster together
registerVisual("embeddings", {
  title: "Embeddings",
  note: "Text becomes vectors. Meaning becomes geometry: similar words sit close together.",
  build(canvas) {
    const words = [
      ["king", 0.72, 0.68, "#ffd166"], ["queen", 0.66, 0.78, "#ffd166"], ["prince", 0.78, 0.6, "#ffd166"],
      ["dog", 0.2, 0.3, "#4ade80"], ["puppy", 0.14, 0.4, "#4ade80"], ["cat", 0.3, 0.22, "#4ade80"],
      ["stock", 0.75, 0.2, "#ff6b8b"], ["market", 0.85, 0.28, "#ff6b8b"], ["bond", 0.68, 0.12, "#ff6b8b"],
      ["pizza", 0.35, 0.8, "#8ea2ff"], ["burger", 0.25, 0.86, "#8ea2ff"],
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const qi = Math.floor(t / 2) % 3; // which cluster the query probes
      const q = [["royal puppy?", 0.7, 0.72], ["cute pet?", 0.22, 0.32], ["finance news?", 0.78, 0.2]][qi];
      words.forEach(([wd, x, y, c]) => {
        ctx.beginPath(); ctx.arc(xy(x, w), h - 30 - y * (h - 60), 5, 0, TAU);
        ctx.fillStyle = c; ctx.fill();
        label(ctx, wd, xy(x, w), h - 30 - y * (h - 60) - 9, c, "center");
      });
      const qx = xy(q[1], w), qy = h - 30 - q[2] * (h - 60);
      const pulse = 8 + 5 * Math.sin(t * 3);
      ctx.beginPath(); ctx.arc(qx, qy, pulse + 4, 0, TAU);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      label(ctx, `query: "${q[0]}"`, qx, qy + 22, "#fff", "center");
      label(ctx, "distance in vector space ≈ similarity in meaning", w / 2, h - 8, "rgba(220,228,255,0.6)", "center");
    });
  },
});

// 3. CHUNKING — documents cut into overlapping pieces
registerVisual("chunking", {
  title: "Chunking & Overlap",
  note: "Docs are split into chunks (with overlap) so no answer is cut in half at a boundary.",
  build(canvas) {
    const words = "Retrieval Augmented Generation grounds an LLM in your data . Chunks carry metadata like page numbers . Overlap keeps sentences intact across boundaries .".split(" ");
    const CS = 6; // chunk size in words
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const nChunks = Math.min(4, Math.floor(t / 1.2) + 1);
      const cw = (w - 80) / CS - 2;
      for (let c = 0; c < nChunks; c++) {
        const y = 40 + c * 52;
        ctx.strokeStyle = c % 2 ? "rgba(255,209,102,0.8)" : "rgba(142,162,255,0.8)";
        ctx.strokeRect(40, y - 16, CS * (cw + 2) + 6, 40);
        label(ctx, `chunk ${c + 1}`, 40, y - 22, c % 2 ? "#ffd166" : "#8ea2ff");
        for (let j = 0; j < CS; j++) {
          const wi = c * (CS - 1) + j; // overlap of 1 word
          if (wi >= words.length) break;
          const isOverlap = (c > 0 && j === 0);
          ctx.fillStyle = isOverlap ? "rgba(255,107,139,0.85)" : "rgba(108,140,255,0.35)";
          ctx.fillRect(43 + j * (cw + 2), y - 12, cw, 32);
          label(ctx, words[wi], 43 + j * (cw + 2) + cw / 2, y + 9, "#fff", "center");
        }
      }
      label(ctx, "red word = overlap — the same idea lives in two chunks", w / 2, h - 10, "rgba(255,150,170,0.9)", "center");
    });
  },
});

// 4. COSINE SIMILARITY — query vs three docs
registerVisual("cosine-sim", {
  title: "Cosine Similarity Search",
  note: "Retrieval = comparing angles. Smaller angle → higher cosine score → more relevant document.",
  build(canvas) {
    const docs = [
      { n: "Doc A (pricing)", a: -0.25, s: 0.97, c: "#4ade80" },
      { n: "Doc B (history)", a: 0.85, s: 0.66, c: "#8ea2ff" },
      { n: "Doc C (recipes)", a: 1.75, s: -0.18, c: "#ff6b8b" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cx = w * 0.34, cy = h * 0.55, S = 95;
      const qa = -0.25 + 0.06 * Math.sin(t);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(qa) * S, cy + Math.sin(qa) * S);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
      label(ctx, "query", cx + Math.cos(qa) * S + 8, cy + Math.sin(qa) * S, "#fff");
      docs.forEach((d, i) => {
        const on = t % 3 > i * 0.6;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(d.a) * S, cy + Math.sin(d.a) * S);
        ctx.strokeStyle = d.c; ctx.lineWidth = on ? 2.6 : 1.2; ctx.globalAlpha = on ? 1 : 0.4; ctx.stroke();
        ctx.globalAlpha = 1;
        // score bar
        const bx = w * 0.62, by = 44 + i * 52;
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(bx, by - 10, 180, 16);
        ctx.fillStyle = d.c; ctx.fillRect(bx, by - 10, Math.max(0, d.s) * 180, 16);
        label(ctx, `${d.n}: ${d.s.toFixed(2)}`, bx, by - 16, d.c);
      });
      label(ctx, "cos(0°)=1 same · cos(90°)=0 unrelated · cos(180°)=-1 opposite", w / 2, h - 10, "rgba(220,228,255,0.6)", "center");
    });
  },
});

// 5. VECTOR SEARCH — growing radius finds top-k
registerVisual("vector-search", {
  title: "Top-k Vector Search",
  note: "The query expands its neighborhood until k nearest chunks are found — that's approximate NN search.",
  build(canvas) {
    const pts = points(46, 1, 1, 11).map(([x, y]) => [0.08 + x * 0.84, 0.12 + y * 0.76]);
    const q = [0.5, 0.5];
    const kOrder = [...pts].sort((a, b) => Math.hypot(a[0] - q[0], a[1] - q[1]) - Math.hypot(b[0] - q[0], b[1] - q[1]));
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const r = ((t * 0.35) % 1) * 0.42;
      const qx = xy(q[0], w), qy = h - 30 - q[1] * (h - 60);
      const found = kOrder.slice(0, 3).filter((p) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= r).length;
      ctx.beginPath(); ctx.arc(qx, qy, r * (h - 60), 0, TAU);
      ctx.strokeStyle = "rgba(255,209,102,0.7)"; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      pts.forEach((p) => {
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        const inTop3 = kOrder.slice(0, 3).includes(p);
        ctx.beginPath(); ctx.arc(xy(p[0], w), h - 30 - p[1] * (h - 60), inTop3 ? 6 : 3.5, 0, TAU);
        ctx.fillStyle = d <= r ? (inTop3 ? "#4ade80" : "#8ea2ff") : "rgba(120,140,255,0.35)";
        ctx.fill();
      });
      ctx.beginPath(); ctx.arc(qx, qy, 6, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();
      label(ctx, `found ${found}/3 top chunks — k = 3`, w / 2, h - 8, "#ffd166", "center");
    });
  },
});

// 6. RERANKING — cheap recall first, quality re-score second
registerVisual("rerank", {
  title: "Retrieval → Reranking",
  note: "Fast vector search recalls 20 candidates, a smarter cross-encoder re-sorts them by true relevance.",
  build(canvas) {
    const cands = [
      { t: "Refund window is 30 days", v: 0.71, x: 0.94 }, { t: "Shipping times by region", v: 0.66, x: 0.42 },
      { t: "How to return an item", v: 0.63, x: 0.88 }, { t: "Payment methods accepted", v: 0.55, x: 0.30 },
      { t: "Warranty details", v: 0.51, x: 0.35 },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const phase = Math.min(2, Math.floor(t / 1.8) + 1);
      label(ctx, phase === 1 ? "1) vector recall (fast, approximate)" : "2) cross-encoder rerank (slow, accurate)", w / 2, 22, "#ffd166", "center");
      cands.forEach((c, i) => {
        const y = 48 + i * 44;
        const rank = phase === 1 ? i : cands.slice().sort((a, b) => b.x - a.x).findIndex((o) => o === c);
        const yy = 48 + rank * 44;
        const good = c.x >= 0.8;
        ctx.fillStyle = good ? "rgba(74,222,128,0.35)" : "rgba(108,140,255,0.22)";
        ctx.beginPath(); ctx.roundRect(40, yy - 15, w - 150, 32, 8); ctx.fill();
        label(ctx, `#${rank + 1}`, 52, yy + 4, "#fff");
        label(ctx, c.t, 84, yy + 4, "rgba(235,240,255,0.9)");
        label(ctx, phase === 1 ? `vec ${c.v.toFixed(2)}` : `rerank ${c.x.toFixed(2)}`, w - 84, yy + 4, phase === 1 ? "#8ea2ff" : good ? "#4ade80" : "#ff6b8b", "right");
        if (phase === 2 && rank !== i) {
          ctx.beginPath(); ctx.moveTo(w - 40, y); ctx.lineTo(w - 40, yy);
          ctx.strokeStyle = "rgba(255,209,102,0.5)"; ctx.stroke();
        }
      });
      label(ctx, "green = fed to the LLM context", w / 2, h - 8, "rgba(74,222,128,0.9)", "center");
    });
  },
});

// 7. CONTEXT ASSEMBLY — the prompt window fills up
registerVisual("context-assemble", {
  title: "Assembling the Prompt",
  note: "The final prompt: instructions + retrieved chunks + question. The context window is a budget to spend.",
  build(canvas) {
    const parts = [
      { t: "system instructions", c: "#8ea2ff", w: 0.16 },
      { t: "chunk 1 (refunds)", c: "#4ade80", w: 0.22 },
      { t: "chunk 2 (returns)", c: "#4ade80", w: 0.22 },
      { t: "chunk 3 (shipping)", c: "#4ade80", w: 0.18 },
      { t: "user question", c: "#ffd166", w: 0.12 },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const fill = Math.min(1, t / 3);
      let acc = 0;
      parts.forEach((p) => {
        const on = fill > acc + p.w / 2;
        const x = 30 + acc * (w - 60), wpx = p.w * (w - 60);
        ctx.fillStyle = on ? p.c : "rgba(120,140,255,0.12)";
        ctx.globalAlpha = on ? 0.75 : 1;
        ctx.beginPath(); ctx.roundRect(x, h * 0.32, wpx - 4, 56, 8); ctx.fill();
        ctx.globalAlpha = 1;
        label(ctx, p.t, x + (wpx - 4) / 2, h * 0.32 + 32, on ? "#0a0e1e" : "rgba(220,228,255,0.4)", "center");
        acc += p.w;
      });
      const used = fill;
      ctx.fillStyle = "rgba(255,209,102,0.8)"; ctx.fillRect(30, h * 0.32 + 76, (w - 60) * used, 6);
      ctx.strokeStyle = "rgba(200,210,255,0.3)"; ctx.strokeRect(30, h * 0.32 + 76, w - 60, 6);
      label(ctx, `context window used: ${(used * 100).toFixed(0)}% — overflow gets truncated (usually the middle)`, w / 2, h * 0.32 + 104, "#ffd166", "center");
    });
  },
});

// 8. HALLUCINATION — grounded vs invented
registerVisual("hallucination", {
  title: "Grounding vs Hallucination",
  note: "The model either quotes the retrieved context (safe) or invents facts (hallucination).",
  build(canvas) {
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const which = Math.floor(t / 2.6) % 2;
      label(ctx, "CONTEXT (from your docs): \"Standard warranty is 12 months from purchase date.\"", 24, 34, "#8ea2ff");
      const qy = h * 0.44;
      ctx.fillStyle = which ? "rgba(255,107,139,0.2)" : "rgba(74,222,128,0.2)";
      ctx.beginPath(); ctx.roundRect(24, qy - 26, w - 48, 58, 10); ctx.fill();
      label(ctx, which ? "LLM: \"The warranty is 24 months and covers water damage.\"" : "LLM: \"Per the documents, the standard warranty is 12 months.\"", w / 2, qy, which ? "#ff6b8b" : "#4ade80", "center");
      label(ctx, which ? "❌ HALLUCINATION — not in the source!" : "✅ GROUNDED — every claim traces to the context", w / 2, qy + 40, which ? "#ff6b8b" : "#4ade80", "center");
      label(ctx, " defenses: cite chunks · lower temperature · faithfulness checks · refuse when unsure", w / 2, h - 16, "rgba(220,228,255,0.65)", "center");
    });
  },
});

// 9. RAG vs FINE-TUNING — two lanes
registerVisual("rag-vs-finetune", {
  title: "RAG vs Fine-tuning",
  note: "New facts → retrieve them (RAG). New behavior/style → change the weights (fine-tune). Often both.",
  build(canvas) {
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const colW = (w - 90) / 2;
      [["RAG", "#4ade80", ["model stays frozen", "knowledge lives in a vector DB", "update docs any time", "answers cite sources"]],
       ["Fine-tuning", "#ffd166", ["weights are updated", "learns style, format, domain skill", "retrain to add knowledge", "no built-in citations"]]].forEach(([name, c, rows], col) => {
        const x = 45 + col * (colW + 45);
        pill(ctx, name, x + colW / 2 - 20, 40, c);
        rows.forEach((r, i) => {
          const on = t > 1 + col * 0.9 + i * 0.7;
          ctx.globalAlpha = on ? 1 : 0.25;
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.beginPath(); ctx.roundRect(x, 62 + i * 40, colW, 32, 8); ctx.fill();
          label(ctx, r, x + 12, 62 + i * 40 + 20, "rgba(235,240,255,0.9)");
          ctx.globalAlpha = 1;
        });
      });
      ctx.beginPath(); ctx.moveTo(w / 2, 30); ctx.lineTo(w / 2, h - 30);
      ctx.strokeStyle = "rgba(200,210,255,0.25)"; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
      label(ctx, "fresh facts? → RAG · fixed skill? → fine-tune · enterprise default: RAG first", w / 2, h - 10, "#ffd166", "center");
    });
  },
});

// 10. RAG EVALUATION — three quality gauges
registerVisual("rag-evals", {
  title: "Evaluating a RAG System",
  note: "Three questions: did we retrieve the right chunks, does the answer stick to them, does it answer the ask?",
  build(canvas) {
    const gauges = [
      { n: "Context recall", v: 0.92, c: "#8ea2ff", d: "right chunks retrieved?" },
      { n: "Faithfulness", v: 0.85, c: "#4ade80", d: "answer grounded in chunks?" },
      { n: "Answer relevance", v: 0.78, c: "#ffd166", d: "actually answers the ask?" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      gauges.forEach((g, i) => {
        const x = 45 + i * ((w - 90) / 3), y = h * 0.42, R = 44;
        const fill = g.v * Math.min(1, t / 2);
        ctx.beginPath(); ctx.arc(x, y, R, 0, TAU);
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 10; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + fill * TAU);
        ctx.strokeStyle = g.c; ctx.lineWidth = 10; ctx.stroke();
        label(ctx, `${(g.v * 100).toFixed(0)}%`, x, y + 5, g.c, "center");
        label(ctx, g.n, x, y + R + 20, "rgba(235,240,255,0.9)", "center");
        label(ctx, g.d, x, y + R + 36, "rgba(200,215,255,0.55)", "center");
      });
      label(ctx, "evals = regression tests for prompts and retrievers — no evals, no safe changes", w / 2, h - 12, "#ffd166", "center");
    });
  },
});
