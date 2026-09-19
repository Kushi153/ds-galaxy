---
https://ds-galaxy-1.onrender.com
---


# DS Galaxy — Data Science & AI Interview Universe

An interactive **3D educational platform** for Data Science and AI Engineering interview preparation. Every question is a glowing planet orbiting its topic ring in a full 3D galaxy — click a planet to open the question with its model answer, practice your own answer and get an instant review, and ask **RAVI** (the built-in tutor chatbot) whenever you are stuck.

**No API keys needed. Everything runs locally.**

---

## Features

### ML Galaxy — machine learning, taught pin to pin
- A **second galaxy**: the intro screen has a dedicated "Learn Machine Learning Visually" box that warps you through hyperspace into an ML universe of 17 lessons
- **Learning path in 3 rings**: Foundations (What is ML, types of ML, linear/logistic regression, gradient descent) → Core Algorithms (KNN, trees & forests, SVM, K-Means, neural nets, backpropagation) → Evaluation & Tuning (overfitting, L1/L2 regularization, confusion matrix, ROC/AUC, PCA, activations)
- Every lesson pairs a **live animated demo** with a plain-words explanation, key points, and a ready-to-use **interview one-liner**
- **Progress is saved**: lessons you finish light up gold on the constellation map (stored locally)
- The same demos also play inside RAVI chat — ask "explain gradient descent" and watch it move

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
- **Visual Lab**: 11 interactive, animated demos of core ML concepts — gradient descent, linear regression, under/overfitting, K-means, KNN, decision tree splits, neural network forward pass, PCA, confusion matrix & precision/recall trade-off, SVM max-margin, activation functions. Ask RAVI about any of these and the demo plays right inside the chat; a Visual Lab chip row lets you browse all of them, and every matching question panel has a "See it visually" button
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
├── index.html              # App shell
├── src/
│   ├── main.js             # UI wiring: panels, practice, RAVI chat
│   ├── scene.js            # Three.js galaxy + Shiva eye cinematic triggers
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
├── public/shiva-eye.webp   # The Eye
└── .freebuff/run.md        # Exact dev-server startup recipe
```

---

## Data Sources

- **Master Data Scientist Interview Question Bank** (PDF, 1,055 questions, 47 sections) — parsed via `scripts/parse-bank.mjs`
- **[ai-engineering-interview-questions](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)** (490 questions, 14 sections) — parsed via `scripts/parse-repo.mjs`
- HR Interview section written for this project (32 questions with full guidance)

---

## Contact

**Raviteja Buddha**

- WhatsApp: [9703504923](https://wa.me/919703504923)
- Email: [bkushirt@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=bkushirt@gmail.com)
- LinkedIn: [raviteja-buddha](https://www.linkedin.com/in/raviteja-buddha-7a9279244)
- GitHub: [Kushi153](https://github.com/Kushi153)

---
site on live 👇👇
https://ds-galaxy-1.onrender.com
---
