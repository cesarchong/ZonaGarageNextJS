"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ClientPoints {
  clientId: string
  clientName: string
  points: number
  totalSpent: number
  redemptions: Redemption[]
}

interface Redemption {
  id: string
  clientId: string
  clientName: string
  pointsUsed: number
  reward: string
  createdAt: string
  status: "Disponible" | "Usado"
}

export default function LoyaltySystem() {
  const { toast } = useToast()
  const [clientsPoints, setClientsPoints] = useState<ClientPoints[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    loadLoyaltyData()
  }, [])

  const loadLoyaltyData = () => {
    try {
      const clients = JSON.parse(localStorage.getItem("clients") || "[]")
      const services = JSON.parse(localStorage.getItem("services") || "[]")
      const sales = JSON.parse(localStorage.getItem("sales") || "[]")
      const redemptions = JSON.parse(localStorage.getItem("pointRedemptions") || "[]")

      // Calculate points for each client
      const pointsData: { [key: string]: ClientPoints } = {}

      clients.forEach((client: any) => {
        pointsData[client.id] = {
          clientId: client.id,
          clientName: client.name,
          points: 0,
          totalSpent: 0,
          redemptions: [],
        }
      })

      // Add points from services
      services.forEach((service: any) => {
        if (service.clientId && service.status === "Finalizado" && pointsData[service.clientId]) {
          pointsData[service.clientId].totalSpent += service.total || 0
          pointsData[service.clientId].points += Math.floor((service.total || 0) / 10)
        }
      })

      // Add points from sales
      sales.forEach((sale: any) => {
        if (sale.clientId && pointsData[sale.clientId]) {
          pointsData[sale.clientId].totalSpent += sale.total || 0
          pointsData[sale.clientId].points += Math.floor((sale.total || 0) / 10)
        }
      })

      // Subtract redeemed points and add redemption history
      redemptions.forEach((redemption: any) => {
        if (pointsData[redemption.clientId]) {
          pointsData[redemption.clientId].points -= redemption.pointsUsed
          pointsData[redemption.clientId].redemptions.push(redemption)
        }
      })

      setClientsPoints(Object.values(pointsData))
      setRedemptions(redemptions)
    } catch (error) {
      console.error("Error loading loyalty data:", error)
    }
  }

  const manualRedemption = (clientId: string) => {
    const client = clientsPoints.find((c) => c.clientId === clientId)
    if (!client) return

    if (client.points < 20) {
      toast({
        title: "Puntos insuficientes",
        description: `${client.clientName} tiene ${client.points} puntos. Necesita 20 para canjear.`,
        variant: "destructive",
      })
      return
    }

    const redemption: Redemption = {
      id: Date.now().toString(),
      clientId,
      clientName: client.clientName,
      pointsUsed: 20,
      reward: "Lavado Gratis",
      createdAt: new Date().toISOString(),
      status: "Disponible",
    }

    const allRedemptions = [...redemptions, redemption]
    localStorage.setItem("pointRedemptions", JSON.stringify(allRedemptions))

    toast({
      title: "¡Canje exitoso!",
      description: `${client.clientName} ha canjeado 20 puntos por un lavado gratis`,
      variant: "success",
    })

    loadLoyaltyData()
  }

  const filteredClients = clientsPoints.filter((client) => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "eligible" && client.points >= 20) ||
      (filterStatus === "active" && client.points > 0)
    return matchesSearch && matchesFilter
  })

  const totalPointsIssued = clientsPoints.reduce((sum, client) => sum + client.points, 0)
  const totalRedemptions = redemptions.length
  const eligibleClients = clientsPoints.filter((client) => client.points >= 20).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Lealtad</h1>
          <p className="text-gray-600">Gestión de puntos y recompensas para clientes</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <i className="fas fa-star text-yellow-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsIssued}</div>
            <p className="text-xs text-muted-foreground">Puntos en circulación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canjes Realizados</CardTitle>
            <i className="fas fa-gift text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedemptions}</div>
            <p className="text-xs text-muted-foreground">Recompensas entregadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Elegibles</CardTitle>
            <i className="fas fa-trophy text-blue-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleClients}</div>
            <p className="text-xs text-muted-foreground">Pueden canjear ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <i className="fas fa-users text-purple-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsPoints.filter((c) => c.points > 0).length}</div>
            <p className="text-xs text-muted-foreground">Con puntos acumulados</p>
          </CardContent>
        </Card>
      </div>

      {/* Program Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <i className="fas fa-dollar-sign text-3xl text-yellow-600 mb-2"></i>
              <h3 className="font-bold">Ganar Puntos</h3>
              <p className="text-sm text-gray-600">Cada $10 en servicios = 1 punto</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <i className="fas fa-star text-3xl text-green-600 mb-2"></i>
              <h3 className="font-bold">Canjear Recompensas</h3>
              <p className="text-sm text-gray-600">20 puntos = 1 lavado gratis</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <i className="fas fa-infinity text-3xl text-blue-600 mb-2"></i>
              <h3 className="font-bold">Sin Vencimiento</h3>
              <p className="text-sm text-gray-600">Los puntos nunca expiran</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar Cliente</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">Todos los clientes</option>
                <option value="eligible">Elegibles para canje (20+ puntos)</option>
                <option value="active">Con puntos acumulados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Points Table */}
      <Card>
        <CardHeader>
          <CardTitle>Puntos por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Cliente</th>
                  <th className="text-left py-3 px-4">Puntos</th>
                  <th className="text-left py-3 px-4">Total Gastado</th>
                  <th className="text-left py-3 px-4">Canjes</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.clientId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{client.clientName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <i className="fas fa-star text-yellow-500 mr-2"></i>
                        <span className="text-lg font-bold">{client.points}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">${client.totalSpent.toFixed(2)}</td>
                    <td className="py-3 px-4">{client.redemptions.length}</td>
                    <td className="py-3 px-4">
                      {client.points >= 20 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Elegible para canje
                        </span>
                      ) : client.points > 0 ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Acumulando puntos
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Sin puntos</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {client.points >= 20 && (
                        <Button
                          onClick={() => manualRedemption(client.clientId)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <i className="fas fa-gift mr-2"></i>
                          Canjear 20 pts
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Redemptions */}
      <Card>
        <CardHeader>
          <CardTitle>Canjes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length > 0 ? (
            <div className="space-y-3">
              {redemptions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-gift text-green-600 mr-3"></i>
                      <div>
                        <p className="font-medium">{redemption.clientName}</p>
                        <p className="text-sm text-gray-600">
                          {redemption.reward} - {new Date(redemption.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-3">-{redemption.pointsUsed} puntos</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          redemption.status === "Usado" ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {redemption.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-gift text-4xl mb-4"></i>
              <p>No hay canjes registrados aún</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
