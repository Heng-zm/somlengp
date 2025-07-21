
'use server';
/**
 * @fileOverview A flow for handling a chat conversation with an AI.
 *
 * - chat - A function that handles a single chat turn.
 * - ChatInput - The input type for the function (a string).
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import {MessageData} from 'genkit';

// The input is a simple string for the latest user message.
const ChatInputSchema = z.string();
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<ReadableStream<string>> {
  // This now correctly invokes the flow and returns its result.
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(), // The schema for the final, non-streamed output, though we use the stream.
    stream: true,
  },
  async (userMessage) => {
    // The flow receives the user message directly and creates the message history.
    // NOTE: This implementation does not maintain conversation history across requests.
    const messages: MessageData[] = [
        { role: 'user', content: [{ text: userMessage }] }
    ];

    const {stream: genkitStream} = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      messages: messages, // Correctly pass the constructed messages array
      stream: true,
    });
    
    // Bridge the Genkit async iterator to a ReadableStream that the client can use.
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of genkitStream) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                console.error("Error in chat stream", err);
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });
  }
);
