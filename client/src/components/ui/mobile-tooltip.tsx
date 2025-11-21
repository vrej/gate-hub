"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg border bg-gray-900 px-3 py-2 text-sm text-white shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  >
    {props.children}
    <TooltipPrimitive.Arrow className="fill-gray-900" width={11} height={5} />
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

interface MobileTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  delayDuration?: number
}

export function MobileTooltip({ 
  children, 
  content, 
  side = "top", 
  className,
  delayDuration = 300 
}: MobileTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const handleTriggerClick = () => {
    if (isMobile) {
      setOpen(!open)
    }
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          <div
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
            tabIndex={isMobile ? 0 : -1}
            className={cn(
              "inline-block",
              isMobile && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded active:scale-95 transition-transform duration-150"
            )}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn(
            className,
            isMobile && "max-w-[90vw] mx-4"
          )}
          sideOffset={isMobile ? 8 : 4}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
