import { z } from 'zod';

export type TranscriptWord = {
  text: string;
  start: number;
  end: number;
};

const TranscriptWordSchema = z.object({
  text: z.string(),
  start: z.number().describe('Start time of the word in seconds.'),
  end: z.number().describe('End time of the word in seconds.'),
});

export const TranscribeAudioOutputSchema = z.object({
  transcript: z
    .array(TranscriptWordSchema)
    .describe('The structured transcript with word timings.'),
  text: z.string().describe('The full transcribed text as a single string.'),
});
export type TranscribeAudioOutput = z.infer<
  typeof TranscribeAudioOutputSchema
>;
