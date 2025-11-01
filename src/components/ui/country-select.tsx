"use client"

import React from "react"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectSeparator,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import countriesData, { countries, flagEmoji, Country } from "@/lib/country-codes"
import { cn } from "@/lib/utils"

export type CountrySelectProps = {
  value?: string // iso2
  onValueChange?: (iso2: string) => void
  placeholder?: string
  className?: string
  showDialCode?: boolean
  priority?: string[] // iso2 codes to pin on top
}

function OptionLabel({ c, showDialCode }: { c: Country; showDialCode: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg leading-none">{flagEmoji(c.iso2)}</span>
      <span className="truncate">{c.name}</span>
      {showDialCode && <span className="ml-auto tabular-nums text-muted-foreground">+{c.dialCode}</span>}
    </div>
  )
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country",
  className,
  showDialCode = true,
  priority = ["US", "GB", "CA", "AU", "IN"],
}: CountrySelectProps) {
  const prio = countries.filter((c) => priority.includes(c.iso2))
  const rest = countries.filter((c) => !priority.includes(c.iso2))
  const sorted = [...rest].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue
          placeholder={placeholder}
          aria-label={value}
        />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Popular</SelectLabel>
          {prio.map((c) => (
            <SelectItem key={c.iso2} value={c.iso2} aria-label={`${c.name} +${c.dialCode}`}>
              <OptionLabel c={c} showDialCode={showDialCode} />
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>All countries</SelectLabel>
          {sorted.map((c) => (
            <SelectItem key={c.iso2} value={c.iso2} aria-label={`${c.name} +${c.dialCode}`}>
              <OptionLabel c={c} showDialCode={showDialCode} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default CountrySelect
