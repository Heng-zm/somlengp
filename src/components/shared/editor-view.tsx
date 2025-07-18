
"use client";

import { Textarea } from "@/components/ui/textarea";

interface EditorViewProps {
  transcript: string;
  onTranscriptChange: (newTranscript: string) => void;
  disabled: boolean;
}

export function EditorView({ transcript, onTranscriptChange, disabled }: EditorViewProps) {
  return (
    <div className="relative h-full w-full">
      <Textarea
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Your transcribed text will appear here. You can edit it directly."
        className="h-[76vh] w-full resize-none text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled}
        aria-label="Transcription Editor"
      />
    </div>
  );
}
