// ============================================================
// DS Galaxy — Curriculum: ML Galaxy (17 lessons, 3 rings)
// ============================================================

export const ML = {
  id: "ml",
  name: "ML Galaxy",
  icon: "🪐",
  accent: "#6c8cff",
  tagline: "Machine learning, taught pin to pin — every lesson is a live animation.",
  rings: [
    {
      label: "Foundations",
      lessons: [
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
      ],
    },
    {
      label: "Core Algorithms",
      lessons: [
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
      ],
    },
    {
      label: "Evaluation & Tuning",
      lessons: [
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
      ],
    },
  ],
};
