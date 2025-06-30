"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

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

  const refreshDashboard = () => {
    try {
      // Initialize with empty arrays - you can replace this with your data source
      const services: any[] = []
      const inventory: any[] = []
      const sales: any[] = []
      const employees: any[] = []
      const clients: any[] = []
      const vehicles: any[] = []

      // Update stats with safe calculations
      setStats({
        servicesInProgress: services.filter((s: any) => s.status === "En proceso").length,
        todaySales: sales.filter((s: any) => isToday(new Date(s.createdAt))).length,
        lowStockItems: inventory.filter((item: any) => item.quantity <= item.minStock).length,
        activeEmployees: employees.filter((e: any) => e.status === "Activo").length,
      })

      // Get recent services with safe data handling
      const recent = services
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((service: any) => {
          const client = clients.find((c: any) => c.id === service.clientId) || { name: "Cliente no encontrado" }
          const vehicle = vehicles.find((v: any) => v.id === service.vehicleId) || {
            make: "Vehículo",
            model: "no encontrado",
            plate: "N/A",
          }
          const employee = employees.find((e: any) => e.id === service.employeeId) || { name: "Sin asignar" }
          return {
            ...service,
            client,
            vehicle,
            employee,
            typeName: service.typeName || service.type || "Servicio general",
          }
        })
      setRecentServices(recent)

      // Get upcoming appointments with safe filtering
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const upcoming = services
        .filter((s: any) => {
          if (!s.startTime) return false
          const startTime = new Date(s.startTime)
          return startTime >= now && startTime <= tomorrow && s.status === "En proceso"
        })
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5)
        .map((service: any) => {
          const client = clients.find((c: any) => c.id === service.clientId) || { name: "Cliente no encontrado" }
          return {
            ...service,
            client,
            typeName: service.typeName || service.type || "Servicio general",
          }
        })
      setUpcomingAppointments(upcoming)
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
        <StatCard title="Servicios en Proceso" value={stats.servicesInProgress} />
        <StatCard title="Ventas Hoy" value={stats.todaySales} />
        <StatCard title="Productos Bajo Stock" value={stats.lowStockItems} />
        <StatCard title="Empleados Activos" value={stats.activeEmployees} />
      </div>

      <div className="dashboard-content">
        {/* Recent Services - Desktop Table */}
        <div className="desktop-services-section">
          <div className="bg-white p-4 rounded shadow lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Últimos Servicios</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">Cliente</th>
                    <th className="py-2 px-4 border">Vehículo</th>
                    <th className="py-2 px-4 border">Servicio</th>
                    <th className="py-2 px-4 border">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.length > 0 ? (
                    recentServices.map((service, index) => (
                      <tr key={service.id || index}>
                        <td className="py-2 px-4 border">{service.client.name}</td>
                        <td className="py-2 px-4 border">
                          {service.vehicle.make} {service.vehicle.model}
                        </td>
                        <td className="py-2 px-4 border">{service.typeName}</td>
                        <td className="py-2 px-4 border">
                          <StatusBadge status={service.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        No hay servicios recientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                      <div className="mobile-card-client">{service.client.name}</div>
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

        {/* Upcoming Appointments */}
        <div className="appointments-section">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="appointments-title">Próximas Reservas</h3>
            <div className="appointments-list">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment, index) => (
                  <div key={appointment.id || index} className="appointment-card">
                    <div className="appointment-service">{appointment.typeName}</div>
                    <div className="appointment-client">{appointment.client.name}</div>
                    <div className="appointment-time">
                      <i className="far fa-clock"></i>
                      {formatTime(new Date(appointment.startTime))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="appointments-empty">
                  <p>No hay servicios programados</p>
                </div>
              )}
            </div>
          </div>
        </div>
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