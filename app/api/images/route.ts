import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { message } = await req.json();
  const prompt = `Generate an image that describes the following recipe: ${message}`;
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: prompt.slice(0, 250),
    size: "1024x1024",
    quality: "low",
    output_format: "jpeg",    // smaller than png
    output_compression: 60,   // 0-100 (lower = smaller)
    n: 1,
  });
    const imageBase64 = (response.data as any)[0].b64_json;
    return new Response(JSON.stringify(imageBase64));
}