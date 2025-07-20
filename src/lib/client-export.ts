
'use client';

import { Document, Packer, Paragraph, TextRun } from "docx";
import type { TranscriptWord } from "./types";

function formatSrtTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  
    const pad = (num: number) => num.toString().padStart(2, '0');
    const padMs = (num: number) => num.toString().padStart(3, '0');
  
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${padMs(milliseconds)}`;
}

function formatVttTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  
    const pad = (num: number) => num.toString().padStart(2, '0');
    const padMs = (num: number) => num.toString().padStart(3, '0');
  
    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
}

function groupWordsIntoSegments(words: TranscriptWord[], segmentDuration: number): { text: string; start: number; end: number }[] {
    if (!words.length || segmentDuration <= 0) return [];

    const segments = [];
    let currentSegmentWords: TranscriptWord[] = [];
    let segmentStartTime = words[0]?.start ?? 0;
    
    for (const word of words) {
        // If the current word starts after the segment time limit, finalize the previous segment.
        if (currentSegmentWords.length > 0 && word.start >= segmentStartTime + segmentDuration) {
            const segmentText = currentSegmentWords.map(w => w.text).join(' ').trim();
            const segmentEndTime = currentSegmentWords[currentSegmentWords.length - 1].end;
            segments.push({ text: segmentText, start: segmentStartTime, end: segmentEndTime });
            
            // Start a new segment
            currentSegmentWords = [word];
            segmentStartTime = word.start;
        } else {
            if (currentSegmentWords.length === 0) {
                segmentStartTime = word.start; // Set start time for the very first word of a new segment
            }
            currentSegmentWords.push(word);
        }
    }

    // Add the last segment if it has any words.
    if (currentSegmentWords.length > 0) {
        const segmentText = currentSegmentWords.map(w => w.text).join(' ').trim();
        const segmentEndTime = currentSegmentWords[currentSegmentWords.length - 1].end;
        segments.push({ text: segmentText, start: segmentStartTime, end: segmentEndTime });
    }

    return segments;
}

function exportToSrt(text: string, words: TranscriptWord[], wordsPerSecond?: number): string | null {
    if ((!words || words.length === 0)) return null;

    let srtContent = '';
    const segmentDuration = wordsPerSecond ? 60 / wordsPerSecond : 0;
    
    if (segmentDuration > 0) {
        const segments = groupWordsIntoSegments(words, segmentDuration);
        segments.forEach((segment, i) => {
            srtContent += `${i + 1}\n`;
            srtContent += `${formatSrtTime(segment.start)} --> ${formatSrtTime(segment.end)}\n`;
            srtContent += `${segment.text}\n\n`;
        });
    } else {
        words.forEach((word, i) => {
            srtContent += `${i + 1}\n`;
            srtContent += `${formatSrtTime(word.start)} --> ${formatSrtTime(word.end)}\n`;
            srtContent += `${word.text}\n\n`;
        });
    }
  
    return srtContent;
}
  
function exportToVtt(text: string, words: TranscriptWord[], wordsPerSecond?: number): string | null {
    if (!words || words.length === 0) return null;

    let vttContent = 'WEBVTT\n\n';
    const segmentDuration = wordsPerSecond ? 60 / wordsPerSecond : 0;
    
    if (segmentDuration > 0) {
        const segments = groupWordsIntoSegments(words, segmentDuration);
        segments.forEach((segment, i) => {
            vttContent += `${formatVttTime(segment.start)} --> ${formatVttTime(segment.end)}\n`;
            vttContent += `${segment.text}\n\n`;
        });

    } else {
        words.forEach((word) => {
            vttContent += `${formatVttTime(word.start)} --> ${formatVttTime(word.end)}\n`;
            vttContent += `${word.text}\n\n`;
        });
    }
    
    return vttContent;
}
  
function exportToTxt(text: string): string {
  return text;
}

function exportToJson(words: TranscriptWord[]): string | null {
    if (words.length === 0) return null;
    return JSON.stringify(words, null, 2);
}
  
function exportToCsv(words: TranscriptWord[]): string | null {
    if (words.length === 0) return null;
    let csvContent = 'text,start,end\n';
    words.forEach(word => {
        const text = `"${word.text.replace(/"/g, '""')}"`;
        csvContent += `${text},${word.start},${word.end}\n`;
    });
    return csvContent;
}

async function exportToDocx(text: string): Promise<Blob> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => 
            new Paragraph({
                children: [new TextRun(line)]
            })
        ),
      }],
    });
  
    return await Packer.toBlob(doc);
}


function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function exportTranscript(
    text: string,
    format: 'srt' | 'vtt' | 'txt' | 'json' | 'csv' | 'docx',
    words: TranscriptWord[],
    showToast: (options: { title: string; description: string; variant: 'destructive' }) => void,
    wordsPerSecond?: number
  ): Promise<void> {
    if (!text.trim() && format !== 'json' && format !== 'csv' && format !== 'docx') {
      showToast({
        title: "Export Failed",
        description: "There is no text to export.",
        variant: "destructive",
      });
      return;
    }
    
    let content: string | Blob | null = null;
    let filename: string = 'transcript';
    let mimeType: string = 'text/plain';

    switch (format) {
      case 'srt':
        content = exportToSrt(text, words, wordsPerSecond);
        filename += '.srt';
        if (!content) {
          showToast({
            title: "Export Failed",
            description: "Word timings not available for SRT export. Try using the 'Words per second' setting.",
            variant: "destructive",
          });
          return;
        }
        break;
      case 'vtt':
          content = exportToVtt(text, words, wordsPerSecond);
          filename += '.vtt';
          mimeType = 'text/vtt';
          if (!content) {
            showToast({
              title: "Export Failed",
              description: "Word timings not available for VTT export. Try using the 'Words per second' setting.",
              variant: "destructive",
            });
            return;
          }
          break;
      case 'txt':
        content = exportToTxt(text);
        filename += '.txt';
        break;
      case 'json':
        content = exportToJson(words);
        filename += '.json';
        mimeType = 'application/json';
        if (!content) {
            showToast({
                title: "Export Failed",
                description: "No structured transcript available for JSON export.",
                variant: "destructive",
            });
            return;
        }
        break;
      case 'csv':
          content = exportToCsv(words);
          filename += '.csv';
          mimeType = 'text/csv';
          if (!content) {
              showToast({
                  title: "Export Failed",
                  description: "No structured transcript available for CSV export.",
                  variant: "destructive",
              });
              return;
          }
          break;
      case 'docx':
        try {
            content = await exportToDocx(text);
            filename += '.docx';
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } catch (error) {
            console.error("Failed to export DOCX:", error);
            showToast({
                title: "Export Failed",
                description: "Could not create DOCX file.",
                variant: "destructive",
            });
            return;
        }
        break;
      default:
        showToast({
            title: "Export Failed",
            description: "Unsupported export format.",
            variant: "destructive",
          });
        return;
    }

    if (content) {
        downloadFile(content, filename, mimeType);
    }
}
