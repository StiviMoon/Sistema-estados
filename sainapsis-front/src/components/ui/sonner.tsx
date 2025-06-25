"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-gray-200 shadow-lg p-4 bg-white dark:bg-gray-900",
          title: "text-base font-semibold text-gray-900 dark:text-white",
          description: "text-sm text-gray-600 dark:text-gray-300",
          actionButton: "bg-blue-600 text-white hover:bg-blue-700 rounded-md px-3 py-1 text-sm",
          cancelButton: "bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md px-3 py-1 text-sm"
        }
      }}
      {...props}
    />
  )
}

export { Toaster }