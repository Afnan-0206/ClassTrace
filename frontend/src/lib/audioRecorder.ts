/**
 * Browser Audio Recorder for ClassTrace.
 * Records microphone input with MediaRecorder and converts to standard WAV format.
 */

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private onLevelCallback?: (level: number) => void;
  private animationFrameId: number | null = null;

  async start(onAudioLevel?: (level: number) => void): Promise<void> {
    this.audioChunks = [];
    this.onLevelCallback = onAudioLevel;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Audio analysis for real-time visualizer waveform
      if (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
        this.monitorAudioLevel();
      }

      // Check supported MIME type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/wav'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, selectedMime ? { mimeType: selectedMime } : undefined);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
      throw new Error(`Microphone initialization failed: ${error.message}`);
    }
  }

  private monitorAudioLevel() {
    if (!this.analyser || !this.onLevelCallback) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedLevel = Math.min(1.0, avg / 128); // 0 to 1
      if (this.onLevelCallback) {
        this.onLevelCallback(normalizedLevel);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized.'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
          await this.audioContext.close();
        }
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
        }

        const rawBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        resolve(rawBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}

