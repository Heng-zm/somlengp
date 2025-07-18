import Link from 'next/link';
import { Mic, FileText, BotMessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
           <BotMessageSquare className="h-8 w-8 text-primary" />
           <h1 className="text-3xl font-bold text-foreground">VoiceScribe</h1>
        </div>
        <p className="text-muted-foreground text-lg">Your AI-powered transcription assistant.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        <FeatureCard
          href="/voice-transcript"
          title="Voice Transcript"
          description="Transcribe audio files into editable text with timestamps."
          icon={Mic}
          gradient="from-blue-400 to-teal-400"
        />
        <FeatureCard
          href="/pdf-transcript"
          title="PDF Transcript"
          description="Extract and clean up text from your PDF documents."
          icon={FileText}
          gradient="from-purple-400 to-pink-400"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

function FeatureCard({ href, title, description, icon: Icon, gradient }: FeatureCardProps) {
  return (
    <Link href={href} passHref>
      <Card className={`relative w-full h-full min-h-[200px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] shadow-lg text-white bg-gradient-to-br ${gradient}`}>
          <div className="relative z-10">
            <div className="mb-4 p-3 bg-white/20 rounded-full w-fit">
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="opacity-80 mt-1">{description}</p>
          </div>
          <div className="flex justify-end z-10">
            <Button variant="secondary" className="bg-white/90 text-foreground hover:bg-white">
              Start Now
            </Button>
          </div>
      </Card>
    </Link>
  );
}
