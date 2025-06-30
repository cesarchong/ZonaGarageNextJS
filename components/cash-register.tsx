"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime, formatDate, formatCurrency } from "@/lib/utils"

interface CashMovement {
  id: string
  type: "open" | "close" | "deposit" | "withdrawal" | "payment"
  amount: number
  description: string
  timestamp: string
  paymentMethod?: string
  relatedId?: string
}

interface PendingPayment {
  id: string
  type: "sale" | "service"
  clientName: string
  amount: number
  description: string
  date: string
  items?: string[]
  isRedemption?: boolean
}

interface PaymentSummary {
  cash: number
  card: number
  transfer: number
  mobile: number
  zelle: number
  binance: number
  total: number
}

export default function CashRegister() {
  const [isOpen, setIsOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [dailyPayments, setDailyPayments] = useState<PaymentSummary>({
    cash: 0,
    card: 0,
    transfer: 0,
    mobile: 0,
    zelle: 0,
    binance: 0,
    total: 0,
  })
  const [showOpenForm, setShowOpenForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [formData, setFormData] = useState({
    initialAmount: "",
    finalAmount: "",
    movementAmount: "",
    movementDescription: "",
    movementType: "deposit" as "deposit" | "withdrawal",
    paymentMethod: "cash",
    receivedAmount: "",
    changeAmount: 0,
  })

  const { toast } = useToast()

  useEffect(() => {
    loadCashRegisterData()
    loadPendingPayments()
    calculateDailyPayments()
  }, [])

  const loadCashRegisterData = () => {
    try {
      const savedData = localStorage.getItem("cashRegister")
      if (savedData) {
        const data = JSON.parse(savedData)
        setIsOpen(data.isOpen || false)
        setCashAmount(data.cashAmount || 0)
        setMovements(data.movements || [])
      }
    } catch (error) {
      console.error("Error loading cash register data:", error)
    }
  }

  const loadPendingPayments = () => {
    try {
      const sales = JSON.parse(localStorage.getItem("sales") || "[]")
      const services = JSON.parse(localStorage.getItem("services") || "[]")
      const clients = JSON.parse(localStorage.getItem("clients") || "[]")
      const payments = JSON.parse(localStorage.getItem("payments") || "[]")

      // Get paid IDs to filter out
      const paidIds = payments.map((p: any) => p.paymentId)

      // Get client name helper
      const getClientName = (clientId?: string) => {
        if (!clientId) return "Cliente general"
        const client = clients.find((c: any) => c.id === clientId)
        return client?.name || "Cliente no encontrado"
      }

      // Filter unpaid sales
      const pendingSales = sales
        .filter((sale: any) => !paidIds.includes(sale.id))
        .map((sale: any) => ({
          id: sale.id,
          type: "sale" as const,
          clientName: getClientName(sale.clientId),
          amount: sale.total || 0,
          description: `Venta #${sale.id.slice(-4)}`,
          date: sale.createdAt,
          items: sale.items?.map((item: any) => `${item.productName} x${item.quantity}`) || [],
        }))

      // Después de crear pendingServices, agregar:
      const pointsData = JSON.parse(localStorage.getItem("pointRedemptions") || "[]")

      // Modificar el mapeo de pendingServices para incluir información de canjes:
      const pendingServices = services
        .filter((service: any) => service.status === "Pendiente de cobro" && !paidIds.includes(service.id))
        .map((service: any) => {
          const hasRedemption = service.redemptionApplied || false
          return {
            id: service.id,
            type: "service" as const,
            clientName: getClientName(service.clientId),
            amount: service.total || 0,
            description: `Servicio: ${service.typeName || service.type || "Servicio general"}${hasRedemption ? " (GRATIS)" : ""}`,
            date: service.createdAt,
            items: [service.typeName || service.type || "Servicio general"],
            isRedemption: hasRedemption,
          }
        })

      setPendingPayments([...pendingSales, ...pendingServices])
    } catch (error) {
      console.error("Error loading pending payments:", error)
      setPendingPayments([])
    }
  }

  const calculateDailyPayments = () => {
    try {
      const today = new Date()
      const todayStr = today.toDateString()
      const payments = JSON.parse(localStorage.getItem("payments") || "[]")

      const todayPayments = payments.filter((payment: any) => {
        const paymentDate = new Date(payment.createdAt)
        return paymentDate.toDateString() === todayStr
      })

      const summary = todayPayments.reduce(
        (acc: PaymentSummary, payment: any) => {
          const amount = payment.total || 0
          switch (payment.paymentMethod) {
            case "cash":
              acc.cash += amount
              break
            case "card":
            case "debit":
            case "credit":
              acc.card += amount
              break
            case "transfer":
              acc.transfer += amount
              break
            case "mobile":
              acc.mobile += amount
              break
            case "zelle":
              acc.zelle += amount
              break
            case "binance":
              acc.binance += amount
              break
          }
          acc.total += amount
          return acc
        },
        { cash: 0, card: 0, transfer: 0, mobile: 0, zelle: 0, binance: 0, total: 0 },
      )

      setDailyPayments(summary)
    } catch (error) {
      console.error("Error calculating daily payments:", error)
    }
  }

  const saveCashRegisterData = (data: any) => {
    try {
      localStorage.setItem("cashRegister", JSON.stringify(data))
    } catch (error) {
      console.error("Error saving cash register data:", error)
    }
  }

  const addMovement = (movement: Omit<CashMovement, "id" | "timestamp">) => {
    const newMovement: CashMovement = {
      ...movement,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    const newMovements = [...movements, newMovement]
    setMovements(newMovements)

    let newCashAmount = cashAmount
    let newIsOpen = isOpen

    // Update cash amount for cash movements
    if (movement.type === "open") {
      newCashAmount = movement.amount
      newIsOpen = true
    } else if (movement.type === "close") {
      newIsOpen = false
      newCashAmount = 0
    } else if (movement.type === "deposit" || (movement.type === "payment" && movement.paymentMethod === "cash")) {
      newCashAmount = cashAmount + movement.amount
    } else if (movement.type === "withdrawal") {
      newCashAmount = cashAmount - movement.amount
    }

    setCashAmount(newCashAmount)
    setIsOpen(newIsOpen)

    saveCashRegisterData({
      isOpen: newIsOpen,
      cashAmount: newCashAmount,
      movements: newMovements,
    })
  }

  const handleOpenCash = () => {
    if (!formData.initialAmount || Number.parseFloat(formData.initialAmount) < 0) {
      toast({
        title: "Error",
        description: "Debe ingresar un monto inicial válido",
        variant: "destructive",
      })
      return
    }

    addMovement({
      type: "open",
      amount: Number.parseFloat(formData.initialAmount),
      description: "Apertura de caja",
    })

    setFormData({ ...formData, initialAmount: "" })
    setShowOpenForm(false)
    toast({
      title: "Éxito",
      description: "Caja abierta correctamente",
    })
  }

  const handleCloseCash = () => {
    const finalAmount = formData.finalAmount ? Number.parseFloat(formData.finalAmount) : cashAmount

    addMovement({
      type: "close",
      amount: finalAmount,
      description: `Cierre de caja - Efectivo final: ${formatCurrency(finalAmount)}`,
    })

    setFormData({ ...formData, finalAmount: "" })
    setShowCloseForm(false)
    toast({
      title: "Éxito",
      description: "Caja cerrada correctamente",
    })
  }

  const handleMovement = () => {
    if (!formData.movementAmount || !formData.movementDescription) {
      toast({
        title: "Error",
        description: "Debe completar todos los campos",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(formData.movementAmount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    addMovement({
      type: formData.movementType,
      amount,
      description: formData.movementDescription,
    })

    setFormData({
      ...formData,
      movementAmount: "",
      movementDescription: "",
      movementType: "deposit",
    })
    setShowMovementForm(false)
    toast({
      title: "Éxito",
      description: `${formData.movementType === "deposit" ? "Depósito" : "Retiro"} registrado correctamente`,
    })
  }

  const handlePayment = () => {
    if (!selectedPayment) return

    if (formData.paymentMethod === "cash") {
      if (!isOpen) {
        toast({
          title: "Error",
          description: "La caja debe estar abierta para recibir pagos en efectivo",
          variant: "destructive",
        })
        return
      }

      const received = Number.parseFloat(formData.receivedAmount)
      if (!received || received < selectedPayment.amount) {
        toast({
          title: "Error",
          description: "El monto recibido debe ser mayor o igual al total",
          variant: "destructive",
        })
        return
      }
    }

    // Add payment movement
    addMovement({
      type: "payment",
      amount: selectedPayment.amount,
      description: `Pago: ${selectedPayment.description} - ${selectedPayment.clientName}`,
      paymentMethod: formData.paymentMethod,
      relatedId: selectedPayment.id,
    })

    // Create payment record
    const payments = JSON.parse(localStorage.getItem("payments") || "[]")
    const newPayment = {
      id: Date.now().toString(),
      paymentId: selectedPayment.id,
      type: selectedPayment.type,
      clientName: selectedPayment.clientName,
      total: selectedPayment.amount,
      paymentMethod: formData.paymentMethod,
      amountReceived:
        formData.paymentMethod === "cash" ? Number.parseFloat(formData.receivedAmount) : selectedPayment.amount,
      change: formData.paymentMethod === "cash" ? formData.changeAmount : 0,
      cashierId: "admin",
      createdAt: new Date().toISOString(),
      items: selectedPayment.items || [],
    }
    payments.push(newPayment)
    localStorage.setItem("payments", JSON.stringify(payments))

    // Update service status if it's a service
    if (selectedPayment.type === "service") {
      const services = JSON.parse(localStorage.getItem("services") || "[]")
      const updatedServices = services.map((service: any) =>
        service.id === selectedPayment.id
          ? { ...service, status: "Finalizado", paymentMethod: formData.paymentMethod }
          : service,
      )
      localStorage.setItem("services", JSON.stringify(updatedServices))
    }

    // Remove from pending payments and refresh daily payments
    setPendingPayments((prev) => prev.filter((p) => p.id !== selectedPayment.id))
    calculateDailyPayments()

    setSelectedPayment(null)
    setShowPaymentForm(false)
    setFormData({
      ...formData,
      paymentMethod: "cash",
      receivedAmount: "",
      changeAmount: 0,
    })

    toast({
      title: "Éxito",
      description: "Pago procesado correctamente",
    })
  }

  const calculateChange = () => {
    if (selectedPayment && formData.receivedAmount) {
      const received = Number.parseFloat(formData.receivedAmount)
      const change = received - selectedPayment.amount
      setFormData({ ...formData, changeAmount: Math.max(0, change) })
    }
  }

  useEffect(() => {
    calculateChange()
  }, [formData.receivedAmount, selectedPayment])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Caja</h1>
          <p className="text-gray-600">Control de efectivo y procesamiento de pagos</p>
        </div>
        <div className="flex gap-2">
          {!isOpen ? (
            <Button onClick={() => setShowOpenForm(true)} className="bg-green-600 hover:bg-green-700">
              <i className="fas fa-unlock mr-2"></i>
              Abrir Caja
            </Button>
          ) : (
            <>
              <Button onClick={() => setShowMovementForm(true)} variant="outline">
                <i className="fas fa-exchange-alt mr-2"></i>
                Movimiento
              </Button>
              <Button onClick={() => setShowCloseForm(true)} className="bg-red-600 hover:bg-red-700">
                <i className="fas fa-lock mr-2"></i>
                Cerrar Caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado de Caja</CardTitle>
            <i className={`fas ${isOpen ? "fa-unlock text-green-600" : "fa-lock text-red-600"}`}></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isOpen ? "Abierta" : "Cerrada"}</div>
            <p className="text-xs text-muted-foreground">{isOpen ? "Lista para transacciones" : "Fuera de servicio"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectivo en Caja</CardTitle>
            <i className="fas fa-money-bill-wave text-green-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cashAmount)}</div>
            <p className="text-xs text-muted-foreground">Disponible en efectivo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <i className="fas fa-clock text-yellow-600"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Payments Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Pagos del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">💵 Efectivo</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(dailyPayments.cash)}</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">💳 Tarjeta</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(dailyPayments.card)}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">🏦 Transferencia</div>
              <div className="text-xl font-bold text-purple-600">{formatCurrency(dailyPayments.transfer)}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600">📱 Pago Móvil</div>
              <div className="text-xl font-bold text-orange-600">{formatCurrency(dailyPayments.mobile)}</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-sm text-gray-600">💰 Zelle</div>
              <div className="text-xl font-bold text-indigo-600">{formatCurrency(dailyPayments.zelle)}</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600">₿ Binance</div>
              <div className="text-xl font-bold text-yellow-600">{formatCurrency(dailyPayments.binance)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">💰 TOTAL</div>
              <div className="text-2xl font-bold text-gray-600">{formatCurrency(dailyPayments.total)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${payment.isRedemption ? "bg-green-50 border-green-200" : ""}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <i
                        className={`fas ${payment.type === "sale" ? "fa-shopping-cart" : "fa-concierge-bell"} ${payment.isRedemption ? "text-green-600" : "text-blue-600"}`}
                      ></i>
                      <span className="font-medium">{payment.description}</span>
                      <span className="text-sm text-gray-500">- {payment.clientName}</span>
                      {payment.isRedemption && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          CANJE APLICADO
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{formatDate(payment.date)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${payment.isRedemption ? "text-green-600" : "text-green-600"}`}>
                      {payment.isRedemption ? "GRATIS" : formatCurrency(payment.amount)}
                    </span>
                    <Button
                      onClick={() => {
                        setSelectedPayment(payment)
                        setFormData({ ...formData, receivedAmount: payment.amount.toString() })
                        setShowPaymentForm(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <i className="fas fa-credit-card mr-2"></i>
                      {payment.isRedemption ? "Confirmar" : "Cobrar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {movements.length > 0 ? (
              movements
                .slice(-10)
                .reverse()
                .map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 border-l-4 border-l-blue-500 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <i
                          className={`fas ${
                            movement.type === "open"
                              ? "fa-unlock text-green-600"
                              : movement.type === "close"
                                ? "fa-lock text-red-600"
                                : movement.type === "deposit"
                                  ? "fa-plus text-green-600"
                                  : movement.type === "withdrawal"
                                    ? "fa-minus text-red-600"
                                    : "fa-credit-card text-blue-600"
                          }`}
                        ></i>
                        <span className="font-medium">{movement.description}</span>
                        {movement.paymentMethod && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {movement.paymentMethod === "cash"
                              ? "Efectivo"
                              : movement.paymentMethod === "card"
                                ? "Tarjeta"
                                : movement.paymentMethod === "transfer"
                                  ? "Transferencia"
                                  : "Pago Móvil"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{formatDateTime(movement.timestamp)}</div>
                    </div>
                    <span
                      className={`text-lg font-bold ${
                        movement.type === "withdrawal" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {movement.type === "withdrawal" ? "-" : "+"}
                      {formatCurrency(movement.amount)}
                    </span>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-4xl mb-4"></i>
                <p>No hay movimientos registrados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showOpenForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Abrir Caja</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monto Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.initialAmount}
                  onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleOpenCash} className="flex-1 bg-green-600 hover:bg-green-700">
                  Abrir Caja
                </Button>
                <Button onClick={() => setShowOpenForm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCloseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Cerrar Caja</h3>
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Efectivo en sistema:</p>
                <p className="text-lg font-bold">{formatCurrency(cashAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Efectivo Real (Conteo)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.finalAmount}
                  onChange={(e) => setFormData({ ...formData, finalAmount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder={cashAmount.toString()}
                />
              </div>
              {formData.finalAmount && Number.parseFloat(formData.finalAmount) !== cashAmount && (
                <div
                  className={`p-3 rounded ${
                    Number.parseFloat(formData.finalAmount) > cashAmount
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <p className="text-sm font-medium">
                    Diferencia: {formatCurrency(Number.parseFloat(formData.finalAmount) - cashAmount)}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleCloseCash} className="flex-1 bg-red-600 hover:bg-red-700">
                  Cerrar Caja
                </Button>
                <Button onClick={() => setShowCloseForm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMovementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Registrar Movimiento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={formData.movementType}
                  onChange={(e) =>
                    setFormData({ ...formData, movementType: e.target.value as "deposit" | "withdrawal" })
                  }
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="deposit">Depósito</option>
                  <option value="withdrawal">Retiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.movementAmount}
                  onChange={(e) => setFormData({ ...formData, movementAmount: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.movementDescription}
                  onChange={(e) => setFormData({ ...formData, movementDescription: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Motivo del movimiento"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleMovement} className="flex-1">
                  Registrar
                </Button>
                <Button onClick={() => setShowMovementForm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Procesar Pago</h3>
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">{selectedPayment.description}</p>
                <p className="text-sm text-gray-600">Cliente: {selectedPayment.clientName}</p>
                <p className="text-lg font-bold">Total: {formatCurrency(selectedPayment.amount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Método de Pago</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mobile">Pago Móvil</option>
                </select>
              </div>

              {formData.paymentMethod === "cash" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monto Recibido</label>
                    <input
                      type="number"
                      step="0.01"
                      min={selectedPayment.amount}
                      value={formData.receivedAmount}
                      onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder={selectedPayment.amount.toString()}
                    />
                  </div>

                  {formData.changeAmount > 0 && (
                    <div className="bg-yellow-100 p-3 rounded">
                      <p className="text-sm font-medium text-yellow-800">
                        Cambio a entregar: {formatCurrency(formData.changeAmount)}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handlePayment} className="flex-1 bg-green-600 hover:bg-green-700">
                  Procesar Pago
                </Button>
                <Button onClick={() => setShowPaymentForm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
