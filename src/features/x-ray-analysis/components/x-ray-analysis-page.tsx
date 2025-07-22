
"use client";

import { Card } from "@/components/ui/card";
import { XRayAnalysisChart } from "./x-ray-analysis-chart";

function XRayIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m14.5 2-2.5 6 2.5 6h-5L7 8l-2.5-6" />
            <path d="m7 14 2.5 6 2.5-6" />
            <path d="M14.5 14h-5" />
        </svg>
    )
}


export function XRayAnalysisPage() {
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow p-4 md:p-6 flex flex-col items-center justify-center">
          <Card className="w-full max-w-lg p-6 md:p-8 bg-card text-card-foreground shadow-2xl rounded-3xl">
            <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">AI cuts ER wait:</h2>
                        <p className="text-2xl md:text-3xl font-bold tracking-tight text-primary">1h10 saved on visits</p>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <XRayIcon className="w-8 h-8"/>
                        <span className="font-semibold text-lg">X-ray analysis</span>
                    </div>
                </div>
                <div>
                    <XRayAnalysisChart />
                </div>
            </div>
          </Card>
      </main>
    </div>
  );
}
