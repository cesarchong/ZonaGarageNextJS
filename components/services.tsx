"use client"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"

interface ServiceProduct {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
  isPromotion?: boolean
  includedProducts?: ServiceProduct[]
}

export default function Services() {
  const { toast } = useToast()
  const [services, setServices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [showSimpleForm, setShowSimpleForm] = useState(false)
  const [currentService, setCurrentService] = useState<any>(null)

  // Invoice state
  const [showInvoice, setShowInvoice] = useState(false)
  const [invoiceService, setInvoiceService] = useState<any>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [lastCreatedService, setLastCreatedService] = useState<any>(null)
  const [showFullInvoiceView, setShowFullInvoiceView] = useState(false)
  const [fullInvoiceData, setFullInvoiceData] = useState<any>(null)

  // NUEVOS ESTADOS PARA OPTIMIZACIÓN
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<any>(null)
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<any>(null)
  const [paymentData, setPaymentData] = useState({
    discountType: "percentage", // "percentage" o "fixed"
    discountValue: "",
    extraCharges: "",
    extraChargesDescription: "",
    paymentMethod: "cash",
    finalTotal: 0,
  })

  // Agregar estado para la hoja de impresión después de los estados existentes
  const [showPrintSheet, setShowPrintSheet] = useState(false)
  const [printSheetData, setPrintSheetData] = useState<any>(null)

  const [showClientReception, setShowClientReception] = useState(false)
  const [showInternalInvoice, setShowInternalInvoice] = useState(false)
  const [receptionData, setReceptionData] = useState<any>(null)
  const [internalInvoiceData, setInternalInvoiceData] = useState<any>(null)

  // Simple form state - NUEVO FLUJO MEJORADO
  const [currentStep, setCurrentStep] = useState(1)
  const [clientSelectionMode, setClientSelectionMode] = useState<"existing" | "new" | null>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  // Form inputs - CAMPOS MEJORADOS
  const [clientSearch, setClientSearch] = useState("")
  const [filteredClients, setFilteredClients] = useState<any[]>([])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)

  // Nuevo cliente - CAMPOS COMPLETOS
  const [newClientName, setNewClientName] = useState("")
  const [newClientLastName, setNewClientLastName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientAddress, setNewClientAddress] = useState("")
  const [newClientCedula, setNewClientCedula] = useState("") // NUEVO ESTADO

  // Nuevo vehículo - CAMPOS COMPLETOS
  const [newVehicleMake, setNewVehicleMake] = useState("")
  const [newVehicleModel, setNewVehicleModel] = useState("")
  const [newVehicleYear, setNewVehicleYear] = useState("")
  const [newVehicleColor, setNewVehicleColor] = useState("")
  const [newVehiclePlate, setNewVehiclePlate] = useState("")
  const [newVehicleSeatType, setNewVehicleSeatType] = useState<"Cuero" | "Tela" | "">("")

  // Products for simple form
  const [selectedProductsSimple, setSelectedProductsSimple] = useState<ServiceProduct[]>([])
  const [selectedProductIdSimple, setSelectedProductIdSimple] = useState("")
  const [selectedQuantitySimple, setSelectedQuantitySimple] = useState("1")
  const [showProductsSection, setShowProductsSection] = useState(false)

  // NUEVO: Campo de observaciones
  const [serviceNotes, setServiceNotes] = useState("")

  // New: Independent product sales
  const [showProductSalesSection, setShowProductSalesSection] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedProductForSale, setSelectedProductForSale] = useState<any>(null)
  const [productSaleQuantity, setProductSaleQuantity] = useState("1")
  const [cartProducts, setCartProducts] = useState<ServiceProduct[]>([])

  // Mover las funciones dentro del componente para que tengan acceso a las variables de estado
  const calculateDetailedTotals = () => {
    // Calcular el precio base sumando todos los servicios seleccionados
const servicePrice = selectedServiceTypes.reduce((sum, service) => sum + (service.base_price || 0), 0)
    const productsSubtotal = selectedProductsSimple.reduce((sum, product) => sum + product.total, 0)

    let totalDiscounts = 0
    selectedProductsSimple.forEach((product) => {
      if (product.isPromotion && product.includedProducts) {
        const originalPromoPrice = product.includedProducts.reduce((sum, included) => sum + included.total, 0)
        const discountAmount = originalPromoPrice - product.total
        totalDiscounts += discountAmount
      } else {
        const originalProduct = products.find((p) => p.id === product.productId)
        if (originalProduct) {
          const originalPrice = originalProduct.price * product.quantity
          const discountAmount = originalPrice - product.total
          totalDiscounts += discountAmount
        }
      }
    })

    const subtotal = servicePrice + productsSubtotal + totalDiscounts
    const total = servicePrice + productsSubtotal

    return {
      serviceSubtotal: servicePrice,
      productsSubtotal: productsSubtotal,
      totalDiscounts: totalDiscounts,
      subtotal: subtotal,
      total: total,
    }
  }

  const calculateCartDetailedTotals = () => {
    const productsSubtotal = cartProducts.reduce((sum, product) => sum + product.total, 0)

    let totalDiscounts = 0
    cartProducts.forEach((product) => {
      const originalProduct = products.find((p) => p.id === product.productId)
      if (originalProduct) {
        const originalPrice = originalProduct.price * product.quantity
        const discountAmount = originalPrice - product.total
        totalDiscounts += discountAmount
      }
    })

    const subtotal = productsSubtotal + totalDiscounts
    const total = productsSubtotal

    return {
      serviceSubtotal: 0,
      productsSubtotal: productsSubtotal,
      totalDiscounts: totalDiscounts,
      subtotal: subtotal,
      total: total,
    }
  }

  useEffect(() => {
    refreshServices()
    
  }, [])

  useEffect(() => {
    if (clientSearch.length > 0) {
      const filtered = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (client.phone && client.phone.includes(clientSearch)),
      )
      setFilteredClients(filtered)
      setShowClientSuggestions(true)
    } else {
      setFilteredClients([])
      setShowClientSuggestions(false)
    }
  }, [clientSearch, clients])

  useEffect(() => {
    if (productSearch.length > 0) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(productSearch.toLowerCase())),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products.slice(0, 10))
    }
  }, [productSearch, products])

  useEffect(() => {
  refreshServices()
  refreshClients()
  refreshVehicles()
  refreshEmployees()
    refreshServiceTypes() // <-- Agregado

}, [])

  // NUEVO: Calcular total final con descuentos y extras
  useEffect(() => {
    if (selectedServiceForPayment) {
      let total = selectedServiceForPayment.total || 0

      // Aplicar descuento
      if (paymentData.discountValue) {
        const discountAmount =
          paymentData.discountType === "percentage"
            ? (total * Number.parseFloat(paymentData.discountValue)) / 100
            : Number.parseFloat(paymentData.discountValue)
        total -= discountAmount
      }

      // Agregar cobros extra
      if (paymentData.extraCharges) {
        total += Number.parseFloat(paymentData.extraCharges)
      }

      setPaymentData((prev) => ({ ...prev, finalTotal: Math.max(0, total) }))
    }
  }, [selectedServiceForPayment, paymentData.discountType, paymentData.discountValue, paymentData.extraCharges])

  const refreshServices = async () => {
  try {
    const { data: servicesData, error: servicesError } = await supabase.from("servicios").select("*")
    if (servicesError) throw servicesError
    setServices(servicesData || [])
  } catch (error) {
    setServices([])
  }
}



const refreshServiceTypes = async () => {
  try {
    const { data: serviceTypesData, error: serviceTypesError } = await supabase.from("tipos_servicio").select("*")
      .eq("is_active", true)
    if (serviceTypesError) throw serviceTypesError
    setServiceTypes(serviceTypesData || [])
  } catch (error) {
    setServiceTypes([])
  }
}

