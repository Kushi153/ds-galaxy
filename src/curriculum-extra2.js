// ============================================================
// DS Galaxy — Curricula: Deep Learning + AI Engineering
// ============================================================

export const DL = {
  id: "dl",
  name: "Deep Learning Galaxy",
  icon: "⚡",
  accent: "#ffd166",
  tagline: "From a single neuron to transformers — watch deep learning assemble itself.",
  rings: [
    {
      label: "Neural Net Basics",
      lessons: [
        {
          demo: "perceptron",
          title: "The Perceptron",
          blurb: "One neuron: multiply inputs by weights, add bias, step. Every misclassification nudges the weights until the line separates the classes — this is learning in its purest form.",
          points: [
            "Output = step(w·x + b); learning = nudging w toward the correct side.",
            "Only works on linearly separable data (the 1969 Minsky–Papert limitation).",
            "The fix: stack neurons in layers + non-linear activations = MLP.",
            "Same update logic survives today inside gradient descent.",
          ],
          interview: "\"A perceptron is a single linear classifier updated on mistakes — stacking layers with non-linearities is what overcame its limits.\"",
        },
        {
          demo: "nn",
          title: "Neural Networks (MLP)",
          blurb: "Layers of weighted sums with non-linear activations. The forward pass flows left to right; depth lets early layers detect simple features and later layers combine them into concepts.",
          points: [
            "Each neuron: z = Σwᵢxᵢ + b, then activation f(z).",
            "No activation → any depth collapses to one linear layer.",
            "Universal approximation: one hidden layer suffices, but depth is exponentially more efficient.",
            "Parameters = weights + biases; capacity must match data size.",
          ],
          interview: "\"An MLP is stacked linear transforms with non-linear activations — depth builds hierarchical features, activations keep it non-linear.\"",
        },
        {
          demo: "backprop",
          title: "Backpropagation",
          blurb: "Forward pass predicts, loss measures the miss, then the error flows backward layer by layer — each weight receives its exact share of the blame via the chain rule.",
          points: [
            "Backprop = chain rule applied efficiently, reusing intermediate gradients.",
            "Gradients tell each weight which direction reduces loss.",
            "Vanishing gradients: deep sigmoid chains shrink signals — ReLU/residuals fight it.",
            "One step = forward + backward + optimizer update; repeat millions of times.",
          ],
          interview: "\"Backprop computes the loss gradient for every weight via the chain rule, and the optimizer steps opposite it — the whole training loop in one sentence.\"",
        },
        {
          demo: "activation",
          title: "Activation Functions",
          blurb: "Stack 100 purely linear layers and you still get a line. Activations inject the non-linearity that makes depth powerful — watch ReLU, sigmoid, tanh and linear compared live.",
          points: [
            "ReLU max(0,x): default hidden-layer choice — fast, no vanishing gradient for x>0.",
            "Sigmoid/tanh saturate → gradients vanish in deep stacks.",
            "Output choices: sigmoid (binary), softmax (multiclass), linear (regression).",
            "Modern variants: LeakyReLU, GELU, SwiGLU fix 'dying ReLU'.",
          ],
          interview: "\"Activations provide non-linearity; ReLU dominates hidden layers because it trains fast and doesn't saturate like sigmoid.\"",
        },
      ],
    },
    {
      label: "Architectures",
      lessons: [
        {
          demo: "cnn-conv",
          title: "CNNs — Convolution",
          blurb: "A small filter slides across the image computing dot products, producing a feature map of where its pattern fires. Edge filters, texture filters, eye detectors — all learned, all from this one operation.",
          points: [
            "Three ideas: local receptive fields, shared weights, translation equivariance.",
            "Stacking: conv → ReLU → pool, repeated; early layers = edges, deep layers = objects.",
            "Parameters depend on kernel size, not image size — that's the efficiency win.",
            "Padding keeps spatial size; stride downsamples.",
          ],
          interview: "\"Convolutions share small filters across all positions, so networks learn translation-equivariant features with far fewer parameters than dense layers.\"",
        },
        {
          demo: "pooling",
          title: "Max Pooling",
          blurb: "Each 2×2 window collapses to its maximum value: the map shrinks 4×, the strongest activation survives, and small shifts in input stop mattering.",
          points: [
            "Pooling adds translation invariance and cuts compute.",
            "Max pooling keeps the strongest signal; average pooling smooths it.",
            "Modern nets often replace pooling with strided convolutions.",
            "Global average pooling at the end replaces huge flatten layers.",
          ],
          interview: "\"Max pooling downsamples feature maps so activations become robust to small translations — I also use global average pooling before classifiers.\"",
        },
        {
          demo: "rnn",
          title: "Recurrent Neural Networks",
          blurb: "The same cell processes tokens one at a time, carrying a hidden-state memory forward. Watch the state travel along the timeline — and fade on long sequences.",
          points: [
            "hₜ = f(W·hₜ₋₁ + U·xₜ) — memory is the hidden state.",
            "Vanishing gradients through time: long dependencies fade → LSTM/GRU gates.",
            "Sequential nature blocks parallelism — the reason transformers won.",
            "Still natural for streaming/online tasks.",
          ],
          interview: "\"RNNs carry hidden state through time, which gives memory but suffers vanishing gradients and no parallelism — why transformers replaced them for language.\"",
        },
        {
          demo: "attention",
          title: "Attention",
          blurb: "For each word, attention weights decide which other words matter right now. Watch 'it' look back and find 'animal' and 'tired' — context solved with pure weighted lookup.",
          points: [
            "Queries, keys, values: softmax(QKᵀ/√d)·V.",
            "Every position attends to every position — long-range dependencies, one hop.",
            "Multi-head attention runs several views in parallel.",
            "Self-attention is O(n²) in sequence length — the cost transformers pay.",
          ],
          interview: "\"Self-attention lets every token gather information from every other token via query-key matching — parallel, long-range, and the heart of transformers.\"",
        },
        {
          demo: "transformer",
          title: "The Transformer",
          blurb: "Tokens rise through identical blocks: self-attention (mix information across positions) then a feed-forward net (process it), with residuals and normalization keeping gradients healthy.",
          points: [
            "Attention + FFN + residual + LayerNorm = one transformer block; stack it.",
            "Positional encodings restore order that attention alone can't see.",
            "No recurrence → full parallelism during training → scale became possible.",
            "Encoder (BERT, understanding) vs decoder (GPT, generation) vs both (T5).",
          ],
          interview: "\"A transformer stacks self-attention and feed-forward blocks with residuals — parallelizable and scalable, which is why every modern LLM is one.\"",
        },
      ],
    },
    {
      label: "Training Toolkit",
      lessons: [
        {
          demo: "dropout",
          title: "Dropout",
          blurb: "Each training step randomly switches off a fraction of neurons. No single neuron can be relied on, so the network learns redundant, robust features — cheap ensemble learning.",
          points: [
            "p ≈ 0.2–0.5 typical; only active during training, disabled at inference.",
            "Acts like averaging an ensemble of subnetworks.",
            "Inverted dropout scales activations at train time so inference needs no changes.",
            "Watch for it in conv nets (lower p) vs dense layers (higher p).",
          ],
          interview: "\"Dropout randomly zeroes activations during training to prevent co-adaptation — at inference it's off, equivalent to an ensemble of subnetworks.\"",
        },
        {
          demo: "optimizers",
          title: "Optimizers: SGD vs Adam",
          blurb: "Three optimizers descend the same loss ravine: plain SGD zigzags, Momentum smooths the path, Adam adapts the step size per parameter and usually converges fastest.",
          points: [
            "SGD + momentum remains the choice for many vision tasks (better generalization).",
            "Adam keeps running mean+variance of gradients → per-parameter learning rates.",
            "AdamW decouples weight decay — the modern default for transformers.",
            "Learning-rate schedules (warmup + cosine decay) matter as much as the optimizer.",
          ],
          interview: "\"Adam adapts per-parameter steps using gradient moments; AdamW is my default, with SGD+momentum sometimes generalizing better in vision.\"",
        },
        {
          demo: "transfer",
          title: "Transfer Learning & Fine-tuning",
          blurb: "Nobody trains from scratch anymore: start from a pretrained model, freeze its general layers, and train a small new head on your modest dataset — better results, a fraction of the cost.",
          points: [
            "Feature extraction: frozen base + trainable head.",
            "Fine-tuning: unfreeze the last blocks with a tiny learning rate.",
            "Works because early layers learn universal features (edges, word senses).",
            "Domain gap big? Fine-tune more layers; data tiny? Freeze more.",
          ],
          interview: "\"I start from pretrained weights, train a head on my data, then unfreeze upper layers with a low LR — transfer learning beats from-scratch in almost every practical setting.\"",
        },
      ],
    },
  ],
};

