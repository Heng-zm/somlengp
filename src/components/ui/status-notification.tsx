import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  Timer,
  AlertCircle
} from "lucide-react"

import { cn } from "@/lib/utils"

const statusNotificationVariants = cva(
  "inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md backdrop-blur-sm",
  {
    variants: {
      status: {
        pending: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-200/50 hover:shadow-amber-300/60",
        submitted: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200/50 hover:shadow-blue-300/60",
        success: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-200/50 hover:shadow-green-300/60",
        failed: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200/50 hover:shadow-red-300/60",
        expired: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-gray-200/50 hover:shadow-gray-300/60",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
)

const iconMap = {
  pending: AlertCircle,
  submitted: Send,
  success: CheckCircle,
  failed: XCircle,
  expired: Timer,
}

export interface StatusNotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusNotificationVariants> {
  status: "pending" | "submitted" | "success" | "failed" | "expired"
  showIcon?: boolean
}

const StatusNotification = React.memo(function StatusNotification({ 
  className, 
  status = "pending", 
  showIcon = true,
  children,
  ...props 
}: StatusNotificationProps) {
  const Icon = iconMap[status]
  
  const statusLabels = {
    pending: "Pending",
    submitted: "Submitted", 
    success: "Success",
    failed: "Failed",
    expired: "Expired",
  }

  return (
    <div 
      className={cn(statusNotificationVariants({ status }), className)} 
      {...props}
      role="status"
      aria-live="polite"
    >
      {showIcon && (
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </span>
      )}
      <span className="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
        {children || statusLabels[status]}
      </span>
    </div>
  )
})

export { StatusNotification, statusNotificationVariants }
