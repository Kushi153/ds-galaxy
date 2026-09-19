// ============================================================
// DS Galaxy — Visual Lab: interactive ML demos for RAVI
// Each demo renders into a canvas inside a .vsl-card in the
// chat. Every demo is a factory: (canvas) => control()
// so they can be stopped/restarted freely.
// ============================================================

const VIZ = {}; // id -> { title, note, build(canvas) -> {stop()} }

const TAU = Math.PI * 2;

// ---------- tiny helpers ----------
function grid(ctx, w, h, step = 40) {
  ctx.strokeStyle = "rgba(120,140,255,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function points(n, w, h, seed = 1) {
  // deterministic pseudo-random so every rerun looks the same
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: n }, () => [rnd(), rnd()]);
}

// map data-coords (0..1) to canvas with margin
function xy(v, size, m = 30) {
  return m + v * (size - 2 * m);
}

function axes(ctx, w, h, m = 30) {
  ctx.strokeStyle = "rgba(200,210,255,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(m, h - m); ctx.lineTo(w - m, h - m); // x
  ctx.moveTo(m, h - m); ctx.lineTo(m, m);         // y
  ctx.stroke();
}

function label(ctx, text, x, y, color = "rgba(220,228,255,0.75)", align = "left") {
  ctx.fillStyle = color;
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// ============================================================
// 1. GRADIENT DESCENT — ball rolls down a loss curve
// ============================================================
VIZ["grad-descent"] = {
  title: "Gradient Descent",
  note: "Watch the ball take steps downhill on the loss curve. Each step size = learning rate × slope.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 34;
    // loss curve: a parabola-like bowl
    const f = (x) => Math.pow(x - 0.62, 2) * 0.9 + 0.06;
    const df = (x) => 2 * (x - 0.62) * 0.9;
    let x = 0.08;              // start position
    const lr = 0.18;           // learning rate
    let ballTrail = [];
    let raf = 0, tick = 0;

    function frame() {
      tick++;
      if (tick % 22 === 0 && Math.abs(df(x)) > 0.004 && x > 0.02) {
        ballTrail.push(x);
        x = x - lr * df(x);     // the update rule!
        if (ballTrail.length > 9) ballTrail.shift();
      }
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h);
      // curve
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const px = xy(i / 100, w, m), py = h - m - f(i / 100) * (h - 2 * m) * 0.92;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = "#6c8cff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // trail ghosts
      for (let i = 0; i < ballTrail.length; i++) {
        const gx = xy(ballTrail[i], w, m);
        const gy = h - m - f(ballTrail[i]) * (h - 2 * m) * 0.92;
        ctx.beginPath();
        ctx.arc(gx, gy, 3, 0, TAU);
        ctx.fillStyle = `rgba(108,140,255,${0.12 + 0.09 * i})`;
        ctx.fill();
      }
      // ball
      const bx = xy(x, w, m), by = h - m - f(x) * (h - 2 * m) * 0.92;
      const g = ctx.createRadialGradient(bx, by, 1, bx, by, 12);
      g.addColorStop(0, "#ffd166"); g.addColorStop(1, "rgba(255,209,102,0)");
      ctx.beginPath(); ctx.arc(bx, by, 12, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, TAU); ctx.fillStyle = "#ffd166"; ctx.fill();

      label(ctx, "weight →", w - m, h - 8, undefined, "right");
      label(ctx, "loss ↑", 8, m + 4);
      label(ctx, `step: x = x − lr·slope  (lr = ${lr})`, w / 2, h - 6, "rgba(180,195,255,0.8)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 2. LINEAR REGRESSION — line learns to fit noisy points
// ============================================================
VIZ["lin-reg"] = {
  title: "Linear Regression",
  note: "The line starts random and learns the best fit by minimizing squared errors (dashed lines).",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 30;
    const data = points(28, w, h, 7).map(([a, b]) => [a, 0.15 + 0.65 * a + (b - 0.5) * 0.22]);
    let w0 = 0.7, w1 = -0.5, step = 0;
    const lr = 0.08;
    let raf = 0, tick = 0, done = false;

    function sse() {
      let e = 0;
      for (const [a, b] of data) e += Math.pow(w0 + w1 * a - b, 2);
      return e;
    }

    function frame() {
      tick++;
      if (!done && tick % 4 === 0 && step < 260) {
        // batch gradient descent on MSE
        let g0 = 0, g1 = 0;
        for (const [a, b] of data) { const err = w0 + w1 * a - b; g0 += err; g1 += err * a; }
        w0 -= lr * (g0 / data.length);
        w1 -= lr * (g1 / data.length);
        step++;
        if (step >= 260) done = true;
      }
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h); axes(ctx, w, h, m);
      // error lines
      for (const [a, b] of data) {
        const px = xy(a, w, m), py = h - m - b * (h - 2 * m);
        const fy = h - m - Math.min(1.15, Math.max(-0.15, w0 + w1 * a)) * (h - 2 * m);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, fy);
        ctx.strokeStyle = "rgba(255,107,139,0.35)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fillStyle = "#4ade80"; ctx.fill();
      }
      // fitted line
      ctx.beginPath();
      ctx.moveTo(xy(0, w, m), h - m - Math.min(1.15, Math.max(-0.15, w0)) * (h - 2 * m));
      ctx.lineTo(xy(1, w, m), h - m - Math.min(1.15, Math.max(-0.15, w0 + w1)) * (h - 2 * m));
      ctx.strokeStyle = "#6c8cff"; ctx.lineWidth = 2.5; ctx.stroke();
      label(ctx, `MSE = ${sse().toFixed(4)}  ·  epoch ${step}`, m + 4, m + 2);
      label(ctx, "y = w₀ + w₁x", w - m, h - 8, "rgba(180,195,255,0.8)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 3. OVERFITTING — underfit / good fit / overfit toggle
// ============================================================
VIZ["overfit"] = {
  title: "Underfit vs Good fit vs Overfit",
  note: "Polynomial degree 1 ignores the curve; degree 15 chases every noise point. Degree 3 generalizes.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 30;
    const fTrue = (x) => 0.5 + 0.35 * Math.sin(x * TAU);
    const data = points(22, w, h, 11).map(([a, b]) => [a, fTrue(a) + (b - 0.5) * 0.16]);

    // Precompute least-squares poly fits for degrees 1,3,15
    function fit(degree) {
      const n = degree + 1;
      // normal matrix A (Vandermonde)
      const A = data.map(([x]) => Array.from({ length: n }, (_, j) => Math.pow(x, j)));
      const y = data.map(([, v]) => v);
      // solve via Gaussian elimination on normal equations
      const M = Array.from({ length: n }, (_, i) => [...A.reduce((acc, row, k) => {
        acc.push(...[]); return acc;
      }, [])]);
      // Simpler: build ATA and ATy
      const ATA = Array.from({ length: n }, () => new Array(n).fill(0));
      const ATy = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          for (let k = 0; k < data.length; k++) ATA[i][j] += Math.pow(data[k][0], i + j);
        }
        for (let k = 0; k < data.length; k++) ATy[i] += Math.pow(data[k][0], i) * y[k];
      }
      // gaussian elimination
      for (let i = 0; i < n; i++) {
        let piv = i;
        for (let r = i + 1; r < n; r++) if (Math.abs(ATA[r][i]) > Math.abs(ATA[piv][i])) piv = r;
        [ATA[i], ATA[piv]] = [ATA[piv], ATA[i]];
        [ATy[i], ATy[piv]] = [ATy[piv], ATy[i]];
        for (let r = i + 1; r < n; r++) {
          const f = ATA[r][i] / (ATA[i][i] || 1e-9);
          for (let c = i; c < n; c++) ATA[r][c] -= f * ATA[i][c];
          ATy[r] -= f * ATy[i];
        }
      }
      const coef = new Array(n).fill(0);
      for (let i = n - 1; i >= 0; i--) {
        let s = ATy[i];
        for (let j = i + 1; j < n; j++) s -= ATA[i][j] * coef[j];
        coef[i] = s / (ATA[i][i] || 1e-9);
      }
      return coef;
    }

    const fits = { 1: fit(1), 3: fit(3), 15: fit(15) };
    const evalp = (coef, x) => coef.reduce((s, c, j) => s + c * Math.pow(x, j), 0);
    let mode = 0; const modes = [1, 3, 15];
    let raf = 0, tick = 0;

    function frame() {
      tick++;
      if (tick % 240 === 0) mode = (mode + 1) % 3;   // cycle every ~4s
      const deg = modes[mode];
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h); axes(ctx, w, h, m);
      // true function (faint)
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const px = xy(i / 100, w, m), py = h - m - fTrue(i / 100) * (h - 2 * m);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = "rgba(255,209,102,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
      // data
      for (const [a, b] of data) {
        ctx.beginPath(); ctx.arc(xy(a, w, m), h - m - b * (h - 2 * m), 3, 0, TAU);
        ctx.fillStyle = "#4ade80"; ctx.fill();
      }
      // fitted curve
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const x = i / 160;
        const v = Math.max(-0.4, Math.min(1.4, evalp(fits[deg], x)));
        const px = xy(x, w, m), py = h - m - v * (h - 2 * m);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = mode === 0 ? "#ff6b8b" : mode === 1 ? "#4ade80" : "#ff6b8b";
      ctx.lineWidth = 2.5; ctx.stroke();
      const names = ["Underfit — degree 1 (high bias)", "Good fit — degree 3 ✓", "Overfit — degree 15 (high variance)"];
      label(ctx, names[mode], w / 2, m + 2, "rgba(235,240,255,0.95)", "center");
      label(ctx, "dashed gold = the true pattern", w - m, h - 8, "rgba(255,209,102,0.6)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 4. K-MEANS — centroids migrate to clusters
// ============================================================
VIZ["kmeans"] = {
  title: "K-Means Clustering",
  note: "Unsupervised: no labels given. Points get colored by nearest centroid; centroids drift to cluster centers.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    // 3 blobs
    const blobs = [[0.25, 0.3], [0.72, 0.28], [0.5, 0.75]];
    const data = [];
    blobs.forEach(([cx, cy], bi) => {
      for (let i = 0; i < 26; i++) {
        const [a, b] = points(2, w, h, 40 + bi * 17 + i)[0];
        data.push([cx + (a - 0.5) * 0.22, cy + (b - 0.5) * 0.22, bi]);
      }
    });
    let cents = [[0.15, 0.8], [0.85, 0.75], [0.5, 0.15]];  // deliberately wrong
    const cols = ["#6c8cff", "#ff6b8b", "#ffd166"];
    let raf = 0, tick = 0, converged = 0;

    function frame() {
      tick++;
      if (tick % 30 === 0 && converged < 6) {
        // assign step
        const assign = data.map(([x, y]) => {
          let best = 0, bd = 9;
          cents.forEach(([cx, cy], i) => {
            const d = (x - cx) ** 2 + (y - cy) ** 2;
            if (d < bd) { bd = d; best = i; }
          });
          return best;
        });
        // update step
        const sums = cents.map(() => [0, 0, 0]);
        data.forEach(([x, y], i) => {
          sums[assign[i]][0] += x; sums[assign[i]][1] += y; sums[assign[i]][2]++;
        });
        cents = sums.map(([sx, sy, c], i) => c ? [sx / c, sy / c] : cents[i]);
        converged++;
      }
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      data.forEach(([x, y], i) => {
        let best = 0, bd = 9;
        cents.forEach(([cx, cy], ci) => {
          const d = (x - cx) ** 2 + (y - cy) ** 2;
          if (d < bd) { bd = d; best = ci; }
        });
        ctx.beginPath();
        ctx.arc(xy(x, w, m), xy(y, h, m), 3.2, 0, TAU);
        ctx.fillStyle = cols[best]; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      });
      cents.forEach(([cx, cy], i) => {
        ctx.beginPath();
        ctx.arc(xy(cx, w, m), xy(cy, h, m), 7, 0, TAU);
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(xy(cx, w, m), xy(cy, h, m), 2.5, 0, TAU);
        ctx.fillStyle = cols[i]; ctx.fill();
      });
      label(ctx, converged < 6 ? `iteration ${converged} — centroids moving…` : "converged ✓", m + 6, m + 2);
      label(ctx, "K = 3, unlabeled data", w - m, h - 8, "rgba(180,195,255,0.75)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 5. KNN — a query point asks its neighbors for a vote
// ============================================================
VIZ["knn"] = {
  title: "K-Nearest Neighbors",
  note: "The white star is a new point. Its K nearest neighbors vote on its class — watch the decision boundary.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    const K = 5;
    const raw = points(40, w, h, 23);
    const data = raw.map(([a, b], i) => [a, b, ((a * 2.2 + b * 1.4 + (raw[i][0] - 0.5) * 0.6) > 1.05) ? 0 : 1]);
    const q = [0.52, 0.55];
    let raf = 0, t = 0;

    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      // distance lines to K nearest
      const withD = data.map(([x, y, c]) => ({ x, y, c, d: (x - q[0]) ** 2 + (y - q[1]) ** 2 }))
        .sort((a, b) => a.d - b.d);
      const kn = withD.slice(0, K);
      withD.forEach((p, i) => {
        const isN = kn.includes(p);
        ctx.beginPath();
        ctx.arc(xy(p.x, w, m), xy(p.y, h, m), isN ? 4.5 : 3, 0, TAU);
        ctx.fillStyle = p.c === 0 ? "#6c8cff" : "#ff6b8b";
        ctx.globalAlpha = isN ? 1 : 0.45; ctx.fill(); ctx.globalAlpha = 1;
      });
      kn.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(xy(p.x, w, m), xy(p.y, h, m));
        ctx.lineTo(xy(q[0], w, m), xy(q[1], h, m));
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      });
      // query star
      const qx = xy(q[0], w, m), qy = xy(q[1], h, m);
      const pulse = 7 + Math.sin(t / 20) * 1.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = -Math.PI / 2 + (i * TAU) / 5, a2 = a1 + TAU / 10;
        ctx.lineTo(qx + Math.cos(a1) * pulse, qy + Math.sin(a1) * pulse);
        ctx.lineTo(qx + Math.cos(a2) * (pulse * 0.45), qy + Math.sin(a2) * (pulse * 0.45));
      }
      ctx.closePath();
      ctx.fillStyle = "#fff"; ctx.fill();
      const votes = [0, 0]; kn.forEach((p) => votes[p.c]++);
      const winner = votes[0] > votes[1] ? "class A (blue)" : "class B (pink)";
      label(ctx, `K = ${K} → voted ${winner} (${votes[0]}–${votes[1]})`, m + 6, m + 2);
      label(ctx, "dashed lines = distances", w - m, h - 8, "rgba(180,195,255,0.7)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 6. DECISION TREE SPLITS — axis splits carving the space
// ============================================================
VIZ["tree"] = {
  title: "Decision Tree Splits",
  note: "Each split carves the space with a simple question ('x > 0.5?'). Deep trees memorize, shallow ones generalize.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    const raw = points(46, w, h, 31);
    const data = raw.map(([a, b]) => [a, b, (b > 0.5 + 0.28 * Math.sin(a * TAU)) ? 0 : 1]);
    // recursive split rectangles
    const rects = [];
    function split(x0, y0, x1, y1, depth, axis) {
      const pts = data.filter(([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
      if (depth === 0 || pts.length < 6) {
        const A = pts.filter((p) => p[2] === 0).length;
        rects.push({ x0, y0, x1, y1, cls: A > pts.length / 2 ? 0 : 1 });
        return;
      }
      const vals = pts.map((p) => p[axis]).sort();
      const mid = (vals[Math.floor(vals.length / 2) - 1] + vals[Math.floor(vals.length / 2)]) / 2;
      if (axis === 0) {
        split(x0, y0, mid, y1, depth - 1, 1);
        split(mid, y0, x1, y1, depth - 1, 1);
      } else {
        split(x0, y0, x1, mid, depth - 1, 0);
        split(x0, mid, x1, y1, depth - 1, 0);
      }
    }
    let depth = 0, raf = 0, tick = 0;
    function frame() {
      tick++;
      if (tick % 90 === 0 && tick > 30) { depth = (depth + 1) % 5; rects.length = 0; }
      if (rects.length === 0 && depth > 0) split(0, 0, 1, 1, depth, 0);
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      for (const r of rects) {
        const alpha = depth === 4 ? 0.34 : 0.22;
        ctx.fillStyle = r.cls === 0 ? `rgba(108,140,255,${alpha})` : `rgba(255,107,139,${alpha})`;
        ctx.fillRect(xy(r.x0, w, m), xy(r.y0, h, m),
          xy(r.x1, w, m) - xy(r.x0, w, m), xy(r.y1, h, m) - xy(r.y0, h, m));
        ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.strokeRect(
          xy(r.x0, w, m), xy(r.y0, h, m),
          xy(r.x1, w, m) - xy(r.x0, w, m), xy(r.y1, h, m) - xy(r.y0, h, m));
      }
      data.forEach(([x, y, c]) => {
        ctx.beginPath(); ctx.arc(xy(x, w, m), xy(y, h, m), 3, 0, TAU);
        ctx.fillStyle = c === 0 ? "#6c8cff" : "#ff6b8b"; ctx.fill();
      });
      const cap = depth === 0 ? "depth 0 — one box, no questions asked"
        : `depth ${depth} — ${depth} question${depth > 1 ? "s" : ""} per path`;
      label(ctx, cap, m + 6, m + 2);
      label(ctx, depth === 4 ? "deep = memorizing noise (overfit risk)" : "shallow = generalizing", w - m, h - 8, "rgba(180,195,255,0.7)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 7. NEURAL NETWORK — signal flows forward through layers
// ============================================================
VIZ["nn"] = {
  title: "Neural Network Forward Pass",
  note: "Inputs flow left to right: weighted sums + activation at each layer produce the output. Colors = activation strength.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const layers = [3, 5, 5, 2];
    const nodes = layers.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({
        x: 50 + li * ((w - 100) / (layers.length - 1)),
        y: h / 2 + (i - (n - 1) / 2) * (h / (Math.max(...layers) + 1)),
        a: 0,           // activation 0..1
        pulsing: false,
      })));
    let raf = 0, t = 0, wave = -0.5;

    function frame() {
      t++;
      wave += 0.012;
      if (wave > 1.5) wave = -0.5;   // loop the wave
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 48);
      // connections
      for (let li = 0; li < layers.length - 1; li++) {
        for (const a of nodes[li]) for (const b of nodes[li + 1]) {
          const lit = wave > li * 0.25 + 0.15 && wave < li * 0.25 + 0.75;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = lit ? "rgba(108,140,255,0.5)" : "rgba(120,140,255,0.10)";
          ctx.lineWidth = lit ? 1.6 : 0.8;
          ctx.stroke();
        }
      }
      // nodes
      nodes.forEach((layer, li) => layer.forEach((n) => {
        const lit = wave > li * 0.25 + 0.1 && wave < li * 0.25 + 0.6;
        const glow = lit ? 0.5 + 0.5 * Math.sin((wave - li * 0.25) * 6) : 0.18;
        ctx.beginPath(); ctx.arc(n.x, n.y, lit ? 8 : 6, 0, TAU);
        ctx.fillStyle = `rgba(108,140,255,${0.25 + glow * 0.6})`; ctx.fill();
        ctx.strokeStyle = "rgba(200,215,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
      }));
      const names = ["input", "hidden", "hidden", "output"];
      names.forEach((nm, li) => {
        label(ctx, nm, nodes[li][0].x, 16, "rgba(220,228,255,0.85)", "center");
      });
      label(ctx, wave > 1.2 ? "prediction out →" : "forward pass…", w - 50, h - 12, "rgba(180,195,255,0.8)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 8. PCA — variance flattens onto the top principal axis
// ============================================================
VIZ["pca"] = {
  title: "PCA — Dimensionality Reduction",
  note: "PCA finds the direction of maximum variance (PC1). Projecting onto it keeps the most information in fewer dimensions.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    // correlated 2D gaussian-ish data
    const data = points(60, w, h, 5).map(([a, b]) => {
      const x = a, y = 0.3 + 0.4 * a + (b - 0.5) * 0.25;
      return [x, y];
    });
    // compute mean + covariance, then top eigenvector via power iteration
    const mx = data.reduce((s, [x]) => s + x, 0) / data.length;
    const my = data.reduce((s, [, y]) => s + y, 0) / data.length;
    let cxx = 0, cxy = 0, cyy = 0;
    for (const [x, y] of data) {
      cxx += (x - mx) ** 2; cxy += (x - mx) * (y - my); cyy += (y - my) ** 2;
    }
    cxx /= data.length; cxy /= data.length; cyy /= data.length;
    // power iteration on [[cxx,cxy],[cxy,cyy]]
    let vx = 1, vy = 0.3;
    for (let it = 0; it < 30; it++) {
      const nx = cxx * vx + cxy * vy, ny = cxy * vx + cyy * vy;
      const len = Math.hypot(nx, ny) || 1e-9;
      vx = nx / len; vy = ny / len;
    }
    let phase = 0, raf = 0;

    function frame() {
      phase += 0.01;
      const proj = Math.min(1, Math.max(0, (phase - 0.2) / 0.5)); // 0→1 projection sweep
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      // PC1 line through mean
      const L = 0.75;
      ctx.beginPath();
      ctx.moveTo(xy(mx - vx * L, w, m), xy(my - vy * L, h, m));
      ctx.lineTo(xy(mx + vx * L, w, m), xy(my + vy * L, h, m));
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.stroke();
      label(ctx, "PC1 — direction of max variance", xy(mx + vx * L, w, m) - 10, xy(my + vy * L, h, m) - 8, "rgba(255,209,102,0.9)", "right");
      data.forEach(([x, y]) => {
        const t = (x - mx) * vx + (y - my) * vy;   // scalar projection
        const pxp = mx + vx * t, pyp = my + vy * t; // projected point
        const px = xy(x, w, m), py = xy(y, h, m);
        const jx = xy(pxp, w, m), jy = xy(pyp, h, m);
        // projection drop line
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(jx, jy);
        ctx.strokeStyle = `rgba(255,107,139,${0.15 + proj * 0.35})`; ctx.lineWidth = 1; ctx.stroke();
        // point glides onto the line as proj→1
        const gx = px + (jx - px) * proj, gy = py + (jy - py) * proj;
        ctx.beginPath(); ctx.arc(gx, gy, 3, 0, TAU);
        ctx.fillStyle = proj > 0.98 ? "#ffd166" : "#4ade80"; ctx.fill();
      });
      label(ctx, proj > 0.98 ? "2D → 1D done — variance preserved ✓" : "projecting onto PC1…", m + 6, m + 2);
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 9. CONFUSION MATRIX — classification outcomes live
// ============================================================
VIZ["conf-matrix"] = {
  title: "Confusion Matrix & Metrics",
  note: "100 patients, 20 actually sick. Precision = trust in positives; Recall = how many sick we caught. See the trade-off when the threshold moves.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 30;
    const N = 100, sick = 20;
    let threshold = 0.5, dir = 1, raf = 0, tick = 0;
    const data = points(N, w, h, 99).map(([a, b], i) => ({
      ill: i < sick,
      score: Math.min(0.98, Math.max(0.02, (i < sick ? 0.35 + a * 0.6 : b * 0.75))),
    }));

    function frame() {
      tick++;
      if (tick % 3 === 0) {
        threshold += dir * 0.006;
        if (threshold > 0.9) dir = -1;
        if (threshold < 0.15) dir = 1;
      }
      let TP = 0, FP = 0, FN = 0, TN = 0;
      for (const d of data) {
        const pred = d.score >= threshold;
        if (d.ill && pred) TP++; else if (!d.ill && pred) FP++;
        else if (d.ill && !pred) FN++; else TN++;
      }
      const prec = TP + FP ? TP / (TP + FP) : 0, rec = TP + FN ? TP / (TP + FN) : 0;

      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      // 2x2 matrix
      const bw = (w - 2 * m) / 2 - 6, bh = (h - 2 * m) / 2 - 6;
      const cells = [
        { v: TP, t: "TP — caught sick", c: "rgba(74,222,128,0.75)" },
        { v: FP, t: "FP — false alarm", c: "rgba(255,209,102,0.55)" },
        { v: FN, t: "FN — missed sick", c: "rgba(255,107,139,0.65)" },
        { v: TN, t: "TN — healthy ✓", c: "rgba(108,140,255,0.4)" },
      ];
      cells.forEach((c, i) => {
        const cx = m + (i % 2) * (bw + 12), cy = m + Math.floor(i / 2) * (bh + 12);
        ctx.fillStyle = c.c;
        ctx.globalAlpha = 0.25 + Math.min(1, c.v / 30) * 0.75;
        ctx.fillRect(cx, cy, bw, bh);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.strokeRect(cx, cy, bw, bh);
        label(ctx, String(c.v), cx + bw / 2, cy + bh / 2 - 2, "#fff", "center");
        ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(235,240,255,0.85)";
        ctx.fillText(c.t, cx + bw / 2, cy + bh / 2 + 12);
      });
      label(ctx, `threshold ${threshold.toFixed(2)}  ·  precision ${prec.toFixed(2)}  ·  recall ${rec.toFixed(2)}`, w / 2, h - 8, "rgba(220,228,255,0.9)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 10. SVM — margin maximization between two classes
// ============================================================
VIZ["svm"] = {
  title: "Support Vector Machine",
  note: "Many lines separate the classes, but SVM picks the one with the maximum margin. Circled points = support vectors.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    const raw = points(44, w, h, 77);
    const data = raw.map(([a, b]) => [a, b, a + b > 1.0 ? 0 : 1]);
    // decision boundary: a+b=1  →  in canvas coords
    let raf = 0, t = 0;
    const lines = [[0.9, 1.0], [1.0, 1.0], [1.1, 1.0]]; // slope pairs to show alternatives

    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 44);
      data.forEach(([x, y, c]) => {
        ctx.beginPath(); ctx.arc(xy(x, w, m), xy(y, h, m), 3.2, 0, TAU);
        ctx.fillStyle = c === 0 ? "#6c8cff" : "#ff6b8b"; ctx.fill();
      });
      // alternative separators (faint) — any of many lines that still separate
      [[0.62, 1.5], [1.38, 0.5]].forEach(([sLo, sHi]) => {
        ctx.beginPath();
        ctx.moveTo(xy(-0.05, w, m), xy(sHi, h, m));
        ctx.lineTo(xy(1.05, w, m), xy(sLo, h, m));
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // max margin boundary a+b = 1
      ctx.beginPath();
      ctx.moveTo(xy(-0.1, w, m), xy(1.1, h, m));
      ctx.lineTo(xy(1.1, w, m), xy(-0.1, h, m));
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2.5; ctx.stroke();
      // margin band
      ctx.save();
      ctx.translate(0, 0);
      ctx.beginPath();
      ctx.moveTo(xy(-0.1, w, m), xy(1.1 - 0.28, h, m));
      ctx.lineTo(xy(1.1 - 0.28, w, m), xy(-0.1, h, m));
      ctx.lineTo(xy(1.1 + 0.28, w, m), xy(-0.1, h, m));
      ctx.lineTo(xy(-0.1, w, m), xy(1.1 + 0.28, h, m));
      ctx.closePath();
      ctx.fillStyle = "rgba(255,209,102,0.08)"; ctx.fill();
      ctx.restore();
      // support vectors: closest points to the line
      const sv = data
        .map((p) => ({ p, d: Math.abs(p[0] + p[1] - 1.0) }))
        .sort((a, b) => a.d - b.d).slice(0, 4);
      for (const { p } of sv) {
        ctx.beginPath();
        ctx.arc(xy(p[0], w, m), xy(p[1], h, m), 7, 0, TAU);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.stroke();
      }
      label(ctx, "max-margin line", xy(0.62, w, m), xy(0.44, h, m), "rgba(255,209,102,0.95)");
      label(ctx, "circled = support vectors", w - m, h - 8, "rgba(180,195,255,0.75)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 11. ACTIVATION FUNCTIONS — why non-linearity matters
// ============================================================
VIZ["activation"] = {
  title: "Activation Functions",
  note: "Without non-linear activations, a 100-layer network collapses into one linear map. Watch each function's shape.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 30;
    const fns = [
      { n: "ReLU", f: (x) => Math.max(0, x), c: "#4ade80" },
      { n: "Sigmoid", f: (x) => 1 / (1 + Math.exp(-x)), c: "#6c8cff" },
      { n: "tanh", f: (x) => Math.tanh(x), c: "#ffd166" },
      { n: "linear", f: (x) => x, c: "#ff6b8b" },
    ];
    let raf = 0, t = 0;
    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 46);
      const span = 5;                    // x from -2.5..2.5
      fns.forEach((fn, fi) => {
        const cx = m + fi * ((w - 2 * m) / 4), cw = (w - 2 * m) / 4;
        // mini axes
        ctx.strokeStyle = "rgba(200,210,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(cx, m); ctx.lineTo(cx, h - m); ctx.moveTo(cx - cw / 2 + 6, h / 2); ctx.lineTo(cx + cw / 2 - 6, h / 2);
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const x = -span / 2 + (i / 60) * span;
          const v = fn.f(x);
          const px = cx - cw / 2 + 6 + (i / 60) * (cw - 12);
          const py = h / 2 - v * (h - 2 * m) * 0.16;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = fn.c; ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t / 60 + fi * 1.4));
        ctx.stroke(); ctx.globalAlpha = 1;
        label(ctx, fn.n, cx, h - m + 12, fn.c, "center");
      });
      label(ctx, "linear → stack 100 layers, still just a line ✗", w / 2, 16, "rgba(255,107,139,0.85)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// public API
// ============================================================
export function visualFor(id) {
  return VIZ[id] || null;
}
export function visualList() {
  return Object.keys(VIZ);
}

// Attach a demo to a .vsl-card element
export function mountVisual(card, id) {
  const def = VIZ[id];
  if (!def) return null;
  card.innerHTML = `
    <div class="vsl-head">
      <span class="vsl-title">${def.title}</span>
      <button class="vsl-replay" title="Restart demo">↻ Replay</button>
    </div>
    <canvas width="560" height="300" class="vsl-canvas"></canvas>
    <p class="vsl-note">${def.note}</p>`;
  const canvas = card.querySelector("canvas");
  let inst = def.build(canvas);
  card.querySelector(".vsl-replay").addEventListener("click", () => {
    inst.stop?.();
    inst = def.build(canvas);
  });
  return inst;
}

// ============================================================
// 12. ML PROJECT LIFECYCLE — the full machine-learning loop
// ============================================================
VIZ["ml-loop"] = {
  title: "The ML Project Lifecycle",
  note: "Machine learning is a loop, not a line: data feeds a model, the model makes predictions, errors feedback and improve the next round.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const nodes = [
      { x: 0.5, y: 0.14, t: "1. Collect Data", c: "#4dd0e1" },
      { x: 0.82, y: 0.42, t: "2. Clean & Prepare", c: "#4ade80" },
      { x: 0.68, y: 0.82, t: "3. Train Model", c: "#6c8cff" },
      { x: 0.32, y: 0.82, t: "4. Evaluate", c: "#ffd166" },
      { x: 0.18, y: 0.42, t: "5. Deploy", c: "#ff6b8b" },
    ].map(n => ({ ...n, X: n.x * w, Y: n.y * h, R: Math.min(w, h) * 0.105 }));
    const ring = Math.min(w, h) * 0.34;
    const cx = w / 2, cy = h / 2;
    let raf = 0, t = 0;

    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 48);
      // orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, ring, 0, TAU);
      ctx.strokeStyle = "rgba(120,140,255,0.18)"; ctx.lineWidth = 2; ctx.stroke();
      // rotating packet along the ring
      const ang = (t / 120) % 1;
      const packetX = cx + Math.cos(ang * TAU - Math.PI / 2) * ring;
      const packetY = cy + Math.sin(ang * TAU - Math.PI / 2) * ring;
      // connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i], b = nodes[(i + 1) % nodes.length];
        ctx.beginPath(); ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y);
        ctx.strokeStyle = "rgba(160,175,255,0.22)"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // feedback arrow (evaluate -> collect) dashed
      ctx.beginPath();
      ctx.moveTo(nodes[3].X - 6, nodes[3].Y - 30);
      ctx.quadraticCurveTo(cx, cy - ring - 42, nodes[0].X + 6, nodes[0].Y - 6);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(255,209,102,0.5)"; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.setLineDash([]);
      // nodes with pulse as the packet passes
      nodes.forEach((n, i) => {
        const na = i / nodes.length - 0.25;
        const d = Math.abs(((ang - na) % 1 + 1.5) % 1 - 0.5);
        const pulse = d < 0.09 ? 1 - d / 0.09 : 0;
        ctx.beginPath(); ctx.arc(n.X, n.Y, n.R + pulse * 5, 0, TAU);
        ctx.fillStyle = "rgba(8,14,34,0.95)"; ctx.fill();
        ctx.strokeStyle = n.c; ctx.lineWidth = 2 + pulse * 1.6; ctx.stroke();
        label(ctx, n.t, n.X, n.Y + 3, "rgba(235,240,255,0.95)", "center");
      });
      // packet
      ctx.beginPath(); ctx.arc(packetX, packetY, 5, 0, TAU);
      ctx.fillStyle = "#fff"; ctx.fill();
      label(ctx, "errors & new data feed back → the loop never ends", w / 2, h - 8, "rgba(255,209,102,0.75)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 13. TYPES OF MACHINE LEARNING — supervised vs unsupervised vs RL
// ============================================================
VIZ["ml-types"] = {
  title: "Types of Machine Learning",
  note: "Supervised learns from labeled examples. Unsupervised finds structure without labels. Reinforcement learns by acting and receiving rewards.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 22;
    const panelW = (w - 2 * m - 24) / 3;
    let raf = 0, t = 0;
    const panels = [
      { title: "Supervised", sub: "with labels", c: "#4ade80" },
      { title: "Unsupervised", sub: "no labels", c: "#6c8cff" },
      { title: "Reinforcement", sub: "reward-based", c: "#ffd166" },
    ];

    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      panels.forEach((p, pi) => {
        const x0 = m + pi * (panelW + 12);
        ctx.strokeStyle = "rgba(200,215,255,0.25)";
        ctx.strokeRect(x0, m + 16, panelW, h - 2 * m - 16);
        label(ctx, p.title, x0 + panelW / 2, m + 4, p.c, "center");
        label(ctx, p.sub, x0 + panelW / 2, h - m + 2, "rgba(200,212,240,0.7)", "center");
        const rnd = () => {
          const s = Math.sin((pi + 1) * 999 + Math.floor(t / 26) * 77.7) * 43758.5453;
          return s - Math.floor(s);
        };
        for (let i = 0; i < 14; i++) {
          const px = x0 + 10 + rnd() * (panelW - 20);
          const py = m + 30 + rnd() * (h - 2 * m - 60);
          if (pi === 0) {
            ctx.beginPath(); ctx.arc(px, py, 3.5, 0, TAU);
            ctx.fillStyle = i % 2 ? "#4ade80" : "#ff6b8b"; ctx.fill();
            label(ctx, i % 2 ? "✓" : "✗", px + 6, py + 3, "rgba(255,255,255,0.75)");
          } else if (pi === 1) {
            ctx.beginPath(); ctx.arc(px, py, 3.5, 0, TAU);
            ctx.fillStyle = "rgba(108,140,255,0.6)"; ctx.fill();
          } else {
            ctx.beginPath(); ctx.arc(px, py, 3.5, 0, TAU);
            ctx.fillStyle = "rgba(255,209,102,0.55)"; ctx.fill();
          }
        }
        if (pi === 2) {
          // agent moves toward + reward
          const ax = x0 + panelW / 2 + Math.sin(t / 40) * (panelW / 4);
          const ay = h / 2 + 8 + Math.cos(t / 55) * 24;
          ctx.beginPath(); ctx.arc(ax, ay, 5, 0, TAU);
          ctx.fillStyle = "#ffd166"; ctx.fill();
          label(ctx, "R +1", ax + 10, ay - 8, "rgba(255,209,102,0.9)");
        }
      });
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 14. REGULARIZATION L1 vs L2 — weights shrink to zero / near zero
// ============================================================
VIZ["reg-l1l2"] = {
  title: "Regularization: L1 vs L2",
  note: "Both penalize big weights to fight overfitting. L1 (Lasso) pushes weights exactly to zero — built-in feature selection. L2 (Ridge) shrinks them near zero.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 26;
    let lambda = 0.02, dir = 1, raf = 0, tick = 0;
    const w0 = [0.9, 0.75, 0.6, 0.45, 0.3, 0.18, 0.1, 0.05]; // initial weights

    function frame() {
      tick++;
      if (tick % 3 === 0) {
        lambda += dir * 0.006;
        if (lambda > 0.35) dir = -1;
        if (lambda < 0.02) dir = 1;
      }
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 46);
      const y0 = h - m;
      w0.forEach((wi, i) => {
        const bx = m + 24 + i * ((w - 2 * m - 40) / w0.length);
        const l1 = Math.max(0, wi - lambda * 2.1);          // hard threshold → 0
        const l2 = wi / (1 + lambda * 3.4);                 // smooth shrink
        const bh1 = l1 * (h - 2 * m), bh2 = l2 * (h - 2 * m);
        // L1 bar
        ctx.fillStyle = "rgba(108,140,255,0.75)";
        ctx.fillRect(bx - 9, y0 - bh1, 8, bh1);
        // L2 bar
        ctx.fillStyle = "rgba(255,107,139,0.7)";
        ctx.fillRect(bx + 1, y0 - bh2, 8, bh2);
        if (l1 === 0) label(ctx, "0", bx - 5, y0 - bh1 - 6, "rgba(108,140,255,0.95)", "center");
      });
      label(ctx, "blue = L1 (Lasso)   pink = L2 (Ridge)", m + 6, m + 2);
      label(ctx, `λ = ${lambda.toFixed(2)} — stronger penalty →`, w - m, h - 8, "rgba(200,212,240,0.8)", "right");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 15. LOGISTIC REGRESSION — sigmoid squeeze into a probability
// ============================================================
VIZ["log-reg"] = {
  title: "Logistic Regression & the Sigmoid",
  note: "Any input is squeezed through the S-curve into 0..1 — a probability. Below 0.5 class A, above class B. That is classification from regression.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 32;
    let raf = 0, t = 0;
    const sig = (x) => 1 / (1 + Math.exp(-x));

    function frame() {
      t++;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h); axes(ctx, w, h, m);
      // sigmoid curve
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * 10 - 5;
        const px = xy((x + 5) / 10, w, m);
        const py = h - m - sig(x) * (h - 2 * m);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = "#6c8cff"; ctx.lineWidth = 2.5; ctx.stroke();
      // 0.5 threshold line
      const ty = h - m - 0.5 * (h - 2 * m);
      ctx.beginPath(); ctx.moveTo(m, ty); ctx.lineTo(w - m, ty);
      ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,209,102,0.6)"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
      label(ctx, "0.5 decision boundary", w - m - 6, ty - 6, "rgba(255,209,102,0.85)", "right");
      // moving sample riding the curve
      const x = Math.sin(t / 90) * 4.4;
      const y = sig(x);
      const px = xy((x + 5) / 10, w, m), py = h - m - y * (h - 2 * m);
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, TAU);
      ctx.fillStyle = y >= 0.5 ? "#ff6b8b" : "#4ade80"; ctx.fill();
      label(ctx, `P(y=1) = ${y.toFixed(2)} → class ${y >= 0.5 ? "B" : "A"}`, px, py - 12, "#fff", "center");
      label(ctx, "input →", w - m, h - 8, "rgba(180,195,255,0.8)", "right");
      label(ctx, "probability ↑", 6, m + 4);
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 16. ROC CURVE & AUC — sweeping the threshold
// ============================================================
VIZ["roc"] = {
  title: "ROC Curve & AUC",
  note: "Every threshold gives one (FPR, TPR) point. Sweeping it traces the ROC curve; the area under it (AUC) measures how well the model ranks classes.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, m = 34;
    let th = 0.02, dir = 1, raf = 0, tick = 0;
    const ill = points(30, w, h, 3).map(([a]) => 0.55 + a * 0.42);
    const ok = points(30, w, h, 4).map(([a]) => a * 0.5);

    function frame() {
      tick++;
      if (tick % 2 === 0) {
        th += dir * 0.012;
        if (th > 0.98) dir = -1;
        if (th < 0.02) dir = 1;
      }
      const tpr = ill.filter((s) => s >= th).length / ill.length;
      const fpr = ok.filter((s) => s >= th).length / ok.length;
      ctx.clearRect(0, 0, w, h);
      // left: distributions + moving threshold
      const lw = w * 0.42;
      grid(ctx, lw, h, 40);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, lw + 2, h); ctx.clip();
      ok.forEach((s, i) => {
        ctx.beginPath(); ctx.arc(xy(s, lw, m), h - m - 10 - (i % 5) * 7, 3, 0, TAU);
        ctx.fillStyle = "rgba(108,140,255,0.75)"; ctx.fill();
      });
      ill.forEach((s, i) => {
        ctx.beginPath(); ctx.arc(xy(s, lw, m), h - m - 10 - (i % 5) * 7, 3, 0, TAU);
        ctx.fillStyle = "rgba(255,107,139,0.8)"; ctx.fill();
      });
      const tx = xy(th, lw, m);
      ctx.beginPath(); ctx.moveTo(tx, m); ctx.lineTo(tx, h - m);
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.stroke();
      label(ctx, "scores + threshold", m + 4, m + 2);
      ctx.restore();
      // right: ROC space with AUC fill
      const rx0 = lw + 24, rw = w - rx0 - m;
      ctx.strokeStyle = "rgba(200,215,255,0.3)";
      ctx.strokeRect(rx0, m, rw, h - 2 * m);
      ctx.strokeStyle = "rgba(200,215,255,0.18)";
      ctx.beginPath(); ctx.moveTo(rx0, h - m); ctx.lineTo(rx0 + rw, m); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx0, h - m);
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        const tp = Math.min(1, Math.pow(f, 0.32));
        ctx.lineTo(rx0 + f * rw, h - m - tp * (h - 2 * m));
      }
      ctx.lineTo(rx0 + rw, h - m);
      ctx.closePath();
      ctx.fillStyle = "rgba(74,222,128,0.14)"; ctx.fill();
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        const tp = Math.min(1, Math.pow(f, 0.32));
        const px = rx0 + f * rw, py = h - m - tp * (h - 2 * m);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2.2; ctx.stroke();
      label(ctx, "ROC — TPR vs FPR", rx0 + rw / 2, m + 14, "rgba(220,228,255,0.9)", "center");
      ctx.beginPath(); ctx.arc(rx0 + fpr * rw, h - m - tpr * (h - 2 * m), 5, 0, TAU);
      ctx.fillStyle = "#ffd166"; ctx.fill();
      label(ctx, `AUC ≈ 0.9 · threshold ${th.toFixed(2)}`, rx0 + rw / 2, h - 8, "rgba(200,212,240,0.85)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};

// ============================================================
// 17. BACKPROPAGATION — error flows backward, weights adjust
// ============================================================
VIZ["backprop"] = {
  title: "Backpropagation",
  note: "Forward: inputs produce a prediction. Backward: the error flows back through the network, and every weight nudges to reduce it. Repeat millions of times.",
  build(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const layers = [3, 4, 4, 1];
    const nodes = layers.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({
        x: 46 + li * ((w - 92) / (layers.length - 1)),
        y: h / 2 + (i - (n - 1) / 2) * (h / 6.5),
      })));
    let raf = 0, t = 0;
    const phaseLen = 150;

    function frame() {
      t++;
      const ph = (t % (phaseLen * 2)) / phaseLen;
      const fwd = ph < 1;
      const p = fwd ? ph : ph - 1;
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h, 48);
      for (let li = 0; li < layers.length - 1; li++) {
        for (const a of nodes[li]) for (const b of nodes[li + 1]) {
          const litF = fwd && p > li / 3 && p < (li + 1.4) / 3;
          const litB = !fwd && p > (3 - li - 1) / 3 && p < (3 - li + 0.4) / 3;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = litF ? "rgba(74,222,128,0.55)" : litB ? "rgba(255,107,139,0.6)" : "rgba(120,140,255,0.10)";
          ctx.lineWidth = litF || litB ? 1.8 : 0.8; ctx.stroke();
        }
      }
      nodes.forEach((layer, li) => layer.forEach((n) => {
        const litF = fwd && p > li / 3 && p < (li + 1.4) / 3;
        const litB = !fwd && p > (3 - li - 1) / 3 && p < (3 - li + 0.4) / 3;
        ctx.beginPath(); ctx.arc(n.x, n.y, litF || litB ? 8 : 6, 0, TAU);
        ctx.fillStyle = litF ? "rgba(74,222,128,0.8)" : litB ? "rgba(255,107,139,0.8)" : "rgba(108,140,255,0.3)";
        ctx.fill();
        ctx.strokeStyle = "rgba(200,215,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
      }));
      label(ctx, fwd ? "FORWARD — making a prediction" : "BACKWARD — error updates the weights",
        w / 2, 18, fwd ? "rgba(74,222,128,0.95)" : "rgba(255,107,139,0.95)", "center");
      label(ctx, fwd ? "input → layers → prediction" : "loss ← gradients ← weights", w / 2, h - 10,
        "rgba(200,212,240,0.75)", "center");
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { stop: () => cancelAnimationFrame(raf) };
  },
};
