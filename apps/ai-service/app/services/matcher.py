"""Cosine similarity face matching."""

from __future__ import annotations

import numpy as np

from app.models.schemas import FaceMatchCandidate, FaceMatchResult


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
    return float(np.dot(a, b) / denom)


def match_embeddings(
    query_embedding: list[float],
    candidates: list[FaceMatchCandidate],
    threshold: float,
    top_k: int,
) -> list[FaceMatchResult]:
    query = np.asarray(query_embedding, dtype=np.float32)
    matches: list[FaceMatchResult] = []

    for candidate in candidates:
        vector = np.asarray(candidate.embedding, dtype=np.float32)
        if vector.size != query.size:
            continue
        similarity = cosine_similarity(query, vector)
        if similarity >= threshold:
            matches.append(FaceMatchResult(id=candidate.id, similarity=round(similarity, 6)))

    matches.sort(key=lambda item: item.similarity, reverse=True)
    return matches[:top_k]
