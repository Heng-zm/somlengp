'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles a single chat turn.
 */
import {defineAction, stream} from '@genkit-ai/next';
import {z} from 'zod';
import {ai} from '@/ai/genkit';
import {MessageData} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const chat = defineAction(
  {
    name: 'chatAction',
    input: z.string(),
    output: z.string(),
    streamable: true,
  },
  async (userMessage, {stream}) => {
    const messages: MessageData[] = [
      {role: 'user', content: [{text: userMessage}]},
    ];

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      messages: messages,
      stream: true,
    });

    for await (const chunk of llmResponse.stream) {
      stream.text(chunk.text);
    }
    return await llmResponse.response;
  }
);
