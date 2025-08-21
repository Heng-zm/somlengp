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
import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
}

const DEFAULT_AI_MODELS: AIModel[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for most tasks',
    icon: '⚡'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (Experimental)',
    description: 'Latest experimental model with enhanced capabilities',
    icon: '✨'
  },
  {
    id: 'grok-beta',
    name: 'grok-beta',
    displayName: 'Grok Beta',
    description: 'xAI\'s conversational AI with real-time knowledge',
    icon: '🤖'
  },
  {
    id: 'grok-vision-beta',
    name: 'grok-vision-beta',
    displayName: 'Grok Vision Beta',
    description: 'Grok with advanced vision capabilities',
    icon: '👁️'
  }
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  models?: AIModel[];
  className?: string;
  size?: 'sm' | 'lg';
  showIcon?: boolean;
  label?: string;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  models = DEFAULT_AI_MODELS,
  className,
  size = 'sm',
  showIcon = true,
  label = 'Select AI Model',
  disabled = false
}: ModelSelectorProps) {
  const sizeClasses = {
    sm: 'text-sm h-8',
    lg: 'text-base h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn(
            "flex",
            sizeClasses[size],
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          {showIcon && <Settings className={cn(iconSizes[size], "mr-2")} />}
          {selectedModel.displayName}
          <ChevronDown className={cn(iconSizes[size], "ml-2")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-64 max-w-[90vw]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model)}
            className={cn(
              "flex flex-col items-start space-y-1 cursor-pointer",
              selectedModel.id === model.id && "bg-blue-50 dark:bg-blue-950/20"
            )}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{model.icon}</span>
              <span className="font-medium">{model.displayName}</span>
              {selectedModel.id === model.id && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {model.description}
            </p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DEFAULT_AI_MODELS };
export type { AIModel };
