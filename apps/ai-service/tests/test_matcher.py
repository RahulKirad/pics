"""Tests for face matching."""

import numpy as np

from app.services.matcher import match_embeddings
from app.models.schemas import FaceMatchCandidate


def test_match_embeddings_returns_similar_faces() -> None:
    query = np.random.rand(512).astype(np.float32)
    query = query / np.linalg.norm(query)

    similar = query * 0.98 + np.random.rand(512).astype(np.float32) * 0.02
    similar = similar / np.linalg.norm(similar)
    different = np.random.rand(512).astype(np.float32)
    different = different / np.linalg.norm(different)

    candidates = [
        FaceMatchCandidate(id="similar", embedding=similar.tolist()),
        FaceMatchCandidate(id="different", embedding=different.tolist()),
    ]

    matches = match_embeddings(query.tolist(), candidates, threshold=0.5, top_k=5)
    assert matches
    assert matches[0].id == "similar"
    assert matches[0].similarity > 0.5
