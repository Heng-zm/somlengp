
'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles the chat process with history.
 * - ChatInput - The input type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import {MessageData, Role, Stream} from 'genkit';

const ChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({text: z.string()})),
      })
    )
    .describe('The complete chat history, including the latest user message.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<Stream<string>> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
    stream: true,
  },
  async ({history}) => {
    // The history from the client already includes the latest user message.
    const messages: MessageData[] = history.map(msg => ({
      role: msg.role as Role,
      content: msg.content.map(c => ({text: c.text})),
    }));

    const {stream} = ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      messages: messages,
      stream: true,
    });

    return stream;
  }
);
