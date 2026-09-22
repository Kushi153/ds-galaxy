---
https://ds-galaxy-1.onrender.com
---


# DS Galaxy — Data Science & AI Interview Universe

An interactive **3D educational platform** for Data Science and AI Engineering interview preparation. Every question is a glowing planet orbiting its topic ring in a full 3D galaxy — click a planet to open the question with its model answer, practice your own answer and get an instant review, and ask **RAVI** (the built-in tutor chatbot) whenever you are stuck.

**No API keys needed. Everything runs locally.**

---

## Features

### Six galaxies + the Trainer, one universe
The intro screen is a **galaxy menu**: the interview-prep universe (DS Galaxy), **five learning galaxies**, each a full constellation map of animated lessons, and the **🎯 Interview Trainer**. Warp through hyperspace into any galaxy — and a **⌂ Home** button in the top bar always brings you back to the menu.

| Galaxy | Lessons | What it teaches (every idea = live animation) |
|---|---|---|
| 🪐 **ML Galaxy** | 17 | ML loop, supervised/unsupervised/RL, linear & logistic regression, gradient descent, KNN, trees & forests, SVM, K-Means, neural nets, backprop, overfitting, L1/L2, confusion matrix, ROC/AUC, PCA, activations |
| 📐 **Maths & Stats** | 12 | mean vs median, variance & σ, distributions, Central Limit Theorem, confidence intervals, p-values, Bayes' theorem, correlation, vectors & cosine similarity, matrix multiplication, eigenvectors, derivatives |
| 🧠 **RAG Galaxy** | 10 | the RAG pipeline, embeddings, chunking & overlap, cosine search, top-k ANN search, reranking, prompt assembly, grounding vs hallucination, RAG vs fine-tuning, RAG evaluation |
| ⚡ **Deep Learning** | 12 | the perceptron, MLPs, backpropagation, activations, CNN convolution, max pooling, RNNs, attention, the transformer, dropout, optimizers (SGD vs Adam), transfer learning |
| ✨ **AI Engineering** | 10 | tokens & next-token prediction, pretrain→SFT→RLHF, temperature sampling, context windows, prompting patterns, fine-tuning vs RAG, hallucination defenses, agents & tool use, evals, LLMOps |

- Every lesson pairs a **live animated demo** with a plain-words explanation, key points, and a ready-to-use **interview one-liner**
- **Progress is saved per galaxy**: finished lessons light up gold on the constellation map (stored locally)
- **Back buttons everywhere**: lesson → all lessons → back to DS Galaxy → ⌂ Home to the galaxy menu; Escape works too

### 🎯 Interview Trainer (`/trainer.html`)
A complete **offline mock-interview simulator** embedded in the site — click the golden **Interview Trainer** box on the intro screen (or open `/trainer.html` directly). Fully self-contained: no backend, no keys, no internet. Seven modes:

| Mode | What it does |
|---|---|
| 🎬 **Full Mock** | 2 timed coding problems → 6 interview questions → 10 rapid-fire, then a full adaptive report |
| 💻 **Coding Round** | Timed Python problems with skeleton, hints, model solution & complexity check |
| 🎙️ **Interview Round** | Speak first, then type — keyword feedback vs expected core ideas, follow-up drills |
| ⚡ **Rapid Fire** | 10 questions × 25s, honest self-rating |
| 📚 **Topic Practice** | Endless drill on Python / SQL / Statistics / ML / DL / LLMs & RAG / HR |
| 🧠 **Instant Coach** | Any question → model answer + likely interviewer follow-ups; 🎤 dictation supported |
| ⏱️ **Copilot Drill** | Timed delivery rounds: think, answer aloud, compare with the model answer |

### The Galaxy (question bank)
- **1,577 questions across 62 topics** — Python, SQL, Statistics, Machine Learning, Deep Learning, Transformers, LLMs, RAG, AI Agents, MLOps, HR and more
- Full 3D starfield galaxy built with Three.js — every question is a clickable planet
- Topic wheel for instant navigation, instant search, quiz mode, keyboard navigation (arrow keys, Escape)
- **Shiva Eye cinematic** — zoom all the way out and the eye of Shiva appears, breathing with a divine halo. Keep scrolling to dive *into* the eye until its red fills the screen, then the galaxy returns

