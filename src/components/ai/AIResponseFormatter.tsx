"use client";

import React from 'react';
import { AIFormat, FormatOptions, inferExportOptions, formatAIResponse } from '@/lib/ai-formatter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

interface Props {
  value: string;
  onFormatted?: (formatted: string) => void;
}

export default function AIResponseFormatter({ value, onFormatted }: Props) {
  const [format, setFormat] = React.useState<AIFormat>('plain');
  const [language, setLanguage] = React.useState<string>('');
  const [headingLevel, setHeadingLevel] = React.useState<1 | 2 | 3 | 4 | 5 | 6 | undefined>(undefined);
  const [wrapAt, setWrapAt] = React.useState<number | undefined>(undefined);
  // Text styling options
  const [enableBold, setEnableBold] = React.useState<boolean>(true);
  const [enableItalic, setEnableItalic] = React.useState<boolean>(true);
  const [enableInlineCode, setEnableInlineCode] = React.useState<boolean>(true);

  const formatted = React.useMemo(() => {
    const options: FormatOptions = {
      format,
      language: format === 'code' ? language : undefined,
      headingLevel: format === 'markdown' ? headingLevel : undefined,
      enableBold,
      enableItalic,
      enableInlineCode,
      wrapAt,
    };
    const out = formatAIResponse(value, options);
    onFormatted?.(out);
    return out;
  }, [value, format, language, headingLevel, enableBold, enableItalic, enableInlineCode, wrapAt, onFormatted]);

  const handleDownload = () => {
    const { filename, mime } = inferExportOptions(format);
    const blob = new Blob([formatted], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={format} onValueChange={(v) => setFormat(v as AIFormat)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Format" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="plain">Plain text</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="code">Code block</SelectItem>
          </SelectContent>
        </Select>

        {format === 'code' && (
          <Input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language (e.g. ts, js, py)"
            className="w-[200px]"
          />
        )}

        {format === 'markdown' && (
          <Select value={headingLevel?.toString() ?? ''} onValueChange={(v) => setHeadingLevel(v ? (Number(v) as 1|2|3|4|5|6) : undefined)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Heading" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No heading</SelectItem>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Input
          type="number"
          value={wrapAt ?? ''}
          onChange={(e) => setWrapAt(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Wrap width"
          className="w-[130px]"
        />

        <Button variant="outline" size="sm" onClick={handleDownload} className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Text styling controls - only show for markdown and html formats */}
      {(format === 'markdown' || format === 'html') && (
        <div className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm font-medium">Text Styling:</span>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="bold" 
              checked={enableBold} 
              onCheckedChange={(checked) => setEnableBold(!!checked)}
            />
            <Label htmlFor="bold" className="text-sm font-bold">**Bold**</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="italic" 
              checked={enableItalic} 
              onCheckedChange={(checked) => setEnableItalic(!!checked)}
            />
            <Label htmlFor="italic" className="text-sm italic">*Italic*</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="code" 
              checked={enableInlineCode} 
              onCheckedChange={(checked) => setEnableInlineCode(!!checked)}
            />
            <Label htmlFor="code" className="text-sm font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">`Code`</Label>
          </div>
        </div>
      )}

      <div className="border rounded-xl p-3 bg-white dark:bg-gray-900 text-sm overflow-auto max-h-96">
        {format === 'html' ? (
          <div dangerouslySetInnerHTML={{ __html: formatted }} />
        ) : (
          <pre className="whitespace-pre-wrap break-words">{formatted}</pre>
        )}
      </div>
    </div>
  );
}

