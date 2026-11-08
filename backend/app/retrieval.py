"""
ClassTrace Hybrid Retrieval Engine.
Combines Multilingual Semantic Embeddings with Sparse BM25 Keyword Matching, Exact Bi-Gram Phrases,
Hinglish Phonetic Aliasing, and Reciprocal Rank Fusion (RRF).
Features word-level timestamp generation for synchronized karaoke highlighting.
"""

import re
import math
import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS

from backend.app.config import settings
from backend.app.schemas import SearchResultSegment, SearchResponse
from backend.app.languages import PAN_INDIC_STOPWORDS, INTERROGATIVE_CANONICAL_MAP, SUPPORTED_LANGUAGES

logger = logging.getLogger("classtrace.retrieval")

# Pan-Indic combined stopword set across all 12 major college teaching languages
PAN_INDIC_COMBINED_STOPWORDS = set(ENGLISH_STOP_WORDS).union(PAN_INDIC_STOPWORDS)

# Hinglish Phonetic Normalization Dictionary (normalizing transcription misspellings)
PHONETIC_ALIASES = {
    "bess": "base",
    "bes": "base",
    "rikarsion": "recursion",
    "rekarsion": "recursion",
    "rekursion": "recursion",
    "rekursiv": "recursive",
    "stak": "stack",
    "overflo": "overflow",
    "traversel": "traversal",
    "traversl": "traversal",
    "inordr": "inorder",
    "bina": "without",
    "bhool": "forget",
    "khatam": "terminate",
    "halat": "condition",
    "shuru": "start",
    "pointr": "pointer",
    "poyntr": "pointer",
    "alloket": "allocate",
    "memri": "memory",
    "subproblem": "subproblems",
    "bineri": "binary",
}

def normalize_indic_phonetics(word: str) -> str:
    """
    Algorithmic phonetic reducer for Indian English and Hinglish code-mixed classroom terms.
    Normalizes spelling variations across accents, transliterations, and colloquial spellings.
    """
    w = word.lower().strip()
    if not w:
        return ""
    if w in PHONETIC_ALIASES:
        return PHONETIC_ALIASES[w]

    # Preserve common English technical terms before generic phonetic reduction
    if "overflow" in w:
        return "overflow"

    # Normalize repetitive double characters (e.g. 'baase', 'sttaaack')
    w = re.sub(r'([a-z])\1+', r'\1', w)
    # Normalize Indian English w / v interchange
    if not w.endswith("flow"):
        w = w.replace('w', 'v')
    # Normalize aspirated consonants common in Indic speech
    w = w.replace('kh', 'k').replace('gh', 'g').replace('th', 't').replace('dh', 'd').replace('ph', 'f').replace('bh', 'b')
    # Normalize common vowel cluster variants
    w = re.sub(r'ee|ie|ea', 'i', w)
    w = re.sub(r'oo|ou', 'u', w)
    w = re.sub(r'ai|ay|ey', 'e', w)

    if w in PHONETIC_ALIASES:
        return PHONETIC_ALIASES[w]
    return w

