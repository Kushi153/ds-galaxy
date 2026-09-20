// ============================================================
// DS Galaxy — Deep Learning demos (registered into visuals.js)
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

// 1. PERCEPTRON — one neuron learns a boundary
registerVisual("perceptron", {
  title: "The Perceptron",
  note: "One neuron = weighted sum + step. It nudges its weights every time it misclassifies a point.",
  build(canvas) {
    const pts = points(36, 1, 1, 5).map(([x, y]) => [x, y, x + y > 1 ? 1 : 0]);
    let w1 = -0.6, w2 = 0.9, b = 0.1;
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30); axes(ctx, w, h);
      if (Math.floor(t * 3) % 2 === 0) { // periodic learning steps
        const p = pts[Math.floor(t * 7) % pts.length];
        const out = w1 * p[0] + w2 * p[1] + b > 0 ? 1 : 0;
        const err = p[2] - out;
        w1 += 0.06 * err * p[0]; w2 += 0.06 * err * p[1]; b += 0.06 * err;
      }
      // decision boundary: w1·x + w2·y + b = 0
      const yl = (x) => (-b - w1 * x) / w2;
      ctx.beginPath();
      ctx.moveTo(xy(0, w), h - 30 - yl(0) * (h - 60));
      ctx.lineTo(xy(1, w), h - 30 - yl(1) * (h - 60));
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.6; ctx.stroke();
      pts.forEach((p) => {
        ctx.beginPath(); ctx.arc(xy(p[0], w), h - 30 - p[1] * (h - 60), 4.5, 0, TAU);
        ctx.fillStyle = p[2] ? "#4ade80" : "#ff6b8b"; ctx.fill();
      });
      label(ctx, `w₁=${w1.toFixed(2)}  w₂=${w2.toFixed(2)}  b=${b.toFixed(2)}`, 20, 22, "#ffd166");
      label(ctx, "green vs red — the line is the neuron's decision", w / 2, h - 8, "rgba(220,228,255,0.65)", "center");
    });
  },
});

// 2. CNN CONVOLUTION — a filter slides over the image
registerVisual("cnn-conv", {
  title: "CNN Convolution",
  note: "A 3×3 edge-detecting filter slides across the image, producing a feature map of where edges live.",
  build(canvas) {
    const IMG = 8, px = 26; // 8x8 grid
    const img = [
      "........", "..##....", "..##....", "........",
      "....###.", "....###.", "........", "........",
    ].map((r) => [...r].map((c) => (c === "#" ? 1 : 0.12)));
    const K = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
    return ticker(canvas, (ctx, w, h) => {
      grid(ctx, w, h, 30);
      const step = Math.floor(t * 3) % 36;
      const sx = step % 6, sy = Math.floor(step / 6);
      // input image
      for (let r = 0; r < IMG; r++) for (let c = 0; c < IMG; c++) {
        const inPatch = r >= sy && r < sy + 3 && c >= sx && c < sx + 3;
        ctx.fillStyle = `rgba(142,162,255,${0.15 + img[r][c] * 0.75})`;
        ctx.fillRect(24 + c * px, 40 + r * px, px - 2, px - 2);
        if (inPatch) { ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.strokeRect(24 + c * px, 40 + r * px, px - 2, px - 2); }
      }
      // feature map
      for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
        let acc = 0;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) acc += img[r + i][c + j] * K[i][j];
        const active = r === sy && c === sx;
        ctx.fillStyle = `rgba(74,222,128,${Math.min(1, Math.abs(acc) * 0.35 + 0.06)})`;
        ctx.fillRect(24 + 8 * px + 40 + c * px, 40 + r * px, px - 2, px - 2);
        if (active) { ctx.strokeStyle = "#ffd166"; ctx.strokeRect(24 + 8 * px + 40 + c * px, 40 + r * px, px - 2, px - 2); }
      }
      label(ctx, "input (8×8)", 24, 28, "#8ea2ff");
      label(ctx, "feature map (6×6)", 24 + 8 * px + 40, 28, "#4ade80");
      label(ctx, "moving 3×3 kernel", 24, h - 14, "#ffd166");
    });
  },
});

