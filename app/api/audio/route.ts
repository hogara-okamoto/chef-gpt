// app/api/tts/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const tts = await openai.audio.speech.create({
    model: "tts-1",            // or "gpt-4o-mini-tts"
    voice: "alloy",
    input: message,
    // response_format: "mp3", // optional; defaults to mp3 today, but be explicit if you like
  });

  // Edge runtime: avoid Buffer; use arrayBuffer
  const audioArrayBuffer = await tts.arrayBuffer();

  return new Response(audioArrayBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",               // critical for iOS
      "Content-Disposition": 'inline; filename="speech.mp3"', // helps Safari
      "Cache-Control": "no-store",
    },
  });
}
