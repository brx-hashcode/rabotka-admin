import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXAF(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
  }).format(amount);
}

export function renderAdminAvatar(firstName: string) {
  const url = `https://api.dicebear.com/9.x/adventurer-neutral/svg?flip=true&seed=${firstName}`;

  return url;
}
