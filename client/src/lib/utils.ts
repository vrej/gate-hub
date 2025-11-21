import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to properly resolve icon URLs
 * Handles different icon storage formats:
 * - Full URLs (http/https)
 * - Local paths (/uploads/filename)
 * - Just filenames (filename)
 */
export function resolveIconUrl(icon: string | null | undefined): string {
  if (!icon || icon.trim() === '') {
    return '';
  }
  
  if (icon.startsWith('http')) {
    // It's already a full URL
    return icon;
  } else if (icon.startsWith('/uploads/')) {
    // It's a local path, use as-is
    return icon;
  } else {
    // It's just a filename, construct the full path
    return `/uploads/${icon}`;
  }
}
