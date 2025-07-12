"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Clientes } from "@/interfaces/clientes.interface"
import type { Productos } from "@/interfaces/productos.interface"
import type { Servicios as ServicioInt } from "@/interfaces/servicios.interface"
import type { Trabajadores } from "@/interfaces/trabajadores.interface"
import type { Vehiculos } from "@/interfaces/vehiculos.interface"
import type { Venta } from "@/interfaces/ventas.interface"
import { getCollection } from "@/lib/firebase"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [stats, setStats] = useState({
    servicesInProgress: 0,
    todaySales: 0,
    lowStockItems: 0,
    activeEmployees: 0,
  })
  const [recentServices, setRecentServices] = useState<any[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    refreshDashboard()
  }, [])

  const refreshDashboard = async () => {
    try {
      // Cargar datos desde Firestore
      const [services, inventory, sales, employees, clients, vehicles] = await Promise.all([
        getCollection("servicios") as Promise<ServicioInt[]>,
        getCollection("productos") as Promise<Productos[]>,
        getCollection("ventas") as Promise<Venta[]>,
        getCollection("trabajadores") as Promise<Trabajadores[]>,
        getCollection("clientes") as Promise<Clientes[]>,
        getCollection("vehiculos") as Promise<Vehiculos[]>,
      ])

      // Actualizar estadísticas
      setStats({
        servicesInProgress: 0, // no se muestra actualmente
        todaySales: services.filter(s => isToday(new Date(s.fecha_servicio))).length,
        lowStockItems: inventory.filter(p => Number(p.cantidad_disponible) <= Number(p.stock_minimo)).length,
        activeEmployees: employees.filter(e => e.estado).length,
      })

      // Obtener últimos servicios
      const recent = services
        // Ordenar por timestamp de fecha_servicio descendente
        .sort((a, b) => new Date(b.fecha_servicio).getTime() - new Date(a.fecha_servicio).getTime())
        .slice(0, 5)
        .map(s => {
          const client = clients.find(c => c.id === s.cliente_id) || { nombre: "Cliente no encontrado" }
          const vehicle = vehicles.find(v => v.id === s.vehiculo_id) || { marca: "Vehículo", modelo: "no encontrado", placa: "N/A" }
          const employee = employees.find(e => e.id === s.empleado_id) || { nombre: "Sin asignar" }
          return {
            ...s,
            client,
            vehicle,
            employee,
            createdAt: s.fecha_servicio,
            typeName: s.tipos_servicio_realizados?.map(t => t.nombre).join(", ") || "Servicio general",
            status: s.pagado ? "Finalizado" : "Pendiente de cobro",
          }
        })
      setRecentServices(recent)

      // Próximas reservas omitidas (sección comentada en UI)
    } catch (error) {
      console.error("Error refreshing dashboard:", error)
      // Set default values on error
      setStats({
        servicesInProgress: 0,
        todaySales: 0,
        lowStockItems: 0,
        activeEmployees: 0,
      })
      setRecentServices([])
      setUpcomingAppointments([])
    }
  }

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <div className="dashboard-container">
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard title="Ventas Hoy" value={stats.todaySales} />
        <StatCard title="Productos Bajo Stock" value={stats.lowStockItems} />
        <StatCard title="Empleados Activos" value={stats.activeEmployees} />
      </div>

      <div className="dashboard-content">
        {/* Recent Services - Desktop Table */}
        <div className="desktop-services-section">
          <div className="bg-white p-4 rounded shadow lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Últimos Servicios</h3>
            {/* Tabla de Últimos Servicios con ShadCN Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.length > 0 ? (
                  recentServices.map((service, index) => (
                    <TableRow key={service.id || index}>
                      <TableCell>{service.client.nombre}</TableCell>
                      <TableCell>{service.vehicle.marca} {service.vehicle.modelo}</TableCell>
                      <TableCell>{service.vehicle.placa}</TableCell>
                      <TableCell>{service.typeName}</TableCell>
                      <TableCell>{service.createdAt ? formatDate(new Date(service.createdAt)) : 'N/A'}</TableCell>
                      <TableCell><StatusBadge status={service.status} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No hay servicios recientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Services - Mobile Cards */}
        <div className="mobile-services-section">
          <div className="mobile-section-header">
            <h3>Últimos Servicios</h3>
          </div>
          <div className="mobile-services-list">
            {recentServices.length > 0 ? (
              recentServices.map((service, index) => (
                <div
                  key={service.id || index}
                  className={`mobile-service-card ${expandedCard === service.id ? "expanded" : ""}`}
                  onClick={() => toggleCardExpansion(service.id)}
                >
                  <div className="mobile-card-header">
                    <div className="mobile-card-main-info">
                      <div className="mobile-card-client">{service.client.nombre}</div>
                      <div className="mobile-card-vehicle">
                        {service.vehicle.make} {service.vehicle.model}
                      </div>
                      <div className="mobile-card-service">{service.typeName}</div>
                    </div>
                    <div className="mobile-card-status">
                      <StatusBadge status={service.status} />
                    </div>
                  </div>

                  {expandedCard === service.id && (
                    <div className="mobile-card-expanded">
                      <div className="mobile-card-detail">
                        <span className="mobile-detail-label">Placa:</span>
                        <span className="mobile-detail-value">{service.vehicle.plate}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-detail-label">Trabajador:</span>
                        <span className="mobile-detail-value">{service.employee.name}</span>
                      </div>
                      <div className="mobile-card-detail">
                        <span className="mobile-detail-label">Fecha:</span>
                        <span className="mobile-detail-value">
                          {service.createdAt ? formatDate(new Date(service.createdAt)) : "No disponible"}
                        </span>
                      </div>
                      {service.startTime && (
                        <div className="mobile-card-detail">
                          <span className="mobile-detail-label">Hora inicio:</span>
                          <span className="mobile-detail-value">{formatTime(new Date(service.startTime))}</span>
                        </div>
                      )}
                      {service.notes && (
                        <div className="mobile-card-detail">
                          <span className="mobile-detail-label">Notas:</span>
                          <span className="mobile-detail-value">{service.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mobile-card-expand-indicator">
                    <i className={`fas fa-chevron-${expandedCard === service.id ? "up" : "down"}`}></i>
                  </div>
                </div>
              ))
            ) : (
              <div className="mobile-empty-state">
                <i className="fas fa-clipboard-list"></i>
                <p>No hay servicios recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Próximas Reservas comentado */}
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="stat-card">
      <CardContent className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <p className="stat-card-value">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "En proceso":
        return "status-badge status-in-progress"
      case "Finalizado":
        return "status-badge status-completed"
      case "Pendiente de cobro":
        return "status-badge status-pending"
      default:
        return "status-badge status-default"
    }
  }

  return <span className={getStatusClass(status)}>{status || "Sin estado"}</span>
}

// Helper functions
function isToday(date: Date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function formatTime(date: Date) {
  try {
    if (!date || isNaN(date.getTime())) {
      return "N/A"
    }
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  } catch (error) {
    return "N/A"
  }
}

function formatDate(date: Date) {
  try {
    if (!date || isNaN(date.getTime())) {
      return "N/A"
    }
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    return "N/A"
  }
}