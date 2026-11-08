import { Lecture, SearchResponse, VoiceSearchResponse, ConfigStatus, BenchmarkReport, SupportedLanguage, SUPPORTED_LANGUAGES, GnaniModel, EvonReasoningResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/config/status`);
    if (res.ok) return await res.json();
  } catch {
    // fallback if backend is offline during build
  }
  return {
    gnani_configured: false,
    gnani_model: 'prisma-v2.5',
    supabase_configured: false,
    active_database: 'Local SQLite Engine',
  };
}

export async function fetchLanguages(): Promise<{ count: number; languages: SupportedLanguage[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/languages`);
    if (res.ok) return await res.json();
  } catch {
    // fallback if backend is offline
  }
  return { count: SUPPORTED_LANGUAGES.length, languages: SUPPORTED_LANGUAGES };
}

export async function fetchLectures(): Promise<Lecture[]> {
  try {
    const res = await fetch(`${API_BASE}/api/lectures`);
    if (res.ok) return await res.json();
  } catch {
    // fallback if backend is offline during build
  }
  return [];
}

export async function fetchLectureDetail(id: string): Promise<Lecture | null> {
  try {
    const res = await fetch(`${API_BASE}/api/lectures/${id}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback if backend is offline during build
  }
  return null;
}

export async function uploadLecture(
  file: File,
  title?: string,
  languageCode: string = 'indic-auto'
): Promise<{ success: boolean; lecture: Lecture; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (languageCode) formData.append('language_code', languageCode);

  const res = await fetch(`${API_BASE}/api/lectures/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Lecture upload failed');
  }
  return data;
}

export async function recordLiveLecture(
  audioBlob: Blob,
  title: string,
  languageCode: string = 'indic-auto',
  segments?: Array<{ start_time: number; end_time: number; transcript: string; speaker?: string }>
): Promise<{ success: boolean; lecture: Lecture; message: string }> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'live_classroom_recording.webm');
  formData.append('title', title);
  formData.append('language_code', languageCode);
  if (segments && segments.length > 0) {
    formData.append('segments_json', JSON.stringify(segments));
  }

  const res = await fetch(`${API_BASE}/api/lectures/record`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Failed to save live recording');
  }
  return data;
}

export async function searchByText(
  query: string,
  lectureId?: string,
  contextTimestamp?: number,
  followUp?: boolean,
  languageCode: string = 'indic-auto'
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      lecture_id: lectureId || null,
      limit: 3,
      context_timestamp: contextTimestamp || null,
      follow_up: Boolean(followUp),
      language_code: languageCode || 'indic-auto',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Search failed');
  }
  return res.json();
}

export async function searchByVoice(
  audioBlob: Blob,
  lectureId?: string,
  languageCode: string = 'indic-auto',
  contextTimestamp?: number,
  followUp?: boolean,
  fallbackText?: string
): Promise<VoiceSearchResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'student_query.wav');
  if (lectureId) formData.append('lecture_id', lectureId);
  formData.append('limit', '3');
  formData.append('language_code', languageCode || 'indic-auto');
  if (contextTimestamp !== undefined && contextTimestamp !== null) {
    formData.append('context_timestamp', contextTimestamp.toString());
  }
  if (followUp) {
    formData.append('follow_up', 'true');
  }
  if (fallbackText && fallbackText.trim()) {
    formData.append('fallback_text', fallbackText.trim());
  }

  const res = await fetch(`${API_BASE}/api/search/voice`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'Voice search recognition failed');
  }
  return data;
}

export async function runBenchmarkEvaluation(): Promise<BenchmarkReport> {
  const res = await fetch(`${API_BASE}/api/benchmark/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Benchmark execution failed');
  return res.json();
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getAudioStreamUrl(urlOrFilename: string): string {
  if (urlOrFilename.startsWith('http')) return urlOrFilename;
  if (urlOrFilename.startsWith('/api/audio/')) return `${API_BASE}${urlOrFilename}`;
  return `${API_BASE}/api/audio/${urlOrFilename}`;
}

export async function fetchGnaniModels(): Promise<{ success: boolean; models: GnaniModel[]; active_models: Record<string, string> }> {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    if (res.ok) return await res.json();
  } catch {
    // fallback if backend is starting
  }
  return {
    success: true,
    models: [
      {
        id: 'prisma-v2.5',
        name: 'Prisma v2.5',
        category: 'SPEECH TO TEXT',
        badge: 'Active Engine',
        description:
          "Trained on 14M+ hours of telephonic audio. Streams in under 200ms across 10+ Indian languages plus Hinglish, Tanglish and Benglish, according to Gnani AI's published benchmarks.",
        linkText: 'Speech to text API',
        linkHref: 'https://www.gnani.ai/speech-to-text-api/',
        icon: 'Activity',
        specs: {
          latency: '< 200ms',
          trainingData: '14M+ Hours',
          languages: '10+ Indic + Code-Mixed',
          format: 'Real-time Streaming & Batch',
        },
      },
      {
        id: 'timbre-v2.5',
        name: 'Timbre v2.5',
        category: 'TEXT TO SPEECH, BETA',
        badge: 'Beta Available',
        description:
          'Speaks 10+ Indic languages with context-aware prosody, Indian names, numerals and lakh and crore cadence. Streams over WebSocket and SSE.',
        linkText: 'Text to speech API',
        linkHref: 'https://www.gnani.ai/text-to-speech-api/',
        icon: 'Volume2',
        specs: {
          prosody: 'Context-Aware Indic',
          numerals: 'Lakh & Crore Cadence',
          streaming: 'WebSocket & SSE',
          languages: '10+ Indic Dialects',
        },
      },
      {
        id: 'evon-v3.3',
        name: 'Evon v3.3',
        category: 'REASONING, OPEN WEIGHT',
        badge: '30B MoE',
        description:
          'A 30B-parameter mixture-of-experts model with 128K context and 11 Indian languages natively. Apache 2.0 weights are available by request on Hugging Face.',
        linkText: 'Evon v3.3 release notes',
        linkHref: 'https://huggingface.co/gnani-ai',
        icon: 'Layers',
        specs: {
          architecture: '30B Mixture-of-Experts',
          contextWindow: '128K Tokens',
          nativeLanguages: '11 Indian Languages',
          license: 'Apache 2.0',
        },
      },
    ],
    active_models: { stt: 'prisma-v2.5', tts: 'timbre-v2.5', reasoning: 'evon-v3.3' },
  };
}

export async function synthesizeSpeechTimbre(text: string, languageCode: string = 'hi'): Promise<string> {
  const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language_code: languageCode }),
  });
  if (!res.ok) throw new Error('Timbre TTS synthesis failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function reasonWithEvon(query: string, lectureId?: string): Promise<EvonReasoningResponse> {
  const res = await fetch(`${API_BASE}/api/reasoning/evon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lecture_id: lectureId || null }),
  });
  if (!res.ok) throw new Error('Evon v3.3 reasoning failed');
  return res.json();
}


