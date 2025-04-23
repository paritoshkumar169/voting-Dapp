"use client"

import type React from "react"

// Adapted from shadcn/ui toast component
import { useState, createContext, useContext } from "react"

type ToastType = {
  title: string
  description: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: (toast: ToastType) => void
  toasts: ToastType[]
  removeToast: (index: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const toast = (toast: ToastType) => {
    setToasts((prev) => [...prev, toast])
  }

  const removeToast = (index: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map((toast, index) => (
          <div
            key={index}
            className={`p-4 rounded-md shadow-lg max-w-md transform transition-all duration-300 ease-in-out ${
              toast.variant === "destructive" ? "bg-red-900" : "bg-[#512da8]"
            }`}
            onClick={() => removeToast(index)}
          >
            <div className="font-semibold">{toast.title}</div>
            <div className="text-sm opacity-90">{toast.description}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
