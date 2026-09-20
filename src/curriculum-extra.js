// ============================================================
// DS Galaxy — Curricula: Maths&Stats, RAG, Deep Learning, AI
// ============================================================

export const MATHS = {
  id: "maths",
  name: "Maths & Stats Galaxy",
  icon: "📐",
  accent: "#4dd0e1",
  tagline: "The mathematics behind every model — drawn, not just written.",
  rings: [
    {
      label: "Descriptive Statistics",
      lessons: [
        {
          demo: "mean-median",
          title: "Mean vs Median",
          blurb: "The mean averages every value — one extreme outlier can drag it far away. The median only cares about rank order, so it barely moves. Knowing which to trust is a top interview question.",
          points: [
            "Mean uses every value → sensitive to outliers; median uses only the middle rank → robust.",
            "Skewed data (income, house prices, latency): report the median, not the mean.",
            "Mode still matters for categorical data (most common category).",
            "Mean + median together tell you the skew direction.",
          ],
          interview: "\"I use the median for skewed data because the mean gets dragged by outliers, and report both when the difference itself is informative.\"",
        },
        {
          demo: "variance",
          title: "Variance & Standard Deviation",
          blurb: "Two datasets can share the exact same mean and behave completely differently. Variance measures the average squared distance from the mean; standard deviation brings it back to the original units.",
          points: [
            "σ² = average of (x − μ)²; σ = √σ² — same units as the data.",
            "Population formulas divide by N; sample formulas divide by n−1 (Bessel's correction).",
            "Coefficient of variation (σ/μ) compares spread across different scales.",
            "Std deviation is the backbone of z-scores, confidence intervals and the normal model.",
          ],
          interview: "\"Standard deviation is the typical distance from the mean — I use it for z-scores and to compare variability across datasets.\"",
        },
        {
          demo: "distributions",
          title: "Common Distributions",
          blurb: "Normal, skewed, bimodal, uniform — each shape tells a story about the process that generated the data, and each dictates which statistical tools are valid.",
          points: [
            "Normal: symmetric, defined by mean and σ — most tests assume it (or rely on CLT).",
            "Right-skewed (income, durations): use log transforms or non-parametric tests.",
            "Bimodal usually means two mixed populations — segment before modeling.",
            "Uniform: every value equally likely — the base of random sampling and simulations.",
          ],
          interview: "\"I plot the distribution first — its shape decides between parametric tests, transforms, or segmentation.\"",
        },
      ],
    },
    {
      label: "Probability & Inference",
      lessons: [
        {
          demo: "clt",
          title: "Central Limit Theorem",
          blurb: "Sample ANY distribution — as long as samples are big enough, the distribution of their means approaches a normal curve. It is the reason statistics works at all.",
          points: [
            "Means of n ≥ ~30 samples are approximately normal, regardless of the population shape.",
            "The CLT is why confidence intervals and t-tests exist.",
            "Standard error = σ/√n — quadruple the data to halve the error.",
            "Sample proportion and sample sums obey it too — the backbone of A/B testing.",
          ],
          interview: "\"The CLT says sample means become normal as n grows, which is what lets me build confidence intervals on any population.\"",
        },
        {
          demo: "confidence",
          title: "Confidence Intervals",
          blurb: "A 90% confidence interval is a statement about the procedure: resample many times and 90% of the intervals you build will capture the true mean. Watch some miss in red.",
          points: [
            "CI = estimate ± critical value × standard error.",
            "Higher confidence → wider interval; more data → narrower.",
            "A 95% CI does NOT mean 95% probability for THIS interval — the frequentist reading matters in interviews.",
            "Bootstrap resampling builds CIs without any distribution assumptions.",
          ],
          interview: "\"A 95% CI means the method captures the true value 95% of the time over repeated samples — not that this particular interval is 95% likely.\"",
        },
        {
          demo: "p-value",
          title: "P-values & Hypothesis Testing",
          blurb: "Assume the null hypothesis is true. How surprising is your result? The p-value answers exactly that — the probability of seeing data at least this extreme by chance alone.",
          points: [
            "p-value = P(data this extreme | H₀ true) — NOT the probability H₀ is true.",
            "α = 0.05 is a convention, not magic; state it before testing.",
            "Statistical significance ≠ practical significance — always report effect size.",
            "Multiple tests inflate false positives (Bonferroni/FDR corrections exist).",
          ],
          interview: "\"A p-value measures how compatible the data is with the null hypothesis; I pair it with effect size because 0.04 vs 0.06 is not a cliff.\"",
        },
        {
          demo: "bayes",
          title: "Bayes' Theorem",
          blurb: "How belief updates with evidence: posterior ∝ likelihood × prior. The disease-test demo shows why even a 90%-accurate test can leave most positives healthy — base rates dominate.",
          points: [
            "P(A|B) = P(B|A)·P(A) / P(B) — invert conditional probabilities.",
            "Rare conditions + imperfect tests → low posterior despite high sensitivity.",
            "Spam filters, medical screening and fraud detection are all Bayesian at heart.",
            "Priors encode what you knew before the data arrived.",
          ],
          interview: "\"Bayes updates a prior with evidence into a posterior — base rates matter, which is why rare-event screening needs careful thresholds.\"",
        },
        {
          demo: "correlation",
          title: "Correlation",
          blurb: "Pearson's r measures LINEAR association from −1 to +1. It misses curves, breaks on outliers, and — the classic interview trap — says nothing about causation.",
          points: [
            "r = covariance of x,y normalized by their σ's — scale-free.",
            "Only measures linear relationships; Anscombe's quartet shows how misleading that can be.",
            "Spearman's rank correlation handles monotonic-but-nonlinear and outliers better.",
            "Confounders: ice-cream sales correlate with drownings — summer causes both.",
          ],
          interview: "\"Correlation quantifies linear association, never causation — I check for confounders and consider Spearman when data is ordinal or skewed.\"",
        },
      ],
    },
    {
      label: "Linear Algebra & Calculus",
      lessons: [
        {
          demo: "vectors",
          title: "Vectors, Dot Product & Cosine Similarity",
          blurb: "Data lives in vector space. The dot product measures how much two vectors agree; cosine similarity normalizes that to pure angle — the exact math behind embeddings and document search.",
          points: [
            "a·b = |a||b|cos θ — positive = similar direction, zero = unrelated.",
            "Cosine similarity ignores magnitude: perfect for comparing text embeddings.",
            "Embeddings turn words/docs into vectors where geometry equals meaning.",
            "Norms (L1, L2) measure vector size — the same L1/L2 from regularization.",
          ],
          interview: "\"Cosine similarity compares embedding directions regardless of length — it's how vector search ranks documents by meaning.\"",
        },
        {
          demo: "matmul",
          title: "Matrix Multiplication",
          blurb: "C[i][j] is the dot product of A's row i with B's column j. Every layer of every neural network is (mostly) one big matrix multiply — that's why GPUs matter.",
          points: [
            "(m×n)·(n×p) = m×p — inner dimensions must match.",
            "NOT commutative: A·B ≠ B·A (order matters, and changes shapes).",
            "Each nn.Linear is y = Wx + b — batched matmuls run whole datasets at once.",
            "Complexity O(n³) naively; blocked/strassen/GPU kernels speed it up.",
          ],
          interview: "\"Matrix multiplication is the core compute of deep learning — every dense layer is Wx+b, so GPU matmul throughput is what training cost really is.\"",
        },
        {
          demo: "eigen",
          title: "Eigenvectors & Eigenvalues",
          blurb: "Apply a matrix to a vector and it usually changes direction. Eigenvectors are the special directions a matrix only stretches — and PCA hunts exactly the dominant ones of the covariance matrix.",
          points: [
            "M·v = λ·v: same direction, scaled by eigenvalue λ.",
            "Dominant eigenvector of the covariance matrix = PC1, the direction of max variance.",
            "Eigenvalue = variance explained along that component.",
            "SVD generalizes this to non-square matrices — the engine behind PCA and recommendations.",
          ],
          interview: "\"PCA finds eigenvectors of the covariance matrix — eigenvalues rank how much variance each principal component explains.\"",
        },
        {
          demo: "derivatives",
          title: "Derivatives & Gradients",
          blurb: "The derivative is the slope at a point — the direction of steepest INCREASE. Gradients stack derivatives across every parameter, and gradient descent simply walks the other way.",
          points: [
            "f′(x) = instantaneous rate of change; gradient ∇f extends it to many variables.",
            "Chain rule: how gradients flow backward through composed layers (backprop).",
            "Zero gradient = flat point (min, max, or saddle — saddlepoints dominate in high dimensions).",
            "Partial derivatives w.r.t. each weight = each weight's share of the blame.",
          ],
          interview: "\"The gradient points uphill fastest, so learning steps the opposite way — backprop computes it for every weight with the chain rule.\"",
        },
      ],
    },
  ],
};