### Answers for every question
- 307 hand-curated model answers (core DS sections + the AI-engineering bank)
- A **209-concept knowledge base** (statistics, ML, DL, NLP, LLMs, RAG, MLOps, SQL, pandas, math…) matched against question phrasing — so ~90% of the bank gets a real written answer
- Behavioral/HR questions get **structured frameworks** (Present-Past-Future, STAR, salary negotiation, career gaps…) instead of one fake "model answer"
- The rest resolve to the **closest related concepts**, each with a real explanation

### RAVI — the tutor chatbot
- Friendly-teacher personality: simple words first, examples, gentle nudges
- Answers doubts directly in chat, with source chips that jump to the question planet
- Understands small talk (hi / thanks / bye) and context ("Explain this simply", "Give an example", "How to answer in interview" work on the open question)
- **Visual Lab**: **56 interactive, animated demos** of ML, maths, RAG, deep-learning and AI concepts. Ask RAVI about any of them ("explain the central limit theorem", "how does attention work") and the demo plays right inside the chat; a Visual Lab chip row lets you browse all of them, and matching question panels have a "See it visually" button
- Optional upgrade: set `GEMINI_API_KEY` in the backend environment and RAVI answers with a real LLM (server-side only — the browser never sees a key)

### STAR Practice mode
- Type your answer to any question and get honest feedback: strengths, gaps, a verdict (Strong / Partially there / Needs work)
- Behavioral questions get a full **S/T/A/R breakdown** of your story; technical questions are scored against the model answer

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vite, Three.js (procedural — zero 3D assets), vanilla JS |
| Backend | FastAPI (Python 3), Uvicorn |
| Intelligence | Offline retrieval + knowledge base (no keys needed); optional Gemini upgrade |
| Data | `src/data/questions.json` (1,577 Q), `src/data/answers-*.json` (307 curated), `backend/kb-*.json` (209 concepts) |

---

## Run It

### 1. Frontend (port 5173)

```bash
npm install
npm run dev
```

### 2. Backend (port 8000)

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows  (source .venv/bin/activate on Linux/Mac)
pip install -r backend/requirements.txt
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 3. Open

```
http://localhost:5173
```

Enter the galaxy, click planets, open RAVI, hit Practice. That's it — no keys, no accounts.

### Optional: AI mode

Set `GEMINI_API_KEY` in the backend's environment and restart it — evaluation and chat upgrade to LLM quality automatically. Without it, everything still works fully offline.

---

## Project Structure

```
├── index.html              # App shell + galaxy menu (6 galaxies)
├── src/
│   ├── main.js             # UI wiring: panels, practice, RAVI chat
│   ├── scene.js            # Three.js galaxy + Shiva eye cinematic triggers
│   ├── mlgalaxy.js         # Multi-galaxy engine: constellation maps + warp
│   ├── curriculum-ml.js    # ML Galaxy lessons (17)
│   ├── curriculum-extra.js # Maths&Stats + RAG lessons
│   ├── curriculum-extra2.js# Deep Learning + AI lessons
│   ├── visuals.js          # Core demo registry (17 ML demos)
│   ├── visuals-maths.js / -rag.js / -dl.js / -ai.js  # 39 more demos
│   ├── style.css           # All styling
│   ├── ai.js               # Backend API client
│   └── data/
│       ├── questions.json  # 1,577 questions / 62 sections
│       ├── answers-core.json / answers-ai.json
├── backend/
│   ├── main.py             # FastAPI: /api/chat, /api/evaluate, /api/answer
│   ├── kb-ds.json          # 87 DS/stats/ML concepts
│   ├── kb-ai.json          # 46 AI/LLM-engineering concepts
│   ├── kb-umbrella.json    # 10 umbrella "what is X" concepts
│   ├── kb-fill.json / kb-fill2.json
│   └── kb-hr.json          # 16 HR/behavioral frameworks
├── scripts/                # Data parsers (PDF → questions.json, repo merge)
├── public/
│   ├── shiva-eye.webp      # The Eye
│   └── trainer.html        # 🎯 Interview Trainer (offline mock-interview app)
└── .freebuff/run.md        # Exact dev-server startup recipe
```

---

## Contact

**Raviteja Buddha**

- WhatsApp: [9703504923](https://wa.me/919703504923)
- Email: [bkushirt@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=bkushirt@gmail.com)
- LinkedIn: [raviteja-buddha](https://www.linkedin.com/in/raviteja-buddha-7a9279244)
- GitHub: [Kushi153](https://github.com/Kushi153)

---
site on live 🫵
https://ds-galaxy-1.onrender.com 🫵
---
