"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface SystemStats {
  services: number
  sales: number
  clients: number
  vehicles: number
  employees: number
  inventory: number
  attendance: number
  loyalty: number
}

export default function AdminPanel() {
  const { toast } = useToast()
  const [stats, setStats] = useState<SystemStats>({
    services: 0,
    sales: 0,
    clients: 0,
    vehicles: 0,
    employees: 0,
    inventory: 0,
    attendance: 0,
    loyalty: 0,
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)
  const [backupData, setBackupData] = useState<string>("")
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: "",
    end: "",
  })

  useEffect(() => {
    loadSystemStats()
  }, [])

  const loadSystemStats = () => {
    try {
      // Aquí cargarías las estadísticas desde tu API o base de datos
      console.log("Loading system stats...")
    } catch (error) {
      console.error("Error loading system stats:", error)
    }
  }

  const confirmAction = (action: string) => {
    setShowConfirmDialog(action)
  }

  const executeAction = (action: string) => {
    setShowConfirmDialog(null)

    switch (action) {
      case "delete-all-sales":
        deleteAllSales()
        break
      case "delete-old-sales":
        deleteOldSales()
        break
      case "reset-reports":
        resetReports()
        break
      case "reset-all-data":
        resetAllData()
        break
      case "clean-old-attendance":
        cleanOldAttendance()
        break
      case "reset-loyalty":
        resetLoyaltySystem()
        break
      case "optimize-storage":
        optimizeStorage()
        break
      default:
        break
    }
  }

  const deleteAllSales = () => {
    // Aquí harías la llamada a tu API para eliminar todas las ventas
    toast({
      title: "Ventas eliminadas",
      description: "Todas las ventas han sido eliminadas del sistema",
      variant: "success",
    })
    loadSystemStats()
  }

  const deleteOldSales = () => {
    if (!selectedDateRange.start || !selectedDateRange.end) {
      toast({
        title: "Error",
        description: "Seleccione un rango de fechas válido",
        variant: "destructive",
      })
      return
    }

    // Aquí harías la llamada a tu API para eliminar ventas del período seleccionado
    toast({
      title: "Ventas eliminadas",
      description: "Ventas del período seleccionado han sido eliminadas",
      variant: "success",
    })
    loadSystemStats()
  }

  const resetReports = () => {
    // Aquí harías la llamada a tu API para reiniciar reportes
    toast({
      title: "Reportes reiniciados",
      description: "Los datos de reportes han sido limpiados (manteniendo últimos 30 días)",
      variant: "success",
    })
    loadSystemStats()
  }

  const resetAllData = () => {
    // Aquí harías la llamada a tu API para reiniciar todos los datos
    toast({
      title: "Sistema reiniciado",
      description: "Todos los datos del sistema han sido eliminados",
      variant: "success",
    })
    loadSystemStats()
  }

  const cleanOldAttendance = () => {
    // Aquí harías la llamada a tu API para limpiar asistencias antiguas
    toast({
      title: "Asistencias limpiadas",
      description: "Registros de asistencia antiguos eliminados",
      variant: "success",
    })
    loadSystemStats()
  }

  const resetLoyaltySystem = () => {
    // Aquí harías la llamada a tu API para reiniciar el sistema de lealtad
    toast({
      title: "Sistema de lealtad reiniciado",
      description: "Todos los puntos de lealtad han sido reiniciados",
      variant: "success",
    })
    loadSystemStats()
  }

  const optimizeStorage = () => {
    // Aquí harías la llamada a tu API para optimizar el almacenamiento
    toast({
      title: "Almacenamiento optimizado",
      description: "Registros duplicados eliminados",
      variant: "success",
    })
    loadSystemStats()
  }

  const createBackup = () => {
    // Aquí harías la llamada a tu API para crear un backup
    const dataStr = JSON.stringify({ message: "Backup placeholder" }, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `zona-garaje-backup-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Backup creado",
      description: "Respaldo del sistema descargado exitosamente",
      variant: "success",
    })
  }

  const restoreBackup = () => {
    if (!backupData) {
      toast({
        title: "Error",
        description: "No hay datos de respaldo para restaurar",
        variant: "destructive",
      })
      return
    }

    try {
      const backup = JSON.parse(backupData)
      if (!backup.data) {
        throw new Error("Formato de respaldo inválido")
      }

      // Aquí harías la llamada a tu API para restaurar los datos
      toast({
        title: "Sistema restaurado",
        description: "Los datos han sido restaurados desde el respaldo",
        variant: "success",
      })
      loadSystemStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al restaurar el respaldo. Verifique el formato del archivo",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackupData(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestión avanzada del sistema Zona Garaje</p>
        </div>
        <div className="flex items-center space-x-2">
          <i className="fas fa-shield-alt text-2xl text-red-500"></i>
          <span className="text-sm font-medium text-red-600">Acceso Administrativo</span>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <i className="fas fa-concierge-bell text-2xl text-blue-500 mb-2"></i>
            <p className="text-2xl font-bold">{stats.services}</p>
            <p className="text-sm text-gray-600">Servicios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <i className="fas fa-cash-register text-2xl text-green-500 mb-2"></i>
            <p className="text-2xl font-bold">{stats.sales}</p>
            <p className="text-sm text-gray-600">Ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <i className="fas fa-users text-2xl text-purple-500 mb-2"></i>
            <p className="text-2xl font-bold">{stats.clients}</p>
            <p className="text-sm text-gray-600">Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <i className="fas fa-hard-hat text-2xl text-orange-500 mb-2"></i>
            <p className="text-2xl font-bold">{stats.employees}</p>
            <p className="text-sm text-gray-600">Empleados</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-trash-alt text-red-500 mr-2"></i>
              Gestión de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button onClick={() => confirmAction("delete-all-sales")} variant="destructive" className="w-full mb-3">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Eliminar Todas las Ventas
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Eliminar Ventas por Fecha</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Desde</label>
                  <input
                    type="date"
                    value={selectedDateRange.start}
                    onChange={(e) => setSelectedDateRange({ ...selectedDateRange, start: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hasta</label>
                  <input
                    type="date"
                    value={selectedDateRange.end}
                    onChange={(e) => setSelectedDateRange({ ...selectedDateRange, end: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <Button onClick={() => confirmAction("delete-old-sales")} variant="outline" className="w-full">
                <i className="fas fa-calendar-times mr-2"></i>
                Eliminar Ventas del Período
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-tools text-blue-500 mr-2"></i>
              Mantenimiento del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => confirmAction("reset-reports")} variant="outline" className="w-full">
              <i className="fas fa-chart-bar mr-2"></i>
              Reiniciar Reportes
            </Button>

            <Button onClick={() => confirmAction("clean-old-attendance")} variant="outline" className="w-full">
              <i className="fas fa-clock mr-2"></i>
              Limpiar Asistencias Antiguas
            </Button>

            <Button onClick={() => confirmAction("reset-loyalty")} variant="outline" className="w-full">
              <i className="fas fa-star mr-2"></i>
              Reiniciar Sistema de Lealtad
            </Button>

            <Button onClick={() => confirmAction("optimize-storage")} variant="outline" className="w-full">
              <i className="fas fa-compress-alt mr-2"></i>
              Optimizar Almacenamiento
            </Button>

            <Button onClick={() => confirmAction("reset-all-data")} variant="destructive" className="w-full">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Reiniciar Todo el Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-database text-green-500 mr-2"></i>
            Respaldo y Restauración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup */}
            <div>
              <h4 className="font-medium mb-3">Crear Respaldo</h4>
              <p className="text-sm text-gray-600 mb-4">
                Descarga un archivo con todos los datos del sistema para respaldo de seguridad.
              </p>
              <Button onClick={createBackup} variant="yellow" className="w-full">
                <i className="fas fa-download mr-2"></i>
                Descargar Respaldo
              </Button>
            </div>

            {/* Restore */}
            <div>
              <h4 className="font-medium mb-3">Restaurar Respaldo</h4>
              <p className="text-sm text-gray-600 mb-4">
                Sube un archivo de respaldo para restaurar los datos del sistema.
              </p>
              <div className="space-y-3">
                <input type="file" accept=".json" onChange={handleFileUpload} className="w-full p-2 border rounded" />
                <Button
                  onClick={() => confirmAction("restore-backup")}
                  variant="outline"
                  className="w-full"
                  disabled={!backupData}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Restaurar Datos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-memory text-2xl text-blue-500 mb-2"></i>
              <p className="font-medium">Almacenamiento Usado</p>
              <p className="text-sm text-gray-600">-- MB</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-calendar text-2xl text-green-500 mb-2"></i>
              <p className="font-medium">Último Acceso</p>
              <p className="text-sm text-gray-600">{new Date().toLocaleDateString("es-ES")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <i className="fas fa-code-branch text-2xl text-purple-500 mb-2"></i>
              <p className="font-medium">Versión</p>
              <p className="text-sm text-gray-600">Zona Garaje v1.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-bold mb-2">Confirmar Acción</h3>
              <p className="text-gray-600 mb-6">
                {showConfirmDialog === "delete-all-sales" && "¿Está seguro de eliminar TODAS las ventas?"}
                {showConfirmDialog === "delete-old-sales" && "¿Eliminar las ventas del período seleccionado?"}
                {showConfirmDialog === "reset-reports" && "¿Reiniciar los datos de reportes?"}
                {showConfirmDialog === "reset-all-data" && "¿ELIMINAR TODOS LOS DATOS del sistema?"}
                {showConfirmDialog === "clean-old-attendance" && "¿Limpiar registros de asistencia antiguos?"}
                {showConfirmDialog === "reset-loyalty" && "¿Reiniciar el sistema de lealtad?"}
                {showConfirmDialog === "optimize-storage" && "¿Optimizar el almacenamiento del sistema?"}
                {showConfirmDialog === "restore-backup" && "¿Restaurar los datos desde el respaldo?"}
                <br />
                <strong className="text-red-600">Esta acción no se puede deshacer.</strong>
              </p>
              <div className="flex space-x-4">
                <Button onClick={() => setShowConfirmDialog(null)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => executeAction(showConfirmDialog)} variant="destructive" className="flex-1">
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}