'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export default function EnvChecker() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
  }

  const getStatus = (value: string | undefined) => {
    if (!value) return 'missing'
    if (value.includes('your-') || value.includes('undefined')) return 'placeholder'
    return 'set'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'set': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'placeholder': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'missing': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'set': return 'default'
      case 'placeholder': return 'secondary'
      case 'missing': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatValue = (value: string | undefined) => {
    if (!value) return 'Not set'
    if (value.length > 50) {
      return value.substring(0, 20) + '...' + value.substring(value.length - 10)
    }
    return value
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Environment Variables Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => {
          const status = getStatus(value)
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <span className="font-mono text-sm">{key}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(status) as any}>
                  {status}
                </Badge>
                <span className="text-xs text-gray-500 max-w-48 truncate">
                  {formatValue(value)}
                </span>
              </div>
            </div>
          )
        })}
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Next Steps:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• If variables are <Badge variant="destructive" className="text-xs">missing</Badge>, create <code>.env.local</code> file</li>
            <li>• If variables show <Badge variant="secondary" className="text-xs">placeholder</Badge>, update with real values</li>
            <li>• If all show <Badge variant="default" className="text-xs">set</Badge>, check Supabase project settings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}