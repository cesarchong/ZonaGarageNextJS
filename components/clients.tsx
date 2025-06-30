"use client"

import type React from "react"
import { supabase } from "../lib/supabaseClient"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export default function Clients() {
  const { toast } = useToast()
  const [clients, setClients] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentClient, setCurrentClient] = useState<any>(null)
  const [includeVehicle, setIncludeVehicle] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<any>(null)
  const [clientForVehicle, setClientForVehicle] = useState<any>(null)

  // Agregar después de las líneas existentes de useState
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [selectedClientForPoints, setSelectedClientForPoints] = useState<any>(null)
  const [clientPoints, setClientPoints] = useState<{
    [key: string]: { points: number; totalSpent: number; redemptions: any[] }
  }>({})

  // Cliente form state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [cedula, setCedula] = useState("")

  // Vehículo form state
  const [plate, setPlate] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [color, setColor] = useState("")
  const [type, setType] = useState("")

  useEffect(() => {
    refreshClients()
    calculateClientPoints()
  }, [])

  const refreshClients = async () => {
    try {
      const { data: clientsData, error: clientsError } = await supabase.from("clientes").select("*")
      const { data: vehiclesData, error: vehiclesError } = await supabase.from("vehiculos").select("*")
      if (clientsError) throw clientsError
      if (vehiclesError) throw vehiclesError
      setClients(clientsData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error("Error loading clients data:", error)
      setClients([])
      setVehicles([])
    }
  }

  const calculateClientPoints = async () => {
    try {
      const { data: services, error: servicesError } = await supabase.from("servicios").select("*")
      const { data: sales, error: salesError } = await supabase.from("ventas").select("*")
      const { data: redemptions, error: redemptionsError } = await supabase.from("pointRedemptions").select("*")
      if (servicesError) throw servicesError
      if (salesError) throw salesError
      if (redemptionsError) throw redemptionsError
      const pointsData: { [key: string]: { points: number; totalSpent: number; redemptions: any[] } } = {}
      // Calculate points from services
      services?.forEach((service: any) => {
        if (service.clientId && service.status === "Finalizado") {
          if (!pointsData[service.clientId]) {
            pointsData[service.clientId] = { points: 0, totalSpent: 0, redemptions: [] }
          }
          pointsData[service.clientId].totalSpent += service.total || 0
          pointsData[service.clientId].points += Math.floor((service.total || 0) / 10)
        }
      })
      // Calculate points from sales
      sales?.forEach((sale: any) => {
        if (sale.clientId) {
          if (!pointsData[sale.clientId]) {
            pointsData[sale.clientId] = { points: 0, totalSpent: 0, redemptions: [] }
          }
          pointsData[sale.clientId].totalSpent += sale.total || 0
          pointsData[sale.clientId].points += Math.floor((sale.total || 0) / 10)
        }
      })
      // Subtract redeemed points
      redemptions?.forEach((redemption: any) => {
        if (pointsData[redemption.clientId]) {
          pointsData[redemption.clientId].points -= redemption.pointsUsed
          pointsData[redemption.clientId].redemptions.push(redemption)
        }
      })
      setClientPoints(pointsData)
    } catch (error) {
      setClientPoints({})
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
    // Cerrar el formulario de vehículo si está abierto
    if (showVehicleForm) {
      setShowVehicleForm(false)
    }
  }

  const toggleVehicleForm = (client?: any) => {
    setShowVehicleForm(!showVehicleForm)
    if (!showVehicleForm && client) {
      setClientForVehicle(client)
      resetVehicleForm()
    } else {
      setClientForVehicle(null)
    }
    // Cerrar el formulario de cliente si está abierto
    if (showForm) {
      setShowForm(false)
    }
  }

  const resetForm = () => {
    // Reset client form
    setCurrentClient(null)
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setCedula("")

    // Reset vehicle form
    setPlate("")
    setMake("")
    setModel("")
    setYear("")
    setColor("")
    setType("")

    // Default to include vehicle
    setIncludeVehicle(true)
  }

  const resetVehicleForm = () => {
    setCurrentVehicle(null)
    setPlate("")
    setMake("")
    setModel("")
    setYear("")
    setColor("")
    setType("")
  }

  // --- NUEVO: Guardar y actualizar clientes SOLO en Supabase ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones mejoradas
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "El teléfono del cliente es obligatorio",
        variant: "destructive",
      })
      return
    }
    if (!cedula.trim()) {
      toast({
        title: "Error",
        description: "La cédula del cliente es obligatoria",
        variant: "destructive",
      })
      return
    }
    const cedulaRegex = /^[VE]-\d{7,8}$/
    if (!cedulaRegex.test(cedula.trim().toUpperCase())) {
      toast({
        title: "Error",
        description: "La cédula debe tener el formato V-12345678 o E-12345678",
        variant: "destructive",
      })
      return
    }
    try {
      const clientData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "",
        address: address.trim() || "",
        cedula: cedula.trim(),
      }
      let successMessage = ""
      if (currentClient) {
        const { error } = await supabase.from("clientes").update(clientData).eq("id", currentClient.id)
        if (error) throw error
        successMessage = "Cliente actualizado exitosamente"
      } else {
        const { data, error } = await supabase.from("clientes").insert([clientData]).select()
        if (error) throw error
        successMessage = "Cliente agregado exitosamente"
        // Si se incluye vehículo, agregarlo también
        if (includeVehicle && plate && make && model && type && data && data[0]) {
          const vehicleData = {
            clientId: data[0].id,
            plate: plate.toUpperCase().trim(),
            make: make.trim(),
            model: model.trim(),
            year: year.trim() || "",
            color: color.trim() || "",
            type,
          }
          const { error: vehicleError } = await supabase.from("vehiculos").insert([vehicleData])
          if (vehicleError) throw vehicleError
          successMessage = "Cliente y vehículo agregados exitosamente"
        }
      }
      toast({
        title: "Éxito",
        description: successMessage,
        variant: "success",
      })
      resetForm()
      setShowForm(false)
      refreshClients()
    } catch (error: any) {
      console.error("Error saving client:", error?.message || JSON.stringify(error) || error)
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "Ocurrió un error al guardar el cliente",
        variant: "destructive",
      })
    }
  }

  // --- NUEVO: Guardar y actualizar vehículos SOLO en Supabase ---
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForVehicle) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un cliente",
        variant: "destructive",
      })
      return
    }
    if (!plate.trim()) {
      toast({
        title: "Error",
        description: "La placa del vehículo es obligatoria",
        variant: "destructive",
      })
      return
    }
    if (!make.trim()) {
      toast({
        title: "Error",
        description: "La marca del vehículo es obligatoria",
        variant: "destructive",
      })
      return
    }
    if (!model.trim()) {
      toast({
        title: "Error",
        description: "El modelo del vehículo es obligatorio",
        variant: "destructive",
      })
      return
    }
    if (!type) {
      toast({
        title: "Error",
        description: "El tipo de vehículo es obligatorio",
        variant: "destructive",
      })
      return
    }
    try {
      const vehicleData = {
        clientId: clientForVehicle.id,
        plate: plate.toUpperCase().trim(),
        make: make.trim(),
        model: model.trim(),
        year: year.trim() || "",
        color: color.trim() || "",
        type,
      }
      let successMessage = ""
      if (currentVehicle) {
        const { error } = await supabase.from("vehiculos").update(vehicleData).eq("id", currentVehicle.id)
        if (error) throw error
        successMessage = "Vehículo actualizado exitosamente"
      } else {
        const { error } = await supabase.from("vehiculos").insert([vehicleData])
        if (error) throw error
        successMessage = "Vehículo agregado exitosamente"
      }
      toast({
        title: "Éxito",
        description: successMessage,
        variant: "success",
      })
      resetVehicleForm()
      setShowVehicleForm(false)
      refreshClients()
    } catch (error: any) {
      console.error("Error saving vehicle:", error?.message || JSON.stringify(error) || error)
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "Ocurrió un error al guardar el vehículo",
        variant: "destructive",
      })
    }
  }
  // Función para editar cliente (necesaria para el botón de editar)
