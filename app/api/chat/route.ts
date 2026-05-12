import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const fullPrompt = `Kamu adalah Tutor AI di platform edukasi Web3 bernama SkillChain. 
    Jelaskan dengan ringkas, ramah, dan mudah dipahami: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response.text();

    return NextResponse.json({ reply: response });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}
