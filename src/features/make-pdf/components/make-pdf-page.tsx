
"use client";

import { useState, useMemo, useContext } from 'react';
import { Download, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { exportTranscript } from '@/lib/client-export';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';

export function MakePdfPage() {
  const [text, setText] = useState('');
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('MakePdfPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);
  
  const handleExport = () => {
    if (!text.trim()) {
        toast({
            title: t.exportFailed,
            description: t.noTextToExport,
            variant: "destructive",
        });
        return;
    }
    exportTranscript(text, 'docx', [], toast);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        <main className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative overflow-y-auto">
            <Card className="flex flex-col h-full shadow-sm overflow-hidden rounded-2xl">
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t.pasteTextHere}
                    className="h-full w-full resize-none font-body text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
                    aria-label="Text to export"
                />
            </Card>
        </main>
        
        <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
            <div className="w-full max-w-lg flex gap-2 items-center">
                <Button 
                    onClick={handleExport}
                    size="lg"
                    className="flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!text.trim()}
                >
                    <Download className="h-5 w-5" />
                    <span className="ml-2 sm:inline font-bold">{t.exportAsDocx}</span>
                </Button>
            </div>
        </footer>
    </div>
  );
}