const editClient = (client: any) => {
  setCurrentClient(client)
  setName(client.name)
  setPhone(client.phone)
  setEmail(client.email || "")
  setAddress(client.address || "")
  setCedula(client.cedula || "")
  setIncludeVehicle(false)
  setShowForm(true)
}

// Función para editar vehículo (necesaria para el botón de editar)
const editVehicle = (vehicle: any) => {
  const client = clients.find((c) => c.id === vehicle.clientId)
  if (!client) return
  setCurrentVehicle(vehicle)
  setClientForVehicle(client)
  setPlate(vehicle.plate)
  setMake(vehicle.make)
  setModel(vehicle.model)
  setYear(vehicle.year || "")
  setColor(vehicle.color || "")
  setType(vehicle.type)
  setShowVehicleForm(true)
}

  // --- NUEVO: Eliminar cliente SOLO en Supabase ---
  const deleteClient = async (id: string) => {
    try {
      const clientVehicles = vehicles.filter((v) => v.clientId === id)
      if (clientVehicles.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar el cliente porque tiene vehículos registrados",
          variant: "destructive",
        })
        return
      }
      const { data: services } = await supabase.from("servicios").select("*").eq("clientId", id)
      if (services && services.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar el cliente porque tiene servicios registrados",
          variant: "destructive",
        })
        return
      }
      if (!confirm("¿Está seguro de eliminar este cliente?")) return
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) throw error
      toast({
        title: "Eliminado",
        description: "Cliente eliminado exitosamente",
        variant: "success",
      })
      refreshClients()
    } catch (error: any) {
      console.error("Error deleting client:", error?.message || JSON.stringify(error) || error)
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "Ocurrió un error al eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  // --- NUEVO: Eliminar vehículo SOLO en Supabase ---
  const deleteVehicle = async (id: string) => {
    try {
      const { data: services } = await supabase.from("servicios").select("*").eq("vehicleId", id)
      if (services && services.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar el vehículo porque tiene servicios registrados",
          variant: "destructive",
        })
        return
      }
      if (!confirm("¿Está seguro de eliminar este vehículo?")) return
      const { error } = await supabase.from("vehiculos").delete().eq("id", id)
      if (error) throw error
      toast({
        title: "Eliminado",
        description: "Vehículo eliminado exitosamente",
        variant: "success",
      })
      refreshClients()
    } catch (error: any) {
      console.error("Error deleting vehicle:", error?.message || JSON.stringify(error) || error)
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "Ocurrió un error al eliminar el vehículo",
        variant: "destructive",
      })
    }
  }

  // --- NUEVO: Canje de puntos SOLO en Supabase ---
  const redeemPoints = async (clientId: string) => {
    try {
      const client = clients.find((c) => c.id === clientId)
      if (!client) return
      const currentPoints = clientPoints[clientId]?.points || 0
      if (currentPoints < 20) {
        toast({
          title: "Puntos insuficientes",
          description: `${client.name} tiene ${currentPoints} puntos. Necesita 20 para canjear.`,
          variant: "destructive",
        })
        return
      }
      const redemption = {
        clientId,
        clientName: client.name,
        pointsUsed: 20,
        reward: "Lavado Gratis",
        createdAt: new Date().toISOString(),
        status: "Disponible",
      }
      const { error } = await supabase.from("pointRedemptions").insert([redemption])
      if (error) throw error
      toast({
        title: "¡Canje exitoso!",
        description: `${client.name} ha canjeado 20 puntos por un lavado gratis`,
        variant: "success",
      })
      calculateClientPoints()
      setShowPointsModal(false)
    } catch (error: any) {
      console.error("Error redeeming points:", error?.message || JSON.stringify(error) || error)
      toast({
        title: "Error",
        description: error?.message || JSON.stringify(error) || "Ocurrió un error al canjear los puntos",
        variant: "destructive",
      })
    }
  }

  const viewClientPoints = (client: any) => {
    setSelectedClientForPoints(client)
    setShowPointsModal(true)
  }

  // Filtrar clientes según el término de búsqueda
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true

    const searchTermLower = searchTerm.toLowerCase()
    const clientVehicles = vehicles.filter((v) => v.clientId === client.id)

    // Buscar en datos del cliente
    const clientMatch =
      client.name.toLowerCase().includes(searchTermLower) ||
      client.phone.toLowerCase().includes(searchTermLower) ||
      (client.cedula && client.cedula.toLowerCase().includes(searchTermLower)) ||
      (client.email && client.email.toLowerCase().includes(searchTermLower))

    // Buscar en vehículos del cliente
    const vehicleMatch = clientVehicles.some(
      (v) =>
        v.plate.toLowerCase().includes(searchTermLower) ||
        v.make.toLowerCase().includes(searchTermLower) ||
        v.model.toLowerCase().includes(searchTermLower) ||
        (v.color && v.color.toLowerCase().includes(searchTermLower)),
    )

    return clientMatch || vehicleMatch
  })

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Clientes y Vehículos</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentClient ? "Editando cliente" : "Nuevo cliente"}</span>
              </div>
            )}
            {showVehicleForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>
                  {currentVehicle ? "Editando vehículo" : "Nuevo vehículo"} para {clientForVehicle?.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {showForm || showVehicleForm ? (
              <>
                <Button onClick={showForm ? toggleForm : toggleVehicleForm} variant="outline">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
                <Button onClick={showForm ? toggleForm : toggleVehicleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={toggleForm} variant="yellow">
                  <i className="fas fa-plus mr-2"></i>Nuevo Cliente
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Buscador */}
        {!showForm && !showVehicleForm && (
          <div className="mb-6">
            <div className="form-group">
              <label htmlFor="searchTerm">Buscar Clientes</label>
              <input
                type="text"
                id="searchTerm"
                placeholder="Buscar por nombre, teléfono, placa, marca o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-6 form-container">
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="bg-gradient-to-r from-yellow-50 to-white p-4 border-b border-gray-100 rounded-t-lg">
                <h3 className="text-xl font-bold text-gray-800">
                  {currentClient ? "Editar Cliente" : "Nuevo Cliente"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Complete los datos del cliente en el formulario a continuación
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                      <i className="fas fa-user-circle mr-2 text-yellow-500"></i>
                      Información Personal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label htmlFor="clientName" className="font-medium text-gray-700">
                          Nombre Completo*
                        </label>
                        <input
                          type="text"
                          id="clientName"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="Nombre y apellidos"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="clientCedula" className="font-medium text-gray-700">
                          Cédula*
                        </label>
                        <input
                          type="text"
                          id="clientCedula"
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value.toUpperCase())}
                          required
                          className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="V-12345678 o E-12345678"
                          maxLength={10}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="clientPhone" className="font-medium text-gray-700">
                          Teléfono*
                        </label>
                        <input
                          type="tel"
                          id="clientPhone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="Número de contacto"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="clientEmail" className="font-medium text-gray-700">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="clientEmail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="ejemplo@correo.com"
                        />
                      </div>

                      <div className="form-group md:col-span-2 lg:col-span-3">
                        <label htmlFor="clientAddress" className="font-medium text-gray-700">
                          Dirección
                        </label>
                        <input
                          type="text"
                          id="clientAddress"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="Dirección completa"
                        />
                      </div>
                    </div>
                  </div>

                  {!currentClient && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-700 flex items-center">
                          <i className="fas fa-car mr-2 text-yellow-500"></i>
                          Información del Vehículo
                        </h4>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeVehicle"
                            checked={includeVehicle}
                            onChange={(e) => setIncludeVehicle(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                          />
                          <label htmlFor="includeVehicle" className="ml-2 text-sm text-gray-700">
                            Incluir vehículo
                          </label>
                        </div>
                      </div>

                      {includeVehicle && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="form-group">
                            <label htmlFor="vehiclePlate" className="font-medium text-gray-700">
                              Placa*
                            </label>
                            <input
                              type="text"
                              id="vehiclePlate"
                              value={plate}
                              onChange={(e) => setPlate(e.target.value)}
                              required={includeVehicle}
                              className="mt-1 uppercase focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="ABC123"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="vehicleMake" className="font-medium text-gray-700">
                              Marca*
                            </label>
                            <input
                              type="text"
                              id="vehicleMake"
                              value={make}
                              onChange={(e) => setMake(e.target.value)}
                              required={includeVehicle}
                              className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="Toyota, Honda, etc."
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="vehicleModel" className="font-medium text-gray-700">
                              Modelo*
                            </label>
                            <input
                              type="text"
                              id="vehicleModel"
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              required={includeVehicle}
                              className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="Corolla, Civic, etc."
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="vehicleYear" className="font-medium text-gray-700">
                              Año
                            </label>
                            <input
                              type="number"
                              id="vehicleYear"
                              min="1900"
                              max="2099"
                              value={year}
                              onChange={(e) => setYear(e.target.value)}
                              className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="2023"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="vehicleColor" className="font-medium text-gray-700">
                              Color
                            </label>
                            <input
                              type="text"
                              id="vehicleColor"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="Blanco, Negro, etc."
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="vehicleType" className="font-medium text-gray-700">
                              Tipo*
                            </label>
                            <select
                              id="vehicleType"
                              value={type}
                              onChange={(e) => setType(e.target.value)}
                              required={includeVehicle}
                              className="mt-1 focus:ring-yellow-500 focus:border-yellow-500"
                            >
                              <option value="">Seleccione...</option>
                              <option value="Automóvil">Automóvil</option>
                              <option value="Camioneta">Camioneta</option>
                              <option value="Motocicleta">Motocicleta</option>
                              <option value="Camión">Camión</option>
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                  <div className="flex space-x-3">
                    <Button type="submit" variant="yellow" className="px-6">
                      <i className="fas fa-save mr-2"></i>
                      {currentClient ? "Actualizar Cliente" : "Guardar"}
                    </Button>
                    <Button type="button" onClick={toggleForm} variant="outline" className="border-gray-300">
                      <i className="fas fa-arrow-left mr-2"></i>Volver
                    </Button>
                  </div>
                  <Button type="button" onClick={toggleForm} variant="destructive" size="sm">
                    <i className="fas fa-times mr-2"></i>Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showVehicleForm && (
          <div className="mb-6 form-container">
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-gray-100 rounded-t-lg">
                <h3 className="text-xl font-bold text-gray-800">
                  {currentVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {clientForVehicle
                    ? `Para el cliente: ${clientForVehicle.name}`
                    : "Seleccione un cliente para continuar"}
                </p>
              </div>

              <form onSubmit={handleVehicleSubmit} className="p-6">
                {!clientForVehicle ? (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                    <i className="fas fa-exclamation-circle text-yellow-500 text-xl mb-2"></i>
                    <p className="text-sm text-yellow-700">
                      Seleccione un cliente de la lista para agregar un vehículo, o use el botón "Agregar Vehículo"
                      junto a un cliente específico.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                      <div className="flex items-center">
                        <i className="fas fa-user-circle text-blue-500 text-xl mr-3"></i>
                        <div>
                          <h5 className="font-medium text-gray-800">Cliente seleccionado</h5>
                          <p className="text-sm text-gray-600">{clientForVehicle.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                        <i className="fas fa-car mr-2 text-blue-500"></i>
                        Datos del Vehículo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label htmlFor="vehiclePlate" className="font-medium text-gray-700">
                            Placa*
                          </label>
                          <input
                            type="text"
                            id="vehiclePlate"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                            required
                            className="mt-1 uppercase focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ABC123"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="vehicleMake" className="font-medium text-gray-700">
                            Marca*
                          </label>
                          <input
                            type="text"
                            id="vehicleMake"
                            value={make}
                            onChange={(e) => setMake(e.target.value)}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Toyota, Honda, etc."
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="vehicleModel" className="font-medium text-gray-700">
                            Modelo*
                          </label>
                          <input
                            type="text"
                            id="vehicleModel"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Corolla, Civic, etc."
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="vehicleYear" className="font-medium text-gray-700">
                            Año
                          </label>
                          <input
                            type="number"
                            id="vehicleYear"
                            min="1900"
                            max="2099"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="2023"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="vehicleColor" className="font-medium text-gray-700">
                            Color
                          </label>
                          <input
                            type="text"
                            id="vehicleColor"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Blanco, Negro, etc."
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="vehicleType" className="font-medium text-gray-700">
                            Tipo*
                          </label>
                          <select
                            id="vehicleType"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccione...</option>
                            <option value="Automóvil">Automóvil</option>
                            <option value="Camioneta">Camioneta</option>
                            <option value="Motocicleta">Motocicleta</option>
                            <option value="Camión">Camión</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                      <div className="flex space-x-3">
                        <Button type="submit" variant="yellow" className="px-6">
                          <i className="fas fa-save mr-2"></i>
                          {currentVehicle ? "Actualizar Vehículo" : "Guardar Vehículo"}
                        </Button>
                        <Button type="button" onClick={toggleVehicleForm} variant="outline" className="border-gray-300">
                          <i className="fas fa-arrow-left mr-2"></i>Volver
                        </Button>
                      </div>
                      <Button type="button" onClick={toggleVehicleForm} variant="destructive" size="sm">
                        <i className="fas fa-times mr-2"></i>Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Lista de clientes organizada */}
        {!showForm && !showVehicleForm && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">Lista de Clientes y sus Vehículos ({filteredClients.length})</h3>

            {filteredClients.length > 0 ? (
              <div className="space-y-4">
                {filteredClients.map((client) => {
                  const clientVehicles = vehicles.filter((v) => v.clientId === client.id)
                  const points = clientPoints[client.id]?.points || 0
                  const totalSpent = clientPoints[client.id]?.totalSpent || 0

                  return (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Información del cliente */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                        {/* Datos del cliente */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-lg text-gray-800">{client.name}</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                {client.cedula && (
                                  <div className="flex items-center">
                                    <i className="fas fa-id-card text-gray-400 mr-2 w-4"></i>
                                    <span>{client.cedula}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <i className="fas fa-phone text-gray-400 mr-2 w-4"></i>
                                  <span>{client.phone}</span>
                                </div>
                                {client.email && (
                                  <div className="flex items-center">
                                    <i className="fas fa-envelope text-gray-400 mr-2 w-4"></i>
                                    <span>{client.email}</span>
                                  </div>
                                )}
                                {client.address && (
                                  <div className="flex items-center">
                                    <i className="fas fa-map-marker-alt text-gray-400 mr-2 w-4"></i>
                                    <span className="text-xs">{client.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Puntos de fidelidad */}
                        <div className="text-center bg-white rounded-lg p-3 border">
                          <div className="text-sm text-gray-600 mb-1">Puntos de Fidelidad</div>
                          <div className={`text-2xl font-bold ${points >= 20 ? "text-green-600" : "text-yellow-600"}`}>
                            <i className="fas fa-star mr-1"></i>
                            {points}
                          </div>
                          <div className="text-xs text-gray-500">${totalSpent.toFixed(2)} gastados</div>
                          {points >= 20 && (
                            <div className="text-xs text-green-600 font-medium mt-1">¡Canje disponible!</div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            onClick={() => viewClientPoints(client)}
                            variant="default"
                            size="sm"
                            title="Ver puntos"
                          >
                            <i className="fas fa-star"></i>
                          </Button>
                          <Button onClick={() => editClient(client)} variant="yellow" size="sm" title="Editar cliente">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            onClick={() => toggleVehicleForm(client)}
                            variant="outline"
                            size="sm"
                            title="Añadir vehículo"
                          >
                            <i className="fas fa-car"></i>
                          </Button>
                          <Button
                            onClick={() => deleteClient(client.id)}
                            variant="destructive"
                            size="sm"
                            title="Eliminar cliente"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>

                      {/* Vehículos del cliente */}
                      {clientVehicles.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-700 flex items-center">
                              <i className="fas fa-car mr-2"></i>
                              Vehículos ({clientVehicles.length})
                            </h5>
                            <Button onClick={() => toggleVehicleForm(client)} variant="outline" size="sm">
                              <i className="fas fa-plus mr-1"></i>Añadir
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {clientVehicles.map((vehicle) => (
                              <div
                                key={vehicle.id}
                                className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">{vehicle.plate}</div>
                                    <div className="text-sm text-gray-600">
                                      {vehicle.make} {vehicle.model}
                                      {vehicle.year && ` (${vehicle.year})`}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">{vehicle.type}</span>
                                      {vehicle.color && <span className="text-gray-400">{vehicle.color}</span>}
                                    </div>
                                  </div>
                                  <div className="flex space-x-1 ml-2">
                                    <Button
                                      onClick={() => editVehicle(vehicle)}
                                      variant="outline"
                                      size="sm"
                                      title="Editar vehículo"
                                    >
                                      <i className="fas fa-edit text-xs"></i>
                                    </Button>
                                    <Button
                                      onClick={() => deleteVehicle(vehicle.id)}
                                      variant="destructive"
                                      size="sm"
                                      title="Eliminar vehículo"
                                    >
                                      <i className="fas fa-trash text-xs"></i>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mensaje cuando no hay vehículos */}
                      {clientVehicles.length === 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">
                              <i className="fas fa-car mr-2"></i>
                              Sin vehículos registrados
                            </span>
                            <Button onClick={() => toggleVehicleForm(client)} variant="outline" size="sm">
                              <i className="fas fa-plus mr-1"></i>Añadir Vehículo
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
                <p className="text-lg font-medium mb-2">
                  {searchTerm ? "No se encontraron resultados" : "No hay clientes registrados"}
                </p>
                <p className="text-sm">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primer cliente"}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Points Modal */}
      {showPointsModal && selectedClientForPoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Sistema de Puntos</h3>
              <Button onClick={() => setShowPointsModal(false)} variant="outline" size="sm">
                <i className="fas fa-times"></i>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-bold text-lg">{selectedClientForPoints.name}</h4>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-yellow-600">
                    {clientPoints[selectedClientForPoints.id]?.points || 0}
                  </div>
                  <div className="text-sm text-gray-600">Puntos Acumulados</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">Información de Puntos</h5>
                <div className="text-sm space-y-1">
                  <p>• Cada $10 en servicios = 1 punto</p>
                  <p>• 20 puntos = 1 lavado gratis</p>
                  <p>• Total gastado: ${(clientPoints[selectedClientForPoints.id]?.totalSpent || 0).toFixed(2)}</p>
                </div>
              </div>

              {(clientPoints[selectedClientForPoints.id]?.points || 0) >= 20 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-green-800">¡Canje Disponible!</h5>
                      <p className="text-sm text-green-600">Puede canjear 20 puntos por un lavado gratis</p>
                    </div>
                    <Button
                      onClick={() => redeemPoints(selectedClientForPoints.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <i className="fas fa-gift mr-2"></i>
                      Canjear
                    </Button>
                  </div>
                </div>
              )}

              {/* Redemption History */}
              {clientPoints[selectedClientForPoints.id]?.redemptions?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Historial de Canjes</h5>
                  <div className="space-y-2">
                    {clientPoints[selectedClientForPoints.id].redemptions.map((redemption: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{redemption.reward}</span>
                        <span className="text-gray-600">{new Date(redemption.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button onClick={() => setShowPointsModal(false)} variant="outline">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
