"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function Vehicles() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<any>(null)

  // Form state
  const [clientId, setClientId] = useState("")
  const [plate, setPlate] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [color, setColor] = useState("")
  const [type, setType] = useState("")

  // Loading state
  const [loading, setLoading] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)

  useEffect(() => {
    refreshVehicles()
  }, [])

  const refreshVehicles = () => {
    const vehiclesData = JSON.parse(localStorage.getItem("vehicles") || "[]")
    const clientsData = JSON.parse(localStorage.getItem("clients") || "[]")
    setVehicles(vehiclesData)
    setClients(clientsData)
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      // Reset form when opening
      setCurrentVehicle(null)
      setClientId("")
      setPlate("")
      setMake("")
      setModel("")
      setYear("")
      setColor("")
      setType("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const vehicleData = {
        id: currentVehicle?.id || Date.now().toString(),
        clientId,
        plate: plate.toUpperCase(),
        make,
        model,
        year: year || "",
        color: color || "",
        type,
        createdAt: currentVehicle?.createdAt || new Date().toISOString(),
      }

      // Get existing vehicles
      const vehiclesData = JSON.parse(localStorage.getItem("vehicles") || "[]")

      if (currentVehicle) {
        // Update existing vehicle
        const index = vehiclesData.findIndex((v: any) => v.id === currentVehicle.id)
        if (index !== -1) {
          vehiclesData[index] = vehicleData
          toast({
            title: "Actualizado",
            description: "Vehículo actualizado exitosamente",
            variant: "success",
          })
        }
      } else {
        // Add new vehicle
        vehiclesData.push(vehicleData)
        toast({
          title: "Agregado",
          description: "Vehículo agregado exitosamente",
          variant: "success",
        })
      }

      // Save back to localStorage
      localStorage.setItem("vehicles", JSON.stringify(vehiclesData))

      // Reset form and refresh
      toggleForm()
      refreshVehicles()
      setLoading(false)
    }, 600)
  }

  const editVehicle = (vehicle: any) => {
    setCurrentVehicle(vehicle)
    setClientId(vehicle.clientId)
    setPlate(vehicle.plate)
    setMake(vehicle.make)
    setModel(vehicle.model)
    setYear(vehicle.year || "")
    setColor(vehicle.color || "")
    setType(vehicle.type)
    setShowForm(true)
  }

  const handleDeleteVehicle = (id: string) => {
    // Check if vehicle has services
    const services = JSON.parse(localStorage.getItem("services") || "[]")
    const vehicleServices = services.filter((s: any) => s.vehicleId === id)

    if (vehicleServices.length > 0) {
      toast({
        title: "Error",
        description: "No se puede eliminar el vehículo porque tiene servicios registrados",
        variant: "destructive",
      })
      setDeleteDialogOpen(false)
      setDeleteVehicleId(null)
      return
    }

    // Delete vehicle
    const vehiclesData = vehicles.filter((v) => v.id !== id)
    localStorage.setItem("vehicles", JSON.stringify(vehiclesData))

    toast({
      title: "Eliminado",
      description: "Vehículo eliminado exitosamente",
      variant: "success",
    })

    refreshVehicles()
    setDeleteDialogOpen(false)
    setDeleteVehicleId(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-3 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Vehículos</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentVehicle ? "Editando vehículo" : "Nuevo vehículo"}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {showForm ? (
              <>
                <Button onClick={toggleForm} variant="outline">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
                <Button onClick={toggleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={toggleForm} variant="yellow">
                <i className="fas fa-plus mr-2"></i>Registrar Vehículo
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="vehicleClient" className="block mb-1">
                  Cliente
                </label>
                <select
                  id="vehicleClient"
                  className="w-full p-2 border rounded"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="vehiclePlate" className="block mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  id="vehiclePlate"
                  className="w-full p-2 border rounded"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleMake" className="block mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  id="vehicleMake"
                  className="w-full p-2 border rounded"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleModel" className="block mb-1">
                  Modelo*
                </label>
                <input
                  type="text"
                  id="vehicleModel"
                  className="w-full p-2 border rounded"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleYear" className="block mb-1">
                  Año
                </label>
                <input
                  type="number"
                  id="vehicleYear"
                  className="w-full p-2 border rounded"
                  min="1900"
                  max="2099"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleColor" className="block mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="vehicleColor"
                  className="w-full p-2 border rounded"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleType" className="block mb-1">
                  Tipo
                </label>
                <select
                  id="vehicleType"
                  className="w-full p-2 border rounded"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="Automóvil">Automóvil</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Motocicleta">Motocicleta</option>
                  <option value="Camión">Camión</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group flex justify-between">
                <div className="flex space-x-4">
                  <Button type="submit" variant="yellow" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</span>
                    ) : (
                      <><i className="fas fa-save mr-2"></i>{currentVehicle ? "Actualizar" : "Guardar"}</>
                    )}
                  </Button>
                  <Button type="button" onClick={toggleForm} variant="outline">
                    <i className="fas fa-arrow-left mr-2"></i>Volver a la Lista
                  </Button>
                </div>
                <Button type="button" onClick={toggleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Salir
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Lista de Vehículos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Placa</th>
                  <th className="py-2 px-4 border">Marca/Modelo</th>
                  <th className="py-2 px-4 border">Cliente</th>
                  <th className="py-2 px-4 border">Tipo</th>
                  <th className="py-2 px-4 border">Año/Color</th>
                  <th className="py-2 px-4 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => {
                    const client = clients.find((c) => c.id === vehicle.clientId) || { name: "No encontrado" }

                    return (
                      <tr key={vehicle.id}>
                        <td className="py-2 px-4 border">{vehicle.plate}</td>
                        <td className="py-2 px-4 border">
                          {vehicle.make} {vehicle.model}
                        </td>
                        <td className="py-2 px-4 border">{client.name}</td>
                        <td className="py-2 px-4 border">{vehicle.type}</td>
                        <td className="py-2 px-4 border">
                          {vehicle.year || "-"} / {vehicle.color || "-"}
                        </td>
                        <td className="py-2 px-4 border">
                          <Button onClick={() => editVehicle(vehicle)} variant="yellow" size="sm" className="mr-1">
                            <i className="fas fa-edit mr-1"></i>Editar
                          </Button>
                          <Button onClick={() => { setDeleteVehicleId(vehicle.id); setDeleteDialogOpen(true) }} variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />Eliminar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No hay vehículos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog de confirmación de borrado */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro de eliminar este vehículo?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El vehículo será eliminado permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => deleteVehicleId && handleDeleteVehicle(deleteVehicleId)}
              >
                Eliminar
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
