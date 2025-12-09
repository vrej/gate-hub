import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom", className)}
      style={{ fontFamily: 'Inter, sans-serif' }}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t font-medium [&>tr]:last:border-b-0",
      className
    )}
    style={{ background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)' }}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, style, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors data-[state=selected]:bg-muted global-table-row",
      className
    )}
    style={{
      background: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#4a5568',
      borderBottom: '1px solid #f1f5f9',
      ...style
    }}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 text-left align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 600,
      color: '#a0aec0',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '12px 16px',
      borderBottom: '1px solid #e8eef5',
      background: 'transparent',
      ...style
    }}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("align-middle [&:has([role=checkbox])]:pr-0", className)}
    style={{
      padding: '16px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#4a5568',
      ...style
    }}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, style, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4", className)}
    style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#a0aec0',
      ...style
    }}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
