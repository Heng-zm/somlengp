
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ThreeDotsLoaderProps {
  className?: string;
}

const ThreeDotsLoader = React.memo(function ThreeDotsLoader({ className }: ThreeDotsLoaderProps) {
  return (
    <div className={cn("flex space-x-2 justify-center items-center", className)}>
      <span className="sr-only">Loading...</span>
      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce-dot [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce-dot [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-foreground rounded-full animate-bounce-dot"></div>
    </div>
  );
});

export { ThreeDotsLoader };
