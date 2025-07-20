
'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles the chat process with history.
 * - ChatInput - The input type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MessageData, Role} from 'genkit';

const ChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({text: z.string()})),
      })
    )
    .describe('The chat history.'),
  message: z.string().describe('The latest user message.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput) {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    stream: true,
  },
  async ({history, message}) => {
    // Combine the previous history with the new user message.
    const messages: MessageData[] = [
      ...history.map(msg => ({
        role: msg.role as Role,
        content: msg.content.map(c => ({text: c.text})),
      })),
      {role: 'user', content: [{text: message}]},
    ];

    const {stream} = await ai.generate({
      model: 'gemini-2.5-flash',
      messages: messages,
      stream: true,
    });

    return stream;
  }
);
