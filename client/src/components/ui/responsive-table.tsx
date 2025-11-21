import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileView?: React.ReactNode;
}

export function ResponsiveTable({ children, className, mobileView }: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileView) {
    return <div className={className}>{mobileView}</div>;
  }

  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4 space-y-3", className)}>
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:justify-between gap-1", className)}>
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
