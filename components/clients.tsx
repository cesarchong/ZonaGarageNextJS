"use client"

import type React from "react"

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "../lib/firebase"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { showToast } from "nextjs-toast-notify"
import { useEffect, useState } from "react"

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
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

  // --- Manejo de clase dialog-open en el body para ocultar la barra flotante ---
  useEffect(() => {
    if (formDialogOpen || showVehicleForm || showPointsModal) {
      document.body.classList.add("dialog-open");
    } else {
      document.body.classList.remove("dialog-open");
    }
    // Limpieza por si el componente se desmonta con un dialog abierto
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, [formDialogOpen, showVehicleForm, showPointsModal]);

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
  const [seatType, setSeatType] = useState("")


  useEffect(() => {
    refreshClients()
    calculateClientPoints()
    fetchCategories()
  }, [])

  // Cargar categorías de Firebase
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categorias"))
      setCategories(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error: any) {
      setCategories([])
      showToast.error("Error al cargar categorías: " + (error?.message || "No se pudieron cargar las categorías."), {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  // CRUD Firebase
  const refreshClients = async () => {
    try {
      const clientsSnap = await getDocs(collection(db, "clientes"))
      setClients(clientsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      const vehiclesSnap = await getDocs(collection(db, "vehiculos"))
      setVehicles(vehiclesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    } catch (error: any) {
      setClients([])
      setVehicles([])
      showToast.error("Error al cargar clientes/vehículos: " + (error?.message || "No se pudieron cargar los datos."), {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  const calculateClientPoints = async () => {
    try {
      const servicesSnap = await getDocs(collection(db, "servicios"))
      const salesSnap = await getDocs(collection(db, "ventas"))
      const redemptionsSnap = await getDocs(collection(db, "pointRedemptions"))
      const services = servicesSnap.docs.map((doc) => doc.data())
      const sales = salesSnap.docs.map((doc) => doc.data())
      const redemptions = redemptionsSnap.docs.map((doc) => doc.data())
      const pointsData: { [key: string]: { points: number; totalSpent: number; redemptions: any[] } } = {}
      services?.forEach((service: any) => {
        if (service.clientId && service.status === "Finalizado") {
          if (!pointsData[service.clientId]) {
            pointsData[service.clientId] = { points: 0, totalSpent: 0, redemptions: [] }
          }
          pointsData[service.clientId].totalSpent += service.total || 0
          pointsData[service.clientId].points += Math.floor((service.total || 0) / 10)
        }
      })
      sales?.forEach((sale: any) => {
        if (sale.clientId) {
          if (!pointsData[sale.clientId]) {
            pointsData[sale.clientId] = { points: 0, totalSpent: 0, redemptions: [] }
          }
          pointsData[sale.clientId].totalSpent += sale.total || 0
          pointsData[sale.clientId].points += Math.floor((sale.total || 0) / 10)
        }
      })
      redemptions?.forEach((redemption: any) => {
        if (pointsData[redemption.clientId]) {
          pointsData[redemption.clientId].points -= redemption.pointsUsed
          pointsData[redemption.clientId].redemptions.push(redemption)
        }
      })
      setClientPoints(pointsData)
    } catch (error: any) {
      setClientPoints({})
      showToast.error("Error al calcular puntos: " + (error?.message || "No se pudieron calcular los puntos de fidelidad."), {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    setFormDialogOpen(!showForm ? true : false)
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
    setSeatType("")

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
    setSeatType("")
  }

  // --- NUEVO: Guardar y actualizar clientes SOLO en Firebase ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast.error("El nombre del cliente es obligatorio", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!phone.trim()) {
      showToast.error("El teléfono del cliente es obligatorio", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!cedula.trim()) {
      showToast.error("La cédula del cliente es obligatoria", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    // Validar que no exista otra cédula igual (excepto si es el mismo cliente en edición)
    const cedulaTrim = cedula.trim()
    const cedulaDuplicada = clients.some(
      (c) => c.cedula === cedulaTrim && (!currentClient || c.id !== currentClient.id)
    )
    if (cedulaDuplicada) {
      showToast.error("Ya existe un cliente registrado con esa cédula", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    try {
      // Usar la interfaz Clientes para guardar los campos correctos
      const clientData = {
        cedula: cedulaTrim,
        nombre: name.trim(),
        telefono: phone.trim(),
        email: email.trim() || "",
        direccion: address.trim() || "",
        activo: true,
        fecha_registro: new Date().toISOString(),
      }
      let successMessage = ""
      if (currentClient) {
        const clientRef = doc(db, "clientes", currentClient.id)
        await updateDoc(clientRef, clientData)
        successMessage = "Cliente actualizado exitosamente"
      } else {
        const clientRef = await addDoc(collection(db, "clientes"), clientData)
        successMessage = "Cliente agregado exitosamente"
        // Si se incluye vehículo, agregarlo también
        if (includeVehicle && plate && make && model && type) {
          // Usar la interfaz Vehiculos para guardar los campos correctos
          const vehicleData = {
            placa: plate.toUpperCase().trim(),
            marca: make.trim(),
            modelo: model.trim(),
            anio: year ? parseInt(year) : 0,
            color: color.trim() || "",
            tipo: type,
            tipo_asiento: seatType.trim() || "", // Nuevo campo opcional
            id_cliente: clientRef.id,
          }
          await addDoc(collection(db, "vehiculos"), vehicleData)
          successMessage = "Cliente y vehículo agregados exitosamente"
        }
      }
      showToast.success(successMessage, {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      resetForm()
      setShowForm(false)
      setFormDialogOpen(false)
      refreshClients()
    } catch (error: any) {
      console.error("Error saving client:", error?.message || JSON.stringify(error) || error)
      showToast.error(error?.message || "Ocurrió un error al guardar el cliente", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  // --- NUEVO: Guardar y actualizar vehículos SOLO en Firebase ---
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForVehicle) {
      showToast.error("No se ha seleccionado un cliente", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!plate.trim()) {
      showToast.error("La placa del vehículo es obligatoria", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    // Validar que no exista otra placa igual (excepto si es el mismo vehículo en edición)
    const plateTrim = plate.toUpperCase().trim()
    const placaDuplicada = vehicles.some(
      (v) => v.plate === plateTrim && (!currentVehicle || v.id !== currentVehicle.id)
    )
    if (placaDuplicada) {
      showToast.error("Ya existe un vehículo registrado con esa placa", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!make.trim()) {
      showToast.error("La marca del vehículo es obligatoria", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!model.trim()) {
      showToast.error("El modelo del vehículo es obligatorio", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    if (!type) {
      showToast.error("El tipo de vehículo es obligatorio", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      return
    }
    try {
      // Usar la interfaz Vehiculos para guardar los campos correctos
      const vehicleData = {
        placa: plateTrim,
        marca: make.trim(),
        modelo: model.trim(),
        anio: year ? parseInt(year) : 0,
        color: color.trim() || "",
        tipo: type,
        tipo_asiento: seatType.trim() || "",
        id_cliente: clientForVehicle.id,
      }
      let successMessage = ""
      if (currentVehicle) {
        const vehicleRef = doc(db, "vehiculos", currentVehicle.id)
        await updateDoc(vehicleRef, vehicleData)
        successMessage = "Vehículo actualizado exitosamente"
      } else {
        await addDoc(collection(db, "vehiculos"), vehicleData)
        successMessage = "Vehículo agregado exitosamente"
      }
      showToast.success(successMessage, {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      resetVehicleForm()
      setShowVehicleForm(false)
      refreshClients()
    } catch (error: any) {
      console.error("Error saving vehicle:", error?.message || JSON.stringify(error) || error)
      showToast.error(error?.message || "Ocurrió un error al guardar el vehículo", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }
// Función para editar cliente (necesaria para el botón de editar)
// Función para editar cliente (adaptada a la interfaz Clientes)
const editClient = (client: any) => {
  setCurrentClient(client)
  setName(client.nombre)
  setPhone(client.telefono)
  setEmail(client.email || "")
  setAddress(client.direccion || "")
  setCedula(client.cedula || "")
  setIncludeVehicle(false)
  setShowForm(true)
  setFormDialogOpen(true)
}

// Función para editar vehículo (necesaria para el botón de editar)
const editVehicle = (vehicle: any) => {
  // Buscar el cliente usando el campo correcto de la interfaz Vehiculos
  const client = clients.find((c) => c.id === vehicle.id_cliente)
  if (!client) return
  setCurrentVehicle(vehicle)
  setClientForVehicle(client)
  setPlate(vehicle.placa)
  setMake(vehicle.marca)
  setModel(vehicle.modelo)
  setYear(vehicle.anio ? vehicle.anio.toString() : "")
  setColor(vehicle.color || "")
  setType(vehicle.tipo)
  setSeatType(vehicle.tipo_asiento || "")
  setShowVehicleForm(true)
}

  // --- NUEVO: Eliminar cliente SOLO en Firebase ---
  const deleteClient = async (id: string) => {
    try {
      const clientVehicles = vehicles.filter((v) => v.clientId === id)
      if (clientVehicles.length > 0) {
      showToast.error("No se puede eliminar el cliente porque tiene vehículos registrados", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
        return
      }
      // Buscar servicios de este cliente
      const servicesSnap = await getDocs(query(collection(db, "servicios"), where("clientId", "==", id)))
      if (!servicesSnap.empty) {
      showToast.error("No se puede eliminar el cliente porque tiene servicios registrados", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
        return
      }
      if (!confirm("¿Está seguro de eliminar este cliente?")) return
      await deleteDoc(doc(db, "clientes", id))
      showToast.success("Cliente eliminado exitosamente", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      refreshClients()
    } catch (error: any) {
      console.error("Error deleting client:", error?.message || JSON.stringify(error) || error)
      showToast.error(error?.message || "Ocurrió un error al eliminar el cliente", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  // --- NUEVO: Eliminar vehículo SOLO en Firebase con confirmación ShadCN ---
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)
  const [deleteVehicleDialogOpen, setDeleteVehicleDialogOpen] = useState(false)

  const askDeleteVehicle = (id: string) => {
    setDeleteVehicleId(id)
    setDeleteVehicleDialogOpen(true)
  }

  const confirmDeleteVehicle = async () => {
    if (!deleteVehicleId) return
    try {
      const servicesSnap = await getDocs(query(collection(db, "servicios"), where("vehicleId", "==", deleteVehicleId)))
      if (!servicesSnap.empty) {
        showToast.error("No se puede eliminar el vehículo porque tiene servicios registrados", {
          duration: 4000,
          progress: true,
          position: "top-center",
          transition: "bottomToTopBounce",
          icon: '',
          sound: true,
        })
        setDeleteVehicleDialogOpen(false)
        setDeleteVehicleId(null)
        return
      }
      await deleteDoc(doc(db, "vehiculos", deleteVehicleId))
      showToast.success("Vehículo eliminado exitosamente", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      refreshClients()
    } catch (error: any) {
      console.error("Error deleting vehicle:", error?.message || JSON.stringify(error) || error)
      showToast.error(error?.message || "Ocurrió un error al eliminar el vehículo", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    } finally {
      setDeleteVehicleDialogOpen(false)
      setDeleteVehicleId(null)
    }
  }

  // --- NUEVO: Canje de puntos SOLO en Firebase ---
  const redeemPoints = async (clientId: string) => {
    try {
      const client = clients.find((c) => c.id === clientId)
      if (!client) return
      const currentPoints = clientPoints[clientId]?.points || 0
      if (currentPoints < 20) {
      showToast.error(`${client.nombre} tiene ${currentPoints} puntos. Necesita 20 para canjear.`, {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
        return
      }
      const redemption = {
        clientId,
        clientName: client.nombre,
        pointsUsed: 20,
        reward: "Lavado Gratis",
        createdAt: new Date().toISOString(),
        status: "Disponible",
      }
      await addDoc(collection(db, "pointRedemptions"), redemption)
      showToast.success(`${client.nombre} ha canjeado 20 puntos por un lavado gratis`, {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
      calculateClientPoints()
      setShowPointsModal(false)
    } catch (error: any) {
      console.error("Error redeeming points:", error?.message || JSON.stringify(error) || error)
      showToast.error(error?.message || "Ocurrió un error al canjear los puntos", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bottomToTopBounce",
        icon: '',
        sound: true,
      })
    }
  }

  const viewClientPoints = (client: any) => {
    setSelectedClientForPoints(client)
    setShowPointsModal(true)
  }

  // Estado para el filtro de búsqueda
  const [searchBy, setSearchBy] = useState<'name' | 'cedula'>('name')

  // Limpiar el input de búsqueda cada vez que cambia el filtro
  const handleSearchByChange = (v: 'name' | 'cedula') => {
    setSearchBy(v)
    setSearchTerm("")
  }

  // Filtrar clientes según el término de búsqueda y el filtro seleccionado
  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true
    const searchTermLower = searchTerm.toLowerCase()
    if (searchBy === 'cedula') {
      return (client.cedula && client.cedula.toLowerCase().includes(searchTermLower))
    } else {
      return (client.nombre && client.nombre.toLowerCase().includes(searchTermLower))
    }
  })

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex flex-col gap-y-2 sm:flex-row sm:items-center sm:space-x-4">
            <h2 className="text-xl font-bold">Gestión de Clientes y Vehículos</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600 mt-1 sm:mt-0">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentClient ? "Editando cliente" : "Nuevo cliente"}</span>
              </div>
            )}
            {showVehicleForm && (
              <div className="flex items-center text-sm text-gray-600 mt-1 sm:mt-0">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>
                  {currentVehicle ? "Editando vehículo" : "Nuevo vehículo"} para {clientForVehicle?.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2 w-full sm:w-auto">
            {showForm || showVehicleForm ? (
              <>
                <Button onClick={showForm ? toggleForm : toggleVehicleForm} variant="outline" className="w-full sm:w-auto">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
                <Button onClick={showForm ? toggleForm : toggleVehicleForm} variant="destructive" className="w-full sm:w-auto">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={toggleForm} variant="yellow" className="w-full sm:w-auto">
                  <i className="fas fa-plus mr-2"></i>Nuevo Cliente
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Buscador mejorado con filtro a la izquierda y búsqueda a la derecha */}
        {!showForm && !showVehicleForm && (
          <div className="mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:w-56">
                <label htmlFor="searchBy" className="block text-base font-medium text-gray-700 mb-1">Filtrar por</label>
                <Select value={searchBy} onValueChange={v => handleSearchByChange(v as 'name' | 'cedula')}>
                  <SelectTrigger className="w-full min-h-[44px] text-base px-4 border-gray-300 focus:ring-0 focus:border-yellow-500">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="cedula">Cédula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 w-full">
                <label htmlFor="searchTerm" className="block text-base font-medium text-gray-700 mb-1">Buscar Cliente</label>
                <input
                  type={searchBy === 'cedula' ? 'number' : 'text'}
                  id="searchTerm"
                  placeholder={searchBy === 'cedula' ? 'Buscar por cédula...' : 'Buscar por nombre...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[44px] text-base px-4 shadow-sm"
                  inputMode={searchBy === 'cedula' ? 'numeric' : undefined}
                  pattern={searchBy === 'cedula' ? '[0-9]*' : undefined}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dialog para formulario de cliente */}
        {/* Dialog para formulario de cliente, reorganizado y usando componentes ShadCN */}
        <Dialog open={formDialogOpen} onOpenChange={(open) => { setFormDialogOpen(open); if (!open) setShowForm(false) }}>
          <DialogContent className="max-w-full w-full sm:max-w-4xl p-0 max-h-[95vh] overflow-y-auto rounded-none sm:rounded-2xl">
            <DialogHeader className="px-4 pt-6 pb-2 sm:px-8 sticky top-0 z-10 bg-white">
              <DialogTitle className="text-2xl">{currentClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              <DialogDescription className="text-base text-gray-500">
                {currentClient ? "Modifica los datos del cliente seleccionado." : "Completa los datos para registrar un nuevo cliente."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-8 pt-2 sm:px-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="clientName" className="block text-base font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      id="clientName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                      placeholder="Nombre y apellidos"
                    />
                  </div>
                  <div>
                    <label htmlFor="clientCedula" className="block text-base font-medium text-gray-700 mb-1">Cédula</label>
                    <input
                      type="text"
                      id="clientCedula"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                      placeholder="Ej: 12345678"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <label htmlFor="clientPhone" className="block text-base font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      id="clientPhone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                      placeholder="Número de contacto"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="clientEmail" className="block text-base font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      id="clientEmail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="clientAddress" className="block text-base font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      id="clientAddress"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>
              </div>
              {!currentClient && (
                <div className="rounded-xl border border-gray-100 p-4 sm:p-6 bg-gray-50 mt-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <span className="font-semibold text-gray-700 flex items-center text-lg">
                      <i className="fas fa-car mr-2 text-yellow-500"></i> Información del Vehículo
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch id="includeVehicle" checked={includeVehicle} onCheckedChange={setIncludeVehicle} />
                      <label htmlFor="includeVehicle" className="ml-2 text-base text-gray-700">Incluir vehículo</label>
                    </div>
                  </div>
                  {includeVehicle && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label htmlFor="vehiclePlate" className="block text-base font-medium text-gray-700 mb-1">Placa</label>
                        <input
                          type="text"
                          id="vehiclePlate"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value)}
                          required={includeVehicle}
                          className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4 uppercase"
                          placeholder="ABC123"
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicleMake" className="block text-base font-medium text-gray-700 mb-1">Marca</label>
                        <input
                          type="text"
                          id="vehicleMake"
                          value={make}
                          onChange={(e) => setMake(e.target.value)}
                          required={includeVehicle}
                          className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                          placeholder="Toyota, Honda, etc."
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicleModel" className="block text-base font-medium text-gray-700 mb-1">Modelo</label>
                        <input
                          type="text"
                          id="vehicleModel"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          required={includeVehicle}
                          className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                          placeholder="Corolla, Civic, etc."
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicleYear" className="block text-base font-medium text-gray-700 mb-1">Año</label>
                        <input
                          type="number"
                          id="vehicleYear"
                          min="1900"
                          max="2099"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicleColor" className="block text-base font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="text"
                          id="vehicleColor"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full rounded-lg border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 min-h-[48px] text-base px-4"
                          placeholder="Blanco, Negro, etc."
                        />
                      </div>
                      <div>
                        <label htmlFor="vehicleType" className="block text-base font-medium text-gray-700 mb-1">Tipo</label>
                       <Select value={type} onValueChange={setType} required>
                        <SelectTrigger className="w-full min-h-[48px] text-base px-4 border-gray-300 focus:ring-0 focus:border-yellow-500">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automóvil">Automóvil</SelectItem>
                          <SelectItem value="Camioneta">Camioneta</SelectItem>
                          <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Pickup">Pickup</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="vehicleSeatType" className="block text-base font-medium text-gray-700 mb-1">Tipo de Asiento</label>
                      <Select value={seatType} onValueChange={setSeatType} required>
                        <SelectTrigger className="w-full min-h-[48px] text-base px-4 border-gray-300 focus:ring-0 focus:border-yellow-500">
                          <SelectValue placeholder="Seleccione tipo de asiento..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cuero">Cuero</SelectItem>
                          <SelectItem value="Tela">Tela</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-8 border-t border-gray-200 mt-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:space-x-3 w-full sm:w-auto">
                  <Button type="submit" variant="yellow" className="w-full sm:w-auto px-6 min-h-[48px] text-base">
                    <i className="fas fa-save mr-2"></i>
                    {currentClient ? "Actualizar Cliente" : "Guardar"}
                  </Button>
                </div>
                <DialogClose asChild>
                  <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto min-h-[48px] text-base">
                    <i className="fas fa-times mr-2"></i>Cancelar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para formulario de vehículo */}
        <Dialog open={showVehicleForm} onOpenChange={(open) => { setShowVehicleForm(open); if (!open) setCurrentVehicle(null); }}>
          <DialogContent className="max-w-full w-full sm:max-w-2xl p-0 max-h-[95vh] overflow-y-auto rounded-none sm:rounded-2xl">
            <DialogHeader className="px-4 pt-6 pb-2 sm:px-8 sticky top-0 z-10 bg-white">
              <DialogTitle className="text-2xl">{currentVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
              <DialogDescription className="text-base text-gray-500">
                {clientForVehicle ? (
                  <>
                    {currentVehicle ? "Modifica los datos del vehículo seleccionado." : `Registra un nuevo vehículo para ${clientForVehicle.nombre}.`}
                  </>
                ) : (
                  "Selecciona un cliente para continuar."
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVehicleSubmit} className="space-y-6 px-4 pb-8 pt-2 sm:px-8">
              {!clientForVehicle ? (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl text-center">
                  <i className="fas fa-exclamation-circle text-yellow-500 text-2xl mb-2"></i>
                  <p className="text-base text-yellow-700">
                    Selecciona un cliente de la lista para agregar un vehículo, o usa el botón "Agregar Vehículo" junto a un cliente específico.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="vehiclePlate" className="block text-base font-medium text-gray-700 mb-1">Placa*</label>
                      <input
                        type="text"
                        id="vehiclePlate"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        required
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] text-base px-4 uppercase"
                        placeholder="ABC123"
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleType" className="block text-base font-medium text-gray-700 mb-1">Tipo*</label>
                      <Select value={type} onValueChange={setType} required>
                        <SelectTrigger className="w-full min-h-[48px] text-base px-4 border-gray-300 focus:ring-0 focus:border-yellow-500">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Automóvil">Automóvil</SelectItem>
                          <SelectItem value="Camioneta">Camioneta</SelectItem>
                          <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Pickup">Pickup</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="vehicleMake" className="block text-base font-medium text-gray-700 mb-1">Marca*</label>
                      <input
                        type="text"
                        id="vehicleMake"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        required
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] text-base px-4"
                        placeholder="Toyota, Honda, etc."
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleModel" className="block text-base font-medium text-gray-700 mb-1">Modelo*</label>
                      <input
                        type="text"
                        id="vehicleModel"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        required
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] text-base px-4"
                        placeholder="Corolla, Civic, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="vehicleYear" className="block text-base font-medium text-gray-700 mb-1">Año</label>
                      <input
                        type="number"
                        id="vehicleYear"
                        min="1900"
                        max="2099"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] text-base px-4"
                        placeholder="2023"
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleColor" className="block text-base font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        id="vehicleColor"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 min-h-[48px] text-base px-4"
                        placeholder="Blanco, Negro, etc."
                      />
                    </div>
                  </div>
                  {/* Campo para Tipo de Asiento */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="vehicleSeatType" className="block text-base font-medium text-gray-700 mb-1">Tipo de Asiento</label>
                      <Select value={seatType} onValueChange={setSeatType} required>
                        <SelectTrigger className="w-full min-h-[48px] text-base px-4 border-gray-300 focus:ring-0 focus:border-yellow-500">
                          <SelectValue placeholder="Seleccione tipo de asiento..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cuero">Cuero</SelectItem>
                          <SelectItem value="Tela">Tela</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-8 border-t border-gray-200 mt-8 flex flex-col gap-2 md:flex-row md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:space-x-3 w-full md:w-auto">
                  <Button type="submit" variant="yellow" className="w-full md:w-auto px-8 py-3 text-lg font-semibold">
                    <i className="fas fa-save mr-2"></i>
                    {currentVehicle ? "Actualizar Vehículo" : "Guardar Vehículo"}
                  </Button>
                </div>
                <Button type="button" onClick={toggleVehicleForm} variant="destructive" size="lg" className="w-full md:w-auto px-6 py-3 text-lg">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lista de clientes organizada */}
        {!showForm && !showVehicleForm && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">Lista de Clientes y sus Vehículos ({filteredClients.length})</h3>

            {filteredClients.length > 0 ? (
              <div className="space-y-4">
                {filteredClients.map((client) => {
                  // Relacionar vehículos usando el campo correcto de la interfaz Vehiculos: id_cliente
                  const clientVehicles = vehicles.filter((v) => v.id_cliente === client.id)
                  const points = clientPoints[client.id]?.points || 0
                  const totalSpent = clientPoints[client.id]?.totalSpent || 0

                  return (
                    <div
                      key={client.id}
                      className="border rounded-lg p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Información del cliente */}
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 items-start">
                        {/* Datos del cliente */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 shadow-inner">
                              <h4 className="font-bold text-lg text-blue-900 flex items-center gap-2 mb-1">
                                <i className="fas fa-user-circle text-blue-400"></i>{client.nombre}
                              </h4>
                              <div className="text-sm text-blue-800 space-y-1">
                                {client.cedula && (
                                  <div className="flex items-center">
                                    <i className="fas fa-id-card text-blue-300 mr-2 w-4"></i>
                                    <span>{client.cedula}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <i className="fas fa-phone text-blue-300 mr-2 w-4"></i>
                                  <span>{client.telefono}</span>
                                </div>
                                {client.email && (
                                  <div className="flex items-center">
                                    <i className="fas fa-envelope text-blue-300 mr-2 w-4"></i>
                                    <span>{client.email}</span>
                                  </div>
                                )}
                                {client.direccion && (
                                  <div className="flex items-center">
                                    <i className="fas fa-map-marker-alt text-blue-300 mr-2 w-4"></i>
                                    <span className="text-xs">{client.direccion}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Puntos de fidelidad */}
                        <div className="text-center bg-white rounded-lg p-3 border mt-2 sm:mt-0">
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
                        <div className="flex flex-wrap gap-2 justify-end mt-2 sm:mt-0">
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
                        <div className="mt-4 pt-4 border-t border-yellow-300 bg-yellow-50/60 rounded-xl overflow-x-auto shadow-inner">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                            <h5 className="font-semibold text-yellow-800 flex items-center text-base tracking-wide">
                              <i className="fas fa-car mr-2 text-yellow-500"></i>
                              Vehículos del Cliente <span className="ml-1">({clientVehicles.length})</span>
                            </h5>
                            <Button onClick={() => toggleVehicleForm(client)} variant="outline" size="sm" className="w-full sm:w-auto mt-2 sm:mt-0">
                              <i className="fas fa-plus mr-1"></i>Añadir
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {clientVehicles.map((vehicle) => (
                              <div
                                key={vehicle.id}
                                className="bg-white p-3 rounded-lg border border-yellow-200 hover:border-yellow-400 transition-colors shadow-sm"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-yellow-900 text-base flex items-center gap-2">
                                      <i className="fas fa-id-badge text-yellow-400"></i>{vehicle.placa}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      {vehicle.marca} {vehicle.modelo}
                                      {vehicle.anio && ` (${vehicle.anio})`}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <span className="bg-yellow-100 px-2 py-1 rounded text-xs mr-2 text-yellow-800 border border-yellow-200">{vehicle.tipo}</span>
                                      {vehicle.color && <span className="text-gray-400">{vehicle.color}</span>}
                                    </div>
                                  </div>
                                  <div className="flex space-x-1 ml-0 sm:ml-2 mt-2 sm:mt-0">
                                    <Button
                                      onClick={() => editVehicle(vehicle)}
                                      variant="outline"
                                      size="sm"
                                      title="Editar vehículo"
                                    >
                                      <i className="fas fa-edit text-xs"></i>
                                    </Button>
                                    <Button
                                      onClick={() => askDeleteVehicle(vehicle.id)}
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
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-gray-500 text-sm">
                              <i className="fas fa-car mr-2"></i>
                              Sin vehículos registrados
                            </span>
                            <Button onClick={() => toggleVehicleForm(client)} variant="outline" size="sm" className="w-full sm:w-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2 sm:px-0">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
              <h3 className="text-lg font-bold">Sistema de Puntos</h3>
              <Button onClick={() => setShowPointsModal(false)} variant="outline" size="sm">
                <i className="fas fa-times"></i>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-bold text-lg">{selectedClientForPoints.nombre}</h4>
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h5 className="font-semibold text-green-800">¡Canje Disponible!</h5>
                      <p className="text-sm text-green-600">Puede canjear 20 puntos por un lavado gratis</p>
                    </div>
                    <Button
                      onClick={() => redeemPoints(selectedClientForPoints.id)}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto mt-2 sm:mt-0"
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
                <Button onClick={() => setShowPointsModal(false)} variant="outline" className="w-full sm:w-auto">
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
