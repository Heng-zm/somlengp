'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles a single chat turn.
 */
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { MessageData } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export async function* chat(userMessage: string) {
  const messages: MessageData[] = [
    { role: 'user', content: [{ text: userMessage }] },
  ];

  const llmResponse = await ai.generate({
    model: googleAI.model('gemini-1.5-flash-latest'),
    messages: messages,
    stream: true,
  });

  for await (const chunk of llmResponse.stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
