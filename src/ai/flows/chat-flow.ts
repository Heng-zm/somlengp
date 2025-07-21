
'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles a single chat turn.
 */
import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';

export async function chat(userMessage: string): Promise<ReadableStream<string>> {
  const {stream: llmStream} = ai.generate({
    model: googleAI.model('gemini-1.5-flash-latest'),
    messages: [{role: 'user', content: [{text: userMessage}]}],
    stream: true,
  });

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of llmStream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(text);
          }
        }
      } catch (e) {
        console.error('Error in stream processing', e);
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
