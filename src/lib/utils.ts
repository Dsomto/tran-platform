import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function stageToNumber(stage: string): number {
  return parseInt(stage.replace("STAGE_", ""));
}

export function numberToStage(num: number): string {
  return `STAGE_${num}`;
}

export function trackLabel(track: string): string {
  const labels: Record<string, string> = {
    SOC_ANALYSIS: "SOC Analysis",
    ETHICAL_HACKING: "Ethical Hacking",
    GRC: "GRC",
  };
  return labels[track] || track;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
