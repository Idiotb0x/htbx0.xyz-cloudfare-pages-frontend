"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: "var(--success)",
    error: "var(--danger)",
    info: "var(--accent)",
  };

  const bgMap: Record<ToastType, string> = {
    success: "rgba(34, 197, 94, 0.15)",
    error: "rgba(239, 68, 68, 0.15)",
    info: "rgba(99, 102, 241, 0.15)",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 9999,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              padding: "0.75rem 1.25rem",
              background: "var(--bg-card)",
              border: `1px solid ${colorMap[t.type]}`,
              borderLeft: `3px solid ${colorMap[t.type]}`,
              borderRadius: "var(--radius)",
              color: colorMap[t.type],
              fontSize: "0.875rem",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              minWidth: "250px",
              backdropFilter: "blur(8px)",
              backgroundColor: bgMap[t.type],
              animation: "slideIn 0.2s ease-out",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
