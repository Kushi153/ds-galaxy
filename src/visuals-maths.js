// ============================================================
// DS Galaxy — Maths & Stats demos (registered into visuals.js)
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

// 1. MEAN vs MEDIAN — outlier drags the mean, median stays
registerVisual("mean-median", {
  title: "Mean vs Median",
  note: "An outlier visits the dataset — watch the mean (cyan) chase it while the median (gold) barely moves.",
  build(canvas) {
    const base = [2, 3, 3, 4, 5, 5, 6, 7];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cyc = Math.min(1, Math.max(0, Math.sin(t * 0.8) * 1.6 + 0.4)); // outlier value 0..1
      const data = cyc > 0.02 ? [...base, 10 + cyc * 18] : [...base];
      const sorted = [...data].sort((a, b) => a - b);
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      const sx = (v) => xy(v / 30, w), sy = h * 0.62;
      data.forEach((v, i) => {
        ctx.beginPath(); ctx.arc(sx(v), sy, 5, 0, TAU);
        ctx.fillStyle = i === data.length - 1 && cyc > 0.02 ? "#ff6b8b" : "#8ea2ff"; ctx.fill();
      });
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(sx(mean), sy - 46); ctx.lineTo(sx(mean), sy + 40);
      ctx.strokeStyle = "#4dd0e1"; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx(median), sy - 34); ctx.lineTo(sx(median), sy + 40);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, `mean = ${mean.toFixed(1)}`, sx(mean), sy - 52, "#4dd0e1", "center");
      label(ctx, `median = ${median.toFixed(1)}`, sx(median), sy - 40, "#ffd166", "center");
      label(ctx, cyc > 0.02 ? "outlier present →" : "skewed data? trust the median", w / 2, h - 12, "rgba(255,150,170,0.9)", "center");
    });
  },
});

// 2. VARIANCE & STANDARD DEVIATION — same mean, different spread
registerVisual("variance", {
  title: "Variance & Standard Deviation",
  note: "Two datasets with the SAME mean. Spread (variance) is what the standard deviation measures.",
  build(canvas) {
    const tight = [4.4, 4.7, 4.9, 5.0, 5.1, 5.3, 5.6];
    const loose = [1.2, 2.4, 3.6, 5.0, 6.4, 7.6, 8.8];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const rowY = [h * 0.32, h * 0.72];
      [tight, loose].forEach((d, r) => {
        const mean = 5, y = rowY[r];
        ctx.beginPath(); ctx.moveTo(xy(0, w), y); ctx.lineTo(xy(1, w), y);
        ctx.strokeStyle = "rgba(200,210,255,0.3)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(xy(mean / 10, w), y, 6, 0, TAU);
        ctx.fillStyle = "#ffd166"; ctx.fill();
        d.forEach((v) => {
          const x = xy(v / 10, w);
          const dist = Math.abs(v - mean);
          ctx.beginPath(); ctx.arc(x, y, 4.5 + Math.sin(t * 2 + v) * 0.6, 0, TAU);
          ctx.fillStyle = dist > 2 ? "#ff6b8b" : "#8ea2ff"; ctx.fill();
          if (r === 1) { // show squared deviations on loose row
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xy(mean / 10, w), y);
            ctx.strokeStyle = "rgba(255,107,139,0.25)"; ctx.lineWidth = 1; ctx.stroke();
          }
        });
        const varr = d.reduce((a, v) => a + (v - mean) ** 2, 0) / d.length;
        label(ctx, r === 0 ? `tight: σ² = ${varr.toFixed(2)}` : `loose: σ² = ${varr.toFixed(2)}`, 14, y - 22, r === 0 ? "#8ea2ff" : "#ff6b8b");
      });
      label(ctx, "same mean 5.0 — wildly different variance", w / 2, h - 10, "rgba(220,228,255,0.7)", "center");
    });
  },
});

