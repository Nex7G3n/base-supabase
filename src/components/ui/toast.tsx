import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react"

interface ToastProps extends React.ComponentProps<"div"> {
  variant?: "default" | "success" | "error" | "warning" | "info"
  title?: string
  description?: string
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, onClose, children, ...props }, ref) => {
    const icons = {
      default: Info,
      success: CheckCircle,
      error: XCircle,
      warning: AlertTriangle,
      info: Info,
    }

    const Icon = icons[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg border p-4 shadow-md",
          {
            "border-gray-200 bg-white text-gray-900": variant === "default",
            "border-green-200 bg-green-50 text-green-900": variant === "success",
            "border-red-200 bg-red-50 text-red-900": variant === "error",
            "border-yellow-200 bg-yellow-50 text-yellow-900": variant === "warning",
            "border-blue-200 bg-blue-50 text-blue-900": variant === "info",
          },
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-medium">{title}</div>
            )}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
            {children}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
export type { ToastProps }
