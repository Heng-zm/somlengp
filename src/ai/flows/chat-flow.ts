
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { MessageData } from 'genkit';
import { z } from 'zod';

const ChatInputSchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })
);

export async function chat(
  messages: MessageData[]
): Promise<ReadableStream<string>> {
  return new ReadableStream({
    async start(controller) {
      try {
        // --- 1. Robust Input Validation ---
        if (!messages || messages.length === 0) {
          console.error("Chat function called with empty or undefined messages array.");
          controller.error(new Error("No messages provided for chat."));
          return;
        }
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || !lastMessage.content || lastMessage.content.length === 0 || !lastMessage.content[0] || !lastMessage.content[0].text) {
          console.error("Last message in history is malformed or missing content for the prompt.");
          controller.error(new Error("Invalid or empty last message prompt."));
          return;
        }

        const promptText = lastMessage.content[0].text;
        const historyMessages = messages.slice(0, -1);

        // --- 2. Correctly await the generate call ---
        const { stream, response } = await ai.generate({
          model: googleAI.model('gemini-1.5-flash-latest'),
          history: historyMessages,
          prompt: promptText,
          stream: true,
        });

        // --- 3. Defensive Check for Stream ---
        if (!stream) {
          console.error("ai.generate did not return a valid stream object. This often indicates an underlying Genkit configuration or API issue (e.g., API key, model availability).");
          controller.error(new Error("Failed to get a valid stream from the AI model. Check server logs and Genkit configuration."));
          return;
        }

        // --- 4. Iterate over the stream ---
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(text);
          }
        }
        
        // --- 5. Await the full response completion ---
        await response;

      } catch (error) {
        console.error('Error during AI stream generation or processing:', error);
        controller.error(error);
      } finally {
        // --- 6. Ensure Stream Closure ---
        controller.close();
      }
    },
  });
}