export const RAG = {
  id: "rag",
  name: "RAG Galaxy",
  icon: "🧠",
  accent: "#4ade80",
  tagline: "Retrieval Augmented Generation — how LLMs answer with YOUR data, one animation per concept.",
  rings: [
    {
      label: "Foundations",
      lessons: [
        {
          demo: "rag-pipeline",
          title: "The RAG Pipeline",
          blurb: "Index time: documents → chunks → embeddings → vector DB. Query time: embed the question, retrieve top-k chunks, stuff them into the prompt, and let the LLM answer with grounded context.",
          points: [
            "Two separate flows: offline indexing and live retrieval+generation.",
            "The retriever's quality caps the whole system — garbage in, confident garbage out.",
            "Citations come free: answers point back to the retrieved chunks.",
            "Every RAG failure is one of: bad chunks, bad embedding, bad retrieval, or bad prompting.",
          ],
          interview: "\"RAG grounds an LLM in private data by retrieving relevant chunks at query time and injecting them into the prompt — no retraining needed.\"",
        },
        {
          demo: "embeddings",
          title: "Embeddings",
          blurb: "An embedding model maps text to vectors so that similar meanings land close together. 'Puppy' sits near 'dog'; a query about pets lands inside that neighborhood automatically.",
          points: [
            "Embedding = learned vector representation; similarity = geometric distance.",
            "Models: OpenAI text-embedding-3, sentence-transformers, Cohere embed.",
            "Same model for indexing AND querying — mixing models breaks the space.",
            "Quality check: similar pairs should have high cosine, unrelated pairs low.",
          ],
          interview: "\"Embeddings encode semantics into vector space so cosine distance approximates meaning similarity — one model must embed both docs and queries.\"",
        },
        {
          demo: "chunking",
          title: "Chunking & Overlap",
          blurb: "Documents get split into chunks small enough to retrieve precisely and big enough to carry context. Overlap keeps sentences that straddle boundaries intact.",
          points: [
            "Fixed-size (with overlap) vs semantic chunking — semantics beats blind splitting.",
            "Too small: fragments lose context. Too big: retrieval gets blurry and context overflows.",
            "Keep structure: split on headings/paragraphs before falling back to character counts.",
            "Attach metadata (source, page, section) — it powers citations and filters.",
          ],
          interview: "\"I chunk on document structure with 10–20% overlap and keep metadata, because chunk boundaries are where answers go missing.\"",
        },
      ],
    },
    {
      label: "Retrieval",
      lessons: [
        {
          demo: "cosine-sim",
          title: "Cosine Similarity Search",
          blurb: "The query becomes a vector; every chunk is a vector; retrieval is comparing angles. Small angle → high cosine → the chunk likely contains the answer.",
          points: [
            "cos θ = dot(a,b)/(|a||b|) — 1 identical, 0 unrelated, −1 opposite.",
            "Preferred over Euclidean for text: magnitude encodes length, not relevance.",
            "Inner product vs cosine: normalize vectors once and they become equivalent.",
            "Threshold on scores to refuse answering when nothing is truly relevant.",
          ],
          interview: "\"I retrieve by cosine similarity, normalize embeddings, and set a minimum-score floor so the model says 'not in the docs' instead of guessing.\"",
        },
        {
          demo: "vector-search",
          title: "Top-k Vector Search (ANN)",
          blurb: "Scanning millions of vectors per query is impossible, so approximate nearest neighbor indexes (HNSW, IVF) trade a little recall for huge speed. You ask for the k nearest chunks.",
          points: [
            "Exact search = brute force; ANN = graph/cluster indexes (HNSW, IVF, PQ).",
            "top-k is a hyperparameter: k=3–8 typical; too high drowns the context window.",
            "Indexes trade recall vs latency vs memory — benchmark on YOUR data.",
            "Hybrid search: BM25 keyword + vectors, fused with RRF, catches exact terms.",
          ],
          interview: "\"Vector search uses ANN indexes like HNSW for sub-second top-k retrieval; I often fuse it with BM25 for exact-match queries.\"",
        },
        {
          demo: "rerank",
          title: "Reranking",
          blurb: "Vector recall is fast but shallow. A cross-encoder reads query+chunk together and rescores — pulling the truly relevant chunks to the top before they reach the LLM.",
          points: [
            "Bi-encoder embeds independently (fast); cross-encoder reads the pair (accurate).",
            "Pipeline: recall 20–50 with vectors → rerank → keep top 3–5.",
            "Rerankers: Cohere Rerank, bge-reranker, ColBERT-style late interaction.",
            "Reranking usually beats embedding upgrades — cheapest quality win in RAG.",
          ],
          interview: "\"I recall wide with vectors then rerank with a cross-encoder — it fixes most retrieval misses for a small latency cost.\"",
        },
      ],
    },
    {
      label: "Generation & Quality",
      lessons: [
        {
          demo: "context-assemble",
          title: "Assembling the Prompt",
          blurb: "System instructions + retrieved chunks + the question go into one prompt. The context window is a budget: over-stuffing hurts more than under-stuffing.",
          points: [
            "Order matters — models attend best to the start and end of the context ('lost in the middle').",
            "Cite chunks inline (【1】) so users can verify every claim.",
            "Deduplicate near-identical chunks before spending the budget.",
            "When context is thin, say so — refusal beats hallucination.",
          ],
          interview: "\"I budget the context window, put the best chunks first and last, demand inline citations, and instruct refusal when retrieval is weak.\"",
        },
        {
          demo: "hallucination",
          title: "Grounding vs Hallucination",
          blurb: "Given weak context, an LLM will happily invent a confident answer. Grounding means every claim traces to retrieved text — enforced by prompts, citations and faithfulness checks.",
          points: [
            "Hallucination rate is a retrieval problem half the time: fix the retriever first.",
            "Prompt defenses: 'answer only from the context, else say you don't know'.",
            "Faithfulness evals (RAGAS) catch unsupported claims automatically.",
            "Lower temperature helps; it cannot fix missing evidence.",
          ],
          interview: "\"I fight hallucination with grounding: strict context-only prompting, citations, faithfulness scoring — and I never send the LLM an empty retrieval.\"",
        },
        {
          demo: "rag-vs-finetune",
          title: "RAG vs Fine-tuning",
          blurb: "New facts that change often → retrieve them (RAG). A new style, format or skill → change the weights (fine-tuning). Mature systems usually do both.",
          points: [
            "RAG: fresh knowledge, citations, easy updates — no training cost.",
            "Fine-tuning: style/tone/format/domain behavior — not a knowledge dump.",
            "Fine-tuning cannot reliably inject fast-changing facts; RAG cannot teach style.",
            "Classic combo: fine-tune the behavior, retrieve the facts.",
          ],
          interview: "\"I reach for RAG to ground answers in changing knowledge, and fine-tuning only for behavior like format and tone — they solve different problems.\"",
        },
        {
          demo: "rag-evals",
          title: "Evaluating a RAG System",
          blurb: "Three questions decide quality: did retrieval find the right chunks (context recall), does the answer stick to them (faithfulness), and does it actually answer the question (relevance)?",
          points: [
            "Evaluate retrieval and generation SEPARATELY — failures hide at the seam.",
            "RAGAS-style metrics: context precision/recall, faithfulness, answer relevancy.",
            "Build a golden set of real questions with known source chunks.",
            "Track p95 latency and cost per query alongside quality — they constrain design.",
          ],
          interview: "\"I measure context recall, faithfulness and answer relevance on a golden set, because optimizing the LLM can't fix a broken retriever.\"",
        },
      ],
    },
  ],
};
