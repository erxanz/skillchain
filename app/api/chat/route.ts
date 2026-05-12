import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type ChatPayload = {
  prompt?: string;
  material?: string;
  courseTitle?: string;
};

function buildTutorPrompt({
  prompt,
  material,
  courseTitle,
}: Required<ChatPayload>) {
  return [
    "Kamu adalah Tutor AI di platform edukasi Web3 bernama SkillChain.",
    "Jawab dalam bahasa Indonesia yang ringkas, jelas, dan ramah untuk siswa.",
    "Jika diminta ringkasan, berikan poin-poin praktis.",
    "Jika diminta kuis, buat soal yang relevan dengan materi.",
    `Kelas: ${courseTitle}`,
    `Materi: ${material}`,
    `Pertanyaan siswa: ${prompt}`,
  ].join("\n");
}

async function askOpenAI(systemPrompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah Tutor AI di platform edukasi Web3 bernama SkillChain. Jawab singkat, jelas, ramah, dan fokus pada pembelajaran.",
        },
        { role: "user", content: systemPrompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function askGrok(systemPrompt: string) {
  const apiKey = process.env.GROK_API_KEY;
  const endpoint = process.env.GROK_ENDPOINT ?? "https://api.together.xyz/v1/chat/completions";
  const model = process.env.GROK_MODEL ?? "meta-llama/Llama-3-70b-chat-hf";

  if (!apiKey) {
    throw new Error("Missing GROK_API_KEY");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah Tutor AI di platform edukasi Web3 bernama SkillChain. Jawab singkat, jelas, ramah, dan fokus pada pembelajaran.",
        },
        { role: "user", content: systemPrompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function askGemini(systemPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ].filter((modelName): modelName is string => Boolean(modelName));

  let lastError: unknown;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(systemPrompt);
      return result.response.text().trim();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);

      // Lompat ke model berikutnya jika error karena limit (429), tidak ditemukan (404), atau server sibuk (503)
      if (!/404|429|503/.test(message)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Semua model Gemini gagal merespons.");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatPayload;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt dibutuhkan" }, { status: 400 });
    }

    const tutorPrompt = buildTutorPrompt({
      prompt,
      material: body.material?.trim() || "Materi belum tersedia.",
      courseTitle: body.courseTitle?.trim() || "SkillChain Course",
    });

    let reply = "";
    let lastError: unknown;

    // Coba Gemini dulu
    if (process.env.GEMINI_API_KEY) {
      try {
        reply = await askGemini(tutorPrompt);
        return NextResponse.json({ reply });
      } catch (error) {
        console.error("Gemini error:", error);
        lastError = error;
      }
    }

    // Fallback ke Grok
    if (process.env.GROK_API_KEY && !reply) {
      try {
        reply = await askGrok(tutorPrompt);
        return NextResponse.json({ reply });
      } catch (error) {
        console.error("Grok error:", error);
        lastError = error;
      }
    }

    // Fallback ke OpenAI
    if (process.env.OPENAI_API_KEY && !reply) {
      try {
        reply = await askOpenAI(tutorPrompt);
        return NextResponse.json({ reply });
      } catch (error) {
        console.error("OpenAI error:", error);
        lastError = error;
      }
    }

    // Kalau semua gagal, kasih pesan yang informatif
    if (!reply) {
      const message = lastError instanceof Error ? lastError.message : String(lastError);
      const fallbackReply = message.includes("429")
        ? "Quota AI sudah habis saat ini. Silakan coba lagi dalam beberapa saat."
        : "Tutor AI sedang tidak tersedia saat ini. Mohon coba lagi.";
      return NextResponse.json({ reply: fallbackReply }, { status: 200 });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GROK_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Tambahkan GEMINI_API_KEY, GROK_API_KEY, atau OPENAI_API_KEY di environment untuk mengaktifkan Tutor AI.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}
