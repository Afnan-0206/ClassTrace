export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  id: string;
  lecture_id: string;
  start_time: number;
  end_time: number;
  transcript: string;
  speaker?: string;
  sequence_order: number;
  words?: WordTimestamp[];
}

export interface LectureChapter {
  chapter_number: number;
  title: string;
  start_time: number;
  end_time: number;
  key_topics: string[];
}

export interface Lecture {
  id: string;
  title: string;
  filename: string;
  audio_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  language_detected?: string;
  error_message?: string;
  segment_count: number;
  created_at: string;
  updated_at: string;
  segments?: TranscriptSegment[];
  peaks?: number[];
  chapters?: LectureChapter[];
}

export interface SearchResultSegment {
  id: string;
  lecture_id: string;
  lecture_title: string;
  start_time: number;
  end_time: number;
  transcript: string;
  speaker?: string;
  words?: WordTimestamp[];
  score: number;
  semantic_score: number;
  keyword_score: number;
  audio_url: string;
  snippet_audio_url?: string;
  context_before?: string;
  context_after?: string;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  has_sufficient_evidence: boolean;
  total_matches: number;
  results: SearchResultSegment[];
  message?: string;
}

export interface VoiceSearchResponse {
  success: boolean;
  recognized_text: string;
  detected_language?: string;
  processing_time_seconds?: number;
  search_response: SearchResponse;
}

export interface ConfigStatus {
  gnani_configured: boolean;
  gnani_model: string;
  supabase_configured: boolean;
  active_database: string;
  message?: string;
}

export interface BenchmarkItem {
  question_id: string;
  question: string;
  topic: string;
  expected_start: number;
  expected_end: number;
  retrieved_start?: number;
  retrieved_end?: number;
  retrieved_text?: string;
  hit_at_1: boolean;
  hit_at_3: boolean;
  timestamp_iou: number;
  score: number;
}

export interface BenchmarkReport {
  total_questions: number;
  hit_at_1_count: number;
  hit_at_1_rate: number;
  hit_at_3_count: number;
  hit_at_3_rate: number;
  average_timestamp_iou: number;
  results: BenchmarkItem[];
}

export interface BookmarkItem {
  id: string;
  lecture_id: string;
  lecture_title: string;
  start_time: number;
  end_time: number;
  transcript: string;
  speaker?: string;
  created_at: string;
  note?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  indic_code_mixed: string;
  family: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'indic-auto', name: 'Auto-Detect Indic', native_name: 'Auto-Detect', indic_code_mixed: 'Indic Auto Code-Mixed', family: 'All' },
  { code: 'hi-IN', name: 'Hindi / Hinglish', native_name: 'हिन्दी', indic_code_mixed: 'Hinglish', family: 'Indo-Aryan' },
  { code: 'ta-IN', name: 'Tamil / Tanglish', native_name: 'தமிழ்', indic_code_mixed: 'Tanglish', family: 'Dravidian' },
  { code: 'te-IN', name: 'Telugu / Tenglish', native_name: 'తెలుగు', indic_code_mixed: 'Tenglish', family: 'Dravidian' },
  { code: 'kn-IN', name: 'Kannada / Kanglish', native_name: 'ಕನ್ನಡ', indic_code_mixed: 'Kanglish', family: 'Dravidian' },
  { code: 'ml-IN', name: 'Malayalam / Manglish', native_name: 'മലയാളം', indic_code_mixed: 'Manglish', family: 'Dravidian' },
  { code: 'bn-IN', name: 'Bengali / Banglish', native_name: 'বাংলা', indic_code_mixed: 'Banglish', family: 'Indo-Aryan' },
  { code: 'mr-IN', name: 'Marathi', native_name: 'मराठी', indic_code_mixed: 'Marathi + English', family: 'Indo-Aryan' },
  { code: 'gu-IN', name: 'Gujarati', native_name: 'ગુજરાતી', indic_code_mixed: 'Gujarati + English', family: 'Indo-Aryan' },
  { code: 'pa-IN', name: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', indic_code_mixed: 'Punjabi + English', family: 'Indo-Aryan' },
  { code: 'or-IN', name: 'Odia', native_name: 'ଓଡ଼ିଆ', indic_code_mixed: 'Odia + English', family: 'Indo-Aryan' },
  { code: 'en-IN', name: 'Indian English', native_name: 'English', indic_code_mixed: 'English (India)', family: 'English' },
];

export interface GnaniModelSpecs {
  latency?: string;
  trainingData?: string;
  languages?: string;
  format?: string;
  prosody?: string;
  numerals?: string;
  streaming?: string;
  architecture?: string;
  contextWindow?: string;
  nativeLanguages?: string;
  license?: string;
}

export interface GnaniModel {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  linkText: string;
  linkHref: string;
  icon: 'Activity' | 'Volume2' | 'Layers';
  specs: GnaniModelSpecs;
}

export interface EvonReasoningResponse {
  success: boolean;
  model: string;
  explanation: string;
  timestamp?: string;
  grounded_quote?: string;
  confidence_score?: number;
  grounded: boolean;
}



