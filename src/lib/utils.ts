import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx.
 * Standard shadcn/ui utility.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate age from date of birth.
 * Uses Korean age counting (만 나이).
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Parse a "province|district" location string.
 */
export function parseLocation(location: string): { province: string; district: string } {
  const [province, district] = location.split("|");
  return { province: province || "", district: district || "" };
}

/**
 * Format a location object to "province|district" string.
 */
export function formatLocation(province: string, district: string): string {
  return `${province}|${district}`;
}
