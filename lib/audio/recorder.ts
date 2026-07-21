// Обгортка над MediaRecorder для кросплатформного запису голосу.
// Android Chrome віддає webm/opus, iOS Safari — mp4/aac. Ми підбираємо
// підтримуваний MIME і повертаємо коректне розширення для Whisper.

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  ext: string;
  durationMs: number;
}

// Кандидати в порядку пріоритету. Перший підтримуваний виграє.
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/aac",
  "audio/ogg;codecs=opus",
];

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // ignore
    }
  }
  return ""; // хай браузер вирішує сам
}

function extFromMime(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("ogg")) return "ogg";
  return "webm";
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private startedAt = 0;
  private mimeType = "";
  private onErrorCb: ((err: Error) => void) | null = null;

  onError(cb: (err: Error) => void) {
    this.onErrorCb = cb;
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  // Запит доступу до мікрофона МАЄ відбуватися за user-gesture (вимога iOS).
  async start(): Promise<void> {
    if (!isRecordingSupported()) {
      throw new Error("Браузер не підтримує запис аудіо.");
    }

    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mimeType = pickMimeType();

    const options: MediaRecorderOptions = this.mimeType
      ? { mimeType: this.mimeType }
      : {};
    this.mediaRecorder = new MediaRecorder(this.stream, options);
    // Якщо MIME не задавали — візьмемо фактичний із рекордера
    if (!this.mimeType) this.mimeType = this.mediaRecorder.mimeType || "audio/webm";

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.onerror = () => {
      this.onErrorCb?.(new Error("Помилка запису аудіо."));
      this.cleanup();
    };

    this.startedAt = Date.now();
    // timeslice, щоб дані не губилися при згортанні/дзвінку
    this.mediaRecorder.start(1000);
  }

  // Зупинити й отримати фінальний блоб.
  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      const mr = this.mediaRecorder;
      if (!mr) {
        reject(new Error("Запис не було розпочато."));
        return;
      }

      mr.onstop = () => {
        const mimeType = this.mimeType || mr.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: mimeType });
        const durationMs = Date.now() - this.startedAt;
        this.cleanup();
        if (blob.size === 0) {
          reject(new Error("Порожній запис. Спробуй ще раз."));
          return;
        }
        resolve({ blob, mimeType, ext: extFromMime(mimeType), durationMs });
      };

      try {
        // Витягнути останні дані перед стопом
        if (mr.state !== "inactive") mr.requestData();
        mr.stop();
      } catch (err) {
        this.cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  // Аварійне скасування (напр. користувач пішов зі сторінки).
  cancel() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    } catch {
      // ignore
    }
    this.cleanup();
  }

  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }
}
