// ============================================================
// DS Galaxy — ML Galaxy: a second galaxy that teaches Machine
// Learning "pin to pin" with 17 lessons, each with a live
// animated demo (src/visuals.js). Hyperspace warp both ways.
// ============================================================

import { mountVisual } from "./visuals.js";

const LESSONS = [
  // ---------------- Ring 1 · Foundations ----------------
  {
    demo: "ml-loop",
    title: "What is Machine Learning?",
    blurb:
      "Instead of hand-writing rules, we feed examples to an algorithm and let it find the pattern itself. The demo shows the full loop every ML project runs: collect data, prepare it, train, evaluate, deploy — and errors feed back to make the next version better.",
    points: [
      "Traditional programming: rules + data → answers. Machine learning: data + answers → rules.",
      "A model is just a function with adjustable parameters — training finds the best values.",
      "The loop is continuous: real projects retrain as new data arrives.",
    ],
    interview:
      "\"Machine learning is teaching computers to find patterns from data instead of programming explicit rules — the model improves automatically with more examples.\"",
  },
  {
    demo: "ml-types",
    title: "Types of Machine Learning",
    blurb:
      "Supervised learning trains on labeled examples (spam / not spam). Unsupervised learning finds hidden structure in unlabeled data (customer segments). Reinforcement learning trains an agent by rewarding good actions (game AI, robotics).",
    points: [
      "Supervised splits into classification (discrete labels) and regression (continuous numbers).",
      "Unsupervised main tools: clustering (K-Means), dimensionality reduction (PCA).",
      "Reinforcement = agent + environment + rewards; it learns a policy, not a function from labels.",
      "Semi-supervised and self-supervised sit between these when labels are scarce.",
    ],
    interview:
      "\"The three main paradigms are supervised, unsupervised and reinforcement learning — labels, structure, and rewards respectively.\"",
  },
  {
    demo: "lin-reg",
    title: "Linear Regression",
    blurb:
      "The 'hello world' of ML: fit a straight line through data by minimizing the sum of squared errors. The line starts random and learns — watch the MSE counter fall as the weights adjust.",
    points: [
      "Hypothesis: y = w₀ + w₁x — the weights are learned, not chosen.",
      "Loss = Mean Squared Error; closed-form solution exists (Normal Equation).",
      "Assumptions: linearity, independence, constant error variance (homoscedasticity).",
      "Watch out for outliers — squared error makes them very influential.",
    ],
    interview:
      "\"Linear regression fits y = wx + b by minimizing MSE; I check linearity assumptions and watch for outliers that pull the fit.\"",
  },
  {
    demo: "log-reg",
    title: "Logistic Regression",
    blurb:
      "Despite the name, it is a classifier. Inputs are squeezed through the sigmoid S-curve into a probability between 0 and 1; above 0.5 predict class B, below predict class A.",
    points: [
      "Sigmoid: σ(z) = 1 / (1 + e^-z) turns any real number into a probability.",
      "Trained with log-loss (cross-entropy), not MSE.",
      "Outputs a probability — you can move the 0.5 threshold depending on costs (fraud vs medicine).",
      "Coefficients are interpretable — why it stays popular in credit scoring and healthcare.",
    ],
    interview:
      "\"Logistic regression predicts probability via the sigmoid and classifies at a threshold — trained with cross-entropy loss.\"",
  },
  {
    demo: "grad-descent",
    title: "Gradient Descent",
    blurb:
      "How models actually learn: stand on the loss curve, feel the slope, step downhill. The ball is the current parameter value; the step size is the learning rate.",
    points: [
      "Update rule: w = w − lr × gradient. Too big lr → diverges; too small → crawls.",
      "Batch GD uses all data per step; SGD uses one sample (noisy but fast); mini-batch is the sweet spot.",
      "Modern optimizers: Momentum, RMSProp, Adam adapt the step size per parameter.",
      "Local minima and plateaus are why momentum and adaptive lr matter.",
    ],
    interview:
      "\"Gradient descent iteratively moves parameters opposite the gradient to minimize loss — learning rate controls the step size.\"",
  },
  // ---------------- Ring 2 · Core Algorithms ----------------
  {
    demo: "knn",
    title: "K-Nearest Neighbors",
    blurb:
      "No training at all: to classify a new point, look at the K closest labeled points and take a majority vote. Distance is everything — usually Euclidean.",
    points: [
      "Lazy learner: no training phase, all the work happens at prediction time.",
      "Small K → noisy, overfits; large K → over-smooths. Pick K by cross-validation (odd K avoids ties).",
      "Scale features first — unscaled distances are meaningless.",
      "Slow on big datasets (stores everything); ANN indexes and KD-trees speed it up.",
    ],
    interview:
      "\"KNN is a lazy, non-parametric classifier — majority vote among the K nearest neighbors; feature scaling and K choice are critical.\"",
  },
  {
    demo: "tree",
    title: "Decision Trees & Random Forests",
    blurb:
      "A tree asks yes/no questions about features, splitting the data to reduce impurity. Deeper trees memorize; forests average many trees to generalize.",
    points: [
      "Splits chosen by Gini impurity or entropy (information gain).",
      "Depth controls the bias-variance trade-off — cap it or prune.",
      "Random Forest = many trees on bootstrap samples + random feature subsets (bagging).",
      "Boosting (XGBoost, LightGBM) builds trees sequentially, correcting previous errors.",
    ],
    interview:
      "\"Decision trees split on the feature that most reduces impurity; random forests bag many trees to cut variance, boosting builds them sequentially to cut bias.\"",
  },
  {
    demo: "svm",
    title: "Support Vector Machines",
    blurb:
      "Many lines can separate two classes — SVM picks the one with the widest margin. The few points touching the margin (support vectors) alone define the boundary.",
    points: [
      "Maximizes the margin → better generalization than a barely-separating line.",
      "The kernel trick maps data to higher dimensions without computing coordinates (RBF, polynomial).",
      "C parameter: higher C = fewer margin violations (overfit risk); lower C = softer margin.",
      "Great for small-to-medium datasets; struggles past ~100k samples.",
    ],
    interview:
      "\"SVM finds the maximum-margin hyperplane; kernels let it learn non-linear boundaries, and C trades margin width for violations.\"",
  },
  {
    demo: "kmeans",
    title: "K-Means Clustering",
    blurb:
      "Unsupervised learning: no labels given. Pick K centroids, assign every point to its nearest centroid, move each centroid to its cluster's mean — repeat until stable.",
    points: [
      "Objective: minimize inertia (within-cluster sum of squared distances).",
      "K-Means++ initializes centroids smartly to avoid bad local optima.",
      "Choosing K: Elbow method on inertia, or Silhouette score (−1..1, higher is better).",
      "Assumes roughly spherical, similar-sized clusters — fails on crescent shapes (DBSCAN handles those).",
    ],
    interview:
      "\"K-Means alternates assigning points to nearest centroids and moving centroids to cluster means; K chosen by elbow or silhouette.\"",
  },
  {
    demo: "nn",
    title: "Neural Networks",
    blurb:
      "Stacked layers of neurons: each computes a weighted sum plus bias, then an activation. The forward pass flows left to right — that glowing wave is a prediction being formed.",
    points: [
      "Each neuron: z = Σwᵢxᵢ + b, then f(z) — the activation adds non-linearity.",
      "Without non-linear activations, any depth collapses into one linear layer.",
      "Universal approximation: one hidden layer can approximate any continuous function.",
      "Depth builds hierarchy: edges → shapes → objects; words → phrases → meaning.",
    ],
    interview:
      "\"A neural net is layers of weighted sums with non-linear activations; depth lets it learn hierarchical feature representations.\"",
  },
  {
    demo: "backprop",
    title: "Backpropagation",
    blurb:
      "How neural networks learn: forward pass makes a prediction, the loss measures how wrong it was, then the error flows backward through the network — each weight nudged by its share of the blame.",
    points: [
      "Core math: chain rule of derivatives applied layer by layer.",
      "Gradient of the loss w.r.t. each weight tells it which direction reduces error.",
      "Vanishing gradients in deep sigmoid networks — ReLU and skip connections fight this.",
      "One training step = forward pass + backward pass + optimizer update.",
    ],
    interview:
      "\"Backprop computes gradients of the loss w.r.t. every weight via the chain rule, then gradient descent updates the weights.\"",
  },
  // ---------------- Ring 3 · Evaluation & Tuning ----------------
  {
    demo: "overfit",
    title: "Overfitting vs Underfitting",
    blurb:
      "The central tension of ML. Degree 1 is too simple (high bias — underfit). Degree 15 memorizes every noise point (high variance — overfit). Degree 3 captures the true pattern and generalizes.",
    points: [
      "Underfit: poor on training AND test data — model too simple.",
      "Overfit: great on training, poor on test — model memorized noise.",
      "Diagnose with learning curves: a widening train/validation gap = overfitting.",
      "Fixes for overfitting: more data, regularization, simpler model, dropout, early stopping.",
    ],
    interview:
      "\"Overfitting means memorizing noise — high training accuracy, low test accuracy. I fix it with regularization, more data, or a simpler model.\"",
  },
  {
    demo: "reg-l1l2",
    title: "Regularization (L1 & L2)",
    blurb:
      "Regularization adds a penalty for large weights to the loss. L2 (Ridge) shrinks all weights smoothly toward zero; L1 (Lasso) snaps weak weights exactly to zero — automatic feature selection.",
    points: [
      "Loss becomes: MSE + λ × penalty. λ=0 → no regularization; huge λ → everything shrinks.",
      "L1 = sum of |w| (sparsity); L2 = sum of w² (smooth shrinkage). ElasticNet mixes both.",
      "Same idea in deep learning: weight decay, dropout, early stopping.",
      "Always tune λ with cross-validation, never on the test set.",
    ],
    interview:
      "\"L1 gives sparse weights (feature selection), L2 shrinks them smoothly (Ridge); λ controls the strength and is tuned by cross-validation.\"",
  },
  {
    demo: "conf-matrix",
    title: "Confusion Matrix & Metrics",
    blurb:
      "Four outcomes for any classifier: TP, FP, FN, TN. Precision asks 'when I predict positive, how often am I right?' Recall asks 'of all actual positives, how many did I catch?' Moving the threshold trades one for the other.",
    points: [
      "Precision = TP/(TP+FP); Recall = TP/(TP+FN); F1 = their harmonic mean.",
      "Accuracy lies on imbalanced data: 99% negative data → 'always negative' is 99% accurate and useless.",
      "Which matters more depends on cost: cancer screening → recall; spam filter → precision.",
      "Specificity = TN/(TN+FP); PR-curve is better than ROC for heavy imbalance.",
    ],
    interview:
      "\"I pick the metric from the business cost: recall when misses are expensive (cancer), precision when false alarms are expensive (spam), F1 to balance.\"",
  },
  {
    demo: "roc",
    title: "ROC Curve & AUC",
    blurb:
      "Slide the classification threshold and every position gives one (False Positive Rate, True Positive Rate) point. Sweeping it draws the ROC curve; the area under it (AUC) says how well the model separates classes — 1.0 is perfect, 0.5 is a coin flip.",
    points: [
      "AUC = probability the model ranks a random positive above a random negative.",
      "Threshold-independent: compares models across ALL operating points.",
      "Diagonal = random guessing; a good curve bows toward the top-left corner.",
      "With severe class imbalance, prefer Precision-Recall curves over ROC.",
    ],
    interview:
      "\"ROC plots TPR vs FPR across thresholds; AUC is the probability the model ranks a positive above a negative — 0.5 is random, 1.0 is perfect.\"",
  },
  {
    demo: "pca",
    title: "PCA — Dimensionality Reduction",
    blurb:
      "Find the directions of maximum variance in your data and project onto them. PC1 keeps the most information, PC2 the next — 2D data can become 1D while keeping most of its structure.",
    points: [
      "Unsupervised: uses eigenvectors of the covariance matrix — no labels needed.",
      "Standardize features first, or big-scale features dominate every component.",
      "Uses: visualization, noise reduction, speeding up training, decorrelating features.",
      "Components are linear combos of originals — less interpretable than raw features.",
    ],
    interview:
      "\"PCA projects data onto orthogonal directions of maximum variance; I standardize first and use it to compress features or visualize high-dim data.\"",
  },
  {
    demo: "activation",
    title: "Activation Functions",
    blurb:
      "The non-linearity inside every neuron. Stack 100 purely linear layers and you still get a line — activations are what give networks their power. See ReLU, sigmoid, tanh and linear side by side.",
    points: [
      "ReLU = max(0, x): fast, no vanishing gradient for positive inputs — the default choice.",
      "Sigmoid saturates → tiny gradients in deep nets (vanishing gradient problem).",
      "Output layers: sigmoid for binary, softmax for multi-class, linear for regression.",
      "Modern variants: LeakyReLU, GELU, SwiGLU fix the 'dying ReLU' problem.",
    ],
    interview:
      "\"Activations introduce non-linearity; ReLU is the standard hidden-layer choice, sigmoid/softmax cap the outputs for classification.\"",
  },
];

