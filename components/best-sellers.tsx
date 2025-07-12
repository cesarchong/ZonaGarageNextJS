"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import type { Pagos } from "@/interfaces/pagos.interface"
import type { Productos } from "@/interfaces/productos.interface"
import type { Promocion } from "@/interfaces/promociones.interface"
import type { Servicios } from "@/interfaces/servicios.interface"
import type { TipoServicio } from "@/interfaces/tipos-servicio.interface"
import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
import { formatCurrency } from "@/lib/utils"
import { useEffect, useState } from "react"

// Tipos de datos para el análisis
interface ProductSalesData {
  id: string
  nombre: string
  categoria: string
  precio_venta: number
  cantidad_disponible: number
  costo: number
  cantidad_vendida: number
  ingresos: number
}

interface ProductionStats {
  totalSold: number
  totalRevenue: number
  averagePrice: number
  uniqueProducts: number
}

export default function BestSellers() {
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductSalesData[]>([])
  const [promotions, setPromotions] = useState<Promocion[]>([])
  const [allProducts, setAllProducts] = useState<Productos[]>([])
  const [servicios, setServicios] = useState<Servicios[]>([])
  const [pagos, setPagos] = useState<Pagos[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<string>("month")
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [showCustomDateFilter, setShowCustomDateFilter] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promocion | null>(null)
  const [promotionData, setPromotionData] = useState({
    name: "",
    descripcion: "",
    precio_promocional: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
  })
  const [selectedProducts, setSelectedProducts] = useState<{id: string, cantidad: number}[]>([])
  const [selectedServices, setSelectedServices] = useState<{id: string, cantidad: number}[]>([])
  const [allServices, setAllServices] = useState<TipoServicio[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [productQuantity, setProductQuantity] = useState(1)
  const [serviceQuantity, setServiceQuantity] = useState(1) // Para cargar tipos de servicios disponibles

  // Cargar datos
  useEffect(() => {
    loadData()
    loadTiposServicios()
  }, [])

  // Recargar datos cuando cambie el filtro de tiempo
  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [timeFilter, customDateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productosData, serviciosData, pagosData, promocionesData] = await Promise.all([
        getCollection("productos") as Promise<Productos[]>,
        getCollection("servicios") as Promise<Servicios[]>,
        getCollection("pagos") as Promise<Pagos[]>,
        getCollection("promociones") as Promise<Promocion[]>,
      ])

      setAllProducts(productosData)
      
      // Agregar el ID del documento Firebase a cada promoción
      const promocionesConFirebaseId = (promocionesData as any[]).map(promo => ({
        ...promo,
        firebaseId: promo.id, // El ID que viene de getCollection es el ID del documento de Firebase
        id: promo.id_interno || `promo-${Date.now()}` // Usar el ID interno o crear uno nuevo
      }))
      setPromotions(promocionesConFirebaseId as Promocion[])
      
      // Filtrar servicios por el rango de fechas seleccionado
      const filteredServicios = filterServicesByDateRange(serviciosData)
      setServicios(filteredServicios)

      // Filtrar pagos por el rango de fechas seleccionado
      const filteredPagos = pagosData.filter((pago) => {
        const { start, end } = getDateRange()
        const pagoDate = new Date(pago.fecha_pago)
        return pagoDate >= start && pagoDate < end
      })
      setPagos(filteredPagos)

      // Procesar datos de ventas para calcular productos más vendidos
      const productSalesMap = new Map<string, ProductSalesData>()

      // Procesar solo servicios filtrados por fecha (no procesar pagos por separado para evitar doble conteo)
      filteredServicios.forEach((servicio) => {
        if (Array.isArray(servicio.productos) && servicio.productos.length > 0) {
          servicio.productos.forEach((producto: any) => {
            if (producto.id && !producto.id.startsWith("promo-")) {
              processProductSale(producto, productSalesMap, productosData)
            }
          })
        }
      })

      // Convertir Map a Array
      const salesData = Array.from(productSalesMap.values())
        .filter((product) => product.cantidad_vendida > 0)
        .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)

      setProducts(salesData)
      console.log("Datos cargados:", {
        productos: productosData.length,
        serviciosTotales: serviciosData.length,
        serviciosFiltrados: filteredServicios.length,
        pagosTotales: pagosData.length,
        pagosFiltrados: filteredPagos.length,
        promociones: promocionesData.length,
        productosConVentas: salesData.length,
      })
      console.log("Servicios filtrados detalle:", filteredServicios.map(s => ({
        id: s.id,
        precio_total: s.precio_total,
        productos: s.productos?.length || 0,
        fecha: s.fecha_servicio
      })))
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar tipos de servicios disponibles
  const loadTiposServicios = async () => {
    try {
      const tiposServiciosData = await getCollection('tipos_servicio')
      // Filtrar solo servicios activos
      const serviciosActivos = (tiposServiciosData as TipoServicio[]).filter(servicio => servicio.estado === true)
      setAllServices(serviciosActivos)
    } catch (error) {
      console.error('Error loading tipos servicios:', error)
    }
  }

  // Función auxiliar para procesar cada producto vendido
  const processProductSale = (producto: any, productSalesMap: Map<string, ProductSalesData>, productosData: Productos[]) => {
    const productId = producto.id || producto.producto_id
    if (!productId) return

    const cantidad = Number(producto.cantidad || producto.quantity || 1)
    const precio = Number(producto.precio_venta || producto.price || 0)
    const ingresos = precio * cantidad

    if (productSalesMap.has(productId)) {
      const existing = productSalesMap.get(productId)!
      productSalesMap.set(productId, {
        ...existing,
        cantidad_vendida: existing.cantidad_vendida + cantidad,
        ingresos: existing.ingresos + ingresos,
      })
    } else {
      // Buscar información del producto en la base de datos
      const productInfo = productosData.find((p) => p.id === productId)
      if (productInfo) {
        productSalesMap.set(productId, {
          id: productId,
          nombre: productInfo.nombre,
          categoria: productInfo.id_categoria,
          precio_venta: productInfo.precio_venta,
          costo: productInfo.costo,
          cantidad_disponible: Number(productInfo.cantidad_disponible),
          cantidad_vendida: cantidad,
          ingresos: ingresos,
        })
      }
    }
  }

  // Productos con ventas positivas (para mostrar en la lista principal)
  const getProductsWithSales = () => {
    return products.filter((product) => product.cantidad_vendida > 0)
  }

  // Productos recomendados (bajo stock pero con ventas)
  const getRecommendedProducts = () => {
    return allProducts
      .filter((product) => {
        const cantidad = parseInt(product.cantidad_disponible.toString())
        return cantidad > 5 && cantidad > 0
      })
      .sort((a, b) => {
        const aData = products.find(p => p.id === a.id)
        const bData = products.find(p => p.id === b.id)
        const aSold = aData?.cantidad_vendida || 0
        const bSold = bData?.cantidad_vendida || 0
        return bSold - aSold
      })
      .slice(0, 5)
  }

  // Obtener estadísticas del período
  const getProductionStats = (): ProductionStats => {
    // Para productos vendidos, usar los datos procesados
    const filtered = getProductsWithSales()
    const totalSold = filtered.reduce((sum, product) => sum + product.cantidad_vendida, 0)
    
    // Los ingresos totales se calculan solo desde los productos vendidos
    const totalRevenue = filtered.reduce((sum, product) => sum + product.ingresos, 0)
    
    // Calcular precio promedio basado en los ingresos de productos
    const averagePrice = totalSold > 0 ? totalRevenue / totalSold : 0

    return {
      totalSold,
      totalRevenue,
      averagePrice,
      uniqueProducts: filtered.length,
    }
  }

  // Crear o editar promoción
  const createPromotion = async () => {
    if (selectedProducts.length === 0 && selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un producto o servicio para la promoción",
        variant: "destructive",
      })
      return
    }

    if (!promotionData.name) {
      toast({
        title: "Error",
        description: "Ingresa un nombre para la promoción",
        variant: "destructive",
      })
      return
    }

    if (promotionData.precio_promocional <= 0) {
      toast({
        title: "Error",
        description: "El precio promocional debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    // Procesar productos seleccionados (sin aplicar descuentos, solo capturar información)
    const productosPromocion = selectedProducts.map(producto => {
      const { id, cantidad } = producto
      const productoBase = allProducts.find(p => p.id === id)
      if (!productoBase) return null

      return {
        id: productoBase.id,
        nombre: productoBase.nombre,
        precio_original: productoBase.precio_venta,
        precio_promocion: productoBase.precio_venta, // Se mantiene el precio original, el descuento se aplica en el total
        cantidad_disponible: productoBase.cantidad_disponible,
        cantidad_promocion: cantidad,
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)

    // Procesar servicios seleccionados (sin aplicar descuentos, solo capturar información)
    const serviciosPromocion = selectedServices.map(service => {
      const { id, cantidad } = service
      const servicioBase = allServices.find(s => s.id === id)
      if (!servicioBase) return null
      
      const precioBase = typeof servicioBase.precio_base === 'string' 
        ? parseFloat(servicioBase.precio_base) 
        : (servicioBase.precio_base || 0)

      return {
        id: servicioBase.id,
        nombre: servicioBase.nombre,
        precio_original: precioBase,
        precio_promocion: precioBase, // Se mantiene el precio original, el descuento se aplica en el total
        descripcion: servicioBase.descripcion || "",
        cantidad_promocion: cantidad,
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null)

    // Calcular precio total original considerando las cantidades
    const precioTotalOriginal = [
      ...productosPromocion.map(p => p.precio_original * p.cantidad_promocion),
      ...serviciosPromocion.map(s => s.precio_original * s.cantidad_promocion)
    ].reduce((sum, precio) => sum + precio, 0)

    const promotionToSave: any = {
      id_interno: editingPromotion ? editingPromotion.id : `promo-${Date.now()}`, // ID interno para la lógica
      nombre: promotionData.name,
      descripcion: promotionData.descripcion,
      productos: productosPromocion,
      lista_servicios: serviciosPromocion,
      precio_total_original: precioTotalOriginal,
      precio_total_promocional: promotionData.precio_promocional,
      fecha_inicio: promotionData.startDate,
      fecha_fin: promotionData.endDate,
      fecha_creacion: editingPromotion ? editingPromotion.fecha_creacion : new Date().toISOString(),
      usos_realizados: editingPromotion ? editingPromotion.usos_realizados : 0,
      activa: editingPromotion ? editingPromotion.activa : true,
    }

    try {
      if (editingPromotion && editingPromotion.firebaseId) {
        // Actualizar promoción existente usando el firebaseId
        await updateDocument(`promociones/${editingPromotion.firebaseId}`, promotionToSave)
        toast({
          title: "Promoción actualizada",
          description: `La promoción "${promotionData.name}" ha sido actualizada exitosamente`,
        })
      } else {
        // Crear nueva promoción
        await addDocument("promociones", promotionToSave)
        toast({
          title: "Promoción creada",
          description: `La promoción "${promotionData.name}" ha sido creada exitosamente`,
        })
      }

      await loadData() // Recargar datos
      closePromotionModal() // Resetear formulario
    } catch (error) {
      console.error("Error saving promotion:", error)
      toast({
        title: "Error",
        description: `Error al ${editingPromotion ? 'actualizar' : 'crear'} la promoción`,
        variant: "destructive",
      })
    }
  }

  // Cambiar estado de promoción
  const togglePromotionStatus = async (id: string) => {
    try {
      const promotion = promotions.find((p) => p.id === id)
      if (!promotion || !promotion.firebaseId) return

      const updatedPromotion = { ...promotion, activa: !promotion.activa }
      
      await updateDocument(`promociones/${promotion.firebaseId}`, updatedPromotion)
      await loadData() // Recargar datos

      toast({
        title: updatedPromotion.activa ? "Promoción activada" : "Promoción desactivada",
        description: `La promoción "${promotion.nombre}" ha sido ${updatedPromotion.activa ? "activada" : "desactivada"}`,
      })
    } catch (error) {
      console.error("Error toggling promotion status:", error)
      toast({
        title: "Error",
        description: "Error al cambiar el estado de la promoción",
        variant: "destructive",
      })
    }
  }

  // Eliminar promoción
  const deletePromotion = async (id: string) => {
    try {
      const promotion = promotions.find((p) => p.id === id)
      if (!promotion || !promotion.firebaseId) return

      await deleteDocument(`promociones/${promotion.firebaseId}`)
      await loadData() // Recargar datos

      toast({
        title: "Promoción eliminada",
        description: "La promoción ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la promoción",
        variant: "destructive",
      })
    }
  }

  // Obtener el nombre del período actual
  const getCurrentPeriodName = () => {
    switch (timeFilter) {
      case "week":
        return "esta semana"
      case "month":
        return "este mes"
      case "quarter":
        return "este trimestre"
      case "year":
        return "este año"
      case "custom":
        return "período personalizado"
      default:
        return "este mes"
    }
  }

  // Funciones auxiliares para verificar si un producto está incluido en promoción
  const isProductInPromotion = (productId: string) => {
    return promotions.some((promo) => 
      promo.activa && promo.productos.some(p => p.id === productId)
    )
  }

  const getProductPromotion = (productId: string) => {
    return promotions.find((promo) => 
      promo.activa && promo.productos.some(p => p.id === productId)
    )
  }

  const isServiceInPromotion = (serviceId: string) => {
    return promotions.some((promo) => 
      promo.activa && promo.lista_servicios.some(s => s.id === serviceId)
    )
  }

  const getServicePromotion = (serviceId: string) => {
    return promotions.find((promo) => 
      promo.activa && promo.lista_servicios.some(s => s.id === serviceId)
    )
  }

  // Obtener rango de fechas según el filtro seleccionado
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (timeFilter) {
      case "week":
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      
      case "quarter":
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
        return { start: quarterStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1)
        return { start: yearStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      
      case "custom":
        return {
          start: new Date(customDateRange.start),
          end: new Date(new Date(customDateRange.end).getTime() + 24 * 60 * 60 * 1000)
        }
      
      default: // "today"
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }
  }

  // Filtrar servicios por el rango de fechas seleccionado
  const filterServicesByDateRange = (services: Servicios[]) => {
    const { start, end } = getDateRange()
    return services.filter((service) => {
      const serviceDate = new Date(service.fecha_servicio)
      return serviceDate >= start && serviceDate < end
    })
  }

  // Funciones para manejar productos en promoción
  const addProductToPromotion = (productId: string) => {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    const availableStock = parseInt(product.cantidad_disponible.toString())
    if (availableStock < productQuantity) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${availableStock} unidades disponibles de ${product.nombre}`,
        variant: "destructive",
      })
      return
    }

    const existingIndex = selectedProducts.findIndex(p => p.id === productId)
    if (existingIndex >= 0) {
      const newQuantity = selectedProducts[existingIndex].cantidad + productQuantity
      if (newQuantity > availableStock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${availableStock} unidades disponibles de ${product.nombre}`,
          variant: "destructive",
        })
        return
      }
      
      const updatedProducts = [...selectedProducts]
      updatedProducts[existingIndex].cantidad = newQuantity
      setSelectedProducts(updatedProducts)
    } else {
      setSelectedProducts([...selectedProducts, { id: productId, cantidad: productQuantity }])
    }
    
    setProductSearch("")
    setProductQuantity(1)
  }

  const removeProductFromPromotion = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    const product = allProducts.find(p => p.id === productId)
    if (!product) return

    const availableStock = parseInt(product.cantidad_disponible.toString())
    if (newQuantity > availableStock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${availableStock} unidades disponibles de ${product.nombre}`,
        variant: "destructive",
      })
      return
    }

    if (newQuantity <= 0) {
      removeProductFromPromotion(productId)
      return
    }

    const updatedProducts = selectedProducts.map(p => 
      p.id === productId ? { ...p, cantidad: newQuantity } : p
    )
    setSelectedProducts(updatedProducts)
  }

  // Funciones para manejar servicios en promoción
  const addServiceToPromotion = (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId)
    if (!service) return

    const existingIndex = selectedServices.findIndex(s => s.id === serviceId)
    if (existingIndex >= 0) {
      const updatedServices = [...selectedServices]
      updatedServices[existingIndex].cantidad += serviceQuantity
      setSelectedServices(updatedServices)
    } else {
      setSelectedServices([...selectedServices, { id: serviceId, cantidad: serviceQuantity }])
    }
    
    setServiceSearch("")
    setServiceQuantity(1)
  }

  const removeServiceFromPromotion = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId))
  }

  const updateServiceQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeServiceFromPromotion(serviceId)
      return
    }

    const updatedServices = selectedServices.map(s => 
      s.id === serviceId ? { ...s, cantidad: newQuantity } : s
    )
    setSelectedServices(updatedServices)
  }

  // Filtrar productos para el combobox
  const getFilteredProducts = () => {
    return allProducts.filter(product => 
      product.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10)
  }

  // Filtrar servicios para el combobox
  const getFilteredServices = () => {
    return allServices.filter(service => 
      service.nombre.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      service.descripcion.toLowerCase().includes(serviceSearch.toLowerCase())
    ).slice(0, 10)
  }

  // Función para abrir modal de edición
  const openEditPromotionModal = (promotion: Promocion) => {
    setEditingPromotion(promotion)
    setPromotionData({
      name: promotion.nombre,
      descripcion: promotion.descripcion || "",
      precio_promocional: promotion.precio_total_promocional || 0,
      startDate: promotion.fecha_inicio ? promotion.fecha_inicio.split('T')[0] : new Date().toISOString().split("T")[0],
      endDate: promotion.fecha_fin ? promotion.fecha_fin.split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
    })
    
    // Cargar productos y servicios seleccionados
    const productosConCantidad = promotion.productos.map(p => ({
      id: p.id,
      cantidad: p.cantidad_promocion || 1
    }))
    setSelectedProducts(productosConCantidad)
    
    const serviciosConCantidad = promotion.lista_servicios.map(s => ({
      id: s.id,
      cantidad: s.cantidad_promocion || 1
    }))
    setSelectedServices(serviciosConCantidad)
    
    setShowPromotionModal(true)
  }

  // Función para cerrar modal y resetear datos
  const closePromotionModal = () => {
    setShowPromotionModal(false)
    setEditingPromotion(null)
    setSelectedProducts([])
    setSelectedServices([])
    setPromotionData({
      name: "",
      descripcion: "",
      precio_promocional: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
    })
    setProductSearch("")
    setServiceSearch("")
    setProductQuantity(1)
    setServiceQuantity(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando análisis de productos más vendidos...</p>
        </div>
      </div>
    )
  }

  const stats = getProductionStats()
  const productsWithSales = getProductsWithSales()
  const recommendedProducts = getRecommendedProducts()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos Más Vendidos</h1>
        <p className="text-gray-600">Análisis de productos con mejor rendimiento en {getCurrentPeriodName()}</p>
      </div>

      {/* Filtros de tiempo */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <select
              className="border rounded px-3 py-1 text-sm"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value)
                if (e.target.value !== "custom") {
                  setShowCustomDateFilter(false)
                  loadData()
                }
              }}
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {timeFilter === "custom" && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
              />
              <span className="text-sm">hasta</span>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
              />
              <Button size="sm" onClick={loadData}>
                Aplicar
              </Button>
            </div>
          )}

          <Button
            onClick={() => {
              closePromotionModal()
              setShowPromotionModal(true)
            }}
            className="ml-auto bg-green-600 hover:bg-green-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Crear Promoción
          </Button>
        </div>
      </Card>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSold}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Ingresos por Productos</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="fas fa-chart-line text-yellow-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Precio Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="fas fa-box text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Productos Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueProducts}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Recomendaciones para promociones */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              Recomendaciones para promociones
            </h2>

            <div className="space-y-4">
              {recommendedProducts.map((product) => {
                const productSales = products.find(p => p.id === product.id)
                return (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{product.nombre}</h3>
                        <p className="text-sm text-gray-500">{product.id_categoria}</p>
                      </div>
                      {parseInt(product.cantidad_disponible.toString()) < 10 && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Stock bajo: {product.cantidad_disponible}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Precio:</span>
                        <span className="font-medium ml-1">{formatCurrency(product.precio_venta)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vendidos:</span>
                        <span className="font-medium ml-1">{productSales?.cantidad_vendida || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Margen:</span>
                        <span className="font-medium ml-1">
                          {Math.round(((product.precio_venta - product.costo) / product.precio_venta) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium ml-1">{product.cantidad_disponible}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const isSelected = selectedProducts.some(p => p.id === product.id)
                          if (isSelected) {
                            setSelectedProducts(prev => prev.filter(p => p.id !== product.id))
                          } else {
                            setSelectedProducts(prev => [...prev, { id: product.id, cantidad: 1 }])
                          }
                        }}
                      >
                        {selectedProducts.some(p => p.id === product.id) ? "Quitar" : "Agregar"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Lista de productos más vendidos */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-trophy text-gold mr-2"></i>
              Top Productos ({productsWithSales.length})
            </h2>

            {productsWithSales.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-gray-300 text-4xl mb-4"></i>
                <p className="text-gray-500">No hay datos de ventas para mostrar en {getCurrentPeriodName()}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productsWithSales.slice(0, 10).map((product, index) => {
                  const isInPromotion = isProductInPromotion(product.id)
                  const promotion = getProductPromotion(product.id)

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                        isInPromotion ? "border-green-200 bg-green-50" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                        </div>

                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{product.nombre}</h3>
                            {isInPromotion && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                PROMOCIÓN
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{product.categoria}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Stock: {product.cantidad_disponible}</span>
                            <span>Precio: {formatCurrency(product.precio_venta)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{product.cantidad_vendida}</p>
                        <p className="text-sm text-gray-500">vendidos</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(product.ingresos)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Panel lateral de promociones */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-tags text-blue-500 mr-2"></i>
              Promociones Activas ({promotions.filter((p) => p.activa).length})
            </h2>

            {promotions.filter((p) => p.activa).length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-tags text-gray-300 text-3xl mb-4"></i>
                <p className="text-gray-500 mb-4">No hay promociones activas</p>
                <Button onClick={() => setShowPromotionModal(true)} size="sm">
                  Crear primera promoción
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {promotions
                  .filter((promo) => promo.activa)
                  .map((promo) => {
                    // Obtener productos y servicios de la promoción
                    const promoProducts = promo.productos || []
                    const promoServices = promo.lista_servicios || []
                    const totalItems = promoProducts.length + promoServices.length

                    return (
                      <div
                        key={promo.id}
                        className="border rounded-lg p-4 border-green-200 bg-green-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{promo.nombre}</h3>
                            <p className="text-sm text-gray-500">
                              Precio promocional: {formatCurrency(promo.precio_total_promocional)} • {totalItems} productos/servicios
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Activa
                          </span>
                        </div>

                        <div className="mt-2 text-sm">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {/* Mostrar productos */}
                            {promoProducts.slice(0, 2).map((product) => (
                              <span key={product.id} className="bg-blue-100 px-2 py-1 rounded text-xs">
                                📦 {product.nombre}
                              </span>
                            ))}
                            {/* Mostrar servicios */}
                            {promoServices.slice(0, 2).map((service) => (
                              <span key={service.id} className="bg-green-100 px-2 py-1 rounded text-xs">
                                🔧 {service.nombre}
                              </span>
                            ))}
                            {totalItems > 4 && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                +{totalItems - 4} más
                              </span>
                            )}
                          </div>

                          <div className="text-gray-500">
                            Válido: {promo.fecha_inicio ? new Date(promo.fecha_inicio).toLocaleDateString() : "N/A"} -{" "}
                            {promo.fecha_fin ? new Date(promo.fecha_fin).toLocaleDateString() : "N/A"}
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditPromotionModal(promo)}
                          >
                            <i className="fas fa-edit mr-1"></i>
                            Editar
                          </Button>

                          <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
                            <i className="fas fa-pause mr-1"></i>
                            Pausar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deletePromotion(promo.id)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>

          {/* Promociones inactivas */}
          {promotions.filter((p) => !p.activa).length > 0 && (
            <Card className="p-6 mt-6">
              <h2 className="text-lg font-bold mb-4 text-gray-600">
                <i className="fas fa-pause text-gray-400 mr-2"></i>
                Promociones Pausadas ({promotions.filter((p) => !p.activa).length})
              </h2>

              <div className="space-y-3">
                {promotions
                  .filter((promo) => !promo.activa)
                  .map((promo) => (
                    <div key={promo.id} className="border rounded-lg p-3 border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-700">{promo.nombre}</h3>
                          <p className="text-sm text-gray-500">
                            Precio promocional: {formatCurrency(promo.precio_total_promocional)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditPromotionModal(promo)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
                            <i className="fas fa-play"></i>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500"
                            onClick={() => deletePromotion(promo.id)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de crear promoción */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingPromotion ? "Editar" : "Crear Nueva"} Promoción</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la promoción
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={promotionData.name}
                  onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
                  placeholder="Ej: Descuento de verano"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={promotionData.descripcion}
                  onChange={(e) => setPromotionData({ ...promotionData, descripcion: e.target.value })}
                  placeholder="Describe los detalles de la promoción..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio promocional ($)
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={promotionData.precio_promocional}
                  onChange={(e) => setPromotionData({ ...promotionData, precio_promocional: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder="Ingresa el precio final de la promoción"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={promotionData.startDate}
                    onChange={(e) => setPromotionData({ ...promotionData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={promotionData.endDate}
                    onChange={(e) => setPromotionData({ ...promotionData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Sección para agregar productos */}
              <div>
                <h3 className="text-lg font-medium mb-3">📦 Agregar Productos</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="col-span-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {productSearch || "Buscar producto..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar producto..." 
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandEmpty>No se encontraron productos.</CommandEmpty>
                          <CommandGroup>
                            {getFilteredProducts().map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.id}
                                onSelect={() => {
                                  setProductSearch(product.nombre)
                                }}
                              >
                                <div className="flex justify-between w-full">
                                  <span>{product.nombre}</span>
                                  <span className="text-sm text-gray-500">
                                    Stock: {product.cantidad_disponible}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Cantidad"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const selectedProduct = allProducts.find(p => p.nombre === productSearch)
                    if (selectedProduct) {
                      addProductToPromotion(selectedProduct.id)
                    }
                  }}
                  className="w-full mb-4"
                  disabled={!productSearch || productQuantity <= 0}
                >
                  Agregar Producto
                </Button>

                {/* Lista de productos seleccionados */}
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {selectedProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay productos seleccionados</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProducts.map((producto) => {
                        const productInfo = allProducts.find(p => p.id === producto.id)
                        return productInfo ? (
                          <div key={producto.id} className="bg-blue-50 px-3 py-2 rounded flex justify-between items-center">
                            <div>
                              <span className="font-medium">{productInfo.nombre}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                x{producto.cantidad} | Stock: {productInfo.cantidad_disponible}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max={parseInt(productInfo.cantidad_disponible.toString())}
                                value={producto.cantidad}
                                onChange={(e) => updateProductQuantity(producto.id, Number(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-sm"
                              />
                              <button
                                onClick={() => removeProductFromPromotion(producto.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="fas fa-trash text-sm"></i>
                              </button>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sección para agregar servicios */}
              <div>
                <h3 className="text-lg font-medium mb-3">🔧 Agregar Servicios</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="col-span-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {serviceSearch || "Buscar servicio..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar servicio..." 
                            value={serviceSearch}
                            onValueChange={setServiceSearch}
                          />
                          <CommandEmpty>No se encontraron servicios.</CommandEmpty>
                          <CommandGroup>
                            {getFilteredServices().map((service) => (
                              <CommandItem
                                key={service.id}
                                value={service.id}
                                onSelect={() => {
                                  setServiceSearch(service.nombre)
                                }}
                              >
                                <div className="flex justify-between w-full">
                                  <span>{service.nombre}</span>
                                  <span className="text-sm text-gray-500">
                                    ${service.precio_base}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Cantidad"
                      value={serviceQuantity}
                      onChange={(e) => setServiceQuantity(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const selectedService = allServices.find(s => s.nombre === serviceSearch)
                    if (selectedService) {
                      addServiceToPromotion(selectedService.id)
                    }
                  }}
                  className="w-full mb-4"
                  disabled={!serviceSearch || serviceQuantity <= 0}
                >
                  Agregar Servicio
                </Button>

                {/* Lista de servicios seleccionados */}
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {selectedServices.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay servicios seleccionados</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedServices.map((servicio) => {
                        const serviceInfo = allServices.find(s => s.id === servicio.id)
                        return serviceInfo ? (
                          <div key={servicio.id} className="bg-green-50 px-3 py-2 rounded flex justify-between items-center">
                            <div>
                              <span className="font-medium">{serviceInfo.nombre}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                x{servicio.cantidad} | ${serviceInfo.precio_base}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                value={servicio.cantidad}
                                onChange={(e) => updateServiceQuantity(servicio.id, Number(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-sm"
                              />
                              <button
                                onClick={() => removeServiceFromPromotion(servicio.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="fas fa-trash text-sm"></i>
                              </button>
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={closePromotionModal}>
                Cancelar
              </Button>
              <Button onClick={createPromotion} className="bg-green-600 hover:bg-green-700">
                {editingPromotion ? "Actualizar Promoción" : "Crear Promoción"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
