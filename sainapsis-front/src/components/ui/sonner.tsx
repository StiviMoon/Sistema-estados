"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)", // Fondo blanco sólido
          "--normal-text": "hsl(224 71.4% 4.1%)", // Texto oscuro
          "--normal-border": "hsl(214.3 31.8% 91.4%)", // Borde gris claro
          "--success-bg": "hsl(143 85% 96%)", // Verde claro para success
          "--success-text": "hsl(140 100% 27%)", // Verde oscuro para texto
          "--error-bg": "hsl(0 93% 94%)", // Rojo claro para error
          "--error-text": "hsl(0 84% 37%)", // Rojo oscuro para texto
          "--info-bg": "hsl(214 95% 93%)", // Azul claro para info
          "--info-text": "hsl(221 83% 53%)", // Azul oscuro para texto
          "--warning-bg": "hsl(48 96% 89%)", // Amarillo claro para warning
          "--warning-text": "hsl(32 95% 44%)", // Naranja oscuro para texto
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: 'var(--normal-bg)',
          color: 'var(--normal-text)',
          border: '1px solid var(--normal-border)',
          fontSize: '14px',
          fontWeight: '500',
        },
        classNames: {
          success: 'bg-green-50 text-green-800 border-green-200',
          error: 'bg-red-50 text-red-800 border-red-200',
          info: 'bg-blue-50 text-blue-800 border-blue-200',
          warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          description: 'text-gray-700', // Descripción más oscura
        }
      }}
      {...props}
    />
  )
}

export { Toaster }