const RING_LABELS = ["Foundations", "Core Algorithms", "Evaluation & Tuning"];
const RING_START = [0, 5, 11]; // lesson index where each ring begins
const STORE_KEY = "dsgalaxy.ml.done";

// ---------- state ----------
let overlay, warpCv, home, mapCv, lessonEl, listEl;
let warpStop = null, mapStop = null, demoStop = null;
let curLesson = 0, view = "home", entered = false;

function doneSet() {
  try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveDone(set) {
  localStorage.setItem(STORE_KEY, JSON.stringify([...set]));
}
function progressCount() {
  const done = doneSet();
  let n = 0;
  LESSONS.forEach((l) => { if (done.has(l.demo)) n++; });
  return n;
}

// ---------- hyperspace warp ----------
// Time-based (not frame-count): completes by wall-clock even on heavily
// throttled browsers, with a setInterval fallback if rAF stalls.
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
    if (p >= 0.64 && p < 0.7) { // flash near peak speed
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

function nodePositions() {
  const { W, H } = mapDims();
  const cx = W / 2, cy = H / 2;
  const rings = [
    { r: Math.min(W, H) * 0.16, n: 5, label: RING_LABELS[0] },
    { r: Math.min(W, H) * 0.30, n: 6, label: RING_LABELS[1] },
    { r: Math.min(W, H) * 0.44, n: 6, label: RING_LABELS[2] },
  ];
  const out = [];
  rings.forEach((ring, ri) => {
    const rot = -Math.PI / 2 + ri * 0.5;
    for (let i = 0; i < ring.n; i++) {
      const idx = RING_START[ri] + i;
      const a = rot + (i / ring.n) * Math.PI * 2;
      out.push({
        idx,
        x: cx + Math.cos(a) * ring.r,
        y: cy + Math.sin(a) * ring.r,
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
  if (mapCv.width !== W * dpr) {
    mapCv.width = W * dpr; mapCv.height = H * dpr;
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
    const { W: W2 } = mapDims();
    [0.16, 0.30, 0.44].forEach((f) => {
      ctx.beginPath();
      ctx.arc(W2 / 2, H / 2, Math.min(W2, H) * f, 0, Math.PI * 2);
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
    const R = Math.max(13, Math.min(W, H) * 0.045);
    nodes.forEach((n) => {
      const L = LESSONS[n.idx];
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
      // number inside
      ctx.fillStyle = isDone ? "#241a02" : "rgba(235,240,255,0.92)";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(n.idx + 1), n.x, n.y + 4);
      // ✓ for done
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
    const ringLbl = [
      { f: 0.16, i: 0 }, { f: 0.30, i: 1 }, { f: 0.44, i: 2 },
    ];
    ctx.font = "10px Inter, sans-serif";
    ringLbl.forEach(({ f, i }) => {
      ctx.fillStyle = "rgba(200,215,255,0.4)";
      ctx.textAlign = "center";
      ctx.fillText(RING_LABELS[i], cx, cy - Math.min(W, H) * f - 6);
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
  const L = LESSONS[idx];
  view = "lesson";
  home.style.display = "none";
  lessonEl.style.display = "flex";
  lessonEl.querySelector("#ml-tag").textContent = RING_LABELS[
    idx >= RING_START[2] ? 2 : idx >= RING_START[1] ? 1 : 0
  ];
  lessonEl.querySelector("#ml-title").textContent = `${idx + 1}. ${L.title}`;
  const box = lessonEl.querySelector("#ml-demo");
  box.innerHTML = "";
  if (demoStop) { demoStop(); demoStop = null; }
  const card = document.createElement("div");
  card.className = "vsl-card";
  box.appendChild(card);
  const inst = mountVisual(card, L.demo);
  demoStop = inst && typeof inst.stop === "function" ? inst.stop : null;
  lessonEl.querySelector("#ml-blurb").textContent = L.blurb;
  const ul = lessonEl.querySelector("#ml-points");
  ul.innerHTML = "";
  L.points.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    ul.appendChild(li);
  });
  lessonEl.querySelector("#ml-interview").textContent = L.interview;
  lessonEl.querySelector("#ml-count").textContent = `${idx + 1} / ${LESSONS.length}`;
  // mark visited as learned
  const done = doneSet();
  done.add(L.demo);
  saveDone(done);
  const prev = lessonEl.querySelector("#ml-prev");
  const next = lessonEl.querySelector("#ml-next");
  prev.disabled = idx === 0;
  next.textContent = idx === LESSONS.length - 1 ? "Finish" : "Next lesson";
  next.disabled = false;
}

function backToMap() {
  view = "home";
  if (demoStop) { demoStop(); demoStop = null; }
  lessonEl.style.display = "none";
  home.style.display = "flex";
  updateHeader();
  drawMap();
}

function updateHeader() {
  const p = progressCount();
  home.querySelector("#ml-progress").textContent =
    `${p} of ${LESSONS.length} mastered — keep going, the galaxy lights up as you learn`;
  const list = home.querySelector("#ml-list");
  list.innerHTML = "";
  LESSONS.forEach((L, i) => {
    const b = document.createElement("button");
    b.className = "chip" + (doneSet().has(L.demo) ? " done" : "") + (i === curLesson ? " cur" : "");
    b.textContent = `${i + 1}. ${L.title}`;
    b.addEventListener("click", () => openLesson(i));
    list.appendChild(b);
  });
}

// ---------- open / close ----------
export function openMLGalaxy() {
  if (!overlay) build();
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

export function closeMLGalaxy() {
  if (demoStop) { demoStop(); demoStop = null; }
  if (mapStop) { cancelAnimationFrame(mapStop); mapStop = null; }
  warpCv.style.display = "block";
  warpCv.style.opacity = "1";
  runWarp(() => {
    overlay.style.display = "none";
    warpCv.style.display = "none";
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
        <h2>ML Galaxy</h2>
        <p>Machine learning, taught pin to pin — every lesson is a live animation.</p>
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

  overlay.querySelector("#ml-close").addEventListener("click", closeMLGalaxy);
  overlay.querySelector("#ml-back").addEventListener("click", backToMap);
  overlay.querySelector("#ml-prev").addEventListener("click", () =>
    openLesson(Math.max(0, curLesson - 1)));
  overlay.querySelector("#ml-next").addEventListener("click", () => {
    if (curLesson === LESSONS.length - 1) backToMap();
    else openLesson(Math.min(LESSONS.length - 1, curLesson + 1));
  });
  mapCv.addEventListener("click", (e) => {
    const n = hitNode(e);
    if (n) openLesson(n.idx);
  });
  window.addEventListener("keydown", (e) => {
    if (!entered || overlay.style.display === "none") return;
    if (e.key === "Escape") (view === "lesson" ? backToMap : closeMLGalaxy)();
  });
  window.addEventListener("resize", () => {
    if (overlay.style.display !== "none" && view === "home") drawMap();
  });
}
