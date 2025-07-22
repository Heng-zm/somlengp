
'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a single chat turn.
 */
import {ai} from '@/ai/genkit';
import {MessageData} from 'genkit';
import {z} from 'zod';

const ChatInputSchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({text: z.string()})),
  })
);

export function chat(messages: MessageData[]): ReadableStream<string> {
  const { stream: modelStream } = ai.generate({
    model: 'gemini-1.5-flash-latest',
    history: messages.slice(0, -1),
    prompt: messages[messages.length - 1].content[0].text!,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of modelStream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(text);
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}
