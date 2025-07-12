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
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [services, sales, inventory, employees, clients, vehicles, attendance] = await Promise.all([
        getCollection("servicios") as Promise<Servicios[]>,
        getCollection("ventas") as Promise<Venta[]>,
        getCollection("productos") as Promise<Productos[]>,
        getCollection("trabajadores") as Promise<Trabajadores[]>,
        getCollection("clientes") as Promise<Clientes[]>,
        getCollection("vehiculos") as Promise<Vehiculos[]>,
        getCollection("attendance") as Promise<any[]>,
      ])
      setData({ services, sales, inventory, employees, clients, vehicles, attendance })
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
      {/* <Card className="p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Período</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="week">Últimos 7 días</option>
              <option value="month">Este mes</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {dateFilter === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha inicio</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha fin</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Empleado</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Todos los empleados</option>
              {data.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card> */}

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
