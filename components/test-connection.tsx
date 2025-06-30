"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { neonDb } from "@/lib/SupaBasClient"
import { useState } from "react"

export default function TestConnection() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus("idle")

    try {
      // Probar conexión básica
      const result = await neonDb.getClientes()

      setConnectionStatus("success")
      toast({
        title: "✅ Conexión exitosa",
        description: `Base de datos conectada correctamente. Encontrados ${result.length} clientes.`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error de conexión:", error)
      setConnectionStatus("error")

      toast({
        title: "❌ Error de conexión",
        description: "No se pudo conectar a la base de datos. Revisa la configuración.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTables = async () => {
    setIsLoading(true)

    try {
      // Aquí ejecutarías el script SQL para crear las tablas
      toast({
        title: "🔧 Creando tablas",
        description: "Ejecuta el script SQL en tu consola de Neon para crear las tablas.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error creando tablas:", error)
      toast({
        title: "❌ Error",
        description: "Error al crear las tablas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">Prueba de Conexión a Neon</h3>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "success"
                ? "bg-green-500"
                : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-300"
            }`}
          ></div>
          <span className="text-sm">
            {connectionStatus === "success"
              ? "Conectado"
              : connectionStatus === "error"
                ? "Error de conexión"
                : "Sin probar"}
          </span>
        </div>

        <Button onClick={testConnection} disabled={isLoading} className="w-full">
          {isLoading ? "Probando..." : "Probar Conexión"}
        </Button>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Instrucciones:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Copia tu cadena de conexión de Neon</li>
            <li>Configúrala en DATABASE_URL</li>
            <li>Haz clic en "Probar Conexión"</li>
            <li>Si falla, ejecuta el script SQL en Neon primero</li>
          </ol>
        </div>
      </div>
    </Card>
  )
}