// 3. MAX POOLING — shrink feature maps, keep the strongest signal
registerVisual("pooling", {
  title: "Max Pooling",
  note: "Each 2×2 window collapses to its maximum — smaller maps, positions get less precise, signal survives.",
  build(canvas) {
    const M = [[2, 4, 1, 3], [6, 1, 0, 2], [3, 5, 7, 1], [0, 2, 4, 8]];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const wi = Math.floor(t * 2) % 4;
      const cells = [[0, 0], [0, 2], [2, 0], [2, 2]];
      const [pr, pc] = cells[wi];
      const px = 52;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const inWin = r >= pr && r < pr + 2 && c >= pc && c < pc + 2;
        const isMax = inWin && M[r][c] === Math.max(M[pr][pc], M[pr][pc + 1], M[pr + 1][pc], M[pr + 1][pc + 1]);
        ctx.fillStyle = isMax ? "rgba(255,209,102,0.9)" : inWin ? "rgba(142,162,255,0.35)" : "rgba(108,140,255,0.2)";
        ctx.fillRect(36 + c * px, 52 + r * px, px - 4, px - 4);
        label(ctx, String(M[r][c]), 36 + c * px + px / 2 - 3, 52 + r * px + px / 2 + 4, "#fff", "center");
      }
      // output
      const out = [[6, 3], [7, 8]];
      out.forEach((row, r) => row.forEach((v, c) => {
        const lit = wi === r * 2 + c;
        ctx.fillStyle = lit ? "rgba(74,222,128,0.85)" : "rgba(74,222,128,0.25)";
        ctx.fillRect(36 + 4 * px + 50 + c * px, 52 + r * px, px - 4, px - 4);
        label(ctx, String(v), 36 + 4 * px + 50 + c * px + px / 2 - 3, 52 + r * px + px / 2 + 4, lit ? "#0a0e1e" : "#fff", "center");
      }));
      label(ctx, "input 4×4", 36, 36, "#8ea2ff");
      label(ctx, "pooled 2×2", 36 + 4 * px + 50, 36, "#4ade80");
      label(ctx, "gold cell wins its 2×2 window (max)", w / 2, h - 14, "#ffd166", "center");
    });
  },
});

// 4. RNN — hidden state flows through time steps
registerVisual("rnn", {
  title: "Recurrent Neural Networks",
  note: "The same cell processes tokens one by one, carrying a memory (hidden state) forward through time.",
  build(canvas) {
    const toks = ["The", "stock", "market", "fell", "today", "."];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const upto = 1 + (Math.floor(t * 1.4) % toks.length);
      const xs = toks.map((_, i) => 55 + i * ((w - 110) / (toks.length - 1)));
      ctx.beginPath();
      xs.forEach((x, i) => (i ? ctx.lineTo(x, h * 0.42) : ctx.moveTo(x, h * 0.42)));
      ctx.strokeStyle = "rgba(255,209,102,0.85)"; ctx.lineWidth = 3; ctx.stroke();
      toks.forEach((tk, i) => {
        const seen = i < upto;
        ctx.beginPath(); ctx.arc(xs[i], h * 0.42, 15, 0, TAU);
        ctx.fillStyle = seen ? "rgba(255,209,102,0.9)" : "rgba(120,140,255,0.2)"; ctx.fill();
        label(ctx, tk, xs[i], h * 0.42 + 36, seen ? "#ffd166" : "rgba(200,215,255,0.4)", "center");
        if (seen) label(ctx, "h" + (i + 1), xs[i], h * 0.42 - 26, "rgba(255,209,102,0.8)", "center");
      });
      ctx.beginPath(); ctx.moveTo(xs[upto - 1] - 14, h * 0.42 + 22); ctx.lineTo(xs[upto - 1] + 14, h * 0.42 + 22);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      label(ctx, "hidden state = summary of everything seen so far", w / 2, h - 16, "rgba(220,228,255,0.7)", "center");
      label(ctx, "problem: long sentences fade the memory (vanishing gradient) → LSTMs, then attention", w / 2, h - 36, "rgba(255,150,170,0.75)", "center");
    });
  },
});

