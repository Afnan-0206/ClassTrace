# ClassTrace — Comprehensive QA & Evaluation Benchmark Report

> **"Evidence, not hallucinations."**  
> Empirical validation of speech transcription, hybrid semantic retrieval, timestamp accuracy, and zero-hallucination rejection gates.

---

## 1. Executive Summary

| Metric | Target | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Total Test Questions** | $\ge 15$ | **17 Questions** | **PASSED** |
| **Hit@1 Accuracy** | $\ge 70.0\%$ | **88.2% (15/17)** | **EXCEEDED** |
| **Hit@3 Accuracy** | $\ge 85.0\%$ | **100.0% (17/17)** | **EXCEEDED** |
| **Mean Timestamp IoU** | $\ge 0.70$ | **0.875** | **EXCEEDED** |
| **Negative Control Rejection** | 100% | **100.0% (0% Hallucinations)** | **VERIFIED** |
| **FastAPI Integration Tests** | 100% Pass | **8/8 PASSED** | **VERIFIED** |

---

## 2. Benchmark Dataset Specification

* **Lecture Title:** `DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal`
* **Speaker:** Prof. Sharma
* **Language:** Hinglish (Conversational Hindi + Technical English)
* **Duration:** 308.0 seconds (~5.1 minutes)
* **Audio Format:** 16kHz Mono 16-bit PCM WAV (9.85 MB)

### Ground Truth Segment Map:
1. `seg_001` (00:00 – 00:32 | 32s): Introduction to recursion, breaking bigger problem into smaller identical subproblems.
2. `seg_002` (00:32 – 01:05 | 33s): Base condition explanation, terminating case, factorial base condition (`n == 0 || n == 1`).
3. `seg_003` (01:05 – 01:42 | 37s): Call stack mechanics, memory allocation, activation records, push and pop in LIFO order.
4. `seg_004` (01:42 – 02:20 | 38s): Missing base condition consequences, infinite recursion, fatal Stack Overflow Error.
5. `seg_005` (02:20 – 03:00 | 40s): Binary Trees introduction, hierarchical structure, root node, and leaf nodes with null pointers.
6. `seg_006` (03:00 – 03:45 | 45s): Inorder traversal conceptual rule: Left subtree, then Root node, then Right subtree (`L-Root-R`).
7. `seg_007` (03:45 – 04:30 | 45s): Recursive code implementation walkthrough: `inorder(node.left)`, print, `inorder(node.right)`.
8. `seg_008` (04:30 – 05:08 | 38s): Binary Search Tree (BST) inorder traversal property: strictly ascending sorted order output.

---

## 3. Question-by-Question Evaluation Table

| # | Question String | Expected Range | Retrieved Range | Hit@1 | Hit@3 | IoU | Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Q1** | *"Sir ne recursion ka base case kaise explain kiya tha?"* | `32.0s - 65.0s` | `32.0s - 65.0s` | **PASS** | **PASS** | 1.00 | 0.90 |
| **Q2** | *"Why does a recursive function need a terminating condition?"* | `32.0s - 65.0s` | `32.0s - 65.0s` | **PASS** | **PASS** | 1.00 | 0.81 |
| **Q3** | *"Call stack pe activation records kaise push aur pop hote hain?"* | `65.0s - 102.0s` | `65.0s - 102.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q4** | *"How does memory allocate stack frames during recursive execution?"* | `65.0s - 102.0s` | `65.0s - 102.0s` | **PASS** | **PASS** | 1.00 | 0.85 |
| **Q5** | *"Stack overflow error kab aur kyu aati hai lecture me?"* | `102.0s - 140.0s` | `102.0s - 140.0s` | **PASS** | **PASS** | 1.00 | 0.90 |
| **Q6** | *"What happens if we forget to write a base condition in recursion?"* | `102.0s - 140.0s` | `32.0s - 65.0s` | HIT@3 | **PASS** | 0.00 | 0.86 |
| **Q7** | *"Binary tree ka basic structure aur root node kya hota hai?"* | `140.0s - 180.0s` | `140.0s - 180.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q8** | *"What is a leaf node in a binary tree?"* | `140.0s - 180.0s` | `140.0s - 180.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q9** | *"Inorder traversal ka order kya hota hai? Left root right?"* | `180.0s - 225.0s` | `180.0s - 225.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q10**| *"Explain the sequence of visiting nodes during inorder tree traversal."* | `180.0s - 225.0s` | `180.0s - 225.0s` | **PASS** | **PASS** | 1.00 | 0.76 |
| **Q11**| *"Inorder traversal ko code me recursivley kaise likhte hain?"* | `225.0s - 270.0s` | `180.0s - 225.0s` | HIT@3 | **PASS** | 0.00 | 0.79 |
| **Q12**| *"Show the recursive code implementation for tree inorder traversal."* | `225.0s - 270.0s` | `225.0s - 270.0s` | **PASS** | **PASS** | 1.00 | 0.87 |
| **Q13**| *"Binary search tree par inorder traversal run karne se kya sorted order milta hai?"* | `270.0s - 308.0s` | `270.0s - 308.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q14**| *"Why does BST inorder traversal print elements in ascending order?"* | `270.0s - 308.0s` | `270.0s - 308.0s` | **PASS** | **PASS** | 1.00 | 1.00 |
| **Q15**| *"Recursion ki basic definition teacher ne shuruat me kya batayi?"* | `0.0s - 32.0s` | `0.0s - 32.0s` | **PASS** | **PASS** | 1.00 | 0.47 |
| **Q16**| *"Divide a bigger problem into identical subproblems technique"* | `0.0s - 32.0s` | `0.0s - 32.0s` | **PASS** | **PASS** | 1.00 | 0.83 |
| **Q17**| *(Negative Control)* *"Dynamic programming memoization table and bottom-up grid fill approach"* | `Out of Domain` | `None (Rejected)` | **PASS** | **PASS** | — | — |

---

## 4. Analysis & Failure Modes

1. **Why Q6 ranked Segment 2 higher as Top-1**:
   Q6 contains the phrase *"base condition in recursion"*, causing both Segment 2 (introducing base conditions) and Segment 4 (missing base condition resulting in stack overflow) to score highly. Segment 4 was returned as the immediate #2 match, achieving Hit@3.
2. **Negative Control Verification (Q17)**:
   The query asked about dynamic programming and memoization tables. Because the teacher never discussed DP in this lecture, the stopword-filtered content keyword coverage gate rejected the query, successfully preventing hallucinated passage returns.

