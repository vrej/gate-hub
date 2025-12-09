import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 global-input",
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
  }
)
Input.displayName = "Input"

export { Input }