export const AI = {
  id: "ai",
  name: "AI Engineering Galaxy",
  icon: "✨",
  accent: "#a78bfa",
  tagline: "Building products on top of LLMs — tokens, prompts, agents, evals and shipping.",
  rings: [
    {
      label: "LLM Core",
      lessons: [
        {
          demo: "llm-tokens",
          title: "Tokens & Next-Token Prediction",
          blurb: "An LLM reads text as subword tokens and does exactly one thing: predict the next token. Everything you've seen it do — code, essays, jokes — is that loop repeated thousands of times.",
          points: [
            "Text → tokens → ids → vectors; cost and limits are counted in tokens.",
            "Generation = repeated sampling from P(next | so far).",
            "~4 characters per token in English; non-English can be 2–3× more tokens.",
            "Autoregressive: each generated token becomes input for the next.",
          ],
          interview: "\"LLMs are autoregressive next-token predictors over subword tokens — that single loop explains capability, cost, and latency.\"",
        },
        {
          demo: "llm-training",
          title: "How LLMs Are Trained",
          blurb: "Three stages: pretraining on trillions of tokens teaches language and facts; supervised fine-tuning teaches instruction-following; RLHF from human rankings teaches helpfulness.",
          points: [
            "Pretraining: next-token on web-scale data — the expensive stage.",
            "SFT: curated demonstrations of good answers.",
            "RLHF/DPO: optimize toward human preference rankings.",
            "Foundation model → chat model; most 'tuning' you do is far downstream.",
          ],
          interview: "\"Pretraining gives capability, SFT gives format, RLHF gives behavior — understanding this tells you what fine-tuning can and cannot fix.\"",
        },
        {
          demo: "temperature",
          title: "Temperature & Sampling",
          blurb: "Temperature rescales the output distribution: near 0 always picks the safest token (deterministic, factual), high values spread probability wide (creative, risky).",
          points: [
            "T→0: greedy decoding — best for extraction, code, factual QA.",
            "T≈0.7–1.0: balanced chat and writing.",
            "Top-p (nucleus) sampling: keep the smallest set covering p of the mass.",
            "Determinism needs T=0 AND a fixed seed where supported.",
          ],
          interview: "\"Temperature controls randomness of sampling: low for factual pipelines, higher for ideation — and I set top-p to trim the long tail.\"",
        },
        {
          demo: "context-window",
          title: "Context Windows",
          blurb: "The model attends only to what's inside its window. When a conversation outgrows it, the earliest turns vanish — not 'forgotten', simply absent from the input.",
          points: [
            "Everything the model knows right now must fit in the window.",
            "Strategies: sliding window, summarization, retrieval of older turns (memory = RAG).",
            "'Lost in the middle': position matters, not just length.",
            "Bigger windows cost more tokens → more latency and money per call.",
          ],
          interview: "\"A context window is finite attention: I manage it with summarization and retrieval, because older turns literally leave the model's input.\"",
        },
      ],
    },
    {
      label: "Working with LLMs",
      lessons: [
        {
          demo: "prompting",
          title: "Prompting Patterns",
          blurb: "Zero-shot asks directly. Few-shot shows examples. Chain-of-thought asks for reasoning first. Same model — wildly different results — which is why prompting is an engineering discipline.",
          points: [
            "System prompt = contract: role, rules, output format.",
            "Few-shot examples teach format faster than instructions alone.",
            "Chain-of-thought helps multi-step reasoning; ask for steps before the answer.",
            "Structured output: demand JSON, validate with a schema, retry on failure.",
          ],
          interview: "\"I treat prompts as versioned code: system contract, few-shot exemplars for format, CoT for reasoning, schema-validated outputs with retries.\"",
        },
        {
          demo: "rag-vs-finetune",
          title: "Fine-tuning vs RAG",
          blurb: "Fine-tuning changes behavior: style, format, domain skill. RAG supplies knowledge: fresh, private, citable facts. Most 'the model doesn't know X' problems are retrieval problems.",
          points: [
            "Fine-tune for: tone, schema adherence, domain vocabulary, latency (shorter prompts).",
            "RAG for: facts that change, private data, citations, auditability.",
            "Fine-tuning rarely cures hallucination on missing knowledge — retrieval does.",
            "LoRA/QLoRA make fine-tuning cheap on a single GPU.",
          ],
          interview: "\"I fine-tune behavior and retrieve knowledge: RAG for changing facts with citations, LoRA fine-tuning for format and style.\"",
        },
        {
          demo: "hallucination",
          title: "Hallucination",
          blurb: "The model is a probability machine, not a truth machine: when evidence is missing, it generates plausible text anyway. Grounding, citations and verification turn it into a reliable product.",
          points: [
            "Root causes: gaps in knowledge, weak context, high temperature, leading prompts.",
            "Defenses: grounding (RAG), context-only instructions, citations, self-check passes.",
            "Evaluate faithfulness automatically — spot checks will not scale.",
            "UX matters: show sources, allow correction, expose uncertainty.",
          ],
          interview: "\"I treat hallucination as a systems problem: ground with RAG, constrain with prompts, verify with faithfulness evals, and surface sources to users.\"",
        },
      ],
    },
    {
      label: "Systems & Shipping",
      lessons: [
        {
          demo: "agents",
          title: "AI Agents & Tool Use",
          blurb: "An agent is an LLM in a loop with tools: think about the goal, pick and call a tool, observe the result, repeat until done. Autonomy comes from the loop, intelligence from the model.",
          points: [
            "Core loop: reason → act (tool call) → observe → repeat.",
            "Tools are typed functions with schemas — search, code execution, DB queries.",
            "Guardrails: step limits, allow-lists, human approval for risky actions.",
            "Fail predictably: when confidence is low, escalate rather than guess.",
          ],
          interview: "\"An agent is an LLM loop with typed tool calls and guardrails — the reasoning loop is why it can do multi-step work a plain completion cannot.\"",
        },
        {
          demo: "ai-evals",
          title: "Evals & Benchmarks",
          blurb: "Evals are regression tests for prompts and models: a golden dataset, automatic graders (exact match, LLM-as-judge), and a score you must not regress. No evals, no safe iteration.",
          points: [
            "Build golden sets from real user queries with expected outputs.",
            "Graders: exact/fuzzy match, schema checks, LLM-as-judge with rubrics.",
            "Track quality AND latency + cost — they trade off.",
            "CI for prompts: every prompt/model change reruns the suite.",
          ],
          interview: "\"I build evals before iterating: a golden set, LLM-as-judge scoring, and a CI gate so no prompt change ships without a score.\"",
        },
        {
          demo: "mlops",
          title: "LLMOps: Shipping AI",
          blurb: "Production AI is a loop: version prompts and models, cache responses, monitor latency/cost/quality, capture failures, and feed them back into the eval set.",
          points: [
            "Version EVERYTHING: prompts, models, retrieval configs.",
            "Semantic caching cuts cost/latency for repeated queries.",
            "Monitor: p95 latency, cost per request, hallucination/thumbs-down rate.",
            "Failures become eval cases — the system improves from production traffic.",
          ],
          interview: "\"I run LLM features like software: versioned prompts, caching, dashboards for cost/latency/quality, and a feedback loop that turns failures into evals.\"",
        },
      ],
    },
  ],
};