// 3. DISTRIBUTIONS — cycle normal / skewed / bimodal / uniform
registerVisual("distributions", {
  title: "Common Distributions",
  note: "Four shapes every data scientist must recognize — the demo cycles through them.",
  build(canvas) {
    const shapes = [
      { name: "Normal (Gaussian)", f: (x) => Math.exp(-((x - 0.5) ** 2) / 0.02) },
      { name: "Right-skewed (income, wait times)", f: (x) => Math.exp(-((x - 0.25) ** 2) / 0.008) + 0.25 * Math.exp(-((x - 0.62) ** 2) / 0.05) },
      { name: "Bimodal (two customer groups)", f: (x) => Math.exp(-((x - 0.3) ** 2) / 0.01) + Math.exp(-((x - 0.72) ** 2) / 0.01) },
      { name: "Uniform (fair dice averages)", f: (x) => (x > 0.1 && x < 0.9 ? 1 : 0) },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30); axes(ctx, w, h);
      const s = shapes[Math.floor(t / 2.2) % shapes.length];
      const bins = 40, bw = (w - 60) / bins;
      for (let i = 0; i < bins; i++) {
        const xv = (i + 0.5) / bins;
        const hh = s.f(xv) * (h - 80);
        ctx.fillStyle = "rgba(108,140,255,0.55)";
        ctx.fillRect(xy(xv, w) - bw / 2, h - 30 - hh, bw - 1, hh);
      }
      label(ctx, s.name, w / 2, h - 10, "#ffd166", "center");
      label(ctx, `shape ${Math.floor(t / 2.2) % shapes.length + 1} / 4`, w - 16, 18, "rgba(220,228,255,0.6)", "right");
    });
  },
});

// 4. CENTRAL LIMIT THEOREM — sample means become normal
registerVisual("clt", {
  title: "Central Limit Theorem",
  note: "Samples from a skewed population: the histogram of their MEANS turns into a bell curve.",
  build(canvas) {
    const pop = Array.from({ length: 4000 }, (_, i) => (i % 10) * (i % 3) + ((i * 37) % 17)); // skewed-ish
    const means = [];
    let s = 7;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const n = Math.min(300, Math.floor(t * 25) + 1);
      while (means.length < n) {
        let acc = 0;
        for (let i = 0; i < 12; i++) acc += pop[Math.floor(rnd() * pop.length)];
        means.push(acc / 12);
      }
      const bins = new Array(24).fill(0);
      means.forEach((m) => bins[Math.min(23, Math.floor(m / 2.4))]++);
      const max = Math.max(...bins, 1), bw = (w - 60) / 24;
      bins.forEach((c, i) => {
        const hh = (c / max) * (h - 90);
        ctx.fillStyle = "rgba(74,222,128,0.6)";
        ctx.fillRect(30 + i * bw, h - 40 - hh, bw - 1, hh);
      });
      // ghost of the skewed population above
      const pb = new Array(24).fill(0);
      pop.forEach((v) => pb[Math.min(23, Math.floor(v / 2.4))]++);
      const pmax = Math.max(...pb, 1);
      pb.forEach((c, i) => {
        const hh = (c / pmax) * 34;
        ctx.fillStyle = "rgba(255,107,139,0.35)";
        ctx.fillRect(30 + i * bw, 34 - hh, bw - 1, hh);
      });
      label(ctx, `population (skewed)`, 32, 16, "rgba(255,107,139,0.8)");
      label(ctx, `distribution of ${n} sample means → normal!`, 32, h - 18, "rgba(74,222,128,0.95)");
    });
  },
});

// 5. CONFIDENCE INTERVALS — 90% of them capture the truth
registerVisual("confidence", {
  title: "Confidence Intervals",
  note: "90% confidence = if we resample many times, ~90% of these intervals capture the true mean (dashed line).",
  build(canvas) {
    const TRUE_MU = 10;
    let s = 21;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const cis = Array.from({ length: 16 }, () => {
      const m = TRUE_MU + (rnd() - 0.5) * 2.4;
      const half = 0.55 + rnd() * 0.5;
      return [m - half, m + half];
    });
    return ticker(canvas, (ctx, w, h) => {
      grid(ctx, w, h, 30);
      const sx = (v) => xy((v - 7) / 6, w);
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(sx(TRUE_MU), 14); ctx.lineTo(sx(TRUE_MU), h - 26);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      cis.forEach((ci, i) => {
        const y = 34 + i * ((h - 66) / cis.length);
        const hit = ci[0] <= TRUE_MU && TRUE_MU <= ci[1];
        ctx.beginPath(); ctx.moveTo(sx(ci[0]), y); ctx.lineTo(sx(ci[1]), y);
        ctx.strokeStyle = hit ? "rgba(74,222,128,0.8)" : "rgba(255,107,139,0.95)";
        ctx.lineWidth = 3.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx((ci[0] + ci[1]) / 2), y, 3, 0, TAU);
        ctx.fillStyle = hit ? "#4ade80" : "#ff6b8b"; ctx.fill();
      });
      label(ctx, "true mean μ", sx(TRUE_MU), h - 8, "#ffd166", "center");
    });
  },
});