// 5. ATTENTION — every word looks at every word
registerVisual("attention", {
  title: "Attention",
  note: "For the word 'it', attention weights decide which earlier words matter most — context, solved.",
  build(canvas) {
    const toks = ["The", "animal", "was", "tired", "so", "it", "slept"];
    const focus = 5;
    const weights = [0.08, 0.42, 0.06, 0.30, 0.03, 0.0, 0.11];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const xs = toks.map((_, i) => 42 + i * ((w - 84) / (toks.length - 1)));
      toks.forEach((tk, i) => {
        if (i === focus) return;
        const wgt = weights[i];
        ctx.beginPath(); ctx.moveTo(xs[focus], h * 0.35); ctx.lineTo(xs[i], h * 0.35);
        ctx.strokeStyle = `rgba(255,209,102,${0.15 + wgt * 1.6})`;
        ctx.lineWidth = 1 + wgt * 9;
        ctx.setLineDash([4 + wgt * 6, 4]); ctx.stroke(); ctx.setLineDash([]);
      });
      toks.forEach((tk, i) => {
        const isFocus = i === focus;
        ctx.fillStyle = isFocus ? "#ff6b8b" : weights[i] > 0.2 ? "#ffd166" : "rgba(120,140,255,0.5)";
        ctx.beginPath(); ctx.roundRect(xs[i] - 26, h * 0.35 - 14, 52, 28, 7); ctx.fill();
        label(ctx, tk, xs[i], h * 0.35 + 4, isFocus ? "#fff" : "#0a0e1e", "center");
        if (!isFocus) label(ctx, weights[i].toFixed(2), xs[i], h * 0.35 + 30, "rgba(255,209,102,0.85)", "center");
      });
      label(ctx, `"it" attends most to "animal" (${weights[1]}) and "tired" (${weights[3]})`, w / 2, h - 30, "#ffd166", "center");
      label(ctx, "softmax(QKᵀ/√d)·V — queries, keys, values", w / 2, h - 10, "rgba(220,228,255,0.6)", "center");
    });
  },
});

// 6. TRANSFORMER — stacked self-attention + feed-forward blocks
registerVisual("transformer", {
  title: "The Transformer",
  note: "Tokens flow up through identical blocks: self-attention (mix information) + FFN (process it).",
  build(canvas) {
    const layers = ["Self-Attention", "Add & Norm", "Feed-Forward", "Add & Norm"];
    const toks = ["kitten", "drank", "milk"];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const prog = (t * 0.9) % (layers.length + 2);
      // token row at bottom
      toks.forEach((tk, i) => {
        const x = w * 0.24 + i * (w * 0.26);
        ctx.fillStyle = "rgba(108,140,255,0.55)";
        ctx.beginPath(); ctx.roundRect(x - 34, h - 52, 68, 30, 7); ctx.fill();
        label(ctx, tk, x, h - 33, "#fff", "center");
      });
      // two transformer blocks
      [0, 1].forEach((b) => {
        const by = 30 + b * (h * 0.42);
        ctx.strokeStyle = b === 0 ? "rgba(142,162,255,0.8)" : "rgba(74,222,128,0.8)";
        ctx.strokeRect(w * 0.14, by, w * 0.72, h * 0.38);
        layers.forEach((L, i) => {
          const on = prog > b * layers.length + i;
          const ly = by + 26 + i * (h * 0.38 - 44) / 3;
          ctx.fillStyle = on ? (i % 2 ? "rgba(255,209,102,0.85)" : "rgba(142,162,255,0.75)") : "rgba(120,140,255,0.12)";
          ctx.beginPath(); ctx.roundRect(w * 0.3, ly - 12, w * 0.4, 24, 6); ctx.fill();
          label(ctx, L, w * 0.5, ly + 4, on ? "#0a0e1e" : "rgba(220,228,255,0.4)", "center");
        });
        label(ctx, `layer ${b + 1}`, w * 0.16, by + 16, "rgba(220,228,255,0.55)");
      });
      label(ctx, "no recurrence — attention sees ALL positions in parallel", w * 0.5, 16, "#ffd166", "center");
    });
  },
});

// 7. DROPOUT — neurons randomly switch off during training
registerVisual("dropout", {
  title: "Dropout",
  note: "Each training step randomly disables neurons — no single neuron can be relied on, so the network generalizes.",
  build(canvas) {
    const layers = [5, 7, 7, 3];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const seed = Math.floor(t * 1.6);
      let s = seed * 2654435761 % 0x7fffffff;
      const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      const drop = layers.map((n) => Array.from({ length: n }, () => rnd() < 0.35));
      layers.forEach((n, li) => {
        const x = 50 + li * ((w - 100) / (layers.length - 1));
        for (let i = 0; i < n; i++) {
          const y = h / 2 + (i - (n - 1) / 2) * 34;
          if (li < layers.length - 1) {
            for (let j = 0; j < layers[li + 1]; j++) {
              const y2 = h / 2 + (j - (layers[li + 1] - 1) / 2) * 34;
              const dead = drop[li][i] || drop[li + 1][j];
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (w - 100) / (layers.length - 1), y2);
              ctx.strokeStyle = dead ? "rgba(120,140,255,0.05)" : "rgba(142,162,255,0.16)";
              ctx.lineWidth = 0.7; ctx.stroke();
            }
          }
          ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU);
          ctx.fillStyle = drop[li][i] ? "rgba(255,107,139,0.85)" : "rgba(74,222,128,0.9)";
          ctx.fill();
        }
      });
      label(ctx, `step ${seed}: red = dropped (p = 0.35) — output layers stay active`, w / 2, h - 14, "#ffd166", "center");
    });
  },
});

