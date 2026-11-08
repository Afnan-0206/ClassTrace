"""
Comprehensive retrieval & timestamp accuracy benchmark test suite.
Evaluates:
- Hit@1
- Hit@3
- Timestamp Intersection over Union (IoU)
- Negative control rejection
"""

import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import pytest
import asyncio
from backend.app.database import db
from backend.app.retrieval import retrieval_engine
import json


def test_retrieval_benchmark():
    gt_file = Path(__file__).resolve().parent.parent / "demo_data" / "ground_truth.json"
    assert gt_file.exists(), "ground_truth.json must exist"

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    queries = gt_data["benchmark_queries"]
    assert len(queries) >= 15, f"Must have at least 15 benchmark questions, found {len(queries)}"

    lecture_id = "00000000-0000-4000-a000-000000000001"
    segments = asyncio.run(db.get_all_segments(lecture_id))
    assert len(segments) > 0, "Demo segments must be seeded in database"

    hit_1_count = 0
    hit_3_count = 0
    ious = []

    print(f"\n{'='*75}")
    print(f"CLASSTRACE BENCHMARK EVALUATION ({len(queries)} TEST QUESTIONS)")
    print(f"{'='*75}")

    for idx, q in enumerate(queries, 1):
        q_text = q["question"]
        exp_start = q["expected_timestamp_start"]
        exp_end = q["expected_timestamp_end"]
        is_negative = exp_start < 0

        res = retrieval_engine.search(q_text, segments, limit=3)

        hit_1 = False
        hit_3 = False
        iou = 0.0

        if is_negative:
            # Negative control: must reject
            if not res.has_sufficient_evidence or len(res.results) == 0:
                hit_1 = True
                hit_3 = True
            print(f"[{idx:02d}] NEGATIVE CONTROL: '{q_text[:40]}...' -> Rejected properly: {hit_1}")
        else:
            if res.results:
                best = res.results[0]
                r_start = best.start_time
                r_end = best.end_time

                # Overlap calculation
                inter = max(0.0, min(exp_end, r_end) - max(exp_start, r_start))
                union = max(exp_end, r_end) - min(exp_start, r_start)
                iou = inter / union if union > 0 else 0.0

                if inter > 5.0 or abs(r_start - exp_start) < 15.0:
                    hit_1 = True

                for cand in res.results:
                    c_inter = max(0.0, min(exp_end, cand.end_time) - max(exp_start, cand.start_time))
                    if c_inter > 5.0 or abs(cand.start_time - exp_start) < 15.0:
                        hit_3 = True
                        break

                ious.append(iou)
                status = "PASS" if hit_1 else ("HIT@3" if hit_3 else "FAIL")
                print(f"[{idx:02d}] {status:<5} | Exp: [{exp_start:5.1f}s - {exp_end:5.1f}s] | Got: [{r_start:5.1f}s - {r_end:5.1f}s] (IoU: {iou:.2f}, Score: {best.score:.2f}) | '{q_text[:35]}...'")
            else:
                print(f"[{idx:02d}] FAIL  | Exp: [{exp_start:5.1f}s - {exp_end:5.1f}s] | No results returned | '{q_text[:35]}...'")

        if hit_1:
            hit_1_count += 1
        if hit_3:
            hit_3_count += 1

    total = len(queries)
    hit_1_rate = hit_1_count / total
    hit_3_rate = hit_3_count / total
    avg_iou = sum(ious) / len(ious) if ious else 0.0

    print(f"\n{'-'*75}")
    print(f"RESULTS SUMMARY:")
    print(f"Total Questions Evaluated : {total}")
    print(f"Hit@1 Accuracy            : {hit_1_count}/{total} ({hit_1_rate*100:.1f}%)")
    print(f"Hit@3 Accuracy            : {hit_3_count}/{total} ({hit_3_rate*100:.1f}%)")
    print(f"Mean Timestamp IoU        : {avg_iou:.3f}")
    print(f"{'='*75}\n")

    assert hit_3_rate >= 0.85, f"Hit@3 should be at least 85%, got {hit_3_rate*100:.1f}%"


if __name__ == "__main__":
    test_retrieval_benchmark()