// 6. P-VALUE — where does the test statistic land?
registerVisual("p-value", {
  title: "P-values & Hypothesis Testing",
  note: "Null distribution with rejection tails. The sliding statistic lands far out → small p-value → reject H₀.",
  build(canvas) {
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30); axes(ctx, w, h, 30);
      const bell = (x) => Math.exp(-(x ** 2) / 0.018);
      const bins = 50, bw = (w - 60) / bins;
      for (let i = 0; i < bins; i++) {
        const xv = i / bins, hh = bell(xv - 0.5) * (h - 90);
        const tail = xv < 0.05 || xv > 0.95;
        ctx.fillStyle = tail ? "rgba(255,107,139,0.55)" : "rgba(108,140,255,0.45)";
        ctx.fillRect(30 + i * bw, h - 30 - hh, bw - 1, hh);
      }
      const z = ((Math.sin(t * 0.7) + 1) / 2) * 1.6; // statistic position
      const xv = 0.5 + z * 0.28 * (z > 1 ? 1 : 1);
      const statX = 30 + Math.min(bins - 1, Math.floor((0.5 + (z / 1.6) * 0.47) * bins)) * bw + bw / 2;
      const p = Math.max(0.001, 0.5 - Math.abs(0.5 + (z / 1.6) * 0.47 - 0.5)) * 0.9;
      ctx.beginPath(); ctx.moveTo(statX, h - 30); ctx.lineTo(statX, h - 110);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(statX, h - 110, 5, 0, TAU); ctx.fillStyle = "#ffd166"; ctx.fill();
      label(ctx, `test statistic`, statX, h - 120, "#ffd166", "center");
      label(ctx, `p ≈ ${(p * (z / 1.6)).toFixed(3)} ${z / 1.6 > 0.8 ? "→ reject H₀!" : "→ not significant"}`, w / 2, h - 8, z / 1.6 > 0.8 ? "#ff6b8b" : "rgba(220,228,255,0.7)", "center");
      label(ctx, "rejection region (α = 0.05)", 34, 20, "rgba(255,107,139,0.9)");
    });
  },
});

// 7. BAYES' THEOREM — prior → likelihood → posterior
registerVisual("bayes", {
  title: "Bayes' Theorem",
  note: "A disease test: prior belief updates with evidence. P(D|+) = P(+|D)·P(D) / P(+).",
  build(canvas) {
    const P_D = 0.01, sens = 0.9, fpr = 0.08;
    const P_pos = sens * P_D + fpr * (1 - P_D);
    const stages = [
      { name: "Prior P(D)", v: P_D, c: "#8ea2ff" },
      { name: "Likelihood P(+|D)", v: sens, c: "#4ade80" },
      { name: "Posterior P(D|+)", v: (sens * P_D) / P_pos, c: "#ffd166" },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const reveal = Math.min(3, t / 1.4);
      stages.forEach((st, i) => {
        if (reveal < i + 0.2) return;
        const bh = st.v * (h - 110) + 6;
        const x = 60 + i * ((w - 140) / 3), bw2 = 90;
        ctx.fillStyle = st.c;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x, h - 56 - bh, bw2, bh);
        ctx.globalAlpha = 1;
        label(ctx, st.name, x + bw2 / 2, h - 36, st.c, "center");
        label(ctx, (st.v * 100).toFixed(1) + "%", x + bw2 / 2, h - 60 - bh, st.c, "center");
        if (i < 2 && reveal > i + 0.9) label(ctx, "×", x + bw2 + 28, h / 2, "rgba(220,228,255,0.7)", "center");
      });
      label(ctx, `Even with a 90%-accurate test, only ${((sens * P_D) / P_pos * 100).toFixed(1)}% of positives are sick — base rates matter!`, w / 2, h - 10, "rgba(255,209,102,0.9)", "center");
    });
  },
});

