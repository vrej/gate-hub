import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, style, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full disabled:cursor-not-allowed disabled:opacity-50 global-textarea",
        className
      )}
      style={{
        background: '#ffffff',
        border: '1px solid #e8eef5',
        borderRadius: '12px',
        padding: '12px 16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#4a5568',
        outline: 'none',
        ...style
      }}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
