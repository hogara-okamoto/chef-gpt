import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// (optional) keep these at module scope so they aren't reallocated each request
const cuisines = ['Japanese','Mexican','Thai','Italian','Ethiopian','Turkish','Peruvian','Greek','Korean','Indian','Moroccan','Vietnamese'];
const mains    = ['tofu','salmon','pork','lentils','eggplant','mushrooms','shrimp','beef','tempeh','chickpeas','cauliflower','duck'];
const methods  = ['stir-fry','braise','grill','roast','steam','poach','sous-vide','no-cook','pressure-cook','smoke'];

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // 1) get incoming messages
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 2) build a small “diversity” hint and append it as a user nudge
  const diversityHint = `Theme: ${pick(cuisines)} ${pick(mains)} (${pick(methods)}).`;
  const themedMessages: UIMessage[] = [
    ...messages,
    {
      id: `theme-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: diversityHint }],
    },
  ];

  const recent = themedMessages.slice(-6); // keep only the last few turns
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a professional chef. You provide detailed cooking instructions, tips, and advice on selecting the best ingredients.',
    messages: convertToModelMessages(recent),
    temperature: 0.95,       // more randomness
    topP: 0.9,               // nucleus sampling
    frequencyPenalty: 0.7,   // discourage repeated tokens/phrases
    presencePenalty: 0.6,    // encourage introducing new topics/ingredients
  });
  
  return result.toUIMessageStreamResponse();
}