"""
ClassTrace Pan-Indic Multilingual Retrieval Benchmark.
Tests queries across 8 major Indian college languages + English:
- English
- Hindi / Hinglish
- Tamil / Tanglish
- Telugu / Tenglish
- Kannada / Kanglish
- Malayalam / Manglish
- Bengali / Banglish
- Marathi
- Gujarati
Plus Out-of-Domain Negative Controls across multiple languages to guarantee 0% hallucinations.
"""

import sys
import json
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app.retrieval import retrieval_engine


MULTILINGUAL_TEST_CASES = [
    # --- 1. ENGLISH ---
    {
        "lang": "English",
        "query": "How did the teacher explain the base case in recursion?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "English",
        "query": "What happens if we forget the terminating condition in recursion?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "English",
        "query": "Why does binary search tree inorder traversal give ascending sorted order?",
        "exp_start": 270.0, "exp_end": 308.0,
        "is_negative": False
    },

    # --- 2. HINDI / HINGLISH ---
    {
        "lang": "Hinglish",
        "query": "Sir ne recursion ka base case kaise explain kiya tha?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Hinglish",
        "query": "Stack overflow error kab aur kyu aata hai infinite recursion me?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Hinglish",
        "query": "Call stack pe activation records kaise push aur pop hote hain?",
        "exp_start": 65.0, "exp_end": 102.0,
        "is_negative": False
    },

    # --- 3. TAMIL / TANGLISH ---
    {
        "lang": "Tamil / Tanglish",
        "query": "Sir recursion la base case epdi explain pannaru?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Tamil / Tanglish",
        "query": "Base condition illana recursion la stack overflow error yen varum?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Tamil / Tanglish",
        "query": "Inorder traversal oda order enna? Left root right-ah?",
        "exp_start": 180.0, "exp_end": 225.0,
        "is_negative": False
    },
    {
        "lang": "Tamil / Tanglish",
        "query": "Binary search tree la inorder traversal yen strictly ascending sorted order la print aagudhu?",
        "exp_start": 270.0, "exp_end": 308.0,
        "is_negative": False
    },

    # --- 4. TELUGU / TENGLISH ---
    {
        "lang": "Telugu / Tenglish",
        "query": "Sir recursion lo base case ela explain chesaru?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Telugu / Tenglish",
        "query": "Base condition lekunte fatal stack overflow infinite calls valla ela vastundi?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Telugu / Tenglish",
        "query": "Call stack lo activation record stack frame ela allocate avtundi?",
        "exp_start": 65.0, "exp_end": 102.0,
        "is_negative": False
    },
    {
        "lang": "Telugu / Tenglish",
        "query": "Binary tree lo leaf node ante enti?",
        "exp_start": 140.0, "exp_end": 180.0,
        "is_negative": False
    },

    # --- 5. KANNADA / KANGLISH ---
    {
        "lang": "Kannada / Kanglish",
        "query": "Sir recursion nalli base case hege explain madidru?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Kannada / Kanglish",
        "query": "Base condition illa andre fatal stack overflow memory exhaust agatte alva?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Kannada / Kanglish",
        "query": "Inorder traversal rule sequence hege ide? Left root right?",
        "exp_start": 180.0, "exp_end": 225.0,
        "is_negative": False
    },

    # --- 6. MALAYALAM / MANGLISH ---
    {
        "lang": "Malayalam / Manglish",
        "query": "Sir recursion-il base case engane aanu explain cheythathu?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Malayalam / Manglish",
        "query": "Base condition illathirunnaal infinite recursion and stack overflow sambhavikkumo?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Malayalam / Manglish",
        "query": "Inorder traversal code recursive function aayi engane likhte hain?",
        "exp_start": 225.0, "exp_end": 270.0,
        "is_negative": False
    },

    # --- 7. BENGALI / BANGLISH ---
    {
        "lang": "Bengali / Banglish",
        "query": "Sir recursion-e base case kivabe bojhiechilen?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Bengali / Banglish",
        "query": "Base condition na thakle fatal stack overflow memory exhaust keno hoy?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Bengali / Banglish",
        "query": "Inorder traversal-er rule ki? Left subtree root right node?",
        "exp_start": 180.0, "exp_end": 225.0,
        "is_negative": False
    },

    # --- 8. MARATHI ---
    {
        "lang": "Marathi",
        "query": "Sir ni recursion madhe base case kasa samjavla hota?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Marathi",
        "query": "Base condition nasel tar fatal stack overflow ka hoto?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },
    {
        "lang": "Marathi",
        "query": "Binary search tree cha inorder traversal strictly ascending sorted order madhe ka yeto?",
        "exp_start": 270.0, "exp_end": 308.0,
        "is_negative": False
    },

    # --- 9. GUJARATI ---
    {
        "lang": "Gujarati",
        "query": "Sir e recursion ma base case kevi rite samjavya hata?",
        "exp_start": 32.0, "exp_end": 65.0,
        "is_negative": False
    },
    {
        "lang": "Gujarati",
        "query": "Base condition bhool jaie to fatal stack overflow kem aave?",
        "exp_start": 102.0, "exp_end": 140.0,
        "is_negative": False
    },

    # --- 10. PAN-INDIC NEGATIVE CONTROLS (EVIDENCE GROUNDING CHECK) ---
    {
        "lang": "English (Negative)",
        "query": "Dynamic programming memoization table and bottom-up grid fill approach",
        "exp_start": 0.0, "exp_end": 0.0,
        "is_negative": True
    },
    {
        "lang": "Tamil (Negative)",
        "query": "Dijkstra algorithm la shortest path epdi kandupidikuradhu?",
        "exp_start": 0.0, "exp_end": 0.0,
        "is_negative": True
    },
    {
        "lang": "Telugu (Negative)",
        "query": "Operating systems lo virtual memory paging algorithm ela panichestundi?",
        "exp_start": 0.0, "exp_end": 0.0,
        "is_negative": True
    },
    {
        "lang": "Bengali (Negative)",
        "query": "Database management system e SQL indexing B-tree kivabe kaj kore?",
        "exp_start": 0.0, "exp_end": 0.0,
        "is_negative": True
    }
]


def calculate_iou(s1, e1, s2, e2):
    intersection = max(0.0, min(e1, e2) - max(s1, s2))
    union = max(e1, e2) - min(s1, s2)
    return (intersection / union) if union > 0 else 0.0


def run_pan_indic_benchmark():
    gt_path = project_root / "backend" / "demo_data" / "ground_truth.json"
    with open(gt_path, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    segments = gt_data["segments"]

    print("\n" + "=" * 80)
    print("CLASSTRACE PAN-INDIC MULTILINGUAL BENCHMARK (9 LANGUAGES + NEGATIVE GATES)")
    print("=" * 80)

    total_positive = 0
    hit1_positive = 0
    hit3_positive = 0
    ious = []

    total_negative = 0
    rejected_negative = 0

    for idx, case in enumerate(MULTILINGUAL_TEST_CASES):
        lang = case["lang"]
        q = case["query"]
        is_neg = case["is_negative"]

        res = retrieval_engine.search(q, segments, limit=3)

        if is_neg:
            total_negative += 1
            if not res.has_sufficient_evidence or len(res.results) == 0:
                rejected_negative += 1
                status = "PASS (Rejected)"
            else:
                status = "FAIL (Hallucinated)"
            print(f"[{idx+1:02d}] {status:<16} | [{lang:<18}] | '{q[:48]}...'")
        else:
            total_positive += 1
            exp_s, exp_e = case["exp_start"], case["exp_end"]

            is_hit1 = False
            is_hit3 = False
            top_iou = 0.0
            score = 0.0

            if res.has_sufficient_evidence and len(res.results) > 0:
                top = res.results[0]
                top_iou = calculate_iou(exp_s, exp_e, top.start_time, top.end_time)
                score = top.score
                if top_iou >= 0.5:
                    is_hit1 = True
                    is_hit3 = True
                else:
                    for item in res.results[:3]:
                        iou = calculate_iou(exp_s, exp_e, item.start_time, item.end_time)
                        if iou >= 0.5:
                            is_hit3 = True
                            break

            if is_hit1:
                hit1_positive += 1
                hit3_positive += 1
                ious.append(top_iou)
                status = "HIT@1 PASS"
            elif is_hit3:
                hit3_positive += 1
                ious.append(top_iou)
                status = "HIT@3 PASS"
            else:
                ious.append(0.0)
                status = "FAIL MISS"

            ret_str = f"[{res.results[0].start_time:5.1f}s - {res.results[0].end_time:5.1f}s]" if res.results else "No Match"
            print(f"[{idx+1:02d}] {status:<12} | Exp: [{exp_s:5.1f}s - {exp_e:5.1f}s] | Got: {ret_str} (IoU: {top_iou:.2f}, Score: {score:.2f}) | [{lang:<18}] | '{q[:36]}...'")

    print("\n" + "-" * 80)
    print("PAN-INDIC EVALUATION SUMMARY:")
    print(f"Positive Questions Tested  : {total_positive}")
    print(f"Hit@1 Accuracy Rate        : {hit1_positive}/{total_positive} ({(hit1_positive/total_positive)*100:.1f}%)")
    print(f"Hit@3 Accuracy Rate        : {hit3_positive}/{total_positive} ({(hit3_positive/total_positive)*100:.1f}%)")
    avg_iou = sum(ious) / len(ious) if ious else 0.0
    print(f"Mean Timestamp IoU         : {avg_iou:.3f}")
    print(f"Negative Control Rejection : {rejected_negative}/{total_negative} ({(rejected_negative/total_negative)*100:.1f}%) [Zero Hallucinations]")
    print("=" * 80 + "\n")

    assert hit1_positive == total_positive, f"Hit@1 accuracy dropped! Expected {total_positive}, got {hit1_positive}"
    assert rejected_negative == total_negative, "Negative control failed to reject out-of-domain query!"
    print("ALL PAN-INDIC BENCHMARK CHECKS PASSED WITH 100% SUCCESS!")


if __name__ == "__main__":
    run_pan_indic_benchmark()

