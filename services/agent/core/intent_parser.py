import re
from typing import Optional


DOMAIN_KEYWORDS = {
    "ml": [
        "machine learning", "model", "train", "predict", "classifier",
        "regression", "clustering", "neural", "deep learning", "random forest",
        "decision tree", "svm", "kmeans", "k-means", "linear regression",
        "logistic regression", "gradient", "feature", "dataset", "accuracy",
        "precision", "recall", "f1", "cross validation", "sklearn",
        "scikit-learn", "tensorflow", "pytorch", "xgboost",
    ],
    "general": [
        "script", "tool", "utility", "calculate", "convert", "parse",
        "generate", "analyze", "process", "transform", "sort", "filter",
        "scrape", "api", "http", "json", "csv", "file", "data",
    ],
}


def parse_intent(intent: str) -> dict:
    intent_lower = intent.lower()

    domain = classify_domain(intent_lower)
    algorithm = extract_algorithm(intent_lower)

    return {
        "raw_intent": intent,
        "domain": domain,
        "algorithm": algorithm,
        "intent_lower": intent_lower,
    }


def classify_domain(intent_lower: str) -> str:
    ml_score = sum(1 for kw in DOMAIN_KEYWORDS["ml"] if kw in intent_lower)
    general_score = sum(
        1 for kw in DOMAIN_KEYWORDS["general"] if kw in intent_lower
    )

    if ml_score > general_score:
        return "ml"
    return "general"


def extract_algorithm(intent_lower: str) -> Optional[str]:
    algorithms = {
        "linear regression": "linear_regression",
        "logistic regression": "logistic_regression",
        "decision tree": "decision_tree",
        "random forest": "random_forest",
        "k-means": "kmeans",
        "kmeans": "kmeans",
        "svm": "svm",
        "support vector": "svm",
        "neural network": "neural_network",
        "knn": "knn",
        "k-nearest": "knn",
        "naive bayes": "naive_bayes",
        "gradient boosting": "gradient_boosting",
        "xgboost": "xgboost",
    }

    for keyword, algo_id in algorithms.items():
        if keyword in intent_lower:
            return algo_id

    return None
