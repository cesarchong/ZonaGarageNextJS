"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Clientes } from "@/interfaces/clientes.interface"
import type { Productos } from "@/interfaces/productos.interface"
import type { Servicios } from "@/interfaces/servicios.interface"
import type { Trabajadores } from "@/interfaces/trabajadores.interface"
import type { Vehiculos } from "@/interfaces/vehiculos.interface"
import type { Venta } from "@/interfaces/ventas.interface"
import { getCollection } from "@/lib/firebase"
import { useEffect, useState } from "react"

interface ReportData {
  services: any[]
  sales: any[]
  inventory: any[]
  employees: any[]
  clients: any[]
  vehicles: any[]
  attendance: any[]
}

interface ServiceStats {
  today: number
  week: number
  month: number
  revenue: {
    today: number
    week: number
    month: number
  }
}

interface ProductStats {
  name: string
  sold: number
  revenue: number
}

interface EmployeeStats {
  id: string
  name: string
  servicesCount: number
  revenue: number
  avgCheckIn: string
  avgCheckOut: string
  hoursWorked: number
}

export default function Reports() {
  const { toast } = useToast()
  const [data, setData] = useState<ReportData>({
    services: [],
    sales: [],
    inventory: [],
    employees: [],
    clients: [],
    vehicles: [],
    attendance: [],
  })

  const [dateFilter, setDateFilter] = useState("today")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [tipoReporte, setTipoReporte] = useState("") // "servicios", "pagos", "movimientos"
  const [selectedTipoServicio, setSelectedTipoServicio] = useState("")
  const [selectedMetodoPago, setSelectedMetodoPago] = useState("")
  const [selectedTipoMovimiento, setSelectedTipoMovimiento] = useState("")
  const [tiposServicio, setTiposServicio] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [services, sales, inventory, employees, clients, vehicles, attendance, tiposServ, pagosData, movimientosData] = await Promise.all([
        getCollection("servicios") as Promise<Servicios[]>,
        getCollection("ventas") as Promise<Venta[]>,
        getCollection("productos") as Promise<Productos[]>,
        getCollection("trabajadores") as Promise<Trabajadores[]>,
        getCollection("clientes") as Promise<Clientes[]>,
        getCollection("vehiculos") as Promise<Vehiculos[]>,
        getCollection("attendance") as Promise<any[]>,
        getCollection("tipos_servicio") as Promise<any[]>,
        getCollection("pagos") as Promise<any[]>,
        getCollection("movimientos_caja") as Promise<any[]>,
      ])
      setData({ services, sales, inventory, employees, clients, vehicles, attendance })
      setTiposServicio(tiposServ)
      setPagos(pagosData)
      setMovimientos(movimientosData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos para el reporte",
        variant: "destructive",
      })
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        return { start: yesterday, end: today }
      case "week":
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case "custom":
        return {
          start: customDateRange.start ? new Date(customDateRange.start) : today,
          end: customDateRange.end
            ? new Date(customDateRange.end + "T23:59:59")
            : new Date(today.getTime() + 24 * 60 * 60 * 1000),
        }
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }
  }

  const filterDataByDate = (items: any[], dateField = "createdAt") => {
    const { start, end } = getDateRange()
    return items.filter((item) => {
      const itemDate = new Date(item[dateField])
      return itemDate >= start && itemDate < end
    })
  }

  const clearFilters = () => {
    setDateFilter("today")
    setTipoReporte("")
    setSelectedTipoServicio("")
    setSelectedMetodoPago("")
    setSelectedTipoMovimiento("")
    setCustomDateRange({ start: "", end: "" })
    toast({
      title: "Filtros limpiados",
      description: "Se han restablecido todos los filtros",
    })
  }

  const applyAdvancedFilters = (services: any[]) => {
    let filtered = services

    // Filtrar por tipo de servicio
    if (selectedTipoServicio) {
      filtered = filtered.filter(service => 
        Array.isArray(service.tipos_servicio_realizados) && 
        service.tipos_servicio_realizados.some((tipo: any) => tipo.id === selectedTipoServicio)
      )
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_servicio).getTime()
      const dateB = new Date(b.fecha_servicio).getTime()
      return dateB - dateA
    })
  }

  const getFilteredPayments = () => {
    const { start, end } = getDateRange()
    let filtered = pagos.filter(pago => {
      if (!pago.fecha_pago) return false
      const paymentDate = new Date(pago.fecha_pago)
      return paymentDate >= start && paymentDate < end
    })

    // Filtrar por método de pago
    if (selectedMetodoPago) {
      filtered = filtered.filter(pago => 
        pago.metodo_pago?.toLowerCase() === selectedMetodoPago.toLowerCase()
      )
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_pago).getTime()
      const dateB = new Date(b.fecha_pago).getTime()
      return dateB - dateA
    })
  }

  const getFilteredMovements = () => {
    const { start, end } = getDateRange()
    let filtered = movimientos.filter(mov => {
      if (!mov.fecha_hora) return false
      const movDate = new Date(mov.fecha_hora)
      return movDate >= start && movDate < end
    })

    // Filtrar por tipo de movimiento
    if (selectedTipoMovimiento) {
      filtered = filtered.filter(mov => mov.tipo === selectedTipoMovimiento)
    }

    // Ordenar por fecha (más reciente primero)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_hora).getTime()
      const dateB = new Date(b.fecha_hora).getTime()
      return dateB - dateA
    })
  }

  const getServiceStats = (): ServiceStats => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Filtrar servicios por fecha_servicio hoy y que tengan tipos_servicio_realizados
    const todayServices = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= today && serviceDate < todayEnd && Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0
    })

    const weekServices = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= weekStart && serviceDate < todayEnd && Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0
    })

    const monthServices = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= monthStart && serviceDate < todayEnd && Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0
    })

    // Para ingresos, incluir TODOS los registros (servicios y ventas)
    const todayAllRecords = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= today && serviceDate < todayEnd
    })

    const weekAllRecords = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= weekStart && serviceDate < todayEnd
    })

    const monthAllRecords = data.services.filter((s) => {
      const serviceDate = new Date((s as any).fecha_servicio)
      return serviceDate >= monthStart && serviceDate < todayEnd
    })

    return {
      today: todayServices.length,
      week: weekServices.length,
      month: monthServices.length,
      revenue: {
        // Convertir precio_total de string a número y sumar
        today: todayAllRecords.reduce((sum, s) => {
          const precioTotal = Number((s as any).precio_total) || 0
          return sum + precioTotal
        }, 0),
        week: weekAllRecords.reduce((sum, s) => {
          const precioTotal = Number((s as any).precio_total) || 0
          return sum + precioTotal
        }, 0),
        month: monthAllRecords.reduce((sum, s) => {
          const precioTotal = Number((s as any).precio_total) || 0
          return sum + precioTotal
        }, 0),
      },
    }
  }

  const getTopServices = () => {
    // Obtener TODOS los servicios (sin filtro de fecha) para analizar patrones históricos
    const allServices = data.services.filter(s => Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0)
    const serviceCount: { [key: string]: { count: number; revenue: number } } = {}

    // Contar todas las ocurrencias de cada tipo de servicio realizado
    allServices.forEach((service) => {
      service.tipos_servicio_realizados.forEach((tipo: any) => {
        const serviceName = tipo.nombre || "Servicio general"
        if (!serviceCount[serviceName]) {
          serviceCount[serviceName] = { count: 0, revenue: 0 }
        }
        serviceCount[serviceName].count++
        
        // Calcular ingresos proporcionales por tipo de servicio
        const totalServicios = service.tipos_servicio_realizados.length
        const ingresosPorServicio = parseFloat((service as any).precio_total || '0') / totalServicios
        serviceCount[serviceName].revenue += ingresosPorServicio
      })
    })

    return Object.entries(serviceCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  const getTopProducts = (): ProductStats[] => {
    const filteredSales = filterDataByDate(data.sales)
    const filteredServices = filterDataByDate(data.services)
    const productCount: { [key: string]: { sold: number; revenue: number } } = {}

    // Productos de ventas directas
    filteredSales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        if (!productCount[item.productName]) {
          productCount[item.productName] = { sold: 0, revenue: 0 }
        }
        productCount[item.productName].sold += item.quantity
        productCount[item.productName].revenue += item.total
      })
    })

    // Productos vendidos en servicios
    filteredServices.forEach((service) => {
      if (Array.isArray(service.productos) && service.productos.length > 0) {
        service.productos.forEach((producto: any) => {
          const productName = producto.name || producto.nombre || "Producto sin nombre"
          if (!productCount[productName]) {
            productCount[productName] = { sold: 0, revenue: 0 }
          }
          productCount[productName].sold += producto.quantity || producto.cantidad || 1
          productCount[productName].revenue += parseFloat(producto.price || producto.precio || '0') * (producto.quantity || producto.cantidad || 1)
        })
      }
    })

    return Object.entries(productCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
  }

  const getTodayProductStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    // Filtrar ventas y servicios de hoy usando la misma lógica
    const todaySales = data.sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= today && saleDate < todayEnd
    })
    
    const todayServices = data.services.filter((service) => {
      const serviceDate = new Date(service.fecha_servicio)
      return serviceDate >= today && serviceDate < todayEnd
    })

    let totalSold = 0
    let totalRevenue = 0

    // Productos de ventas directas de hoy
    todaySales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        totalSold += item.quantity
        totalRevenue += item.total
      })
    })

    // Productos vendidos en servicios de hoy - usando precio_venta
    todayServices.forEach((service) => {
      if (Array.isArray(service.productos) && service.productos.length > 0) {
        service.productos.forEach((producto: any) => {
          totalSold += producto.quantity || producto.cantidad || 1
          // Usar precio_venta del array de productos en servicios
          const precioVenta = parseFloat(producto.precio_venta || producto.price || producto.precio || '0')
          const cantidad = producto.quantity || producto.cantidad || 1
          totalRevenue += precioVenta * cantidad
        })
      }
    })

    return { totalSold, totalRevenue }
  }

  const getLowStockProducts = () => {
    return data.inventory.filter((product) => product.cantidad_disponible <= product.stock_minimo)
  }

  const getBestSellingProduct = () => {
    // Obtener todos los productos vendidos en cualquier periodo
    const allSales = data.sales
    const allServices = data.services
    const productCount: { [key: string]: { sold: number; revenue: number } } = {}

    // Productos de ventas directas
    allSales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        if (!productCount[item.productName]) {
          productCount[item.productName] = { sold: 0, revenue: 0 }
        }
        productCount[item.productName].sold += item.quantity
        productCount[item.productName].revenue += item.total
      })
    })

    // Productos vendidos en servicios
    allServices.forEach((service) => {
      if (Array.isArray(service.productos) && service.productos.length > 0) {
        service.productos.forEach((producto: any) => {
          const productName = producto.name || producto.nombre || "Producto sin nombre"
          if (!productCount[productName]) {
            productCount[productName] = { sold: 0, revenue: 0 }
          }
          productCount[productName].sold += producto.quantity || producto.cantidad || 1
          productCount[productName].revenue += parseFloat(producto.price || producto.precio || '0') * (producto.quantity || producto.cantidad || 1)
        })
      }
    })

    // Obtener el producto más vendido
    return Object.entries(productCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sold - a.sold)[0] || { name: "Sin datos", sold: 0, revenue: 0 }
  }

  const getEmployeeStats = (): EmployeeStats[] => {
    // Solo servicios con tipos_servicio_realizados para contar servicios
    const filteredServices = filterDataByDate(data.services).filter(s => Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0)
    // Todos los registros (servicios y ventas) para calcular ingresos
    const allRecords = filterDataByDate(data.services)
    const filteredAttendance = filterDataByDate(data.attendance, "timestamp")

    return data.employees
      .map((employee) => {
        const employeeServices = filteredServices.filter((s) => s.empleado_id === employee.id)
        // Incluir todos los registros del empleado para ingresos
        const employeeAllRecords = allRecords.filter((s) => s.empleado_id === employee.id)
        const employeeAttendance = filteredAttendance.filter((a) => a.employeeId === employee.id)

        const checkIns = employeeAttendance.filter((a) => a.type === "checkin")
        const checkOuts = employeeAttendance.filter((a) => a.type === "checkout")

        let avgCheckIn = "N/A"
        let avgCheckOut = "N/A"
        let hoursWorked = 0

        if (checkIns.length > 0) {
          const avgCheckInMinutes =
            checkIns.reduce((sum, record) => {
              const time = new Date(record.timestamp)
              return sum + (time.getHours() * 60 + time.getMinutes())
            }, 0) / checkIns.length

          const hours = Math.floor(avgCheckInMinutes / 60)
          const minutes = Math.round(avgCheckInMinutes % 60)
          avgCheckIn = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
        }

        if (checkOuts.length > 0) {
          const avgCheckOutMinutes =
            checkOuts.reduce((sum, record) => {
              const time = new Date(record.timestamp)
              return sum + (time.getHours() * 60 + time.getMinutes())
            }, 0) / checkOuts.length

          const hours = Math.floor(avgCheckOutMinutes / 60)
          const minutes = Math.round(avgCheckOutMinutes % 60)
          avgCheckOut = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

          // Calculate hours worked
          checkOuts.forEach((checkOut, index) => {
            const checkIn = checkIns[index]
            if (checkIn) {
              const checkInTime = new Date(checkIn.timestamp)
              const checkOutTime = new Date(checkOut.timestamp)
              hoursWorked += (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
            }
          })
        }

        return {
          id: employee.id,
          name: employee.name,
          servicesCount: employeeServices.length,
          revenue: employeeAllRecords.reduce((sum, s) => sum + parseFloat((s as any).precio_total || '0'), 0),
          avgCheckIn,
          avgCheckOut,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }

  const getWeeklyServiceChart = () => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const weekData = Array(7).fill(0)

    // Obtener servicios de los últimos 7 días
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const weekServices = data.services.filter((service) => {
      const serviceDate = new Date(service.fecha_servicio)
      return serviceDate >= sevenDaysAgo && serviceDate <= now && Array.isArray(service.tipos_servicio_realizados) && service.tipos_servicio_realizados.length > 0
    })

    weekServices.forEach((service) => {
      const dayOfWeek = new Date(service.fecha_servicio).getDay()
      weekData[dayOfWeek]++
    })

    const maxValue = Math.max(...weekData, 1)

    return days.map((day, index) => ({
      day,
      count: weekData[index],
      percentage: (weekData[index] / maxValue) * 100,
    }))
  }

  const exportToCSV = () => {
    const serviceStats = getServiceStats()
    const employeeStats = getEmployeeStats()
    const topProducts = getTopProducts()
    const bestProduct = getBestSellingProduct()

    let csvContent = "Reporte de Zona Garaje\n\n"

    csvContent += "ESTADÍSTICAS DE SERVICIOS\n"
    csvContent += `Servicios Hoy,${serviceStats.today}\n`
    csvContent += `Servicios Esta Semana,${serviceStats.week}\n`
    csvContent += `Servicios Este Mes,${serviceStats.month}\n`
    csvContent += `Ingresos Hoy,$${serviceStats.revenue.today.toFixed(2)}\n`
    csvContent += `Ingresos Esta Semana,$${serviceStats.revenue.week.toFixed(2)}\n`
    csvContent += `Ingresos Este Mes,$${serviceStats.revenue.month.toFixed(2)}\n\n`

    csvContent += "RENDIMIENTO DE EMPLEADOS\n"
    csvContent += "Nombre,Servicios,Ingresos,Entrada Promedio,Salida Promedio,Horas Trabajadas\n"
    employeeStats.forEach((emp) => {
      csvContent += `${emp.name},${emp.servicesCount},$${emp.revenue.toFixed(2)},${emp.avgCheckIn},${emp.avgCheckOut},${emp.hoursWorked}\n`
    })

    csvContent += "\nPRODUCTO MÁS VENDIDO DE TODOS LOS TIEMPOS\n"
    csvContent += `${bestProduct.name},${bestProduct.sold} unidades,$${bestProduct.revenue.toFixed(2)}\n\n`

    csvContent += "PRODUCTOS MÁS VENDIDOS\n"
    csvContent += "Producto,Cantidad Vendida,Ingresos\n"
    topProducts.forEach((product) => {
      csvContent += `${product.name},${product.sold},$${product.revenue.toFixed(2)}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte-zona-garaje-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportado",
      description: "Reporte exportado exitosamente",
      variant: "success",
    })
  }

  const handlePrint = () => {
    window.print()
    toast({
      title: "Imprimiendo",
      description: "Enviando reporte a la impresora",
      variant: "success",
    })
  }

  const exportToPDF = async () => {
    try {
      toast({
        title: "Generando PDF",
        description: "Por favor espera mientras se genera el documento...",
      })

      // Importar pdf-lib dinámicamente
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')

      // Crear nuevo documento PDF
      const pdfDoc = await PDFDocument.create()
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      
      let page = pdfDoc.addPage([595, 842]) // A4 size
      const { width, height } = page.getSize()
      let yPosition = height - 50

      // Función auxiliar para agregar nueva página si es necesario
      const checkAndAddPage = (requiredSpace: number) => {
        if (yPosition < requiredSpace) {
          page = pdfDoc.addPage([595, 842])
          yPosition = height - 50
          return true
        }
        return false
      }

      // Función para dibujar texto centrado
      const drawCenteredText = (text: string, y: number, size: number, font: any) => {
        const textWidth = font.widthOfTextAtSize(text, size)
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        })
      }

      // Agregar logo en el encabezado
      try {
        const logoResponse = await fetch('/images/IMG_6681.jpg')
        const logoArrayBuffer = await logoResponse.arrayBuffer()
        const logoImage = await pdfDoc.embedJpg(logoArrayBuffer)
        
        const logoWidth = 60  // Reducido de 80 a 60
        const logoHeight = 60 // Reducido de 80 a 60
        const logoX = (width - logoWidth) / 2
        
        page.drawImage(logoImage, {
          x: logoX,
          y: yPosition - logoHeight,
          width: logoWidth,
          height: logoHeight,
        })
        
        yPosition -= logoHeight + 20  // Aumentado de 10 a 20 para más separación
      } catch (error) {
        console.log('Error cargando logo, usando texto:', error)
        // Fallback al texto si falla la imagen
        drawCenteredText('ZONA GARAJE', yPosition, 24, timesRomanBoldFont)
        yPosition -= 25
      }

      // Subtítulo del reporte
      const tipoReporteTexto = 
        tipoReporte === 'servicios' ? 'Reporte de Servicios' :
        tipoReporte === 'pagos' ? 'Reporte de Pagos' :
        'Reporte de Movimientos de Caja'
      
      drawCenteredText(tipoReporteTexto, yPosition, 18, timesRomanBoldFont)
      yPosition -= 20

      // Período
      drawCenteredText(
        `Período: ${customDateRange.start} al ${customDateRange.end}`,
        yPosition,
        12,
        timesRomanFont
      )
      yPosition -= 30

      // Línea separadora
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0),
      })
      yPosition -= 30

      // Contenido según tipo de reporte
      if (tipoReporte === 'servicios') {
        const filteredServices = applyAdvancedFilters(
          filterDataByDate(
            data.services.filter(s => Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0), 
            "fecha_servicio"
          )
        )
        const totalIngresos = filteredServices.reduce((sum, s) => sum + parseFloat((s as any).precio_total || '0'), 0)

        // Resumen
        page.drawText('Resumen:', { x: 50, y: yPosition, size: 14, font: timesRomanBoldFont })
        yPosition -= 20
        
        page.drawText(`Total de Servicios: ${filteredServices.length}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 18
        page.drawText(`Ingresos Totales: $${totalIngresos.toFixed(2)}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 18
        page.drawText(`Promedio por Servicio: $${filteredServices.length > 0 ? (totalIngresos / filteredServices.length).toFixed(2) : '0.00'}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 30

        // Tabla de servicios
        if (filteredServices.length > 0) {
          page.drawText('Detalle de Servicios:', { x: 50, y: yPosition, size: 12, font: timesRomanBoldFont })
          yPosition -= 20

          // Encabezados
          page.drawText('Fecha', { x: 50, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Cliente', { x: 120, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Servicios', { x: 220, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Placa', { x: 380, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Total', { x: 480, y: yPosition, size: 10, font: timesRomanBoldFont })
          yPosition -= 5

          page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          })
          yPosition -= 15

          for (const service of filteredServices) {
            checkAndAddPage(50)

            const cliente = data.clients.find(c => c.id === service.cliente_id)
            const vehiculo = data.vehicles.find(v => v.id === service.vehiculo_id)
            const serviciosNombres = service.tipos_servicio_realizados.map((t: any) => t.nombre).join(", ")
            const fecha = new Date(service.fecha_servicio).toLocaleDateString("es-ES")
            
            page.drawText(fecha, { x: 50, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText((cliente?.nombre || "N/A").substring(0, 15), { x: 120, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(serviciosNombres.substring(0, 25), { x: 220, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText((vehiculo?.placa || "N/A").substring(0, 12), { x: 380, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(`$${parseFloat((service as any).precio_total || '0').toFixed(2)}`, { x: 480, y: yPosition, size: 9, font: timesRomanFont })
            yPosition -= 15
          }
        }
      } else if (tipoReporte === 'pagos') {
        const filteredPayments = getFilteredPayments()
        const totalPagos = filteredPayments.reduce((sum, p) => sum + parseFloat(p.monto || '0'), 0)

        // Resumen
        page.drawText('Resumen:', { x: 50, y: yPosition, size: 14, font: timesRomanBoldFont })
        yPosition -= 20
        
        page.drawText(`Total de Pagos: ${filteredPayments.length}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 18
        page.drawText(`Monto Total: $${totalPagos.toFixed(2)}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 30

        // Tabla de pagos
        if (filteredPayments.length > 0) {
          page.drawText('Detalle de Pagos:', { x: 50, y: yPosition, size: 12, font: timesRomanBoldFont })
          yPosition -= 20

          page.drawText('Fecha', { x: 50, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Cliente', { x: 130, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Método', { x: 300, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Monto', { x: 480, y: yPosition, size: 10, font: timesRomanBoldFont })
          yPosition -= 5

          page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          })
          yPosition -= 15

          for (const pago of filteredPayments) {
            checkAndAddPage(50)

            const cliente = data.clients.find(c => c.id === pago.cliente_id)
            const fecha = new Date(pago.fecha_pago).toLocaleDateString("es-ES")
            
            page.drawText(fecha, { x: 50, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText((cliente?.nombre || "N/A").substring(0, 25), { x: 130, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(pago.metodo_pago.substring(0, 20), { x: 300, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(`$${parseFloat(pago.monto || '0').toFixed(2)}`, { x: 480, y: yPosition, size: 9, font: timesRomanFont })
            yPosition -= 15
          }
        }
      } else if (tipoReporte === 'movimientos') {
        const filteredMovements = getFilteredMovements()
        const totalMovimientos = filteredMovements.reduce((sum, m) => {
          const monto = parseFloat(m.monto || '0')
          return m.tipo === 'retiro' ? sum - monto : sum + monto
        }, 0)

        // Resumen
        page.drawText('Resumen:', { x: 50, y: yPosition, size: 14, font: timesRomanBoldFont })
        yPosition -= 20
        
        page.drawText(`Total de Movimientos: ${filteredMovements.length}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 18
        page.drawText(`Balance Total: $${totalMovimientos.toFixed(2)}`, { x: 70, y: yPosition, size: 11, font: timesRomanFont })
        yPosition -= 30

        // Tabla de movimientos
        if (filteredMovements.length > 0) {
          page.drawText('Detalle de Movimientos:', { x: 50, y: yPosition, size: 12, font: timesRomanBoldFont })
          yPosition -= 20

          page.drawText('Fecha', { x: 50, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Tipo', { x: 130, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Descripción', { x: 220, y: yPosition, size: 10, font: timesRomanBoldFont })
          page.drawText('Monto', { x: 480, y: yPosition, size: 10, font: timesRomanBoldFont })
          yPosition -= 5

          page.drawLine({
            start: { x: 50, y: yPosition },
            end: { x: width - 50, y: yPosition },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          })
          yPosition -= 15

          for (const mov of filteredMovements) {
            checkAndAddPage(50)

            const fecha = new Date(mov.fecha_hora).toLocaleDateString("es-ES")
            const signo = mov.tipo === 'retiro' ? '-' : '+'
            
            page.drawText(fecha, { x: 50, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(mov.tipo.substring(0, 15), { x: 130, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(mov.descripcion.substring(0, 40), { x: 220, y: yPosition, size: 9, font: timesRomanFont })
            page.drawText(`${signo}$${parseFloat(mov.monto || '0').toFixed(2)}`, { x: 480, y: yPosition, size: 9, font: timesRomanFont })
            yPosition -= 15
          }
        }
      }

      // Footer en todas las páginas
      const pages = pdfDoc.getPages()
      const totalPages = pages.length
      pages.forEach((p, index) => {
        p.drawText(
          `Generado el ${new Date().toLocaleDateString("es-ES")} - Página ${index + 1} de ${totalPages}`,
          {
            x: 50,
            y: 30,
            size: 8,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
          }
        )
      })

      // Guardar PDF
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-${tipoReporte}-${customDateRange.start}-${customDateRange.end}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Generado",
        description: "El reporte ha sido descargado exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const serviceStats = getServiceStats()
  const topServices = getTopServices()
  const topProducts = getTopProducts()
  const todayProductStats = getTodayProductStats()
  const lowStockProducts = getLowStockProducts()
  const employeeStats = getEmployeeStats()
  const weeklyChart = getWeeklyServiceChart()
  const topEmployees = employeeStats.slice(0, 3)
  const bestSellingProduct = getBestSellingProduct()

  const getRandomTip = () => {
    const tips = [
      "Tu mejor día para promociones es el miércoles, ¡aprovéchalo!",
      "Los servicios de detailing generan más ingresos por cliente",
      "Considera ofrecer paquetes combinados para aumentar ventas",
      "Los clientes prefieren servicios en horarios de tarde",
      "Mantén el inventario de productos básicos siempre disponible",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-gray-600">Análisis completo del rendimiento del negocio</p>
        </div>
        <div className="flex gap-2">
          {dateFilter === "custom" && tipoReporte && customDateRange.start && customDateRange.end && (
            <Button onClick={exportToPDF} variant="default" className="bg-red-600 hover:bg-red-700 text-white">
              <i className="fas fa-file-pdf mr-2"></i>
              Exportar PDF
            </Button>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <i className="fas fa-download mr-2"></i>
            Exportar CSV
          </Button>
          <Button onClick={handlePrint} variant="yellow">
            <i className="fas fa-print mr-2"></i>
            Imprimir
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 print:hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Generar Reporte</h3>
            <Button 
              onClick={clearFilters} 
              variant="outline"
              size="sm"
            >
              <i className="fas fa-times mr-2"></i>
              Limpiar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <i className="fas fa-file-alt mr-2"></i>
                Tipo de Reporte
              </label>
              <select
                value={tipoReporte}
                onChange={(e) => {
                  setTipoReporte(e.target.value)
                  // Limpiar filtros específicos al cambiar tipo de reporte
                  setSelectedTipoServicio("")
                  setSelectedMetodoPago("")
                  setSelectedTipoMovimiento("")
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Seleccionar tipo...</option>
                <option value="servicios">📋 Servicios</option>
                <option value="pagos">💳 Pagos</option>
                <option value="movimientos">💰 Movimientos de Caja</option>
              </select>
            </div>

            {/* Filtro de Fechas */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha inicio</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Fecha fin</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            {/* Filtro Específico según Tipo de Reporte */}
            {tipoReporte === "servicios" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Servicio</label>
                <select
                  value={selectedTipoServicio}
                  onChange={(e) => setSelectedTipoServicio(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Todos los tipos</option>
                  {tiposServicio.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoReporte === "pagos" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Método de Pago</label>
                <select
                  value={selectedMetodoPago}
                  onChange={(e) => setSelectedMetodoPago(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Todos los métodos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="pagomovil">Pago Móvil</option>
                  <option value="zelle">Zelle</option>
                  <option value="binance">Binance</option>
                </select>
              </div>
            )}

            {tipoReporte === "movimientos" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Movimiento</label>
                <select
                  value={selectedTipoMovimiento}
                  onChange={(e) => setSelectedTipoMovimiento(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Todos los movimientos</option>
                  <option value="abrir">Apertura de Caja</option>
                  <option value="cerrar">Cierre de Caja</option>
                  <option value="deposito">Depósito</option>
                  <option value="retiro">Retiro</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            )}

            {/* Botón de Generar Reporte */}
            {tipoReporte && (
              <div className="flex items-end">
                <Button 
                  onClick={() => setDateFilter("custom")} 
                  variant="yellow"
                  className="w-full"
                  disabled={!customDateRange.start || !customDateRange.end}
                >
                  <i className="fas fa-chart-bar mr-2"></i>
                  Generar Reporte
                </Button>
              </div>
            )}
          </div>

          {/* Mensaje de ayuda */}
          {!tipoReporte && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
              <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
              <p className="text-sm text-blue-800">
                Selecciona el tipo de reporte que deseas generar y configura las fechas para comenzar.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Reportes Generados */}
      {dateFilter === "custom" && customDateRange.start && customDateRange.end && tipoReporte && (
        <>
          {/* Reporte de Servicios */}
          {tipoReporte === "servicios" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  <i className="fas fa-calendar-alt mr-2"></i>
                  Servicios Realizados ({customDateRange.start} - {customDateRange.end})
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {applyAdvancedFilters(filterDataByDate(data.services.filter(s => Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0), "fecha_servicio")).length} servicios
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredServices = applyAdvancedFilters(
                  filterDataByDate(
                    data.services.filter(s => Array.isArray(s.tipos_servicio_realizados) && s.tipos_servicio_realizados.length > 0), 
                    "fecha_servicio"
                  )
                )
                const totalIngresos = filteredServices.reduce((sum, s) => sum + parseFloat((s as any).precio_total || '0'), 0)
              
              return (
                <>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total de Servicios</p>
                        <p className="text-2xl font-bold text-blue-700">{filteredServices.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-green-700">${totalIngresos.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Promedio por Servicio</p>
                        <p className="text-2xl font-bold text-purple-700">
                          ${filteredServices.length > 0 ? (totalIngresos / filteredServices.length).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {filteredServices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Servicios
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vehículo
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredServices.map((service, index) => {
                            const cliente = data.clients.find(c => c.id === service.cliente_id)
                            const vehiculo = data.vehicles.find(v => v.id === service.vehiculo_id)
                            const serviciosNombres = service.tipos_servicio_realizados
                              .map((t: any) => t.nombre)
                              .join(", ")
                            
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(service.fecha_servicio).toLocaleDateString("es-ES")}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {cliente?.nombre || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {serviciosNombres}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {vehiculo?.placa || "N/A"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">
                                  ${parseFloat((service as any).precio_total || '0').toFixed(2)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-inbox text-4xl mb-4"></i>
                      <p>No se encontraron servicios en el rango de fechas seleccionado</p>
                    </div>
                  )}
                </>
              )
            })()}
          </CardContent>
        </Card>
          )}

        {/* Reporte de Pagos */}
        {tipoReporte === "pagos" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  <i className="fas fa-credit-card mr-2"></i>
                  Pagos Realizados ({customDateRange.start} - {customDateRange.end})
                  {selectedMetodoPago && ` - ${selectedMetodoPago.charAt(0).toUpperCase() + selectedMetodoPago.slice(1)}`}
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {getFilteredPayments().length} pagos
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredPayments = getFilteredPayments()
                const totalPagos = filteredPayments.reduce((sum, p) => sum + parseFloat(p.monto || '0'), 0)
                
                return (
                  <>
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total de Pagos</p>
                          <p className="text-2xl font-bold text-green-700">{filteredPayments.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monto Total</p>
                          <p className="text-2xl font-bold text-green-700">${totalPagos.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {filteredPayments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Método
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.map((pago, index) => {
                              const cliente = data.clients.find(c => c.id === pago.cliente_id)
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(pago.fecha_pago).toLocaleDateString("es-ES")}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {cliente?.nombre || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {pago.metodo_pago}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right text-green-600">
                                    ${parseFloat(pago.monto || '0').toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-4"></i>
                        <p>No se encontraron pagos con este método</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Reporte de Movimientos */}
        {tipoReporte === "movimientos" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  <i className="fas fa-exchange-alt mr-2"></i>
                  Movimientos de Caja ({customDateRange.start} - {customDateRange.end})
                  {selectedTipoMovimiento && ` - ${selectedTipoMovimiento.charAt(0).toUpperCase() + selectedTipoMovimiento.slice(1)}`}
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {getFilteredMovements().length} movimientos
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredMovements = getFilteredMovements()
                const totalMovimientos = filteredMovements.reduce((sum, m) => {
                  const monto = parseFloat(m.monto || '0')
                  return m.tipo === 'retiro' ? sum - monto : sum + monto
                }, 0)
                
                return (
                  <>
                    <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total de Movimientos</p>
                          <p className="text-2xl font-bold text-purple-700">{filteredMovements.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Balance Total</p>
                          <p className={`text-2xl font-bold ${totalMovimientos >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ${totalMovimientos.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {filteredMovements.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descripción
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMovements.map((mov, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(mov.fecha_hora).toLocaleDateString("es-ES")}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    mov.tipo === 'deposito' || mov.tipo === 'pago' ? 'bg-green-100 text-green-800' :
                                    mov.tipo === 'retiro' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {mov.tipo}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {mov.descripcion}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                                  mov.tipo === 'retiro' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {mov.tipo === 'retiro' ? '-' : '+'}${parseFloat(mov.monto || '0').toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-inbox text-4xl mb-4"></i>
                        <p>No se encontraron movimientos de este tipo</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        )}
        </>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Servicios Hoy</p>
                <p className="text-3xl font-bold">{serviceStats.today}</p>
                <p className="text-sm text-green-100">Total esta semana: {serviceStats.week}</p>
              </div>
              <i className="fas fa-concierge-bell text-4xl text-green-200"></i>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Ingresos Hoy</p>
                <p className="text-3xl font-bold">${serviceStats.revenue.today.toFixed(2)}</p>
                <p className="text-sm text-blue-100">Ingresos este mes: ${serviceStats.revenue.month.toFixed(2)}</p>
              </div>
              <i className="fas fa-dollar-sign text-4xl text-blue-200"></i>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Productos Vendidos Hoy</p>
                <p className="text-3xl font-bold">{todayProductStats.totalSold}</p>
                <p className="text-sm text-yellow-100">
                  Ingresos: ${todayProductStats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <i className="fas fa-shopping-cart text-4xl text-yellow-200"></i>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Producto más vendido */}
      {/* <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <i className="fas fa-trophy text-yellow-300 mr-2"></i>
            Producto Más Vendido de Todos los Tiempos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{bestSellingProduct.name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <p className="text-purple-100 text-sm">Unidades vendidas</p>
                  <p className="text-3xl font-bold">{bestSellingProduct.sold}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <p className="text-purple-100 text-sm">Ingresos totales</p>
                  <p className="text-3xl font-bold">${bestSellingProduct.revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-purple-400 rounded-full flex items-center justify-center">
                <i className="fas fa-crown text-5xl text-yellow-300"></i>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Charts and Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios por Día de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyChart.map((day, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm font-medium">{day.day}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${day.percentage}%` }}
                      >
                        {day.count > 0 && <span className="text-xs font-bold text-black">{day.count}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 text-sm text-gray-600">{day.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Solicitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.count} veces solicitado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-wrench text-blue-600"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Rendimiento de Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Empleado</th>
                  <th className="text-left py-3 px-4">Servicios</th>
                  <th className="text-left py-3 px-4">Ingresos</th>
                  <th className="text-left py-3 px-4">Entrada Promedio</th>
                  <th className="text-left py-3 px-4">Salida Promedio</th>
                  <th className="text-left py-3 px-4">Horas Trabajadas</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((employee, index) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {index < 3 && (
                          <i
                            className={`fas fa-medal mr-2 ${
                              index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-orange-400"
                            }`}
                          ></i>
                        )}
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{employee.servicesCount}</td>
                    <td className="py-3 px-4 font-bold text-green-600">${employee.revenue.toFixed(2)}</td>
                    <td className="py-3 px-4">{employee.avgCheckIn}</td>
                    <td className="py-3 px-4">{employee.avgCheckOut}</td>
                    <td className="py-3 px-4">{employee.hoursWorked}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card> */}

      {/* Products and Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSellingProduct.sold > 0 && (
                <div className="flex items-center justify-between p-3 border-2 border-yellow-400 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <i className="fas fa-crown text-yellow-500 mr-2"></i>
                      <p className="font-bold text-gray-800">{bestSellingProduct.name}</p>
                    </div>
                    <p className="text-sm text-gray-600">{bestSellingProduct.sold} unidades vendidas (Total histórico)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${bestSellingProduct.revenue.toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sold} unidades vendidas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              Productos con Bajo Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-red-800">{product.nombre}</p>
                      <p className="text-sm text-red-600">Stock mínimo: {product.stock_minimo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{product.cantidad_disponible} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
                <p>Todos los productos tienen stock suficiente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Employees and Business Tip */}
      {/* Top 3 Employees */}
      {/* <Card>
        <CardHeader>
          <CardTitle>🏆 Top 3 Empleados del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEmployees.map((employee, index) => (
              <div
                key={employee.id}
                className={`p-4 rounded-lg border-2 ${
                  index === 0
                    ? "bg-yellow-50 border-yellow-300"
                    : index === 1
                      ? "bg-gray-50 border-gray-300"
                      : "bg-orange-50 border-orange-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-400"
                      }`}
                    >
                      <i className="fas fa-medal"></i>
                    </div>
                    <div>
                      <p className="font-bold">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.servicesCount} servicios</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${employee.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{employee.hoursWorked}h trabajadas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Business Tip */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
            Consejo del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
            <p className="text-lg font-medium text-gray-800 mb-4">{getRandomTip()}</p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.clients.length}</p>
                <p className="text-sm text-gray-600">Clientes Totales</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data.vehicles.length}</p>
                <p className="text-sm text-gray-600">Vehículos Registrados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-sm text-gray-500 mt-8">
        <p>Zona Garaje - Reporte generado el {new Date().toLocaleDateString("es-ES")}</p>
      </div>
    </div>
  )
}
