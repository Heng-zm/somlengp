
'use server';
/**
 * @fileOverview A speech-to-text transcription AI agent.
 *
 * - transcribeAudio - A function that handles audio transcription.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import { TranscribeAudioOutput, TranscribeAudioOutputSchema } from '@/lib/types';
import { MAX_BASE64_SIZE_BYTES } from '@/config';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of spoken audio, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;


export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  model: 'gemini-pro',
  input: {schema: TranscribeAudioInputSchema},
  output: {schema: TranscribeAudioOutputSchema},
  prompt: `You are a highly accurate audio transcription service that can understand both English and Khmer.
Transcribe the following audio. The audio may contain both English and Khmer words. Transcribe the words in the language they are spoken.
Include punctuation and structure the output as a clean, readable text.
Provide the full text and a structured transcript with precise word-level timestamps.

Audio: {{media url=audioDataUri}}`,
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {
    if (input.audioDataUri.length > MAX_BASE64_SIZE_BYTES) {
        throw new Error('413: Payload Too Large. Audio file size exceeds the server limit.');
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Transcription failed: The model did not return any output.');
    }
    
    // Post-process to ensure start and end times are numbers.
    const processedTranscript = output.transcript.map(word => ({
        ...word,
        start: Number(word.start) || 0,
        end: Number(word.end) || 0,
    }));

    return {
        transcript: processedTranscript,
        text: output.text,
    };
  }
);
