
'use server';
/**
 * @fileOverview An AI agent for generating a short audio preview of a specific voice.
 *
 * - textToSpeechPreview - A function that handles the voice preview generation.
 * - TextToSpeechPreviewInput - The input type for the function.
 * - TextToSpeechPreviewOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechPreviewInputSchema = z.object({
  voice: z.string().describe('The voice to use for the speech synthesis.'),
});
export type TextToSpeechPreviewInput = z.infer<typeof TextToSpeechPreviewInputSchema>;

const TextToSpeechPreviewOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a data URI.'),
});
export type TextToSpeechPreviewOutput = z.infer<typeof TextToSpeechPreviewOutputSchema>;

export async function textToSpeechPreview(
  input: TextToSpeechPreviewInput
): Promise<TextToSpeechPreviewOutput> {
  return textToSpeechPreviewFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechPreviewFlow = ai.defineFlow(
  {
    name: 'textToSpeechPreviewFlow',
    inputSchema: TextToSpeechPreviewInputSchema,
    outputSchema: TextToSpeechPreviewOutputSchema,
  },
  async ({ voice }) => {
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: "សួស្ដី",
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Algenib' },
          },
        },
      },
    });

    if (!media) {
      throw new Error('No media returned from TTS model.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);
    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
