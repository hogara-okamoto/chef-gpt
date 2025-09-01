import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ImageRequestBody = { message?: string };

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as ImageRequestBody;
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'message'" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `Generate an image that describes the following recipe: ${message}`;
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt.slice(0, 250),
      size: "1024x1024",   // smaller payload; use "1024x1024" if you prefer
      quality: "low",         // smaller & faster than medium/high
      output_format: "jpeg",  // jpeg/webp/png supported
      output_compression: 60, // 0-100 (lower = smaller)
      n: 1,
      // response_format defaults to "b64_json"
    });

    const b64 = res.data?.[0]?.b64_json;
    if (!b64) {
      return new Response(JSON.stringify({ error: "No image generated" }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(b64), {
      headers: { 'Content-Type': 'application/json' }
    }); // client: const data = await res.json(); setImage(data);
  } catch (err: unknown) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Image generation failed" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
