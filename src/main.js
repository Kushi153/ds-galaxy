import "./style.css";
import questionsData from "./data/questions.json";
import { createScene, colorFor } from "./scene.js";
import { getAnswer, raviChat, evaluateAnswer, health } from "./ai.js";
import { mountVisual } from "./visuals.js";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const intro = $("intro");
const searchInput = $("search");
const resultsBox = $("results");
const wheel = $("wheel");
const tooltip = $("tooltip");
const qpanel = $("qpanel");
const qTag = $("q-tag");
const qTitle = $("q-title");
const qText = $("q-text");
const qAnswer = $("q-answer");
const qAnswerText = $("q-answer-text");
const qNote = $("q-note");
const qRelated = $("q-related");
const qCount = $("q-count");
const starPanel = $("star-panel");
const chatBox = $("chatbox");
const chatMsgs = $("chat-msgs");
const toasts = $("toasts");

// ---------- Stats ----------
const allQuestions = questionsData.sections.flatMap((s) => s.questions);
$("stat-sections").textContent = questionsData.sections.length;
$("stat-questions").textContent = allQuestions.length;
$("stat-notes").textContent = allQuestions.filter((q) => q.note).length;

// AI status pill
health()
  .then((h) => {
    const pill = $("ai-status");
    if (!pill) return;
    pill.textContent = h.ai
      ? `RAVI online · ${h.answers} answers · AI mode`
      : `RAVI online · answers for ${h.answers + (h.kb || 0)}+ concepts`;
    pill.classList.add("on");
  })
  .catch(() => {
    const pill = $("ai-status");
    if (pill) {
      pill.textContent = "Backend offline — answers unavailable";
      pill.classList.add("off");
    }
  });

// ---------- Helpers ----------
function qLabel(q) {
  return String(q.id).length > 4 ? `AI-${q.num}` : `Q${q.id}`;
}

function toast(msg, kind = "info") {
  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.textContent = msg;
  toasts.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 350);
  }, 3200);
}

// ---------- Scene ----------
const canvas = $("bg-canvas");
const scene = createScene(canvas);
scene.build(questionsData);

// App is ready — hide the boot loader
$("loader").classList.add("hidden");

