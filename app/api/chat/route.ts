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

async function askGemini(systemPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // PERBAIKAN: "gemini-1.5-flash" ditaruh paling atas karena kuota gratisnya paling besar (15 request/menit).
  const modelCandidates = [
    process.env.GEMINI_MODEL,
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
  ].filter((modelName): modelName is string => Boolean(modelName));

  let lastError: unknown;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: modelName.startsWith("gemini-1.5") ? "v1beta" : "v1" },
      );
      const result = await model.generateContent(systemPrompt);

      return result.response.text().trim();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);

      // Lompat ke model berikutnya jika error karena limit (429) atau server sibuk (503)
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

    if (process.env.GEMINI_API_KEY) {
      try {
        reply = await askGemini(tutorPrompt);
      } catch (error) {
        console.error("Gemini fallback error:", error);
        if (process.env.OPENAI_API_KEY) {
          reply = await askOpenAI(tutorPrompt);
        } else {
          // PERBAIKAN: Pesan error dibuat lebih halus untuk dibaca user di frontend
          return NextResponse.json(
            {
              reply:
                "Sistem AI sedang menerima terlalu banyak permintaan (Limit). Mohon tunggu sekitar 1 menit lalu coba lagi ya.",
            },
            { status: 200 }, // Tetap 200 agar UI tidak merah, hanya menampilkan pesan ke user
          );
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      reply = await askOpenAI(tutorPrompt);
    } else {
      return NextResponse.json(
        {
          error:
            "Tambahkan GEMINI_API_KEY atau OPENAI_API_KEY di environment untuk mengaktifkan Tutor AI.",
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