const refreshClients = async () => {
  try {
    const { data: clientsData, error: clientsError } = await supabase.from("clientes").select("*")
    if (clientsError) throw clientsError
    setClients(clientsData || [])
  } catch (error) {
    setClients([])
  }
}
const refreshVehicles = async () => {
  try {
    const { data: vehiclesData, error: vehiclesError } = await supabase.from("vehiculos").select("*")
    if (vehiclesError) throw vehiclesError
    setVehicles(vehiclesData || [])
  } catch (error) {
    setVehicles([])
  }
}
const refreshEmployees = async () => {
  try {
    const { data: employeesData, error: employeesError } = await supabase
      .from("empleados")
      .select("*")
      .eq("estado", "activo")
    if (employeesError) throw employeesError
    setEmployees(employeesData || [])
  } catch (error) {
    setEmployees([])
  }
}

  // const refreshServices = () => {
  //   try {
  //     const servicesData = JSON.parse(localStorage.getItem("services") || "[]")
  //     const clientsData = JSON.parse(localStorage.getItem("clients") || "[]")
  //     const vehiclesData = JSON.parse(localStorage.getItem("vehicles") || "[]")
  //     const employeesData = JSON.parse(localStorage.getItem("employees") || "[]")
  //     const inventoryData = JSON.parse(localStorage.getItem("inventory") || "[]")
  //     const serviceTypesData = JSON.parse(localStorage.getItem("serviceTypes") || "[]")
  //     const promotionsData = JSON.parse(localStorage.getItem("promotions") || "[]")

  //     setServices(servicesData)
  //     setClients(clientsData)
  //     setVehicles(vehiclesData)
  //     setEmployees(employeesData.filter((e: any) => e.status === "Activo"))
  //     setPromotions(promotionsData)

  //     const availableProducts = inventoryData
  //       .filter((p: any) => p.quantity > 0)
  //       .sort((a: any, b: any) => a.name.localeCompare(b.name))

  //     setProducts(availableProducts)
  //     setServiceTypes(serviceTypesData.filter((st: any) => st.isActive))
  //     setFilteredProducts(availableProducts.slice(0, 10))
  //   } catch (error) {
  //     console.error("Error refreshing services:", error)
  //     toast({
  //       title: "Error",
  //       description: "Hubo un problema al cargar los datos. Por favor, recarga la página.",
  //       variant: "destructive",
  //     })
  //   }
  // }

  const getActivePromotionsForProduct = (productId: string) => {
    return promotions.filter((promo: any) => promo.active && promo.products && promo.products.includes(productId))
  }

  const getBestPromotionForProduct = (productId: string) => {
    const activePromotions = getActivePromotionsForProduct(productId)
    if (activePromotions.length === 0) return null
    return activePromotions.reduce((best: any, current: any) => (current.discount > best.discount ? current : best))
  }

  const resetSimpleForm = () => {
    // Resetear pasos y selección
    setCurrentStep(1)
    setClientSelectionMode(null)
    setSelectedClient(null)
    setSelectedVehicle(null)
    setSelectedServiceTypes([])
    setSelectedEmployee(null)

    // Resetear búsqueda de cliente
    setClientSearch("")
    setFilteredClients([])
    setShowClientSuggestions(false)

    // Resetear datos de nuevo cliente
    setNewClientName("")
    setNewClientLastName("")
    setNewClientEmail("")
    setNewClientPhone("")
    setNewClientAddress("")
    setNewClientCedula("") // NUEVO RESET

    // Resetear datos de nuevo vehículo
    setNewVehicleMake("")
    setNewVehicleModel("")
    setNewVehicleYear("")
    setNewVehicleColor("")
    setNewVehiclePlate("")
    setNewVehicleSeatType("")

    // Resetear productos y ventas
    setSelectedProductsSimple([])
    setSelectedProductIdSimple("")
    setSelectedQuantitySimple("1")
    setShowProductsSection(false)
    setShowProductSalesSection(false)
    setCartProducts([])
    setProductSearch("")
    setSelectedProductForSale(null)
    setProductSaleQuantity("1")

    // Resetear notas
    setServiceNotes("")
  }

  const toggleSimpleForm = () => {
    setShowSimpleForm(!showSimpleForm)
    setShowSuccessMessage(false)
    setLastCreatedService(null)
    if (!showSimpleForm) {
      resetSimpleForm()
    }
  }

  const selectClientMode = (mode: "existing" | "new") => {
    setClientSelectionMode(mode)
    if (mode === "existing") {
      setCurrentStep(1.5) // Sub-paso para buscar cliente existente
    } else {
      setCurrentStep(1.5) // Sub-paso para registrar cliente nuevo
    }
  }

  const selectExistingClient = (client: any) => {
    setSelectedClient(client)
    setClientSearch(client.name)
    setShowClientSuggestions(false)
    setCurrentStep(2)
  }

  const validateNewClientData = () => {
    if (!newClientName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!newClientLastName.trim()) {
      toast({
        title: "Error",
        description: "El apellido es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!newClientEmail.trim()) {
      toast({
        title: "Error",
        description: "El correo electrónico es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!newClientPhone.trim()) {
      toast({
        title: "Error",
        description: "El teléfono es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!newClientAddress.trim()) {
      toast({
        title: "Error",
        description: "La dirección es obligatoria",
        variant: "destructive",
      })
      return false
    }

    // NUEVO: Validación de cédula
    if (!newClientCedula.trim()) {
      toast({
        title: "Error",
        description: "La cédula es obligatoria",
        variant: "destructive",
      })
      return false
    }

    // Validar formato de cédula
    const cedulaRegex = /^[VE]-\d{8}$/
    if (!cedulaRegex.test(newClientCedula)) {
      toast({
        title: "Error",
        description: "El formato de la cédula debe ser V-12345678 o E-12345678",
        variant: "destructive",
      })
      return false
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newClientEmail)) {
      toast({
        title: "Error",
        description: "El formato del correo electrónico no es válido",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const createNewClientAndProceed = () => {
    if (!validateNewClientData()) return

    const newClient = {
      id: Date.now().toString() + "_client",
      name: `${newClientName.trim()} ${newClientLastName.trim()}`,
      firstName: newClientName.trim(),
      lastName: newClientLastName.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim(),
      address: newClientAddress.trim(),
      cedula: newClientCedula.trim(), // NUEVO CAMPO
      createdAt: new Date().toISOString(),
    }

    setSelectedClient(newClient)
    setCurrentStep(2)
  }

  const validateNewVehicleData = () => {
    if (!newVehicleMake.trim()) {
      toast({
        title: "Error",
        description: "La marca es obligatoria",
      })
      return false
    }
    if (!newVehicleModel.trim()) {
      toast({
        title: "Error",
        description: "El modelo es obligatorio",
      })
      return false
    }

    if (!newVehicleYear.trim()) {
      toast({
        title: "Error",
        description: "El año es obligatorio",
      })
      return false
    }

    // Validar que el año sea numérico y esté en un rango válido
    const yearNum = Number.parseInt(newVehicleYear.trim())
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      toast({
        title: "Error",
        description: "El año debe ser un número válido entre 1900 y " + (new Date().getFullYear() + 1),
      })
      return false
    }

    if (!newVehicleColor.trim()) {
      toast({
        title: "Error",
        description: "El color es obligatorio",
      })
      return false
    }
    if (!newVehiclePlate.trim()) {
      toast({
        title: "Error",
        description: "La placa es obligatoria",
      })
      return false
    }
    if (!newVehicleSeatType) {
      toast({
        title: "Error",
        description: "El tipo de asientos es obligatorio",
      })
      return false
    }

    // Verificar si la placa ya existe
    const plateExists = vehicles.some((v) => v.plate && v.plate.toLowerCase() === newVehiclePlate.toLowerCase().trim())

    if (plateExists) {
      toast({
        title: "Placa duplicada",
        description: "Ya existe un vehículo con esta placa",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const createNewVehicleAndProceed = () => {
    if (!validateNewVehicleData()) return

    const newVehicle = {
      id: Date.now().toString() + "_vehicle",
      clientId: selectedClient?.id,
      make: newVehicleMake.trim(),
      model: newVehicleModel.trim(),
      year: newVehicleYear.trim(),
      color: newVehicleColor.trim(),
      plate: newVehiclePlate.toUpperCase().trim(),
      seatType: newVehicleSeatType,
      type: "Automóvil",
      createdAt: new Date().toISOString(),
    }

    setSelectedVehicle(newVehicle)
    setCurrentStep(3)
  }

  const selectServiceType = (serviceType: any) => {
    // Verificar si el servicio ya está seleccionado
    const isAlreadySelected = selectedServiceTypes.some((selected) => selected.id === serviceType.id)

    if (isAlreadySelected) {
      // Si ya está seleccionado, lo quitamos (toggle)
      setSelectedServiceTypes(selectedServiceTypes.filter((selected) => selected.id !== serviceType.id))
    } else {
      // Si no está seleccionado, lo agregamos
      setSelectedServiceTypes([...selectedServiceTypes, serviceType])
    }

    // NO avanzamos automáticamente al siguiente paso para permitir múltiples selecciones
  }

  const selectEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    setCurrentStep(5)
  }

  const selectExistingVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setCurrentStep(3)
  }

  // NUEVAS FUNCIONES PARA OPTIMIZACIÓN

  const openPaymentModal = (service: any) => {
    setSelectedServiceForPayment(service)
    setPaymentData({
      discountType: "percentage",
      discountValue: "",
      extraCharges: "",
      extraChargesDescription: "",
      paymentMethod: "cash",
      finalTotal: service.total || 0,
    })
    setShowPaymentModal(true)
  }

  const openEditModal = (service: any) => {
    setSelectedServiceForEdit(service)
    setSelectedProductsSimple(service.products || [])
    setServiceNotes(service.notes || "")
    setShowEditModal(true)
  }

  // Agregar función para abrir la hoja de impresión después de las funciones existentes
  const openPrintSheet = (service: any) => {
    const serviceClient = clients.find((c) => c.id === service.clientId)
    const serviceVehicle = vehicles.find((v) => v.id === service.vehicleId)
    const serviceEmployee = employees.find((e) => e.id === service.employeeId)

    if (!serviceClient) {
      toast({
        title: "Error",
        description: "No se encontraron los datos completos del servicio",
        variant: "destructive",
      })
      return
    }

    setPrintSheetData({
      service: service,
      client: serviceClient,
      vehicle: serviceVehicle || { plate: "N/A", make: "N/A", model: "N/A", year: "N/A", seatType: "N/A" },
      employee: serviceEmployee || { name: "No asignado" },
    })
    setShowPrintSheet(true)
  }

  const closePrintSheet = () => {
    setShowPrintSheet(false)
    setPrintSheetData(null)
  }

  const openClientReception = (service: any) => {
    const serviceClient = clients.find((c) => c.id === service.clientId)
    const serviceVehicle = vehicles.find((v) => v.id === service.vehicleId)
    const serviceEmployee = employees.find((e) => e.id === service.employeeId)

    if (!serviceClient) {
      toast({
        title: "Error",
        description: "No se encontraron los datos completos del servicio",
        variant: "destructive",
      })
      return
    }

    setReceptionData({
      service: service,
      client: serviceClient,
      vehicle: serviceVehicle || { plate: "N/A", make: "N/A", model: "N/A", year: "N/A", color: "N/A" },
      employee: serviceEmployee || { name: "No asignado" },
    })
    setShowClientReception(true)
  }

  const printClientReception = () => {
    if (!receptionData) {
      toast({
        title: "Error",
        description: "No hay datos de hoja de cliente para imprimir",
        variant: "destructive",
      })
      return
    }

    try {
      const printContent = generateClientReceptionDocument(receptionData)

      // Crear una nueva ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600")
      if (!printWindow) {
        alert("Por favor, permita ventanas emergentes para imprimir")
        return
      }

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Cerrar la ventana después de imprimir (opcional)
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 500)
      }
    } catch (error) {
      console.error("Error printing client reception:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al imprimir la hoja de cliente",
        variant: "destructive",
      })
    }
  }

  const generateClientReceptionDocument = (receptionData: any) => {
    const { service, client, vehicle, employee } = receptionData

    // Generar lista de servicios sin precios
    const servicesList =
      service.selectedServices && service.selectedServices.length > 0
        ? service.selectedServices
            .map(
              (serviceItem: any) => `
    <tr>
      <td>${serviceItem.name}</td>
    </tr>
  `,
            )
            .join("")
        : service.typeName
          ? `
    <tr>
      <td>${service.typeName}</td>
    </tr>
  `
          : ""

    const productsList =
      service.products
        ?.map(
          (product: any) => `
    <tr>
      <td>${product.productName} (x${product.quantity})</td>
    </tr>
  `,
        )
        .join("") || ""

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hoja de Recepción del Cliente</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 15mm;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px 0;
      letter-spacing: 2px;
    }
    .header p {
      margin: 0 0 5px 0;
      font-size: 12px;
    }
    .header h2 {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0 5px 0;
    }
    .date-field {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .client-section, .vehicle-section {
      border: 2px solid #000;
      padding: 15px;
    }
    .client-section h3, .vehicle-section h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 15px 0;
      text-align: center;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .info-row {
      margin-bottom: 12px;
      font-size: 11px;
      display: flex;
      align-items: center;
    }
    .info-label {
      font-weight: bold;
      min-width: 90px;
      margin-right: 10px;
    }
    .info-value {
      flex: 1;
      border-bottom: 1px solid #000;
      height: 20px;
      padding-left: 5px;
      display: flex;
      align-items: center;
    }
    .services-section {
      margin-bottom: 30px;
    }
    .services-section h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 15px 0;
      text-align: center;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .services-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000;
      margin-bottom: 15px;
    }
    .services-table th,
    .services-table td {
      border: 1px solid #000;
      padding: 12px 8px;
      text-align: left;
      font-size: 11px;
    }
    .services-table th {
      background-color: #f8f8f8;
      font-weight: bold;
      text-align: center;
    }
    .observations-section {
      margin-bottom: 40px;
    }
    .observations-section h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .observations-box {
      border: 1px solid #000;
      min-height: 100px;
      padding: 10px;
      margin: 0;
    }
    .signature-section {
      text-align: center;
      margin: 40px 0;
    }
    .signature-label {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 30px;
      text-transform: uppercase;
    }
    .signature-line {
      border-bottom: 2px solid #000;
      width: 300px;
      height: 40px;
      margin: 0 auto;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      margin-top: 30px;
      border-top: 1px solid #000;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="date-field">FECHA: ${new Date().toLocaleDateString("es-ES")}</div>
  
  <div class="header">
    <h1>ZONA GARAJE</h1>
    <p>Tu carro en buenas manos</p>
    <h2>HOJA DE RECEPCIÓN DEL CLIENTE</h2>
    <p>No. ${service.id?.slice(-8) || "N/A"}</p>
  </div>

  <div class="info-section">
    <div class="client-section">
      <h3>Datos del Cliente</h3>
      <div class="info-row">
        <span class="info-label">NOMBRE:</span>
        <div class="info-value">${client?.name || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">TELÉFONO:</span>
        <div class="info-value">${client?.phone || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">DIRECCIÓN:</span>
        <div class="info-value">${client?.address || ""}</div>
      </div>
    </div>

    <div class="vehicle-section">
      <h3>Características del Vehículo</h3>
      <div class="info-row">
        <span class="info-label">MARCA:</span>
        <div class="info-value">${vehicle?.make || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">MODELO:</span>
        <div class="info-value">${vehicle?.model || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">AÑO:</span>
        <div class="info-value">${vehicle?.year || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">COLOR:</span>
        <div class="info-value">${vehicle?.color || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">PLACA:</span>
        <div class="info-value">${vehicle?.plate || ""}</div>
      </div>
      <div class="info-row">
        <span class="info-label">KM:</span>
        <div class="info-value"></div>
      </div>
    </div>
  </div>

  <div class="services-section">
    <h3>Tipo de Servicio</h3>
    <table class="services-table">
      <thead>
        <tr>
          <th>DESCRIPCIÓN</th>
        </tr>
      </thead>
      <tbody>
        ${servicesList}
        ${productsList}
      </tbody>
    </table>
  </div>

  <div class="observations-section">
    <h3>Observaciones del Servicio</h3>
    <div class="observations-box">${service?.notes || ""}</div>
  </div>

  <div class="signature-section">
    <div class="signature-label">Firma del Cliente</div>
    <div class="signature-line"></div>
  </div>

  <div class="footer">
    <p>El cliente reconoce que ha recibido el servicio y que el mismo se completó a su satisfacción.</p>
    <p><strong>www.zonagaraje.com</strong></p>
  </div>
</body>
</html>
`
  }

  const openInternalInvoice = (service: any) => {
    const serviceClient = clients.find((c) => c.id === service.clientId)
    const serviceVehicle = vehicles.find((v) => v.id === service.vehicleId)
    const serviceEmployee = employees.find((e) => e.id === service.employeeId)

    if (!serviceClient) {
      toast({
        title: "Error",
        description: "No se encontraron los datos completos del servicio",
        variant: "destructive",
      })
      return
    }

    // Usar el mismo formato que la factura completa
    const fullInvoiceInfo = {
      service: service,
      client: serviceClient,
      vehicle: serviceVehicle || { plate: "N/A", make: "N/A", model: "N/A", year: "N/A", color: "N/A" },
      employee: serviceEmployee || { name: "No asignado" },
    }

    setFullInvoiceData(fullInvoiceInfo)
    setShowFullInvoiceView(true)
  }

 const processPayment = async () => {
  if (!selectedServiceForPayment) return

  try {
    // Registrar pago en Supabase
    const { data: pagoInsertado, error: pagoError } = await supabase
      .from("pagos")
      .insert([
        {
          servicio_id: selectedServiceForPayment.id,
          metodo_pago: paymentData.paymentMethod,
          monto: paymentData.finalTotal,
          estado: "completado",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (pagoError) throw pagoError

    // Actualizar servicio como pagado en Supabase
    const { error: updateError } = await supabase
      .from("servicios")
      .update({
        pagado: true,
        
      })
      .eq("id", selectedServiceForPayment.id)

    if (updateError) throw updateError

    setShowPaymentModal(false)
    refreshServices()

    toast({
      title: "¡Pago procesado!",
      description: `Pago de $${paymentData.finalTotal.toFixed(2)} registrado exitosamente`,
      variant: "success",
    })
  } catch (error: any) {
    console.error("Error processing payment:", error)
    toast({
      title: "Error",
      description: error?.message || "Hubo un problema al procesar el pago",
      variant: "destructive",
    })
  }
}

  const saveEditedService = async () => {
    if (!selectedServiceForEdit) return

    try {
      // Recalcular totales
      const totals = calculateDetailedTotals()


      setShowEditModal(false)
      refreshServices()

      toast({
        title: "¡Servicio actualizado!",
        description: "Los cambios se han guardado exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error saving edited service:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar los cambios",
        variant: "destructive",
      })
    }
  }

  const addProductToCart = () => {
    if (!selectedProductForSale) {
      toast({
        title: "Error",
        description: "Seleccione un producto",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(productSaleQuantity, 10)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (quantity > selectedProductForSale.quantity) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${selectedProductForSale.quantity} unidades disponibles`,
        variant: "destructive",
      })
      return
    }

    const existingItemIndex = cartProducts.findIndex((item) => item.productId === selectedProductForSale.id)

    if (existingItemIndex >= 0) {
      const updatedProducts = [...cartProducts]
      const newQuantity = updatedProducts[existingItemIndex].quantity + quantity

      if (newQuantity > selectedProductForSale.quantity) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${selectedProductForSale.quantity} unidades disponibles`,
        })
        return
      }

      updatedProducts[existingItemIndex].quantity = newQuantity
      updatedProducts[existingItemIndex].total = newQuantity * selectedProductForSale.price
      setCartProducts(updatedProducts)
    } else {
      const bestPromotion = getBestPromotionForProduct(selectedProductForSale.id)

      let finalPrice = selectedProductForSale.price
      let appliedDiscount = 0
      let productName = selectedProductForSale.name

      if (bestPromotion) {
        appliedDiscount = bestPromotion.discount
        finalPrice = selectedProductForSale.price * (1 - appliedDiscount / 100)
        productName = `${selectedProductForSale.name} (${appliedDiscount}% desc.)`

        toast({
          title: "¡Descuento aplicado!",
          description: `Se aplicó ${appliedDiscount}% de descuento a ${selectedProductForSale.name}`,
          variant: "default",
        })
      }

      const newItem: ServiceProduct = {
        productId: selectedProductForSale.id,
        productName: productName,
        quantity,
        unitPrice: finalPrice,
        total: quantity * finalPrice,
      }
      setCartProducts([...cartProducts, newItem])
    }

    setSelectedProductForSale(null)
    setProductSearch("")
    setProductSaleQuantity("1")

    toast({
      title: "Producto agregado",
      description: `${selectedProductForSale.name} agregado al carrito`,
      variant: "default",
    })
  }

  const removeProductFromCart = (productId: string) => {
    const product = cartProducts.find((p) => p.productId === productId)
    setCartProducts(cartProducts.filter((item) => item.productId !== productId))

    if (product) {
      toast({
        title: "Producto eliminado",
        description: `${product.productName} eliminado del carrito`,
        variant: "default",
      })
    }
  }

  const processProductSale = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      return
    }

    if (cartProducts.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      })
      return
    }

    try {
      

      const now = new Date()
      const totals = calculateCartDetailedTotals()
      const totalAmount = totals.total

      const productsForStorage = []
      for (const item of cartProducts) {
        if (item.isPromotion && item.includedProducts) {
          productsForStorage.push(...item.includedProducts)
        } else {
          productsForStorage.push(item)
        }
      }

      const saleData = {
        id: Date.now().toString(),
        typeId: "product-sale",
        typeName: "Venta de Productos",
        clientId: selectedClient.id,
        vehicleId: selectedVehicle?.id || null,
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        employeeId: selectedEmployee?.id || null,
        basePrice: 0,
        additional: 0,
        discount: totals.totalDiscounts,
        total: totalAmount,
        products: cartProducts,
        notes: serviceNotes, // NUEVO: Incluir observaciones
        status: "Finalizado",
        redemptionApplied: false,
        createdAt: new Date().toISOString(),
      }

  
    
      const fullInvoiceInfo = {
        service: saleData,
        client: selectedClient,
        vehicle: selectedVehicle || { plate: "N/A", make: "N/A", model: "N/A" },
        employee: selectedEmployee || { name: "Venta directa" },
      }

      setFullInvoiceData(fullInvoiceInfo)
      setShowFullInvoiceView(true)
      setLastCreatedService(saleData)

      toast({
        title: "¡Venta registrada!",
        description: `Venta para ${selectedClient.name} procesada exitosamente`,
        variant: "success",
      })

      toggleSimpleForm()
      refreshServices()
    } catch (error) {
      console.error("Error processing sale:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al procesar la venta",
        variant: "destructive",
      })
    }
  }

  const addProductToSimpleService = () => {
    if (!selectedProductIdSimple) {
      toast({
        title: "Error",
        description: "Seleccione un producto o promoción",
        variant: "destructive",
      })
      return
    }

    if (selectedProductIdSimple.startsWith("promo-")) {
      const promoId = selectedProductIdSimple.replace("promo-", "")
      const selectedPromo = promotions.find((p) => p.id === promoId)

      if (!selectedPromo) {
        toast({
          title: "Error",
          description: "Promoción no encontrada",
          variant: "destructive",
        })
        return
      }

      let promoSubtotal = 0
      const promoProducts = []
      const quantity = Number.parseInt(selectedQuantitySimple, 10) || 1

      for (const productId of selectedPromo.products) {
        const product = products.find((p) => p.id === productId)
        if (product) {
          if (product.quantity < quantity) {
            toast({
              title: "Stock insuficiente",
              description: `Solo hay ${product.quantity} unidades disponibles de ${product.name}`,
              variant: "destructive",
            })
            return
          }
          promoSubtotal += product.price * quantity
          promoProducts.push(product)
        }
      }

      const discountAmount = promoSubtotal * (selectedPromo.discount / 100)
      const finalPromoPrice = promoSubtotal - discountAmount

      const promoItem: ServiceProduct = {
        productId: `promo-${selectedPromo.id}`,
        productName: `${selectedPromo.name} (${selectedPromo.discount}% desc.)`,
        quantity: 1,
        unitPrice: finalPromoPrice,
        total: finalPromoPrice,
        isPromotion: true,
        includedProducts: selectedPromo.products
          .map((productId: string) => {
            const product = products.find((p) => p.id === productId)
            if (product) {
              return {
                productId,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                total: product.price * quantity,
              }
            }
            return null
          })
          .filter((item: ServiceProduct | null): item is ServiceProduct => item !== null),
      }

      setSelectedProductsSimple([...selectedProductsSimple, promoItem])

      toast({
        title: "Promoción aplicada",
        description: `Se agregó "${selectedPromo.name}" con ${selectedPromo.discount}% de descuento`,
        variant: "default",
      })

      setSelectedProductIdSimple("")
      setSelectedQuantitySimple("1")
      return
    }

    const product = products.find((p) => p.id === selectedProductIdSimple)
    if (!product) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(selectedQuantitySimple, 10)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (quantity > product.quantity) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${product.quantity} unidades disponibles de ${product.name}`,
        variant: "destructive",
      })
      return
    }

    const existingItemIndex = selectedProductsSimple.findIndex((item) => item.productId === selectedProductIdSimple)

    if (existingItemIndex >= 0) {
      const updatedProducts = [...selectedProductsSimple]
      const newQuantity = updatedProducts[existingItemIndex].quantity + quantity

      if (newQuantity > product.quantity) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${product.quantity} unidades disponibles de ${product.name}`,
        })
        return
      }

      updatedProducts[existingItemIndex].quantity = newQuantity
      updatedProducts[existingItemIndex].total = newQuantity * updatedProducts[existingItemIndex].unitPrice
      setSelectedProductsSimple(updatedProducts)
    } else {
      const bestPromotion = getBestPromotionForProduct(selectedProductIdSimple)

      let finalPrice = product.price
      let appliedDiscount = 0
      let productName = product.name

      if (bestPromotion) {
        appliedDiscount = bestPromotion.discount
        finalPrice = product.price * (1 - appliedDiscount / 100)
        productName = `${product.name} (${appliedDiscount}% desc.)`

        toast({
          title: "¡Descuento aplicado!",
          description: `Se aplicó ${appliedDiscount}% de descuento a ${product.name}`,
          variant: "default",
        })
      }

      const newItem: ServiceProduct = {
        productId: selectedProductIdSimple,
        productName: productName,
        quantity,
        unitPrice: finalPrice,
        total: quantity * finalPrice,
      }
      setSelectedProductsSimple([...selectedProductsSimple, newItem])
    }

    setSelectedProductIdSimple("")
    setSelectedQuantitySimple("1")

    toast({
      title: "Producto agregado",
      description: `${product.name} agregado al servicio`,
      variant: "default",
    })
  }

  const removeProductFromSimpleService = (productId: string) => {
    const product = selectedProductsSimple.find((p) => p.productId === productId)
    setSelectedProductsSimple(selectedProductsSimple.filter((item) => item.productId !== productId))

    if (product) {
      toast({
        title: "Producto eliminado",
        description: `${product.productName} eliminado del servicio`,
        variant: "default",
      })
    }
  }

 const confirmService = async () => {
  // Validación de campos requeridos
  if (!selectedClient || !selectedVehicle || selectedServiceTypes.length === 0 || !selectedEmployee) {
    toast({
      title: "Faltan datos",
      description: "Debe seleccionar cliente, vehículo, al menos un servicio y un empleado.",
      variant: "destructive",
    })
    return
  }

  // Preparar productos (si hay)
  const productos = selectedProductsSimple.length > 0 ? selectedProductsSimple : null

  // Calcular precio final (suma de servicios + productos)
  const precioServicios = selectedServiceTypes.reduce((sum, s) => sum + (s.base_price || 0), 0)
  const precioProductos = productos ? productos.reduce((sum, p) => sum + (p.total || 0), 0) : 0
  const precio_final = precioServicios + precioProductos

  // Preparar objeto para insertar
  const nuevoServicio = {
    cliente_id: selectedClient.id,
    vehiculo_id: selectedVehicle.id,
    tipo_id: selectedServiceTypes[0].id, // Si hay varios, guardar el primero (ajusta si tu tabla permite varios)
    productos: productos ? JSON.stringify(productos) : null,
    notas: serviceNotes || null,
    precio_final,
    descuento: 0, // Ajusta si tienes lógica de descuento
    extra_charges: 0, // Ajusta si tienes lógica de cobros extra
    extra_charges_description: null, // Ajusta si tienes lógica
    pagado: false,
    tipo_servicio: selectedServiceTypes.map((s) => s.name).join(", ") || null,
    created_at: new Date().toISOString(),
  }

  // Guardar en Supabase
  const { data, error } = await supabase
    .from('servicios')
    .insert([nuevoServicio])
    .select()
    .single()

  if (error) {
    toast({
      title: "Error al guardar",
      description: error.message,
      variant: "destructive",
    })
    return
  }

  // Actualizar lista de servicios en el estado
  setServices((prev: any[]) => [data, ...prev])
  setShowSuccessMessage(true)
  setLastCreatedService(data)
  setShowSimpleForm(false)
  // Limpiar selección
  setSelectedClient(null)
  setSelectedVehicle(null)
  setSelectedServiceTypes([])
  setSelectedEmployee(null)
  setSelectedProductsSimple([])
  setServiceNotes("")
  setCurrentStep(1)
}

  const getClientVehicles = () => {
    if (!selectedClient) return []
    return vehicles.filter((v) => v.clientId === selectedClient.id)
  }

  const printInvoice = (service: any, autoPrint = false) => {
    const serviceClient = clients.find((c) => c.id === service.clientId)
    const serviceVehicle = vehicles.find((v) => v.id === service.vehicleId)
    const serviceEmployee = employees.find((e) => e.id === service.employeeId)

    if (!serviceClient) {
      toast({
        title: "Error",
        description: "No se encontraron los datos completos del servicio",
        variant: "destructive",
      })
      return
    }

    setInvoiceService({
      service: service,
      client: serviceClient,
      vehicle: serviceVehicle || { plate: "N/A", make: "N/A", model: "N/A" },
      employee: serviceEmployee || { name: "Venta directa" },
    })
    setShowInvoice(true)
  }

  const closeInvoice = () => {
    setShowInvoice(false)
    setInvoiceService(null)
  }

  const closeFullInvoiceView = () => {
    setShowFullInvoiceView(false)
    setFullInvoiceData(null)
  }

  const printFullInvoice = () => {
    if (!fullInvoiceData) {
      toast({
        title: "Error",
        description: "No hay datos de factura para imprimir",
        variant: "destructive",
      })
      return
    }

    try {
      const printContent = generatePrintableInvoice(fullInvoiceData)

      // Crear una nueva ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600")
      if (!printWindow) {
        alert("Por favor, permita ventanas emergentes para imprimir")
        return
      }

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Cerrar la ventana después de imprimir (opcional)
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 500)
      }
    } catch (error) {
      console.error("Error printing invoice:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al imprimir la factura",
        variant: "destructive",
      })
    }
  }

  const generatePrintableInvoice = (invoiceData: any) => {
    const { service, client, vehicle, employee } = invoiceData

    // Generar lista de servicios si hay servicios seleccionados
    const servicesList =
      service.selectedServices && service.selectedServices.length > 0
        ? service.selectedServices
            .map(
              (serviceItem: any) => `
    <tr>
      <td>${serviceItem.name}</td>
      <td>1</td>
      <td>$${(serviceItem.basePrice || 0).toFixed(2)}</td>
      <td>$${(serviceItem.basePrice || 0).toFixed(2)}</td>
    </tr>
  `,
            )
            .join("")
        : service.basePrice > 0
          ? `
    <tr>
      <td>${service.typeName || "Servicio general"}</td>
      <td>1</td>
      <td>$${(service.basePrice || 0).toFixed(2)}</td>
      <td>$${(service.basePrice || 0).toFixed(2)}</td>
    </tr>
  `
          : ""

    const productsList =
      service.products
        ?.map(
          (product: any) => `
    <tr>
      <td>${product.productName}</td>
      <td>${product.quantity}</td>
      <td>$${product.unitPrice.toFixed(2)}</td>
      <td>$${product.total.toFixed(2)}</td>
    </tr>
  `,
        )
        .join("") || ""

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 15mm;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 5px 0;
          letter-spacing: 1px;
        }
        .header p {
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        .header h2 {
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0 5px 0;
        }
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .client-section, .vehicle-section {
          border: 2px solid #000;
          padding: 12px;
        }
        .client-section h3, .vehicle-section h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        .client-section p, .vehicle-section p {
          margin: 6px 0;
          font-size: 13px;
          font-weight: 500;
        }
        .services-section {
          margin-bottom: 20px;
        }
        .services-section h3 {
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        th {
          font-weight: bold;
        }
      </style>
  </head>
  <body>
    <div class="header">
      <h1>ZONA GARAJE</h1>
      <p>Tu carro en buenas manos</p>
      <h2>FACTURA DE SERVICIO</h2>
      <p>No. ${service.id?.slice(-8) || "N/A"}</p>
    </div>

    <div class="info-section">
      <div class="client-section">
        <h3>CLIENTE</h3>
        <p>Nombre: ${client?.name || "N/A"}</p>
        <p>Telefono: ${client?.phone || "N/A"}</p>
      </div>

      <div class="vehicle-section">
        <h3>VEHICULO</h3>
        <p>Placa: ${vehicle?.plate || "N/A"}</p>
        <p>Marca: ${vehicle?.make || "N/A"}</p>
        <p>Modelo: ${vehicle?.model || "N/A"}</p>
        <p>Trabajador: ${employee?.name || "N/A"}</p>
      </div>
    </div>

    <div class="services-section">
      <h3>SERVICIOS Y PRODUCTOS</h3>
      <table>
        <thead>
          <tr>
            <th>Descripcion</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${servicesList}
          ${
            service.additional > 0
              ? `
            <tr>
              <td>Trabajo adicional</td>
              <td>1</td>
              <td>$${(service.additional || 0).toFixed(2)}</td>
              <td>$${(service.additional || 0).toFixed(2)}</td>
            </tr>
          `
              : ""
          }
          ${productsList}
          ${
            service.extraCharges > 0
              ? `
            <tr>
              <td>${service.extraChargesDescription || "Cobro adicional"}</td>
              <td>1</td>
              <td>$${(service.extraCharges || 0).toFixed(2)}</td>
              <td>$${(service.extraCharges || 0).toFixed(2)}</td>
            </tr>
          `
              : ""
          }
        </tbody>
      </table>
    </div>

    ${
      service.discount > 0
        ? `
      <div style="text-align: right; margin: 10px 0; border: 1px solid #000; padding: 10px; background-color: #f0f8ff;">
        <p style="font-size: 14px; font-weight: bold; margin: 0; color: #006400;">DESCUENTO APLICADO: -$${(service.discount || 0).toFixed(2)}</p>
      </div>
    `
        : ""
    }

    <div style="text-align: right; margin: 20px 0; border: 1px solid #000; padding: 15px;">
      <p style="font-size: 16px; font-weight: bold; margin: 0;">TOTAL A PAGAR: $${(service.finalTotal || service.total || 0).toFixed(2)}</p>
    </div>

    ${
      service.notes
        ? `
      <div style="margin: 20px 0; border: 1px solid #000; padding: 15px;">
        <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">OBSERVACIONES</h3>
        <p style="margin: 0; font-size: 12px;">${service.notes}</p>
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin-top: 30px; border-top: 1px solid #000; padding-top: 15px;">
      <p style="margin: 5px 0; font-size: 12px;">Gracias por confiar en Zona Garaje</p>
      <p style="margin: 5px 0; font-size: 12px;">Conserve esta factura para consultas</p>
    </div>
  </body>
  </html>
`
  }

  const createNewClient = () => {
    if (!newClientName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }
    if (!newClientPhone.trim()) {
      toast({
        title: "Error",
        description: "El teléfono es obligatorio",
        variant: "destructive",
      })
      return
    }

    // Verificar si el cliente ya existe
    const clientExists = clients.some(
      (c) => c.phone === newClientPhone.trim() || c.name.toLowerCase() === newClientName.trim().toLowerCase(),
    )

    if (clientExists) {
      toast({
        title: "Cliente duplicado",
        description: "Ya existe un cliente con este nombre o teléfono",
        variant: "destructive",
      })
      return
    }

    const newClient = {
      id: Date.now().toString() + "_client",
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
      createdAt: new Date().toISOString(),
    }

    const updatedClients = [...clients, newClient]
    setClients(updatedClients)
    setSelectedClient(newClient)
    setClientSearch(newClient.name)
    setFilteredClients([])
    setShowClientSuggestions(false)

    toast({
      title: "Cliente creado",
      description: `Cliente ${newClient.name} creado exitosamente`,
      variant: "success",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Servicios</h2>
        <button onClick={toggleSimpleForm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          {showSimpleForm ? "Cancelar" : "Nuevo Servicio"}
        </button>
      </div>

      {/* Success Message */}
      {showSuccessMessage && lastCreatedService && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">¡Servicio creado exitosamente!</h3>
              <p className="text-green-600 text-sm">
Servicio #{lastCreatedService.id} - Total: ${(lastCreatedService.precio_final ?? 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => printInvoice(lastCreatedService)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Ver Factura
            </button>
          </div>
        </div>
      )}

      {/* Simple Form - NUEVO FLUJO MEJORADO */}
      {showSimpleForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Registro de Nuevo Servicio</h3>

          {/* Product Sales Only Section */}
          {showProductSalesSection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium">Venta Directa de Productos</h4>
                <button onClick={() => setShowProductSalesSection(false)} className="text-gray-500 hover:text-gray-700">
                  ← Volver
                </button>
              </div>

              {/* Client Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showClientSuggestions && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => selectExistingClient(client)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                    <div className="text-green-600">✓</div>
                    <div>
                      <div className="font-medium">{selectedClient.name}</div>
                      <div className="text-sm text-gray-500">{selectedClient.phone}</div>
                    </div>
                  </div>
                )}

                {!selectedClient && clientSearch && filteredClients.length === 0 && (
                  <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 mb-3">Cliente no encontrado. Crear nuevo:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nombre"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Teléfono"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={createNewClient}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      Crear Cliente
                    </button>
                  </div>
                )}
              </div>

              {/* Product Search */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Buscar Producto</label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setSelectedProductForSale(product)
                            setProductSearch(product.name)
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            Stock: {product.quantity} - ${product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProductForSale && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                    <div className="text-green-600">✓</div>
                    <div>
                      <div className="font-medium">{selectedProductForSale.name}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {selectedProductForSale.quantity} - ${selectedProductForSale.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  value={productSaleQuantity}
                  onChange={(e) => setProductSaleQuantity(e.target.value)}
                  placeholder="Cantidad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addProductToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Agregar al Carrito
              </button>

              {/* Cart Display */}
              {cartProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Carrito</h4>
                  <div className="space-y-2">
                    {cartProducts.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">
                            Cantidad: {item.quantity} - Total: ${item.total.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeProductFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-right font-semibold">
                    Total: ${cartProducts.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Agregar observaciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Process Sale Button */}
              <button
                onClick={processProductSale}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Procesar Venta
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Client Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
                      1
                    </div>
                    <h4 className="text-lg font-medium">Seleccionar Cliente</h4>
                    <p className="text-gray-600">Seleccione un cliente existente o cree uno nuevo para continuar.</p>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => selectClientMode("existing")}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-md"
                    >
                      Cliente Existente
                    </button>
                    <button
                      onClick={() => selectClientMode("new")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md"
                    >
                      Nuevo Cliente
                    </button>
                    <button
                      onClick={() => setShowProductSalesSection(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md"
                    >
                      Solo Venta de Productos
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1.5: Existing Client Selection */}
              {clientSelectionMode === "existing" && currentStep === 1.5 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
                      1.5
                    </div>
                    <h4 className="text-lg font-medium">Buscar Cliente Existente</h4>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Buscar Cliente</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showClientSuggestions && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => selectExistingClient(client)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1.5: New Client Form */}
              {clientSelectionMode === "new" && currentStep === 1.5 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
                      1.5
                    </div>
                    <h4 className="text-lg font-medium">Registrar Nuevo Cliente</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nombre"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Apellido *</label>
                      <input
                        type="text"
                        value={newClientLastName}
                        onChange={(e) => setNewClientLastName(e.target.value)}
                        placeholder="Apellido"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico *</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Correo Electrónico"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Teléfono *</label>
                    <input
                      type="tel"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="Teléfono"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Dirección *</label>
                    <input
                      type="text"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      placeholder="Dirección"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cédula *</label>
                    <input
                      type="text"
                      value={newClientCedula}
                      onChange={(e) => setNewClientCedula(e.target.value)}
                      placeholder="V-12345678 o E-12345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={createNewClientAndProceed}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Registrar Cliente
                  </button>
                </div>
              )}

              {/* Step 2: Vehicle Selection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
                      2
                    </div>
                    <h4 className="text-lg font-medium">Seleccionar Vehículo</h4>
                  </div>
                  {getClientVehicles().length > 0 ? (
                    <>
                      <p className="text-gray-600">Seleccione un vehículo existente o registre uno nuevo.</p>
                      <div className="space-y-2">
                        {getClientVehicles().map((vehicle) => (
                          <div
                            key={vehicle.id}
                            onClick={() => selectExistingVehicle(vehicle)}
                            className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="font-medium">{vehicle.plate}</div>
                            <div className="text-sm text-gray-500">
                              {vehicle.make} {vehicle.model}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">Este cliente no tiene vehículos registrados.</p>
                  )}

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-3">Registrar Nuevo Vehículo:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newVehicleMake}
                        onChange={(e) => setNewVehicleMake(e.target.value)}
                        placeholder="Marca"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newVehicleModel}
                        onChange={(e) => setNewVehicleModel(e.target.value)}
                        placeholder="Modelo"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={newVehicleYear}
                        onChange={(e) => setNewVehicleYear(e.target.value)}
                        placeholder="Año"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newVehicleColor}
                        onChange={(e) => setNewVehicleColor(e.target.value)}
                        placeholder="Color"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newVehiclePlate}
                        onChange={(e) => setNewVehiclePlate(e.target.value)}
                        placeholder="Placa"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newVehicleSeatType}
                        onChange={(e) => setNewVehicleSeatType(e.target.value as "Cuero" | "Tela" | "")}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tipo de Asientos</option>
                        <option value="Cuero">Cuero</option>
                        <option value="Tela">Tela</option>
                      </select>
                    </div>
                    <button
                      onClick={createNewVehicleAndProceed}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      Registrar Vehículo
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Service Type Selection */}
             {currentStep === 3 && (
  <div className="space-y-4">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
        3
      </div>
      <h4 className="text-lg font-medium">Seleccionar Servicios</h4>
      <p className="text-gray-600">Seleccione los servicios a realizar.</p>
    </div>
    <div className="space-y-2">
      {serviceTypes.map((serviceType) => (
        <div
          key={serviceType.id}
          onClick={() => selectServiceType(serviceType)}
          className={`p-3 border rounded-md cursor-pointer transition-colors ${
            selectedServiceTypes.some((selected) => selected.id === serviceType.id)
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium">{serviceType.name}</div>
            <div className="text-sm font-semibold">${serviceType.base_price.toFixed(2)}</div>
          </div>
          <div className="text-xs text-gray-500">{serviceType.description}</div>
        </div>
      ))}
    </div>
    {selectedServiceTypes.length > 0 && (
      <button
        onClick={() => setCurrentStep(4)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-4"
      >
        Continuar con {selectedServiceTypes.length} servicio{selectedServiceTypes.length > 1 ? "s" : ""} seleccionado{selectedServiceTypes.length > 1 ? "s" : ""}
      </button>
    )}
  </div>
)}

              {/* Step 4: Employee Selection */}
              {currentStep === 4 && (
  <div>
    <h3>Asignar Empleado</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.length === 0 ? (
        <div className="text-gray-500">No hay empleados activos disponibles.</div>
      ) : (
        employees.map((employee) => (
          <button
            key={employee.id}
            className={`p-4 border rounded-lg ${selectedEmployee?.id === employee.id ? "bg-yellow-100" : "bg-white"}`}
            onClick={() => selectEmployee(employee)}
            type="button"
          >
            <div className="font-bold">{employee.nombre}</div>
            <div className="text-xs text-gray-500">{employee.cargo}</div>
          </button>
        ))
      )}
    </div>
  </div>
)}

              {/* Step 5: Confirm Service */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold mb-2">
                      5
                    </div>
                    <h4 className="text-lg font-medium">Confirmar Servicio</h4>
                    <p className="text-gray-600">Confirme los detalles del servicio antes de guardar.</p>
                  </div>

                  {/* Selected Client */}
                  {selectedClient && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <div className="text-blue-600">👤</div>
                      <div>
                        <div className="font-medium">Cliente: {selectedClient.name}</div>
                        <div className="text-sm text-gray-500">Teléfono: {selectedClient.phone}</div>
                      </div>
                    </div>
                  )}

                  {/* Selected Vehicle */}
                  {selectedVehicle && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <div className="text-blue-600">🚗</div>
                      <div>
                        <div className="font-medium">
                          Vehículo: {selectedVehicle.make} {selectedVehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">Placa: {selectedVehicle.plate}</div>
                      </div>
                    </div>
                  )}

                  {/* Selected Services */}
                  {selectedServiceTypes.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <h5 className="font-medium mb-2">Servicios Seleccionados:</h5>
                      <ul className="space-y-1">
                        {selectedServiceTypes.map((service) => (
                          <li key={service.id} className="text-sm flex justify-between">
                            <span>{service.name}</span>
<span>${(service.base_price ?? 0).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Selected Employee */}
                  {selectedEmployee && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <div className="text-blue-600">👷</div>
                      <div>
                        <div className="font-medium">Empleado: {selectedEmployee.name}</div>
                        <div className="text-sm text-gray-500">Rol: {selectedEmployee.role}</div>
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Agregar Producto o Promoción</label>
                    <select
                      value={selectedProductIdSimple}
                      onChange={(e) => setSelectedProductIdSimple(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar Producto o Promoción</option>
                      <optgroup label="Productos">
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price.toFixed(2)} (Stock: {product.quantity})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Promociones">
                        {promotions.map((promo) => (
                          <option key={promo.id} value={`promo-${promo.id}`}>
                            {promo.name} ({promo.discount}% desc.)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                      type="number"
                      value={selectedQuantitySimple}
                      onChange={(e) => setSelectedQuantitySimple(e.target.value)}
                      placeholder="Cantidad"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={addProductToSimpleService}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Agregar Producto
                  </button>

                  {selectedProductsSimple.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <h5 className="font-medium mb-2">Productos Agregados:</h5>
                      <ul className="space-y-2">
                        {selectedProductsSimple.map((product) => (
                          <li key={product.productId} className="flex justify-between items-center text-sm">
                            <span>
                              {product.productName} x {product.quantity}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span>${product.total.toFixed(2)}</span>
                              <button
                                onClick={() => removeProductFromSimpleService(product.productId)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <textarea
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      placeholder="Agregar observaciones..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={confirmService}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Confirmar Servicio
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Services List */}
      {!showSimpleForm && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Servicios Registrados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
  const serviceClient = clients.find((c) => c.id === service.cliente_id)
  const serviceVehicle = vehicles.find((v) => v.id === service.vehiculo_id)
  const fecha = service.created_at ? new Date(service.created_at) : null
  const total = service.precio_final ?? 0

  return (
    <div key={service.id} className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="font-medium text-sm">#{service.id?.slice(-8) ?? service.id}</div>
          <div className="text-sm text-gray-600">{serviceClient?.name || "Cliente no encontrado"}</div>
          <div className="text-xs text-gray-500">
            {serviceVehicle?.plate || "Sin vehículo"} - {service.tipo_servicio || ""}
          </div>
          <div className="text-xs text-gray-500">
            {fecha ? fecha.toLocaleDateString() : "Sin fecha"} - ${Number(total).toFixed(2)}
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            service.pagado
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {service.pagado ? "Pagado" : "Pendiente"}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        {!service.pagado && (
          <button
            onClick={() => openPaymentModal(service)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
          >
            Pagar
          </button>
        )}
        <button
          onClick={() => openEditModal(service)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
        >
          Editar
        </button>
        <button
          onClick={() => openInternalInvoice(service)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs"
        >
          Factura
        </button>
        <button
          onClick={() => openClientReception(service)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs"
        >
          Hoja Cliente
        </button>
      </div>
    </div>
  )
})}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedServiceForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Procesar Pago</h3>
            <p className="text-gray-600 mb-4">
              Servicio: {selectedServiceForPayment.typeName} - Cliente:{" "}
              {clients.find((c) => c.id === selectedServiceForPayment.clientId)?.name || "Cliente no encontrado"}
            </p>

            <div className="space-y-4">
              {/* Discount Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Descuento</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={paymentData.discountType}
                    onChange={(e) => setPaymentData({ ...paymentData, discountType: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Valor Fijo</option>
                  </select>
                  <input
                    type="number"
                    value={paymentData.discountValue}
                    onChange={(e) => setPaymentData({ ...paymentData, discountValue: e.target.value })}
                    placeholder="Valor del descuento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Extra Charges Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Cobros Extra</label>
                <input
                  type="number"
                  value={paymentData.extraCharges}
                  onChange={(e) => setPaymentData({ ...paymentData, extraCharges: e.target.value })}
                  placeholder="Valor de cobros extra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={paymentData.extraChargesDescription}
                  onChange={(e) => setPaymentData({ ...paymentData, extraChargesDescription: e.target.value })}
                  placeholder="Descripción de cobros extra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Efectivo</option>
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                  <option value="transfer">Transferencia</option>
                  <option value="zelle">Zelle</option>
                  <option value="binance">Binance</option>
                </select>
              </div>

              {/* Final Total Display */}
              <div className="text-right font-semibold">Total Final: ${paymentData.finalTotal.toFixed(2)}</div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Procesar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedServiceForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Servicio</h3>
            <p className="text-gray-600 mb-4">
              Servicio: {selectedServiceForEdit.typeName} - Cliente:{" "}
              {clients.find((c) => c.id === selectedServiceForEdit.clientId)?.name || "Cliente no encontrado"}
            </p>

            <div className="space-y-4">
              {/* Products Section */}
              <div className="space-y-2">
                <h4 className="font-medium">Productos</h4>
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.quantity} - ${product.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={selectedProductsSimple.find((p) => p.productId === product.id)?.quantity || 0}
                        onChange={(e) => {
                          const quantity = Number.parseInt(e.target.value, 10) || 0
                          if (quantity <= product.quantity) {
                            const existingItemIndex = selectedProductsSimple.findIndex(
                              (item) => item.productId === product.id,
                            )

                            if (existingItemIndex >= 0) {
                              const updatedProducts = [...selectedProductsSimple]
                              updatedProducts[existingItemIndex].quantity = quantity
                              updatedProducts[existingItemIndex].total = quantity * product.price
                              setSelectedProductsSimple(updatedProducts)
                            } else {
                              const newItem: ServiceProduct = {
                                productId: product.id,
                                productName: product.name,
                                quantity,
                                unitPrice: product.price,
                                total: quantity * product.price,
                              }
                              setSelectedProductsSimple([...selectedProductsSimple, newItem])
                            }
                          } else {
                            toast({
                              title: "Stock insuficiente",
                              description: `Solo hay ${product.quantity} unidades disponibles`,
                              variant: "destructive",
                            })
                          }
                        }}
                        placeholder="Cantidad"
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const productToRemove = selectedProductsSimple.find((p) => p.productId === product.id)
                          if (productToRemove) {
                            setSelectedProductsSimple(
                              selectedProductsSimple.filter((item) => item.productId !== product.id),
                            )
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Agregar observaciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditedService}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Sheet Modal */}
      {showPrintSheet && printSheetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Hoja de Inspección</h3>
            <p className="text-gray-600 mb-4">
              Servicio: {printSheetData.service.typeName} - Cliente: {printSheetData.client.name}
            </p>

            <div className="space-y-4">
              {/* Client Info */}
              <div>
                <h4 className="font-medium">Cliente</h4>
                <p>Nombre: {printSheetData.client.name}</p>
                <p>Teléfono: {printSheetData.client.phone}</p>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-medium">Vehículo</h4>
                <p>Placa: {printSheetData.vehicle.plate}</p>
                <p>Marca: {printSheetData.vehicle.make}</p>
                <p>Modelo: {printSheetData.vehicle.model}</p>
              </div>

              {/* Services Info */}
              <div>
                <h4 className="font-medium">Servicios</h4>
                <ul>
                  {printSheetData.service.products?.map((product: any) => (
                    <li key={product.productId}>{product.productName}</li>
                  )) || <li>{printSheetData.service.typeName}</li>}
                </ul>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium">Notas</h4>
                <p>{printSheetData.service.notes}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closePrintSheet}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Lógica para imprimir la hoja de inspección
                    window.print()
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Reception Modal */}
      {showClientReception && receptionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Hoja de Recepción del Cliente</h3>
            <p className="text-gray-600 mb-4">
              Servicio: {receptionData.service.typeName} - Cliente: {receptionData.client.name}
            </p>

            <div className="space-y-4">
              {/* Client Info */}
              <div>
                <h4 className="font-medium">Cliente</h4>
                <p>Nombre: {receptionData.client.name}</p>
                <p>Teléfono: {receptionData.client.phone}</p>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-medium">Vehículo</h4>
                <p>Placa: {receptionData.vehicle.plate}</p>
                <p>Marca: {receptionData.vehicle.make}</p>
                <p>Modelo: {receptionData.vehicle.model}</p>
              </div>

              {/* Services Info */}
              <div>
                <h4 className="font-medium">Servicios</h4>
                <ul>
                  {receptionData.service.products?.map((product: any) => (
                    <li key={product.productId}>{product.productName}</li>
                  )) || <li>{receptionData.service.typeName}</li>}
                </ul>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium">Notas</h4>
                <p>{receptionData.service.notes}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowClientReception(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={printClientReception}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Invoice Modal */}
      {showFullInvoiceView && fullInvoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Factura Interna</h3>
            <p className="text-gray-600 mb-4">
              Servicio: {fullInvoiceData.service.typeName} - Cliente: {fullInvoiceData.client.name}
            </p>

            <div className="space-y-4">
              {/* Client Info */}
              <div>
                <h4 className="font-medium">Cliente</h4>
                <p>Nombre: {fullInvoiceData.client.name}</p>
                <p>Teléfono: {fullInvoiceData.client.phone}</p>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-medium">Vehículo</h4>
                <p>Placa: {fullInvoiceData.vehicle.plate}</p>
                <p>Marca: {fullInvoiceData.vehicle.make}</p>
                <p>Modelo: {fullInvoiceData.vehicle.model}</p>
              </div>

              {/* Services Info */}
              <div>
                <h4 className="font-medium">Servicios</h4>
                <ul>
                  {fullInvoiceData.service.products?.map((product: any) => (
                    <li key={product.productId}>{product.productName}</li>
                  )) || <li>{fullInvoiceData.service.typeName}</li>}
                </ul>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium">Notas</h4>
                <p>{fullInvoiceData.service.notes}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeFullInvoiceView}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={printFullInvoice}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
