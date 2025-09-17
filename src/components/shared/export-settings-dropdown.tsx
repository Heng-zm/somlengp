"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  ChevronDown, 
  Video, 
  Database, 
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


export interface ExportFormat {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'subtitle' | 'document' | 'data';
}

const DEFAULT_EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'srt',
    name: 'srt',
    displayName: 'SRT',
    description: 'SubRip subtitle format with timestamps',
    icon: Video,
    category: 'subtitle'
  },
  {
    id: 'vtt',
    name: 'vtt',
    displayName: 'VTT',
    description: 'WebVTT subtitle format for web players',
    icon: Video,
    category: 'subtitle'
  },
  {
    id: 'txt',
    name: 'txt',
    displayName: 'TXT',
    description: 'Plain text without formatting',
    icon: FileText,
    category: 'document'
  },
  {
    id: 'docx',
    name: 'docx',
    displayName: 'DOCX',
    description: 'Microsoft Word document format',
    icon: FileText,
    category: 'document'
  },
  {
    id: 'json',
    name: 'json',
    displayName: 'JSON',
    description: 'Structured data with timestamps',
    icon: Database,
    category: 'data'
  },
  {
    id: 'csv',
    name: 'csv',
    displayName: 'CSV',
    description: 'Spreadsheet format for data analysis',
    icon: FileSpreadsheet,
    category: 'data'
  }
];

interface ExportSettingsDropdownProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  formats?: ExportFormat[];
  className?: string;
  size?: 'sm' | 'lg';
  label?: string;
  disabled?: boolean;
  showIcon?: boolean;
}

export function ExportSettingsDropdown({
  selectedFormat,
  onFormatChange,
  formats = DEFAULT_EXPORT_FORMATS,
  className,
  size = 'sm',
  label = 'Export Format',
  disabled = false,
  showIcon = true
}: ExportSettingsDropdownProps) {
  const selectedFormatData = formats.find(format => format.id === selectedFormat);
  
  const sizeClasses = {
    sm: 'text-sm h-10 px-3',
    lg: 'text-base h-12 px-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Group formats by category
  const groupedFormats = formats.reduce((acc, format) => {
    if (!acc[format.category]) {
      acc[format.category] = [];
    }
    acc[format.category].push(format);
    return acc;
  }, {} as Record<string, ExportFormat[]>);

  const categoryLabels = {
    subtitle: 'Subtitle Formats',
    document: 'Document Formats', 
    data: 'Data Formats'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn(
            "flex justify-between",
            sizeClasses[size],
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {showIcon && selectedFormatData && (
              <selectedFormatData.icon className={cn(iconSizes[size])} />
            )}
            <span className="font-medium">
              {selectedFormatData ? selectedFormatData.displayName : 'Select format'}
            </span>
          </div>
          <ChevronDown className={cn(iconSizes[size], "opacity-50")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-w-[90vw]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(groupedFormats).map(([category, categoryFormats]) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </DropdownMenuLabel>
            {categoryFormats.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <DropdownMenuItem
                  key={format.id}
                  onClick={() => onFormatChange(format.id)}
                  className={cn(
                    "flex flex-col items-start space-y-1 cursor-pointer p-3 min-h-[60px]",
                    isSelected && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{format.displayName}</span>
                        <span className="text-xs text-muted-foreground leading-tight">
                          {format.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        Selected
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_EXPORT_FORMATS };
