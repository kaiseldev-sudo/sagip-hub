import { toast as sonnerToast } from "sonner";

export type ToastFn = typeof sonnerToast;

export function useToast(): { toast: ToastFn } {
  return { toast: sonnerToast };
}

export const toast = sonnerToast;


