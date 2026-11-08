import { Lecture, SearchResponse, SearchResultSegment } from '@/types';

export const DEFAULT_DEMO_LECTURE: Lecture = {
  id: '00000000-0000-4000-a000-000000000001',
  title: 'DSA Lecture 14: Recursion, Call Stack & Binary Tree Inorder Traversal',
  filename: 'dsa_recursion_trees_lecture.wav',
  audio_url: '/demo/dsa_recursion_trees_lecture.wav',
  duration_seconds: 308.0,
  file_size_bytes: 9845272,
  status: 'COMPLETED',
  language_detected: 'Hinglish (Hindi + English)',
  created_at: '2026-11-07T12:00:00Z',
  segment_count: 8,
  chapters: [
    {
      chapter_number: 1,
      title: 'Recursion & Base Case',
      start_time: 0.0,
      end_time: 65.0,
      key_topics: ['Recursion Definition', 'Base Condition', 'Divide & Conquer'],
    },
    {
      chapter_number: 2,
      title: 'Call Stack & Stack Overflow',
      start_time: 65.0,
      end_time: 140.0,
      key_topics: ['Activation Records', 'LIFO Call Stack', 'Memory Exhaustion'],
    },
    {
      chapter_number: 3,
      title: 'Binary Tree Structure',
      start_time: 140.0,
      end_time: 180.0,
      key_topics: ['Root & Leaves', 'Subtree Nodes', 'Hierarchy'],
    },
    {
      chapter_number: 4,
      title: 'Inorder Traversal & BST Property',
      start_time: 180.0,
      end_time: 308.0,
      key_topics: ['L-Root-R Rule', 'Recursive Walk', 'Sorted BST Order'],
    },
  ],
  segments: [
    {
      id: 'seg_001',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 0.0,
      end_time: 32.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Hello everyone, welcome back to DSA class. Aaj ka hamara topic hai Recursion and Binary Tree Traversals. Sabse pehle samajhte hain: Recursion kya hota hai? Jab ek function khud ko bar-bar call karta hai to solve a smaller instance of the same problem, us programming technique ko hum recursion kehte hain. Basically, hum ek bade complex problem ko chhote identical sub-problems me divide kar dete hain.',
    },
    {
      id: 'seg_002',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 32.0,
      end_time: 65.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Ab sabse zaroori concept hai: Base Case ya Base Condition. Dhyan se suniye students, bina base condition ke recursion kabhi complete nahi ho sakta. Base case wo terminating condition hoti hai jahan recursion stop hota hai aur function simple value return karta hai without making further recursive calls. Jaise factorial me agar n equals 0 ya 1 hai, toh hum seedha return 1 karte hain.',
    },
    {
      id: 'seg_003',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 65.0,
      end_time: 102.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Ab internal execution dekhte hain: Call Stack behavior. Jab bhi koi recursive call hoti hai, computer memory me ek naya Activation Record ya Stack Frame push hota hai. Is frame me local variables, parameters aur return address store hota hai. Jab base case hit hota hai, toh function execute hokar return karta hai, aur stack frame pop hona shuru ho jata hai in LIFO order—Last In First Out.',
    },
    {
      id: 'seg_004',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 102.0,
      end_time: 140.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Lekin agar aapne base condition galat likh di ya bhool gaye, toh kya hoga? Infinite recursion trigger ho jayega. Stack par continuously naye frames push hote rahenge, memory limit cross ho jayegi, aur runtime par fatal Stack Overflow Error throw ho jayega. Isliye code likhte waqt hamesha pehle verify karo ki base case reachable hai ya nahi.',
    },
    {
      id: 'seg_005',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 140.0,
      end_time: 180.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Chaliye ab chalte hain hamare agle topic par: Binary Trees. Binary tree ek non-linear hierarchical data structure hai. Har node ke pass maximum do children ho sakte hain: ek Left Child aur ek Right Child. Sabse top node ko hum Root Node bolte hain. Aur jin nodes ke koi child nahi hote, matlab jinka left aur right pointer null hota hai, unhe hum Leaf Nodes kehte hain.',
    },
    {
      id: 'seg_006',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 180.0,
      end_time: 225.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Tree traversal ka matlab hota hai har ek node ko exactly ek baar visit karna. Aaj hum Inorder Traversal discuss karenge. Inorder traversal ka standard rule yaad kar lijiye: Left Subtree, then Root node, then Right Subtree. Yani sabse pehle recursively pure left subtree ko traverse karenge, fir current root node ko process karenge, aur last me right subtree me jayenge. Shortcut yaad rakho: L-Root-R.',
    },
    {
      id: 'seg_007',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 225.0,
      end_time: 270.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Isko code me kaise implement karenge? Code bohot clean hai: function inorder(node) { if (node == null) return; inorder(node.left); print(node.val); inorder(node.right); }. Yahan base case hai jab node null ho jaye. Pehle left subtree ke liye recursive call jayegi, fir current value print hogi, fir right subtree ke liye recursive call jayegi.',
    },
    {
      id: 'seg_008',
      lecture_id: '00000000-0000-4000-a000-000000000001',
      start_time: 270.0,
      end_time: 308.0,
      speaker: 'Prof. Sharma',
      transcript:
        'Inorder traversal ki ek bohot powerful property hai jo interviews me baar-baar puchi jaati hai: agar aap ek Binary Search Tree yaani BST ka inorder traversal nikalte ho, toh nodes ka output hamesha strictly ascending sorted order me aata hai! Toh aaj humne recursion, base condition, call stack, binary tree aur inorder traversal complete kiya. Practice the questions on your portal. Thank you!',
    },
  ],
};