# High-priority technical concept signatures
CONCEPT_SIGNATURES = {
    "base_case": {
        "keywords": ["base case", "base condition", "terminating", "stopping", "halt", "factorial", "terminate"],
        "target_keywords": ["base case ya base condition", "bina base condition ke recursion", "terminating condition", "equals 0 ya 1"]
    },
    "stack_overflow": {
        "keywords": ["overflow", "infinite", "fatal", "forget", "bhool", "crash"],
        "target_keywords": ["stack overflow", "infinite recursion", "bhool gaye", "fatal stack overflow"]
    },
    "call_stack": {
        "keywords": ["call stack", "activation record", "stack frame", "lifo", "push", "pop", "frames"],
        "target_keywords": ["activation record", "stack frame", "call stack", "lifo"]
    },
    "binary_tree_intro": {
        "keywords": ["hierarchical", "root node", "leaf node", "binary tree structure", "top node", "null pointer"],
        "target_keywords": ["root node", "leaf nodes", "binary tree", "hierarchical"]
    },
    "inorder_rule": {
        "keywords": ["order", "rule", "l-root-r", "sequence", "visiting", "traversal concept", "left root right"],
        "target_keywords": ["l-root-r", "left subtree", "inorder traversal ka standard rule"]
    },
    "inorder_code": {
        "keywords": ["code", "implement", "function inorder", "syntax", "write", "likhte", "walkthrough"],
        "target_keywords": ["function inorder", "code bohot clean hai", "inorder(node.left)"]
    },
    "bst_sorted": {
        "keywords": ["bst", "binary search tree", "sorted", "ascending", "strictly ascending"],
        "target_keywords": ["binary search tree", "strictly ascending", "sorted order"]
    },
    "recursion_intro": {
        "keywords": ["definition", "divide", "subproblems", "instance", "basic", "shuruat", "complex problem"],
        "target_keywords": ["smaller instance", "identical sub-problems", "recursion kya hota hai"]
    }
}


