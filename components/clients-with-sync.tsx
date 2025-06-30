"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { dbSync } from "@/lib/database-sync"

export default function ClientsWithSync() {
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
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced")

  // Estados del formulario (mantener igual que antes)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [cedula, setCedula] = useState("")

  // Estados del vehículo (mantener igual que antes)
  const [plate, setPlate] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [color, setColor] = useState("")
  const [type, setType] = useState("")

  useEffect(() => {
    refreshClients()
  }, [])

  // Función mejorada para cargar datos
  const refreshClients = async () => {
    setIsLoading(true)
    setSyncStatus("syncing")

    try {
      // Cargar datos usando el sistema híbrido
      const clientsData = await dbSync.loadData("clients")
      const vehiclesData = await dbSync.loadData("vehicles")

      setClients(clientsData)
      setVehicles(vehiclesData)
      setSyncStatus("synced")

      toast({
        title: "Datos cargados",
        description: "Clientes y vehículos sincronizados correctamente",
        variant: "default",
      })
    } catch (error) {
      console.error("Error loading clients data:", error)
      setSyncStatus("offline")

  

      toast({
        title: "Modo offline",
        description: "Trabajando con datos locales",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función mejorada para guardar datos
  const saveClientData = async (clientsData: any[], vehiclesData?: any[]) => {
    setSyncStatus("syncing")

    try {
      // Guardar usando el sistema híbrido
      await dbSync.saveData("clients", clientsData)
      if (vehiclesData) {
        await dbSync.saveData("vehicles", vehiclesData)
      }

      setSyncStatus("synced")
    } catch (error) {
      console.error("Error saving client data:", error)
      setSyncStatus("offline")

      toast({
        title: "Guardado localmente",
        description: "Los datos se sincronizarán cuando haya conexión",
        variant: "default",
      })
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
    if (showVehicleForm) {
      setShowVehicleForm(false)
    }
  }

  const resetForm = () => {
    setCurrentClient(null)
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setCedula("")
    setPlate("")
    setMake("")
    setModel("")
    setYear("")
    setColor("")
    setType("")
    setIncludeVehicle(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones (mantener igual que antes)
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
        id: currentClient?.id || Date.now().toString(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || "",
        address: address.trim() || "",
        cedula: cedula.trim(),
        createdAt: currentClient?.createdAt || new Date().toISOString(),
      }

      let updatedClients: any[]
      let updatedVehicles = vehicles
      let successMessage = ""

      if (currentClient) {
        updatedClients = clients.map((c: any) => (c.id === currentClient.id ? clientData : c))
        successMessage = "Cliente actualizado exitosamente"
      } else {
        updatedClients = [...clients, clientData]
        successMessage = "Cliente agregado exitosamente"

        if (includeVehicle && plate && make && model && type) {
          const vehicleData = {
            id: Date.now().toString(),
            clientId: clientData.id,
            plate: plate.toUpperCase().trim(),
            make: make.trim(),
            model: model.trim(),
            year: year.trim() || "",
            color: color.trim() || "",
            type,
            createdAt: new Date().toISOString(),
          }

          updatedVehicles = [...vehicles, vehicleData]
          successMessage = "Cliente y vehículo agregados exitosamente"
        }
      }

      // Guardar usando el sistema híbrido
      await saveClientData(updatedClients, updatedVehicles)

      setClients(updatedClients)
      setVehicles(updatedVehicles)

      toast({
        title: "Éxito",
        description: successMessage,
        variant: "success",
      })

      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error("Error saving client:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el cliente",
        variant: "destructive",
      })
    }
  }

  // Función para sincronización manual
  const forceSyncAll = async () => {
    setSyncStatus("syncing")

    try {
      await dbSync.forceSyncAll()
      setSyncStatus("synced")

      toast({
        title: "Sincronización completa",
        description: "Todos los datos han sido sincronizados con la nube",
        variant: "success",
      })
    } catch (error) {
      setSyncStatus("offline")
      toast({
        title: "Error de sincronización",
        description: "No se pudo sincronizar con la nube",
        variant: "destructive",
      })
    }
  }

  // Resto de funciones (editClient, deleteClient, etc.) mantener igual que antes
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

      if (!confirm("¿Está seguro de eliminar este cliente?")) return

      const updatedClients = clients.filter((c) => c.id !== id)
      await saveClientData(updatedClients)
      setClients(updatedClients)

      toast({
        title: "Eliminado",
        description: "Cliente eliminado exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  // Filtrar clientes (mantener igual que antes)
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true

    const searchTermLower = searchTerm.toLowerCase()
    const clientVehicles = vehicles.filter((v) => v.clientId === client.id)

    const clientMatch =
      client.name.toLowerCase().includes(searchTermLower) ||
      client.phone.toLowerCase().includes(searchTermLower) ||
      (client.cedula && client.cedula.toLowerCase().includes(searchTermLower)) ||
      (client.email && client.email.toLowerCase().includes(searchTermLower))

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

            {/* Indicador de estado de sincronización */}
            <div className="flex items-center space-x-2">
              {syncStatus === "synced" && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm">Sincronizado</span>
                </div>
              )}
              {syncStatus === "syncing" && (
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm">Sincronizando...</span>
                </div>
              )}
              {syncStatus === "offline" && (
                <div className="flex items-center text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                  <span className="text-sm">Modo offline</span>
                </div>
              )}
            </div>

            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentClient ? "Editando cliente" : "Nuevo cliente"}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {/* Botón de sincronización manual */}
            <Button onClick={forceSyncAll} variant="outline" disabled={isLoading || syncStatus === "syncing"}>
              <i className="fas fa-sync mr-2"></i>
              Sincronizar
            </Button>

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
                <i className="fas fa-plus mr-2"></i>Nuevo Cliente
              </Button>
            )}
          </div>
        </div>

        {/* Buscador */}
        {!showForm && (
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

        {/* Formulario (mantener igual que antes) */}
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

                  {/* Resto del formulario igual que antes */}
                </div>

                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                  <div className="flex space-x-3">
                    <Button type="submit" variant="yellow" className="px-6" disabled={isLoading}>
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

        {/* Lista de clientes (mantener igual que antes pero con indicador de carga) */}
        {!showForm && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">
              Lista de Clientes y sus Vehículos ({filteredClients.length})
              {isLoading && <span className="text-sm text-gray-500 ml-2">(Cargando...)</span>}
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando clientes...</p>
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="space-y-4">
                {filteredClients.map((client) => {
                  const clientVehicles = vehicles.filter((v) => v.clientId === client.id)

                  return (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
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

                        <div className="flex flex-wrap gap-2 justify-end lg:col-span-2">
                          <Button onClick={() => editClient(client)} variant="yellow" size="sm" title="Editar cliente">
                            <i className="fas fa-edit"></i>
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
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {clientVehicles.length === 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="text-gray-500 text-sm">
                            <i className="fas fa-car mr-2"></i>
                            Sin vehículos registrados
                          </span>
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
    </div>
  )
}