scene.on("hover", (ud, e) => {
  if (ud) {
    tooltip.textContent = `${qLabel(ud.question)} · ${ud.section.title}`;
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY + 10}px`;
    tooltip.style.opacity = "1";
  } else {
    tooltip.style.opacity = "0";
  }
});

scene.on("click", (ud) => {
  if (ud) openQuestion(ud.sectionIndex, ud.qIndex);
  else closePanel();
});

// ---------- Intro gate ----------
$("enter-btn").addEventListener("click", () => {
  intro.classList.add("hidden");
  scene.setFocus(null);
});

// ---------- Shiva Eye cinematic (infinite zoom-through) ----------
// Phases: reveal (eye appears) -> deeper (keeps zooming, scroll feeds it)
//         -> plunge (accelerates, red of the iris fills the screen) -> galaxy returns
const eyeCine = $("eye-cine");
const eyeImg = $("eye-img");
const eyeRed = $("eye-red");
const eyeCap = $("eye-caption");
let cineBusy = false;
let cinePhase = "idle"; // idle | reveal | deeper | plunge | done
let cineScale = 0.28;
let cineRed = 0;
let cineBoost = 0; // extra zoom from the user's scroll wheel
let cineTick = null;

scene.on("cine", () => {
  if (cineBusy) return;
  cineBusy = true;
  cinePhase = "reveal";
  cineScale = 0.28;
  cineRed = 0;
  cineBoost = 0;
  eyeCine.classList.add("active", "js-driven");
  eyeCap.textContent = "Om Namah Shivaya";
  requestAnimationFrame(() => eyeCine.classList.add("show"));
  cineTick = setTimeout(cineStep, 50);
});

function cineStep() {
  if (cinePhase === "reveal") {
    // eye materializes from the void, growing slowly
    cineScale = Math.min(0.62, cineScale + 0.012);
    eyeImg.style.opacity = String(Math.min(1, cineScale / 0.5));
    eyeImg.style.transform = `scale(${cineScale})`;
    if (cineScale >= 0.62) {
      cinePhase = "deeper";
      eyeCap.style.opacity = "1";
    }
  } else if (cinePhase === "deeper") {
    eyeCap.textContent = "keep scrolling — enter the eye";
    // endless zoom: gentle drift + the user's scroll keeps pushing deeper
    const boost = cineBoost > 0 ? 0.05 : 0;
    if (cineBoost > 0) cineBoost--;
    cineScale += cineScale * (0.012 + boost);
    eyeImg.style.transform = `scale(${cineScale})`;
    // the red of the iris starts glowing as the eye fills the view
    const p = (cineScale - 1.5) / (2.2 - 1.5);
    if (p > 0) {
      eyeRed.style.opacity = String(Math.min(0.35, p * 0.5));
      eyeRed.style.transform = `scale(${0.08 + p * 0.5})`;
    }
    if (cineScale >= 2.2) cinePhase = "plunge";
  } else if (cinePhase === "plunge") {
    eyeCap.style.opacity = "0";
    // final dive: eye accelerates past the viewer, red swallows the screen
    cineScale += cineScale * 0.05;
    cineRed = Math.min(1, cineRed + 0.02);
    eyeImg.style.transform = `scale(${cineScale})`;
    eyeRed.style.opacity = String(cineRed);
    eyeRed.style.transform = `scale(${0.08 + cineRed * 2.3})`;
    if (cineRed >= 1) {
      endCine(true);
      return;
    }
  }
  cineTick = setTimeout(cineStep, 50);
}

function endCine(completed) {
  if (cinePhase === "done") return;
  cinePhase = "done";
  clearTimeout(cineTick);
  eyeCine.classList.add("opening"); // red holds a heartbeat, then the veil lifts
  setTimeout(() => {
    eyeCine.classList.add("leaving");
    setTimeout(() => {
      eyeCine.classList.remove("active", "leaving", "show", "opening", "js-driven");
      eyeImg.style.cssText = "";
      eyeRed.style.cssText = "";
      eyeCap.style.cssText = "";
      scene.flyHome(); // glide back to the galaxy
      cineBusy = false;
      cinePhase = "idle";
    }, completed ? 1500 : 1000);
  }, completed ? 900 : 100);
}

// scroll feeds the infinite zoom while the eye is on screen
window.addEventListener("wheel", (e) => {
  if (!cineBusy || cinePhase === "done") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (cinePhase !== "reveal") {
    cineBoost = Math.max(0, Math.min(14, cineBoost + (e.deltaY > 0 ? 1 : -2)));
  }
}, { capture: true, passive: false });

// click during the dive skips to the return
eyeCine.addEventListener("click", () => {
  if (cinePhase === "deeper" || cinePhase === "plunge") endCine(false);
});

// ---------- Question panel ----------
let current = null; // { si, qi }
let currentQRef = null; // { section, id, text }

function openQuestion(si, qi) {
  current = { si, qi };
  const section = questionsData.sections[si];
  const q = section.questions[qi];
  currentQRef = { section: section.title, id: q.id, text: q.text };
  qTag.textContent = section.title;
  qTag.style.color = "#" + new THREE_Color(colorFor(si)).getHexString();
  qTitle.textContent = `${qLabel(q)}. ${q.text}`;
  qCount.textContent = `${qi + 1} / ${section.questions.length}`;

  // Answer area: fetch from backend
  qText.style.display = "none";
  qAnswer.style.display = "none";
  qNote.style.display = q.note ? "block" : "none";
  if (q.note) qNote.textContent = q.note;
  qRelated.style.display = "none";
  qRelated.innerHTML = "";
  if (q.refLink) {
    const a = document.createElement("a");
    a.href = q.refLink;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "reflink";
    a.textContent = "Reference";
    qRelated.style.display = "block";
    qRelated.appendChild(a);
  }
  getAnswer(q.id)
    .then((data) => {
      if (currentQRef?.id !== q.id) return; // user moved on
      if (data.answer) {
        qAnswerText.textContent = data.answer;
        qAnswer.style.display = "block";
      } else {
        qText.textContent =
          "Curated answer coming soon for this one. Try Practice mode or ask RAVI below.";
        qText.style.display = "block";
      }
      if (data.related?.length) {
        qRelated.style.display = "block";
        const lbl = document.createElement("div");
        lbl.className = "related-label";
        lbl.textContent = "Related";
        qRelated.appendChild(lbl);
        for (const r of data.related) {
          const b = document.createElement("button");
          b.className = "related-item";
          b.textContent = r.text;
          b.title = r.section;
          b.addEventListener("click", () => jumpToId(r.id));
          qRelated.appendChild(b);
        }
      }
    })
    .catch(() => {
      if (currentQRef?.id !== q.id) return;
      qText.textContent = "Backend offline — start it with the run doc to see answers.";
      qText.style.display = "block";
    });

  qpanel.classList.add("open");
  scene.setFocus(scene.getPlanetAt(si, qi));
}

async function jumpToId(qid) {
  for (let si = 0; si < questionsData.sections.length; si++) {
    const s = questionsData.sections[si];
    const qi = s.questions.findIndex((q) => q.id === qid);
    if (qi >= 0) {
      openQuestion(si, qi);
      return;
    }
  }
}

function closePanel() {
  qpanel.classList.remove("open");
  current = null;
  scene.setFocus(null);
}

$("qclose").addEventListener("click", closePanel);
$("q-prev").addEventListener("click", () => stepQuestion(-1));
$("q-next").addEventListener("click", () => stepQuestion(1));
$("q-practice").addEventListener("click", () => openPractice());
$("q-ask-ravi").addEventListener("click", () => {
  openChat();
  const input = $("chat-input");
  input.value = `Explain this question: ${currentQRef ? currentQRef.text : ""}`;
  input.focus();
});

function stepQuestion(delta) {
  if (!current) return;
  const section = questionsData.sections[current.si];
  let { si, qi } = current;
  qi += delta;
  if (qi < 0) {
    si = Math.max(0, si - 1);
    qi = questionsData.sections[si].questions.length - 1;
  } else if (qi >= section.questions.length) {
    si = Math.min(questionsData.sections.length - 1, si + 1);
    qi = 0;
  }
  openQuestion(si, qi);
}

// Keyboard navigation
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (!qpanel.classList.contains("open")) return;
  if (e.key === "ArrowRight") stepQuestion(1);
  if (e.key === "ArrowLeft") stepQuestion(-1);
  if (e.key === "Escape") closePanel();
});

// ---------- Section wheel ----------
const chips = questionsData.sections.map((s, i) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.textContent = `${i + 1}. ${s.title}`;
  b.title = `${s.questions.length} questions`;
  b.addEventListener("click", () => focusSection(i));
  wheel.appendChild(b);
  return b;
});

let chipTimer = null;
function focusSection(si) {
  chips.forEach((c) => c.classList.remove("active"));
  chips[si].classList.add("active");
  openQuestion(si, 0);
  chips[si].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  clearTimeout(chipTimer);
  chipTimer = setTimeout(() => chips.forEach((c) => c.classList.remove("active")), 8000);
}
window.focusSection = focusSection;

// ---------- Quiz / reset ----------
$("quiz-btn").addEventListener("click", () => {
  const si = Math.floor(Math.random() * questionsData.sections.length);
  const s = questionsData.sections[si];
  openQuestion(si, Math.floor(Math.random() * s.questions.length));
});
$("reset-btn").addEventListener("click", closePanel);

// ---------- Search ----------
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  if (term.length < 2) {
    resultsBox.classList.remove("show");
    return;
  }
  const hits = [];
  for (let si = 0; si < questionsData.sections.length; si++) {
    const s = questionsData.sections[si];
    for (let qi = 0; qi < s.questions.length; qi++) {
      const q = s.questions[qi];
      if (q.text.toLowerCase().includes(term) || s.title.toLowerCase().includes(term)) {
        hits.push({ si, qi, q, s });
        if (hits.length >= 60) break;
      }
    }
    if (hits.length >= 60) break;
  }
  resultsBox.innerHTML = "";
  for (const h of hits) {
    const btn = document.createElement("button");
    btn.className = "result-item";
    const rn = document.createElement("span");
    rn.className = "rn";
    rn.textContent = qLabel(h.q);
    const rt = document.createElement("span");
    rt.className = "rt";
    rt.textContent = h.q.text;
    const rs = document.createElement("span");
    rs.className = "rs";
    rs.textContent = h.s.title;
    btn.append(rn, rt, rs);
    btn.addEventListener("click", () => {
      resultsBox.classList.remove("show");
      searchInput.blur();
      openQuestion(h.si, h.qi);
    });
    resultsBox.appendChild(btn);
  }
  resultsBox.classList.add("show");
});
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#results, #search")) resultsBox.classList.remove("show");
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && resultsBox.firstChild) resultsBox.firstChild.click();
  if (e.key === "Escape") {
    searchInput.value = "";
    resultsBox.classList.remove("show");
  }
});

// ---------- STAR practice panel ----------
function openPractice() {
  if (!current) {
    const si = Math.floor(Math.random() * questionsData.sections.length);
    const s = questionsData.sections[si];
    openQuestion(si, Math.floor(Math.random() * s.questions.length));
  }
  const section = questionsData.sections[current.si];
  const q = section.questions[current.qi];
  $("star-tag").textContent = `Practice · ${section.title}`;
  $("star-q").textContent = `${qLabel(q)}. ${q.text}`;
  $("star-answer").value = "";
  $("star-feedback").style.display = "none";
  $("star-answer-block").style.display = "none";
  starPanel.classList.add("open");
  $("star-answer").focus();
}
$("practice-btn").addEventListener("click", openPractice);
$("star-close").addEventListener("click", () => starPanel.classList.remove("open"));

const VERDICTS = {
  good: ["good", "Strong answer"],
  partial: ["partial", "Partially there"],
  wrong: ["wrong", "Needs work"],
};

$("star-check").addEventListener("click", async () => {
  const answer = $("star-answer").value.trim();
  if (answer.length < 10) {
    toast("Write a bit more first — even a rough attempt helps.", "warn");
    return;
  }
  const q = questionsData.sections[current.si].questions[current.qi];
  const btn = $("star-check");
  btn.disabled = true;
  btn.textContent = "Evaluating…";
  try {
    const res = await evaluateAnswer(q.id, answer);
    const [cls, label] = VERDICTS[res.verdict] || VERDICTS.partial;
    const badge = $("star-verdict-badge");
    badge.className = `badge ${cls}`;
    badge.textContent = label;
    $("star-score").textContent = res.mode === "ai" ? "RAVI AI review" : "RAVI quick review";
    $("star-feedback-text").textContent = res.feedback;
    $("star-breakdown").style.display = "none";
    $("star-feedback").style.display = "flex";
  } catch (err) {
    toast(friendlyError(err), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Check my answer";
  }
});

$("star-model").addEventListener("click", async () => {
  const q = questionsData.sections[current.si].questions[current.qi];
  const btn = $("star-model");
  btn.disabled = true;
  btn.textContent = "Loading…";
  try {
    const data = await getAnswer(q.id);
    if (data.answer) {
      $("star-answer-text").textContent = data.answer;
      $("star-answer-block").style.display = "block";
    } else {
      toast("No curated answer for this one yet — ask RAVI instead.", "warn");
    }
  } catch (err) {
    toast(friendlyError(err), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Show model answer";
  }
});

// ---------- RAVI chat ----------
const chatHistory = [];
let greeted = false;

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

// Attach an interactive demo card under the latest AI message
function addVisualCard(id) {
  if (!id) return;
  const card = document.createElement("div");
  card.className = "vsl-card";
  chatMsgs.appendChild(card);
  mountVisual(card, id);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

// ---------- Visual Lab browser (chip row above the chat input) ----------
const VSL_CATALOG = [
  ["grad-descent", "Gradient Descent"],
  ["lin-reg", "Linear Regression"],
  ["overfit", "Overfitting"],
  ["kmeans", "K-Means"],
  ["knn", "KNN"],
  ["tree", "Decision Trees"],
  ["nn", "Neural Network"],
  ["pca", "PCA"],
  ["conf-matrix", "Confusion Matrix"],
  ["svm", "SVM"],
  ["activation", "Activations"],
];

function showVisualStandalone(id, label) {
  // Close panels, open chat, show the demo as a teacher-style message
  if (typeof focusPanel !== "undefined" && focusPanel) focusPanel.classList.remove("open");
  if (typeof detailPanel !== "undefined" && detailPanel) detailPanel.classList.remove("open");
  if (!chatBox.classList.contains("open")) openChat();
  addMsg("user", `Show me ${label} visually`);
  addMsg(
    "ai",
    `Here is the ${label} demo — watch it move while you read. Press Replay any time, and ask me any doubt about what you see.`
  );
  addVisualCard(id);
  chatHistory.push({ role: "user", content: `Show me ${label} visually` });
  chatHistory.push({
    role: "assistant",
    content: `Showing the ${label} interactive demo.`,
  });
}

function buildVisualLab() {
  const bar = document.createElement("div");
  bar.className = "vsl-bar";
  const title = document.createElement("span");
  title.className = "vsl-bar-title";
  title.textContent = "Visual Lab";
  bar.appendChild(title);
  for (const [id, label] of VSL_CATALOG) {
    const b = document.createElement("button");
    b.className = "chip vsl-chip";
    b.textContent = label;
    b.addEventListener("click", () => showVisualStandalone(id, label));
    bar.appendChild(b);
  }
  const anchor = document.querySelector(".chat-input-row") || $("chat-input").parentElement;
  anchor.parentElement.insertBefore(bar, anchor);
}
buildVisualLab();

function openChat() {
  chatBox.classList.add("open");
  if (!greeted) {
    greeted = true;
    addMsg(
      "ai",
      "Hi, I am RAVI — your study buddy for this galaxy. Ask me any doubt, or open a question planet and ask about it directly."
    );
  }
  $("chat-input").focus();
}

async function sendChat() {
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg("user", text);
  chatHistory.push({ role: "user", content: text });
  const thinking = addMsg("ai", "…");
  try {
    const data = await raviChat(
      text,
      chatHistory.slice(0, -1),
      currentQRef ? currentQRef.id : null
    );
    thinking.textContent = data.reply;
    chatHistory.push({ role: "assistant", content: data.reply });
    // Interactive visual demo (if RAVI attached one)
    addVisualCard(data.visual);
    // Source chips
    if (data.sources?.length) {
      const srcWrap = document.createElement("div");
      srcWrap.className = "msg-sources";
      for (const s of data.sources.slice(0, 3)) {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = `${s.section} — ${s.text.slice(0, 34)}…`;
        chip.addEventListener("click", () => jumpToId(s.id));
        srcWrap.appendChild(chip);
      }
      chatMsgs.appendChild(srcWrap);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
  } catch (err) {
    thinking.remove();
    chatHistory.pop();
    addMsg("err", friendlyError(err));
  }
}

$("chat-fab").addEventListener("click", () => {
  if (chatBox.classList.contains("open")) chatBox.classList.remove("open");
  else openChat();
});
$("chat-close").addEventListener("click", () => chatBox.classList.remove("open"));
$("chat-send").addEventListener("click", sendChat);
$("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChat();
});
$("chat-suggest")
  .querySelectorAll(".chip")
  .forEach((c) =>
    c.addEventListener("click", () => {
      $("chat-input").value = c.textContent;
      sendChat();
    })
  );

// ---------- "See it visually" button inside the question panel ----------
// Frontend copy of the keyword matcher (mirrors backend/_VISUAL_KEYWORDS)
const VSL_KEYWORDS = [
  [["gradient descent", "learning rate", "steepest descent", "step size"], "grad-descent", "Gradient Descent"],
  [["linear regression", "regression line", "least squares", "best fit line", "fit a line", "regression"], "lin-reg", "Linear Regression"],
  [["overfit", "over-fitting", "underfit", "under-fitting", "high variance", "high bias", "bias variance", "bias-variance", "regulariz", "regularis"], "overfit", "Underfit vs Overfit"],
  [["k-means", "kmeans", "k means", "clustering", "centroid"], "kmeans", "K-Means Clustering"],
  [["knn", "k-nearest", "k nearest", "nearest neighbor", "nearest neighbour"], "knn", "K-Nearest Neighbors"],
  [["decision tree", "decision trees", "random forest", "tree split", "gini", "entropy split", "cart"], "tree", "Decision Tree Splits"],
  [["neural network", "neural net", "forward pass", "backpropagation", "backprop", "deep network", "perceptron", "neuron"], "nn", "Neural Network Forward Pass"],
  [["pca", "principal component", "dimensionality reduction", "dimension reduction", "eigenvector", "eigenvalue"], "pca", "PCA"],
  [["confusion matrix", "precision", "recall", "f1 score", "f1-score", "true positive", "false positive", "classification metric"], "conf-matrix", "Confusion Matrix & Metrics"],
  [["svm", "support vector", "maximal margin", "hyperplane"], "svm", "Support Vector Machine"],
  [["activation function", "relu", "sigmoid", "tanh", "softmax", "non-linearity", "nonlinearity"], "activation", "Activation Functions"],
];

function visualForBankQuestion(section, text) {
  const hay = `${section || ""} ${text || ""}`.toLowerCase();
  let best = null;
  for (const [kws, id, label] of VSL_KEYWORDS) {
    const hits = kws.filter((kw) => hay.includes(kw)).length;
    if (hits && (!best || hits > best.hits)) best = { hits, id, label };
  }
  return best ? { id: best.id, label: best.label } : null;
}

const vslQBtn = document.createElement("button");
vslQBtn.className = "tbtn";
vslQBtn.textContent = "See it visually";
vslQBtn.addEventListener("click", () => {
  const ref = currentQRef;
  if (!ref) return;
  const viz = visualForBankQuestion(ref.section, ref.text);
  if (viz) {
    showVisualStandalone(viz.id, viz.label);
  } else {
    if (!chatBox.classList.contains("open")) openChat();
    addMsg("user", `Show me a visual demo for: ${ref.text}`);
    addMsg(
      "ai",
      "I do not have a matching animation for this one yet — my Visual Lab covers gradient descent, regression, overfitting, K-means, KNN, decision trees, neural nets, PCA, confusion matrices, SVM and activations. Ask me any of those!"
    );
    chatHistory.push({ role: "user", content: `Show me a visual demo for: ${ref.text}` });
    chatHistory.push({ role: "assistant", content: "No matching demo for that topic yet." });
  }
});
document.querySelector("#qpanel .qactions").appendChild(vslQBtn);

function friendlyError(err) {
  const msg = err?.message || "UNKNOWN";
  if (/fetch|Failed to fetch|NetworkError/i.test(msg))
    return "Cannot reach the backend — is the FastAPI server running?";
  if (msg === "answer too short to evaluate") return "Write a bit more before asking for a review.";
  return msg.startsWith("API_") ? `Backend error (${msg}).` : msg;
}

// ---------- Hint fade ----------
setTimeout(() => {
  $("hint").style.opacity = "0";
}, 10000);

// ---------- Color helper (avoids importing three in main) ----------
function THREE_Color(hex) {
  return { getHexString: () => hex.toString(16).padStart(6, "0") };
}

// Debug hook
window.__app = { scene, openQuestion, closePanel, focusSection, jumpToId, data: questionsData };