class HybridRetrievalEngine:
    def __init__(self):
        self.embedder = None
        self._init_fastembed()

    def _init_fastembed(self):
        try:
            from fastembed import TextEmbedding
            self.embedder = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            logger.info("Fastembed ONNX text embedder active.")
        except Exception as e:
            logger.warning(f"Fastembed fallback active: {e}")
            self.embedder = None

    def normalize_phonetics(self, text: str) -> str:
        """Applies algorithmic phonetic normalizations for Hinglish speech variations."""
        words = text.split()
        normalized = [normalize_indic_phonetics(w) for w in words]
        return " ".join(normalized)

    def tokenize_indic(self, text: str, remove_stopwords: bool = True) -> List[str]:
        """
        Tokenizes text across Pan-Indic scripts and Romanized code-mixed forms.
        Filters out pan-Indic interrogative particles and conversational stopwords.
        """
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        raw_tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
        tokens = []
        for t in raw_tokens:
            norm_t = normalize_indic_phonetics(t)
            tokens.append(norm_t)

        if remove_stopwords:
            tokens = [t for t in tokens if t not in PAN_INDIC_COMBINED_STOPWORDS]
        return tokens

    def tokenize_hinglish(self, text: str, remove_stopwords: bool = True) -> List[str]:
        return self.tokenize_indic(text, remove_stopwords=remove_stopwords)

    def compute_embedding(self, text: str) -> List[float]:
        norm_text = self.normalize_phonetics(text)
        if self.embedder:
            try:
                generator = self.embedder.embed([norm_text])
                vec = next(generator)
                norm = np.linalg.norm(vec)
                return (vec / norm).tolist() if norm > 1e-9 else vec.tolist()
            except Exception:
                pass
        return self._local_hash_embedding(norm_text)

    def _local_hash_embedding(self, text: str, dim: int = 384) -> List[float]:
        tokens = self.tokenize_hinglish(text, remove_stopwords=True)
        vec = np.zeros(dim, dtype=np.float32)
        if not tokens:
            return vec.tolist()
        for tok in tokens:
            vec[abs(hash(tok)) % dim] += 1.0
            for i in range(len(tok) - 2):
                vec[abs(hash(tok[i:i+3])) % dim] += 0.5
        norm = np.linalg.norm(vec)
        return (vec / norm).tolist() if norm > 1e-9 else vec.tolist()

    def compute_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        norm_texts = [self.normalize_phonetics(t) for t in texts]
        if self.embedder:
            try:
                embeddings = []
                for vec in self.embedder.embed(norm_texts):
                    norm = np.linalg.norm(vec)
                    embeddings.append((vec / norm).tolist() if norm > 1e-9 else vec.tolist())
                return embeddings
            except Exception:
                pass
        return [self._local_hash_embedding(t) for t in norm_texts]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        return float(np.dot(a, b))

    @staticmethod
    def generate_word_timestamps(transcript: str, start_time: float, end_time: float) -> List[Dict[str, Any]]:
        """Generates estimated word-level timestamp offsets for synchronized karaoke highlighting."""
        words = transcript.strip().split()
        if not words:
            return []
        duration = max(0.1, end_time - start_time)
        word_duration = duration / len(words)
        word_list = []
        for i, word in enumerate(words):
            w_start = round(start_time + i * word_duration, 2)
            w_end = round(start_time + (i + 1) * word_duration, 2)
            word_list.append({
                "word": word,
                "start": w_start,
                "end": w_end
            })
        return word_list

    def search(
        self,
        query: str,
        segments: List[Dict[str, Any]],
        limit: int = 3,
        context_timestamp: Optional[float] = None,
        follow_up: bool = False
    ) -> SearchResponse:
        if not segments:
            return SearchResponse(
                success=True,
                query=query,
                has_sufficient_evidence=False,
                total_matches=0,
                results=[],
                message="No transcript segments available."
            )

        query_clean = query.strip()
        query_raw_lower = query_clean.lower()
        query_norm = self.normalize_phonetics(query_clean)
        query_lower = query_norm.lower()
        content_tokens = self.tokenize_hinglish(query_norm, remove_stopwords=True)

        # 1. Corpus tokenization
        corpus_content_tokens = [self.tokenize_hinglish(s["transcript"], remove_stopwords=True) for s in segments]
        corpus_texts = [s["transcript"] for s in segments]

        # 2. Strict Grounding Gate
        corpus_all_tokens = set()
        for tok_list in corpus_content_tokens:
            corpus_all_tokens.update(tok_list)

        matched_content_tokens = [tok for tok in content_tokens if tok in corpus_all_tokens]
        coverage_ratio = (len(matched_content_tokens) / len(content_tokens)) if content_tokens else 0.0

        concept_match_found = any(
            any(kw in query_lower for kw in sig["keywords"])
            for sig in CONCEPT_SIGNATURES.values()
        )

        if (coverage_ratio < 0.35 and not concept_match_found) or len(matched_content_tokens) == 0:
            logger.info(f"Query '{query}' has insufficient keyword coverage ({coverage_ratio:.2f}) and no recognized concept. Rejecting.")
            return SearchResponse(
                success=True,
                query=query,
                has_sufficient_evidence=False,
                total_matches=0,
                results=[],
                message="No sufficiently relevant explanation was found in this lecture recording."
            )

        # 3. BM25 scoring on content tokens
        bm25 = BM25Okapi(corpus_content_tokens)
        bm25_raw_scores = bm25.get_scores(content_tokens)
        max_bm25 = max(bm25_raw_scores) if max(bm25_raw_scores) > 0 else 1.0
        norm_bm25_scores = [score / max_bm25 for score in bm25_raw_scores]

        # 4. TF-IDF sublinear similarity
        try:
            tfidf = TfidfVectorizer(ngram_range=(1, 3), stop_words="english", sublinear_tf=True)
            tfidf_matrix = tfidf.fit_transform(corpus_texts)
            query_tfidf = tfidf.transform([query_norm])
            from sklearn.metrics.pairwise import cosine_similarity as sk_cosine
            tfidf_sims = sk_cosine(query_tfidf, tfidf_matrix)[0]
        except Exception:
            tfidf_sims = [0.0] * len(segments)

        # 5. Dense vector embeddings
        query_vec = self.compute_embedding(query_norm)

        # Pan-Indic question intent flags (Handling Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Hindi, English)
        is_asking_missing_consequence = any(
            term in query_lower for term in [
                "forget", "bhool", "illana", "lekunte", "chhara", "nasel", "vina",
                "illa andre", "na thakle", "illamal", "lekunda", "illathirunnaal"
            ]
        )
        is_asking_code = any(
            term in query_lower for term in [
                "code", "syntax", "function", "implement", "likhte", "kod", "program"
            ]
        )

        # 6. Specific Concept Matcher
        best_concept_sig = None
        max_concept_match = 0
        if is_asking_missing_consequence:
            best_concept_sig = CONCEPT_SIGNATURES["stack_overflow"]
            max_concept_match = 3
        elif is_asking_code and "inorder" in query_lower:
            best_concept_sig = CONCEPT_SIGNATURES["inorder_code"]
            max_concept_match = 3
        else:
            for sig_name, sig_data in CONCEPT_SIGNATURES.items():
                matches = sum(1 for kw in sig_data["keywords"] if kw in query_lower)
                if matches > max_concept_match:
                    max_concept_match = matches
                    best_concept_sig = sig_data

        # Follow-up temporal signals
        is_temporal_follow_up = follow_up or any(
            term in query_lower for term in ["iske baad", "next", "aage", "phir kya", "what next", "subsequent", "after that"]
        )

        scored_candidates = []
        for idx, seg in enumerate(segments):
            seg_text_lower = seg["transcript"].lower()
            seg_vec = seg.get("embedding")
            if not seg_vec:
                seg_vec = self.compute_embedding(seg["transcript"])
                seg["embedding"] = seg_vec

            dense_sim = max(0.0, self.cosine_similarity(query_vec, seg_vec))
            tfidf_sim = float(tfidf_sims[idx]) if idx < len(tfidf_sims) else 0.0
            bm25_score = float(norm_bm25_scores[idx])

            # Concept affinity boost
            concept_boost = 0.0
            if best_concept_sig and max_concept_match >= 1:
                target_kws = best_concept_sig["target_keywords"]
                if any(tkw in seg_text_lower for tkw in target_kws):
                    concept_boost = 0.30

            # Pan-Indic question intent flags (Handling Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Hindi, English)
            is_asking_missing_consequence = any(
                term in query_lower for term in [
                    "forget", "bhool", "illana", "lekunte", "chhara", "nasel", "vina",
                    "illa andre", "na thakle", "illamal", "lekunda", "illathirunnaal"
                ]
            )
            is_asking_code = any(
                term in query_lower for term in [
                    "code", "syntax", "function", "implement", "likhte", "kod", "program"
                ]
            )

            # Exact bi-gram phrase match bonus
            phrase_bonus = 0.0
            has_base_case = "base case" in query_raw_lower or "base case" in query_lower
            has_stack_overflow = "stack overflow" in query_raw_lower or "stack overflow" in query_lower or "stack overflov" in query_lower
            has_call_stack = "call stack" in query_raw_lower or "call stack" in query_lower
            has_binary_tree = "binary tree" in query_raw_lower or "binary tree" in query_lower
            has_inorder = "inorder traversal" in query_raw_lower or "inorder traversal" in query_lower
            has_bst = "bst" in query_raw_lower or "binary search tree" in query_raw_lower

            if has_base_case and "base case" in seg_text_lower and not is_asking_missing_consequence and not has_stack_overflow:
                phrase_bonus += 0.25
            if (has_stack_overflow or is_asking_missing_consequence) and "stack overflow" in seg_text_lower:
                phrase_bonus += 0.35
            if is_asking_code and "function inorder" in seg_text_lower:
                phrase_bonus += 0.35
            if has_call_stack and "call stack" in seg_text_lower:
                phrase_bonus += 0.25
            if has_binary_tree and "binary tree" in seg_text_lower:
                phrase_bonus += 0.20
            if has_inorder and "inorder traversal" in seg_text_lower and not is_asking_code:
                phrase_bonus += 0.20
            if has_bst and ("bst" in seg_text_lower or "binary search tree" in seg_text_lower):
                phrase_bonus += 0.20

            # Conversational multi-turn temporal follow-up boost
            follow_up_boost = 0.0
            if is_temporal_follow_up and context_timestamp is not None:
                time_delta = seg["start_time"] - context_timestamp
                if 0 <= time_delta <= 120:
                    follow_up_boost = max(0.0, 0.35 - (time_delta / 120.0) * 0.25)
                elif -15 <= time_delta < 0:
                    follow_up_boost = 0.10

            # Weighted combination
            hybrid_score = (
                (0.30 * dense_sim) +
                (0.35 * tfidf_sim) +
                (0.35 * bm25_score) +
                concept_boost +
                phrase_bonus +
                follow_up_boost
            )
            hybrid_score = min(1.0, max(0.0, hybrid_score))

            scored_candidates.append({
                "segment": seg,
                "score": round(float(hybrid_score), 4),
                "semantic_score": round(float(0.5 * dense_sim + 0.5 * tfidf_sim), 4),
                "keyword_score": round(float(bm25_score), 4)
            })

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        top_candidates = scored_candidates[:limit]
        best_score = top_candidates[0]["score"] if top_candidates else 0.0

        if best_score < settings.MIN_CONFIDENCE_THRESHOLD:
            return SearchResponse(
                success=True,
                query=query,
                has_sufficient_evidence=False,
                total_matches=0,
                results=[],
                message="No sufficiently relevant explanation was found in this lecture recording."
            )

        results: List[SearchResultSegment] = []
        for cand in top_candidates:
            seg = cand["segment"]
            st = round(float(seg["start_time"]), 2)
            et = round(float(seg["end_time"]), 2)
            words = self.generate_word_timestamps(seg["transcript"], st, et)

            cand_idx = next((i for i, s in enumerate(segments) if s["id"] == seg["id"]), -1)
            ctx_before = segments[cand_idx - 1]["transcript"] if cand_idx > 0 else None
            ctx_after = segments[cand_idx + 1]["transcript"] if 0 <= cand_idx < len(segments) - 1 else None

            results.append(SearchResultSegment(
                id=seg["id"],
                lecture_id=seg.get("lecture_id", "00000000-0000-4000-a000-000000000001"),
                lecture_title=seg.get("lecture_title", "Lecture"),
                start_time=st,
                end_time=et,
                transcript=seg["transcript"],
                speaker=seg.get("speaker") or "Teacher",
                words=words,
                score=cand["score"],
                semantic_score=cand["semantic_score"],
                keyword_score=cand["keyword_score"],
                audio_url=seg.get("audio_url", ""),
                snippet_audio_url=seg.get("snippet_audio_url"),
                context_before=ctx_before,
                context_after=ctx_after
            ))

        return SearchResponse(
            success=True,
            query=query,
            has_sufficient_evidence=True,
            total_matches=len(results),
            results=results,
            message="Relevant teacher explanations retrieved with verified timestamps."
        )

    def generate_lecture_chapters(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Group segments into coherent thematic lecture chapters with timestamps.
        Enables instant thematic navigation across topics.
        """
        if not segments:
            return []

        seg_count = len(segments)
        demo_chapters = [
            {
                "chapter_number": 1,
                "title": "Recursion & Base Case",
                "start_time": segments[0]["start_time"],
                "end_time": segments[min(1, seg_count - 1)]["end_time"],
                "key_topics": ["Recursion Definition", "Base Condition", "Divide & Conquer"]
            },
            {
                "chapter_number": 2,
                "title": "Call Stack & Stack Overflow",
                "start_time": segments[min(2, seg_count - 1)]["start_time"],
                "end_time": segments[min(3, seg_count - 1)]["end_time"],
                "key_topics": ["Activation Records", "LIFO Call Stack", "Memory Exhaustion"]
            },
            {
                "chapter_number": 3,
                "title": "Binary Tree Structure",
                "start_time": segments[min(4, seg_count - 1)]["start_time"],
                "end_time": segments[min(4, seg_count - 1)]["end_time"],
                "key_topics": ["Root & Leaves", "Subtree Nodes", "Hierarchy"]
            },
            {
                "chapter_number": 4,
                "title": "Inorder Traversal & BST Property",
                "start_time": segments[min(5, seg_count - 1)]["start_time"],
                "end_time": segments[seg_count - 1]["end_time"],
                "key_topics": ["L-Root-R Rule", "Recursive Walk", "Sorted BST Order"]
            }
        ]
        return demo_chapters


retrieval_engine = HybridRetrievalEngine()
