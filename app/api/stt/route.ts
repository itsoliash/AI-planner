import { NextRequest, NextResponse } from "next/server";

// Роут працює на сервері — ключ OpenAI НІКОЛИ не потрапляє в браузер.
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.OPENAI_STT_MODEL || "whisper-1";
const MAX_BYTES = 25 * 1024 * 1024; // Whisper приймає файли до 25 MB

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Не налаштовано OPENAI_API_KEY. Додай ключ у .env.local (локально) та в Environment Variables на Vercel.",
      },
      { status: 500 }
    );
  }

  // Читаємо аудіо з multipart/form-data
  let audio: File | null = null;
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (file instanceof File) {
      audio = file;
    }
  } catch {
    return NextResponse.json(
      { error: "Некоректне тіло запиту. Очікується multipart/form-data з полем 'audio'." },
      { status: 400 }
    );
  }

  if (!audio) {
    return NextResponse.json({ error: "Немає аудіо у запиті." }, { status: 400 });
  }

  if (audio.size === 0) {
    return NextResponse.json({ error: "Порожній аудіофайл." }, { status: 400 });
  }

  if (audio.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Аудіо завелике (ліміт 25 MB). Запиши коротший фрагмент." },
      { status: 413 }
    );
  }

  // Whisper орієнтується на розширення імені файлу — гарантуємо коректне ім'я
  const ext = extFromMime(audio.type);
  const named = new File([audio], `capture.${ext}`, {
    type: audio.type || "application/octet-stream",
  });

  const openaiForm = new FormData();
  openaiForm.append("file", named);
  openaiForm.append("model", MODEL);
  openaiForm.append("response_format", "verbose_json");
  // Не форсуємо мову — Whisper визначить сам; це дозволяє укр/англ суміш.

  try {
    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return NextResponse.json(
        { error: `Whisper повернув помилку ${resp.status}`, detail },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const transcript: string = (data?.text ?? "").toString().trim();
    const lang: string | null = data?.language ?? null;

    if (!transcript) {
      return NextResponse.json(
        { error: "Не вдалося розпізнати мовлення (порожній транскрипт). Спробуй ще раз ближче до мікрофона." },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript, lang, model: MODEL });
  } catch (err) {
    return NextResponse.json(
      { error: "Не вдалося звернутися до Whisper.", detail: String(err) },
      { status: 502 }
    );
  }
}

function extFromMime(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("wav")) return "wav";
  return "webm";
}
