
"use client";

import { useState, useMemo, useContext } from 'react';
import { AudioLines, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { voices, VoicePicker } from './voice-picker';
import { Card } from '@/components/ui/card';

export function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0].value);
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('TextToSpeechPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter some text to generate audio.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setAudioDataUri(null);

    try {
      const result = await textToSpeech({ text, voice: selectedVoice });
      setAudioDataUri(result.audioDataUri);
    } catch (e: any) {
      toast({
        title: 'Generation Failed',
        description: e.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioDataUri) return;
    const a = document.createElement('a');
    a.href = audioDataUri;
    a.download = 'generated_speech.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow p-4 md:p-6 flex flex-col gap-6">
        <VoicePicker 
            selectedValue={selectedVoice} 
            onValueChange={setSelectedVoice}
            disabled={isGenerating}
        />
        <Card className="flex-grow flex flex-col p-4 md:p-6 shadow-sm overflow-hidden rounded-2xl">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-grow w-full resize-none text-base leading-relaxed p-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            disabled={isGenerating}
            aria-label="Text to speech input"
            rows={10}
          />
          {audioDataUri && !isGenerating && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between gap-4">
                <audio controls src={audioDataUri} className="w-full">
                    Your browser does not support the audio element.
                </audio>
                <Button onClick={handleDownload} variant="outline" size="icon">
                    <Download className="w-5 h-5" />
                    <span className="sr-only">Download Audio</span>
                </Button>
            </div>
          )}
        </Card>
      </main>
      
      <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
        <div className="w-full max-w-lg flex gap-2 items-center">
          <Button 
            onClick={handleGenerate}
            size="lg"
            className="flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={isGenerating || !text.trim()}
          >
            {isGenerating ? (
              <ThreeDotsLoader />
            ) : (
              <AudioLines className="h-5 w-5" />
            )}
            <span className="ml-2 sm:inline font-bold">
              {isGenerating ? 'Generating...' : 'Generate Audio'}
            </span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
