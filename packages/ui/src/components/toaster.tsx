"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import {
  Toast,
  ToastClose,
  ToastDescription,
  type ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastProps["variant"];
  /** Milliseconds before auto-dismiss. Default 5000. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  open: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

/** Mount once near the app root. Renders queued toasts and exposes `useToast()`. */
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    setToasts((current) => [...current, { ...options, id: nextId++, open: true }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, open: false } : t)));
    // Let the exit animation finish before unmounting.
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext value={value}>
      <ToastProvider swipeDirection="right">
        {children}
        {toasts.map(({ id, open, title, description, variant, duration }) => (
          <Toast
            key={id}
            open={open}
            variant={variant ?? "default"}
            duration={duration ?? 5000}
            onOpenChange={(isOpen) => {
              if (!isOpen) dismiss(id);
            }}
          >
            <div className="grid gap-1">
              <ToastTitle>{title}</ToastTitle>
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast() must be used inside <Toaster>.");
  return context;
}
