import { config } from 'dotenv';
config();

import '@/ai/flows/improve-transcription-accuracy-flow.ts';
import '@/ai/flows/speech-to-text-flow.ts';
import '@/ai/flows/pdf-transcript-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