// 8. OPTIMIZERS — SGD vs Momentum vs Adam paths
registerVisual("optimizers", {
  title: "Optimizers: SGD vs Adam",
  note: "Three optimizers descend the same ravine — adaptive methods damp oscillation and converge faster.",
  build(canvas) {
    const f = (x, y) => 0.08 * (x * x) + 1.4 * Math.sin(y) ** 2 + 0.05 * (y * y);
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30); axes(ctx, w, h);
      // contour rings
      for (let k = 1; k <= 6; k++) {
        ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.5, k * 26, k * 14, 0, 0, TAU);
        ctx.strokeStyle = "rgba(120,140,255,0.12)"; ctx.stroke();
      }
      const paths = [
        { c: "#ff6b8b", n: "SGD", px: 0.18, py: 0.78, wob: 1 },
        { c: "#8ea2ff", n: "Momentum", px: 0.16, py: 0.86, wob: 0.45 },
        { c: "#4ade80", n: "Adam", px: 0.13, py: 0.92, wob: 0.12 },
      ];
      paths.forEach((p) => {
        const steps = Math.min(60, Math.floor(t * 14));
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const pr = i / 60;
          const x = p.px + (0.62 - p.px) * pr;
          const y = p.py + (0.5 - p.py) * pr + Math.sin(pr * 18) * 0.05 * p.wob * Math.sin(pr * Math.PI);
          i ? ctx.lineTo(xy(x, w), h - 30 - y * (h - 60)) : ctx.moveTo(xy(x, w), h - 30 - y * (h - 60));
        }
        ctx.strokeStyle = p.c; ctx.lineWidth = 2.4; ctx.stroke();
        const pr = Math.min(1, steps / 60);
        const x = p.px + (0.62 - p.px) * pr, y = p.py + (0.5 - p.py) * pr;
        ctx.beginPath(); ctx.arc(xy(x, w), h - 30 - y * (h - 60), 5, 0, TAU);
        ctx.fillStyle = p.c; ctx.fill();
        label(ctx, p.n, xy(x, w) + 10, h - 30 - y * (h - 60), p.c);
      });
      label(ctx, "center = minimum · wild path = plain SGD, smooth path = Adam", w / 2, h - 10, "rgba(220,228,255,0.65)", "center");
    });
  },
});

// 9. TRANSFER LEARNING — pretrained model + small data
registerVisual("transfer", {
  title: "Transfer Learning & Fine-tuning",
  note: "Start from a pretrained model, freeze the general layers, train a small head on YOUR data.",
  build(canvas) {
    const blocks = [
      { n: "Pretrained base", c: "#8ea2ff", sub: "learned on millions of images/text" },
      { n: "Frozen layers", c: "rgba(120,140,255,0.5)", sub: "❄ keeps general features" },
      { n: "New head", c: "#4ade80", sub: "🔥 trains on your small dataset" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const stage = Math.min(3, Math.floor(t / 1.6) + 1);
      blocks.forEach((b, i) => {
        const on = stage > i;
        const x = 40 + i * ((w - 140) / 3), bw = (w - 180) / 3;
        ctx.fillStyle = on ? (i === 2 ? "rgba(74,222,128,0.75)" : "rgba(108,140,255,0.55)") : "rgba(120,140,255,0.12)";
        ctx.beginPath(); ctx.roundRect(x, h * 0.34, bw, 64, 10); ctx.fill();
        if (on && i === 1) { // snowflake-ish flicker
          label(ctx, "❄", x + bw - 18, h * 0.34 + 20, "#fff", "center");
        }
        if (on && i === 2) label(ctx, "🔥", x + bw - 18, h * 0.34 + 20, "#fff", "center");
        label(ctx, b.n, x + bw / 2, h * 0.34 + 30, on ? "#fff" : "rgba(220,228,255,0.4)", "center");
        label(ctx, b.sub, x + bw / 2, h * 0.34 + 48, on ? "rgba(255,255,255,0.75)" : "rgba(220,228,255,0.3)", "center");
        if (i < 2 && on) label(ctx, "→", x + bw + 14, h * 0.34 + 34, "#ffd166", "center");
      });
      label(ctx, `1M images → your 500 examples: cheaper, faster, better than training from scratch`, w / 2, h - 40, "#ffd166", "center");
      label(ctx, stage >= 3 ? "fine-tuning = unfreeze the last layers with a tiny learning rate" : "…", w / 2, h - 18, "rgba(220,228,255,0.7)", "center");
    });
  },
});