// 8. CORRELATION — gallery of scatter shapes
registerVisual("correlation", {
  title: "Correlation",
  note: "Correlation measures LINEAR association only — and correlation ≠ causation.",
  build(canvas) {
    const panels = [
      { r: "+0.9", f: (x, n) => x + n * 0.08 }, { r: "+0.5", f: (x, n) => x * 0.5 + 0.25 + n * 0.14 },
      { r: "0.0", f: (x, n) => 0.5 + (n - 0.5) * 0.5 }, { r: "-0.5", f: (x, n) => 0.75 - x * 0.5 + n * 0.14 },
      { r: "-0.9", f: (x, n) => 1 - x + n * 0.08 },
    ];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cols = 5, pw = (w - 40) / cols;
      panels.forEach((p, i) => {
        const px = 20 + i * pw, py = 24, ph = h - 60;
        ctx.strokeStyle = "rgba(200,210,255,0.2)";
        ctx.strokeRect(px, py, pw - 10, ph);
        const n2 = points(28, 1, 1, i * 7 + 3);
        n2.forEach(([ux, uy]) => {
          const x = 0.08 + ux * 0.84, yv = Math.min(0.97, Math.max(0.03, p.f(x, uy)));
          ctx.beginPath();
          ctx.arc(px + 5 + x * (pw - 20), py + ph - 5 - yv * (ph - 10), 2.4, 0, TAU);
          ctx.fillStyle = `rgba(142,162,255,${0.5 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fill();
        });
        label(ctx, `r = ${p.r}`, px + (pw - 10) / 2, py + ph + 16, Math.abs(parseFloat(p.r)) > 0.8 ? "#4ade80" : "#ffd166", "center");
      });
      label(ctx, "linear strength only · outliers distort it · association ≠ causation", w / 2, h - 6, "rgba(220,228,255,0.65)", "center");
    });
  },
});

// 9. VECTORS & DOT PRODUCT — projection + cosine similarity
registerVisual("vectors", {
  title: "Vectors, Dot Product & Cosine Similarity",
  note: "The dot product measures alignment — the same math behind embeddings and document similarity.",
  build(canvas) {
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cx = w / 2, cy = h * 0.58, S = 110;
      const ang = -1.1 + ((Math.sin(t * 0.5) + 1) / 2) * 1.7; // second vector angle
      const a = [1, 0], b = [Math.cos(ang), Math.sin(ang)];
      const dot = a[0] * b[0] + a[1] * b[1];
      // projection of b onto a
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx + b[0] * S, cy + b[1] * S); ctx.lineTo(cx + dot * S, cy);
      ctx.strokeStyle = "rgba(255,209,102,0.6)"; ctx.stroke(); ctx.setLineDash([]);
      const arrow = (vx, vy, color) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + vx * S, cy + vy * S);
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
        const ex = cx + vx * S, ey = cy + vy * S, A = Math.atan2(vy, vx);
        ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 11 * Math.cos(A - 0.4), ey - 11 * Math.sin(A - 0.4));
        ctx.lineTo(ex - 11 * Math.cos(A + 0.4), ey - 11 * Math.sin(A + 0.4));
        ctx.fill(); ctx.fillStyle = color;
      };
      arrow(a[0], a[1], "#8ea2ff");
      arrow(b[0], b[1], "#4ade80");
      label(ctx, "a", cx + a[0] * S + 10, cy - 8, "#8ea2ff");
      label(ctx, "b", cx + b[0] * S + 10, cy + b[1] * S - 8, "#4ade80");
      const cos = dot / (Math.hypot(...a) * Math.hypot(...b));
      label(ctx, `a·b = ${dot.toFixed(2)}   cos θ = ${cos.toFixed(2)}`, w / 2, 26, "#ffd166", "center");
      label(ctx, cos > 0.85 ? "very similar 👍" : cos > 0.3 ? "somewhat related" : "unrelated", w / 2, 46, "rgba(220,228,255,0.75)", "center");
    });
  },
});

// 10. MATRIX MULTIPLICATION — row × column animation
registerVisual("matmul", {
  title: "Matrix Multiplication",
  note: "C[i][j] = dot product of A's row i with B's column j — watch one cell get computed.",
  build(canvas) {
    const A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]];
    const C = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) C[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j];
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const step = Math.floor(t) % 4; // which cell is being computed
      const [ci, cj] = [[0, 0], [0, 1], [1, 0], [1, 1]][step];
      const cell = (mx, x, y, sz, hi, vals) => {
        vals.forEach((row, i) => row.forEach((v, j) => {
          ctx.fillStyle = hi && hi[0] === i && hi[1] === j ? "rgba(255,209,102,0.85)" : "rgba(108,140,255,0.3)";
          ctx.fillRect(x + j * sz, y + i * sz, sz - 4, sz - 4);
          label(ctx, String(v), x + j * sz + sz / 2 - 2, y + i * sz + sz / 2 + 4, "#fff", "center");
        }));
        return { x, y, sz };
      };
      cell(A, w * 0.12, h * 0.22, 46, [ci, [0, 1]], A);
      label(ctx, "A", w * 0.12, h * 0.16, "#8ea2ff");
      cell(B, w * 0.40, h * 0.22, 46, [cj, null], B);
      label(ctx, "B", w * 0.40, h * 0.16, "#4ade80");
      const cx2 = w * 0.68;
      C.forEach((row, i) => row.forEach((v, j) => {
        const on = i === ci && j === cj;
        ctx.fillStyle = on ? "rgba(255,209,102,0.9)" : "rgba(74,222,128,0.3)";
        ctx.fillRect(cx2 + j * 46, h * 0.22 + i * 46, 42, 42);
        label(ctx, on ? "…" : String(v), cx2 + j * 46 + 21, h * 0.22 + i * 46 + 26, "#fff", "center");
      }));
      label(ctx, "C = A × B", cx2, h * 0.16, "#ffd166");
      const calc = `row ${ci} · col ${cj} = ${A[ci][0]}×${B[0][cj]} + ${A[ci][1]}×${B[1][cj]} = ${C[ci][cj]}`;
      label(ctx, calc, w / 2, h - 18, "#ffd166", "center");
    });
  },
});

// 11. EIGENVECTORS — M·v changes most vectors' direction, never the eigenvector's
registerVisual("eigen", {
  title: "Eigenvectors",
  note: "Apply matrix M repeatedly: random vectors get dragged toward the dominant eigenvector — the PCA axis.",
  build(canvas) {
    const M = [[3, 1], [0.6, 2]]; // eigenvector ≈ direction (2.24, 1)
    const vecs = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * TAU;
      return [Math.cos(a), Math.sin(a)];
    });
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30);
      const cx = w / 2, cy = h / 2, S = 60;
      const n = Math.min(6, Math.floor(t * 1.2) + 1);
      vecs.forEach((v) => {
        let u = [...v];
        for (let k = 0; k < n - 1; k++) {
          const nu = [M[0][0] * u[0] + M[0][1] * u[1], M[1][0] * u[0] + M[1][1] * u[1]];
          const len = Math.hypot(...nu) || 1;
          u = [nu[0] / len, nu[1] / len];
        }
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + u[0] * S * 1.6, cy - u[1] * S * 1.6);
        ctx.strokeStyle = "rgba(142,162,255,0.5)"; ctx.lineWidth = 1.6; ctx.stroke();
      });
      // dominant eigenvector
      const e = Math.hypot(2.24, 1);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (2.24 / e) * S * 2, cy - (1 / e) * S * 2);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3.4; ctx.stroke();
      label(ctx, `after ${n - 1} applications of M`, 20, 24, "rgba(220,228,255,0.7)");
      label(ctx, "dominant eigenvector — the direction PCA finds", w / 2, h - 14, "#ffd166", "center");
    });
  },
});

// 12. DERIVATIVES — tangent line slides along a curve
registerVisual("derivatives", {
  title: "Derivatives & Gradients",
  note: "The derivative is the slope of the tangent line — the exact signal gradient descent follows downhill.",
  build(canvas) {
    const f = (x) => 0.6 * (x - 0.5) ** 2 * 4 - 0.3 + 0.15 * Math.sin(x * 9);
    return ticker(canvas, (ctx, w, h, t) => {
      grid(ctx, w, h, 30); axes(ctx, w, h);
      const sy = (v) => h - 30 - v * (h - 60);
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        i ? ctx.lineTo(xy(x, w), sy(f(x))) : ctx.moveTo(xy(x, w), sy(f(x)));
      }
      ctx.strokeStyle = "#8ea2ff"; ctx.lineWidth = 2.4; ctx.stroke();
      const x = 0.08 + ((Math.sin(t * 0.55) + 1) / 2) * 0.84;
      const eps = 0.012, slope = (f(x + eps) - f(x - eps)) / (2 * eps);
      ctx.beginPath();
      ctx.moveTo(xy(x - 0.13, w), sy(f(x) - slope * 0.13));
      ctx.lineTo(xy(x + 0.13, w), sy(f(x) + slope * 0.13));
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(xy(x, w), sy(f(x)), 5.5, 0, TAU);
      ctx.fillStyle = "#ff6b8b"; ctx.fill();
      label(ctx, `slope (f′) = ${slope.toFixed(2)} → step ${slope > 0 ? "left ◀" : "right ▶"}`, w / 2, 24, "#ffd166", "center");
      label(ctx, "gradient = direction of steepest INCREASE — learning goes the other way", w / 2, h - 10, "rgba(220,228,255,0.65)", "center");
    });
  },
});
