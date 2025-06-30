"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SyncDebug() {
  const [syncInfo, setSyncInfo] = useState<any>({
    lastSyncTime: "Nunca",
    syncStatus: "Inactivo",
    syncErrors: [],
    isRunning: false,
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateSyncInfo = async () => {
      try {
        const { getSyncStatus } = await import("@/lib/auto-sync")
        setSyncInfo(getSyncStatus())
      } catch (error) {
        console.log("Auto-sync no disponible")
      }
    }

    // Actualizar cada 2 segundos
    const interval = setInterval(updateSyncInfo, 2000)
    updateSyncInfo()

    return () => clearInterval(interval)
  }, [])

  const handleForceSync = async () => {
    try {
      const { forceSync } = await import("@/lib/auto-sync")
      forceSync()
    } catch (error) {
      console.error("Error forzando sync:", error)
    }
  }

  const handleClearErrors = async () => {
    try {
      const { clearSyncErrors } = await import("@/lib/auto-sync")
      clearSyncErrors()
      setSyncInfo((prev) => ({ ...prev, syncErrors: [] }))
    } catch (error) {
      console.error("Error limpiando errores:", error)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12"
        >
          🔄
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Debug Sincronización</CardTitle>
            <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <strong>Estado:</strong>
            <span
              className={`ml-2 px-2 py-1 rounded text-white ${
                syncInfo.syncStatus === "Completado"
                  ? "bg-green-500"
                  : syncInfo.syncStatus === "Sincronizando..."
                    ? "bg-blue-500"
                    : syncInfo.syncStatus === "Error"
                      ? "bg-red-500"
                      : "bg-gray-500"
              }`}
            >
              {syncInfo.syncStatus}
            </span>
          </div>

          <div>
            <strong>Última sync:</strong> {syncInfo.lastSyncTime}
          </div>

          <div>
            <strong>Timer activo:</strong> {syncInfo.isRunning ? "✅" : "❌"}
          </div>

          {syncInfo.syncErrors.length > 0 && (
            <div>
              <strong>Errores:</strong>
              <div className="bg-red-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                {syncInfo.syncErrors.map((error, index) => (
                  <div key={index} className="text-red-600 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleForceSync} size="sm" className="flex-1">
              Forzar Sync
            </Button>
            {syncInfo.syncErrors.length > 0 && (
              <Button onClick={handleClearErrors} size="sm" variant="outline">
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
