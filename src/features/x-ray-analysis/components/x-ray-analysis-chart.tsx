
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"

const data = [
  {
    name: "With AI",
    time: 215,
    label: "3h35",
  },
  {
    name: "Without AI",
    time: 285,
    label: "4h45",
  },
]

export function XRayAnalysisChart() {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                <defs>
                    <pattern id="pattern-stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <rect width="4" height="8" transform="translate(0,0)" fill="hsl(var(--primary-foreground))"></rect>
                    </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    hide={true}
                    domain={[0, 320]}
                />
                <Bar dataKey="time" radius={[8, 8, 8, 8]}>
                    <LabelList
                        dataKey="label"
                        position="top"
                        offset={10}
                        className="fill-foreground font-semibold"
                        fontSize={14}
                    />
                    {data.map((entry, index) => (
                        <rect
                            key={`cell-${index}`}
                            fill={entry.name === 'With AI' ? "url(#pattern-stripe)" : "hsl(var(--accent))"}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
