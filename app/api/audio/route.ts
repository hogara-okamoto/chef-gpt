// app/api/tts/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";
export const maxDuration = 30; // 30 seconds timeout for Vercel

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message } = await req.json();
    
    if (!message || message.trim().length === 0) {
      console.error("No message provided for audio generation");
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Generating audio for message:", message.substring(0, 100) + "...");

    const tts = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: message,
      response_format: "mp3", // Explicitly set format
    });

    // Edge runtime: avoid Buffer; use arrayBuffer
    const audioArrayBuffer = await tts.arrayBuffer();
    
    console.log("Audio generated successfully, size:", audioArrayBuffer.byteLength);

    return new Response(audioArrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="speech.mp3"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    
    // Return a more detailed error response
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ 
      error: "Audio generation failed", 
      details: errorMessage 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
