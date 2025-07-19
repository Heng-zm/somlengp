
"use client";

import { useState, useMemo, useContext } from 'react';
import { Wand2, Volume2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { Textarea } from '@/components/ui/textarea';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const availableVoices = [
  'achernar', 'achird', 'algenib', 'algieba', 'alnilam', 'aoede', 'autonoe', 
  'callirrhoe', 'charon', 'despina', 'enceladus', 'erinome', 'fenrir', 
  'gacrux', 'iapetus', 'kore', 'laomedeia', 'leda', 'orus', 'puck', 
  'pulcherrima', 'rasalgethi', 'sadachbia', 'sadaltager', 'schedar', 
  'sulafat', 'umbriel', 'vindemiatrix', 'zephyr', 'zubenelgenubi'
];

export function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Algenib');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
        title: t.errorGeneratingAudio,
        description: 'Please enter some text to generate audio.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setAudioDataUri(null);

    try {
      const result = await textToSpeech({ text, voice });
      if (result.audioDataUri) {
        setAudioDataUri(result.audioDataUri);
      } else {
        throw new Error('The model did not return any audio data.');
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = (e.message || '').toLowerCase();
      let title = t.errorGeneratingAudio;
      let description = e.message || "An unknown error occurred.";

      if (errorMessage.includes('503') || errorMessage.includes('model is overloaded')) {
          title = t.modelOverloadedTitle;
          description = t.modelOverloadedDescription;
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          title = t.rateLimitExceeded;
          description = t.rateLimitMessage;
      }
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioDataUri) return;
    const link = document.createElement('a');
    link.href = audioDataUri;
    link.download = 'generated-audio.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleClear = () => {
    setText('');
    setAudioDataUri(null);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 md:p-6">
      <Card className="flex-grow flex flex-col p-6 rounded-2xl shadow-sm h-[78vh]">
        <div className="flex-grow relative flex flex-col gap-4">
          <div className="flex-grow relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.pasteTextHere}
              className="h-full w-full resize-none text-base leading-relaxed p-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/30"
              disabled={isGenerating}
            />
            {text && (
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="absolute top-2 right-2 rounded-full"
                  disabled={isGenerating}
                >
                  <X className="h-4 w-4" />
              </Button>
            )}
          </div>
           <div className="grid w-full items-center gap-1.5">
             <Label htmlFor="voice-select">Voice</Label>
             <Select
                value={voice}
                onValueChange={setVoice}
                disabled={isGenerating}
              >
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select voice..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map(v => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
        </div>
        
        {audioDataUri && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="text-primary" />
              {t.audioPlayback}
            </h3>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <audio controls src={audioDataUri} className="w-full">
                    Your browser does not support the audio element.
                </audio>
                <Button onClick={handleDownload} variant="outline" size="icon">
                    <Download className="h-5 w-5" />
                    <span className="sr-only">Download Audio</span>
                </Button>
            </div>
          </div>
        )}
      </Card>
      
      <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 mt-4">
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
              <Wand2 className="h-5 w-5" />
            )}
            <span className="ml-2 sm:inline font-bold">
              {isGenerating ? t.generatingAudio : t.generateAudio}
            </span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
