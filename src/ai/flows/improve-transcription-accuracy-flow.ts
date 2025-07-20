
'use server';
/**
 * @fileOverview An AI agent for improving audio transcription accuracy using custom vocabulary.
 *
 * - improveTranscriptionAccuracy - A function that handles the transcription improvement process.
 * - ImproveTranscriptionAccuracyInput - The input type for the improveTranscriptionAccuracy function.
 * - TranscribeAudioOutput - The return type, shared with the standard speech-to-text flow.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import type {TranscribeAudioOutput} from '@/lib/types';
import {TranscribeAudioOutputSchema} from '@/lib/types';
import { MAX_BASE64_SIZE_BYTES } from '@/config';

const ImproveTranscriptionAccuracyInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of spoken audio, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customVocabulary: z.array(z.string()).describe("A list of custom words or phrases to improve recognition accuracy."),
});
export type ImproveTranscriptionAccuracyInput = z.infer<typeof ImproveTranscriptionAccuracyInputSchema>;

export async function improveTranscriptionAccuracy(input: ImproveTranscriptionAccuracyInput): Promise<TranscribeAudioOutput> {
  return improveTranscriptionAccuracyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveTranscriptionAccuracyPrompt',
  model: googleAI.model('gemini-pro'),
  input: {schema: ImproveTranscriptionAccuracyInputSchema},
  output: {schema: TranscribeAudioOutputSchema},
  prompt: `You are a highly accurate audio transcription service that can understand both English and Khmer.
Transcribe the following audio. The audio may contain both English and Khmer words. Transcribe the words in the language they are spoken.
Include punctuation and structure the output as a clean, readable text.
Provide the full text and a structured transcript with precise word-level timestamps.

Pay special attention to the following custom vocabulary. Ensure these words are transcribed correctly if they appear in the audio:
{{#each customVocabulary}}
- {{{this}}}
{{/each}}

Audio: {{media url=audioDataUri}}`,
});

const improveTranscriptionAccuracyFlow = ai.defineFlow(
  {
    name: 'improveTranscriptionAccuracyFlow',
    inputSchema: ImproveTranscriptionAccuracyInputSchema,
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