/**
 * High-precision client-side keyword and token matching fallback
 * for when backend is waking up or offline on mobile devices.
 */
export function localSearchInDemoLecture(query: string): SearchResponse {
  const cleanQ = query.toLowerCase().trim();
  const tokens = cleanQ.split(/\s+/).filter((t) => t.length > 2);

  const scoredSegments = (DEFAULT_DEMO_LECTURE.segments || []).map((seg) => {
    const textLower = seg.transcript.toLowerCase();
    let score = 0;

    // Direct phrase match
    if (textLower.includes(cleanQ)) {
      score += 0.6;
    }

    // Token matches
    for (const token of tokens) {
      if (textLower.includes(token)) {
        score += 0.25;
      }
    }

    // Key topic affinities
    if ((cleanQ.includes('base') || cleanQ.includes('condition')) && (seg.id === 'seg_002' || seg.id === 'seg_004')) {
      score += 0.4;
    }
    if ((cleanQ.includes('stack') || cleanQ.includes('overflow') || cleanQ.includes('frame')) && (seg.id === 'seg_003' || seg.id === 'seg_004')) {
      score += 0.4;
    }
    if ((cleanQ.includes('tree') || cleanQ.includes('leaf') || cleanQ.includes('root')) && (seg.id === 'seg_005' || seg.id === 'seg_006')) {
      score += 0.4;
    }
    if ((cleanQ.includes('inorder') || cleanQ.includes('bst') || cleanQ.includes('traversal')) && (seg.id === 'seg_006' || seg.id === 'seg_007' || seg.id === 'seg_008')) {
      score += 0.4;
    }

    return {
      segment: seg,
      score: Math.min(0.98, Math.max(0.1, score)),
    };
  });

  scoredSegments.sort((a, b) => b.score - a.score);
  const relevantMatches = scoredSegments.filter((s) => s.score >= 0.35).slice(0, 3);

  if (relevantMatches.length === 0) {
    return {
      query,
      results: [],
      has_sufficient_evidence: false,
      total_matches: 0,
      message: 'The instructor did not cover or explain this specific concept in the recorded lecture.',
      response_time_ms: 12,
      source: 'Client Fallback Engine',
    };
  }

  const results: SearchResultSegment[] = relevantMatches.map((m) => ({
    id: m.segment.id,
    lecture_id: m.segment.lecture_id,
    start_time: m.segment.start_time,
    end_time: m.segment.end_time,
    transcript: m.segment.transcript,
    speaker: m.segment.speaker,
    score: m.score,
    context_before: m.segment.id === 'seg_002' ? DEFAULT_DEMO_LECTURE.segments![0].transcript : undefined,
    context_after: m.segment.id === 'seg_002' ? DEFAULT_DEMO_LECTURE.segments![2].transcript : undefined,
  }));

  return {
    query,
    results,
    has_sufficient_evidence: true,
    total_matches: results.length,
    synthesized_answer: `Found in lecture between ${results[0].start_time}s and ${results[0].end_time}s.`,
    response_time_ms: 15,
    source: 'Client Grounded Engine',
  };
}

