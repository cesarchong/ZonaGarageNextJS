"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { Caja, CashMovement } from "@/interfaces/caja.interface"
import type { Pagos } from "@/interfaces/pagos.interface"
import type { Servicios } from "@/interfaces/servicios.interface"
import { addDocument, getCollection, updateDocument } from "@/lib/firebase"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { useEffect, useState } from "react"

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
  const [currentCaja, setCurrentCaja] = useState<Caja | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [movements, setMovements] = useState<CashMovement[]>([])
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
  const [formData, setFormData] = useState({
    initialAmount: "",
    finalAmount: "",
    movementAmount: "",
    movementDescription: "",
    movementType: "deposit" as "deposit" | "withdrawal",
  })

  const { toast } = useToast()

  useEffect(() => {
    loadCashRegisterData()
    loadDailyPayments()
    loadRecentMovements()
  }, [])

  const loadCashRegisterData = async () => {
    try {
      const cajas = await getCollection("cajas") as Caja[]
      const activeCaja = cajas.find(caja => caja.esta_abierta)
      
      if (activeCaja) {
        setCurrentCaja(activeCaja)
        setIsOpen(true)
        setCashAmount(activeCaja.monto_efectivo)
      } else {
        setIsOpen(false)
        setCashAmount(0)
        setCurrentCaja(null)
      }
    } catch (error) {
      console.error("Error loading cash register data:", error)
      toast({
        title: "Error",
        description: "Error al cargar datos de la caja",
        variant: "destructive",
      })
    }
  }

  const loadDailyPayments = async () => {
    try {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const [servicios, pagos] = await Promise.all([
        getCollection("servicios") as Promise<Servicios[]>,
        getCollection("pagos") as Promise<Pagos[]>
      ])
      
      // Filtrar servicios del día actual usando la misma lógica que reportes
      const todayServices = servicios.filter(servicio => {
        const serviceDate = new Date(servicio.fecha_servicio)
        return serviceDate >= todayStart && serviceDate < todayEnd
      })

      const payments = {
        cash: 0,
        card: 0,
        transfer: 0,
        mobile: 0,
        zelle: 0,
        binance: 0,
        total: 0,
      }

      // Si hay pagos registrados, usar esos datos
      const todayServiceIds = todayServices.map(s => s.id)
      const todayPayments = pagos.filter(pago => todayServiceIds.includes(pago.servicio_id))
      
      if (todayPayments.length > 0) {
        // Usar pagos reales de la colección pagos
        todayPayments.forEach(pago => {
          const monto = Number(pago.monto) || 0
          
          switch (pago.metodo_pago?.toLowerCase()) {
            case 'efectivo':
              payments.cash += monto
              break
            case 'tarjeta':
              payments.card += monto
              break
            case 'transferencia':
              payments.transfer += monto
              break
            case 'pago_movil':
            case 'pago móvil':
              payments.mobile += monto
              break
            case 'zelle':
              payments.zelle += monto
              break
            case 'binance':
              payments.binance += monto
              break
            default:
              payments.cash += monto
              break
          }
          payments.total += monto
        })
      } else {
        // Si no hay pagos registrados, usar precio_total de servicios como fallback
        // y asumir que todo fue pagado en efectivo
        todayServices.forEach(servicio => {
          const total = Number(servicio.precio_total) || 0
          payments.cash += total
          payments.total += total
        })
      }

      setDailyPayments(payments)
    } catch (error) {
      console.error("Error loading daily payments:", error)
    }
  }

  const loadRecentMovements = async () => {
    try {
      const movimientos = await getCollection("movimientos_caja") as CashMovement[]
      const recent = movimientos
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
        .slice(0, 10)
      setMovements(recent)
    } catch (error) {
      console.error("Error loading recent movements:", error)
    }
  }

  const addMovement = async (movement: Omit<CashMovement, 'id'>) => {
    try {
      const movementDoc = {
        tipo: movement.tipo,
        monto: movement.monto,
        descripcion: movement.descripcion,
        id_caja: movement.id_caja,
        fecha_hora: new Date().toISOString(),
        fecha_creacion: new Date().toISOString(),
        ...(movement.metodo_pago && { metodo_pago: movement.metodo_pago }),
        ...(movement.id_relacionado && { id_relacionado: movement.id_relacionado }),
      }
      
      await addDocument("movimientos_caja", movementDoc)
      
      // Actualizar el monto en caja si está abierta
      if (currentCaja && isOpen) {
        const newAmount = movement.tipo === "retiro" 
          ? cashAmount - movement.monto 
          : cashAmount + movement.monto
        
        setCashAmount(newAmount)
        
        const updatedCaja = {
          ...currentCaja,
          monto_efectivo: newAmount
        }
        
        await updateDocument(`cajas/${currentCaja.id}`, updatedCaja)
      }
      
      // Recargar movimientos
      loadRecentMovements()
      
      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      })
    } catch (error) {
      console.error("Error adding movement:", error)
      toast({
        title: "Error",
        description: "Error al registrar movimiento",
        variant: "destructive",
      })
    }
  }

  const handleOpenCash = async () => {
    try {
      const initialAmount = Number.parseFloat(formData.initialAmount) || 0
      
      const cajaData: Omit<Caja, 'id'> = {
        esta_abierta: true,
        fecha_apertura: new Date().toISOString(),
        abierta_por: "Admin", // Aquí puedes obtener el usuario actual
        monto_inicial: initialAmount,
        monto_efectivo: initialAmount,
        fecha_creacion: new Date().toISOString(),
      }
      
      const cajaDoc = await addDocument("cajas", cajaData)
      
      // Registrar movimiento de apertura
      await addMovement({
        tipo: "abrir",
        monto: initialAmount,
        descripcion: `Apertura de caja con ${formatCurrency(initialAmount)}`,
        id_caja: cajaDoc.id,
        fecha_hora: new Date().toISOString(),
        fecha_creacion: new Date().toISOString(),
      })
      
      setCurrentCaja({ ...cajaData, id: cajaDoc.id })
      setIsOpen(true)
      setCashAmount(initialAmount)
      setShowOpenForm(false)
      setFormData({ ...formData, initialAmount: "" })
      
      toast({
        title: "Éxito",
        description: "Caja abierta correctamente",
      })
    } catch (error) {
      console.error("Error opening cash register:", error)
      toast({
        title: "Error",
        description: "Error al abrir la caja",
        variant: "destructive",
      })
    }
  }

  const handleCloseCash = async () => {
    try {
      if (!currentCaja) return
      
      const finalAmount = formData.finalAmount 
        ? Number.parseFloat(formData.finalAmount) 
        : cashAmount
      
      const updatedCaja = {
        ...currentCaja,
        esta_abierta: false,
        fecha_cierre: new Date().toISOString(),
        monto_final: finalAmount,
      }
      
      await updateDocument(`cajas/${currentCaja.id}`, updatedCaja)
      
      // Registrar movimiento de cierre
      await addMovement({
        tipo: "cerrar",
        monto: finalAmount,
        descripcion: `Cierre de caja con ${formatCurrency(finalAmount)}`,
        id_caja: currentCaja.id,
        fecha_hora: new Date().toISOString(),
        fecha_creacion: new Date().toISOString(),
      })
      
      setIsOpen(false)
      setCashAmount(0)
      setCurrentCaja(null)
      setShowCloseForm(false)
      setFormData({ ...formData, finalAmount: "" })
      
      toast({
        title: "Éxito",
        description: "Caja cerrada correctamente",
      })
    } catch (error) {
      console.error("Error closing cash register:", error)
      toast({
        title: "Error",
        description: "Error al cerrar la caja",
        variant: "destructive",
      })
    }
  }

  const handleMovement = async () => {
    try {
      if (!formData.movementAmount || !formData.movementDescription) {
        toast({
          title: "Error",
          description: "Complete todos los campos",
          variant: "destructive",
        })
        return
      }
      
      const amount = Number.parseFloat(formData.movementAmount)
      
      await addMovement({
        tipo: formData.movementType === "deposit" ? "deposito" : "retiro",
        monto: amount,
        descripcion: formData.movementDescription,
        id_caja: currentCaja?.id || "",
        fecha_hora: new Date().toISOString(),
        fecha_creacion: new Date().toISOString(),
      })
      
      setShowMovementForm(false)
      setFormData({
        ...formData,
        movementAmount: "",
        movementDescription: "",
      })
    } catch (error) {
      console.error("Error adding movement:", error)
      toast({
        title: "Error",
        description: "Error al registrar movimiento",
        variant: "destructive",
      })
    }
  }

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
            <Dialog open={showOpenForm} onOpenChange={setShowOpenForm}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <i className="fas fa-cash-register mr-2"></i>
                  Abrir Caja
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <i className="fas fa-cash-register mr-2 text-green-600"></i>
                    Abrir Caja
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <i className="fas fa-info-circle text-green-600 mr-2"></i>
                      <p className="text-sm text-green-800">
                        Iniciando nueva sesión de caja para el día
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monto inicial en efectivo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.initialAmount}
                      onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ingrese el monto de efectivo con el que inicia la caja
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleOpenCash} className="bg-green-600 hover:bg-green-700 flex-1">
                      <i className="fas fa-unlock mr-2"></i>
                      Abrir Caja
                    </Button>
                    <Button onClick={() => setShowOpenForm(false)} variant="outline">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Button onClick={() => setShowMovementForm(true)} variant="outline">
                <i className="fas fa-exchange-alt mr-2"></i>
                Movimiento
              </Button>
              <Dialog open={showCloseForm} onOpenChange={setShowCloseForm}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <i className="fas fa-lock mr-2"></i>
                    Cerrar Caja
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <i className="fas fa-lock mr-2 text-red-600"></i>
                      Cerrar Caja
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                        <p className="text-sm text-red-800">
                          Finalizando sesión de caja del día
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Efectivo actual en caja:</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(cashAmount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Efectivo contado (opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.finalAmount}
                        onChange={(e) => setFormData({ ...formData, finalAmount: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder={cashAmount.toString()}
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Si no especifica un monto, se usará el efectivo actual en caja
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCloseCash} className="bg-red-600 hover:bg-red-700 flex-1">
                        <i className="fas fa-lock mr-2"></i>
                        Cerrar Caja
                      </Button>
                      <Button onClick={() => setShowCloseForm(false)} variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`${isOpen ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center ${isOpen ? "text-green-800" : "text-red-800"}`}>
              <i className={`fas ${isOpen ? "fa-unlock" : "fa-lock"} mr-2`}></i>
              Estado de la Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`text-lg font-semibold ${isOpen ? "text-green-700" : "text-red-700"}`}>
                {isOpen ? "ABIERTA" : "CERRADA"}
              </p>
              {currentCaja && (
                <div className="text-sm text-gray-600">
                  <p>Abierta: {formatDateTime(currentCaja.fecha_apertura)}</p>
                  <p>Por: {currentCaja.abierta_por}</p>
                  <p>Monto inicial: {formatCurrency(currentCaja.monto_inicial)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-blue-800">
              <i className="fas fa-dollar-sign mr-2"></i>
              Efectivo en Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(cashAmount)}</p>
              <p className="text-sm text-gray-600">
                {isOpen ? "Disponible para operaciones" : "Caja cerrada"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-800">
              <i className="fas fa-chart-line mr-2"></i>
              Ingresos Totales del Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-yellow-700">{formatCurrency(dailyPayments.total)}</p>
              <p className="text-sm text-gray-600">Total de servicios y productos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Payments Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-credit-card mr-2"></i>
            Resumen de Pagos del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <i className="fas fa-money-bill-wave text-2xl text-green-600 mb-2"></i>
              <p className="text-sm text-gray-600">Efectivo</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(dailyPayments.cash)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <i className="fas fa-credit-card text-2xl text-blue-600 mb-2"></i>
              <p className="text-sm text-gray-600">Tarjeta</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(dailyPayments.card)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <i className="fas fa-exchange-alt text-2xl text-purple-600 mb-2"></i>
              <p className="text-sm text-gray-600">Transferencia</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(dailyPayments.transfer)}</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
              <i className="fas fa-mobile-alt text-2xl text-pink-600 mb-2"></i>
              <p className="text-sm text-gray-600">Pago Móvil</p>
              <p className="text-lg font-bold text-pink-700">{formatCurrency(dailyPayments.mobile)}</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <i className="fas fa-dollar-sign text-2xl text-indigo-600 mb-2"></i>
              <p className="text-sm text-gray-600">Zelle</p>
              <p className="text-lg font-bold text-indigo-700">{formatCurrency(dailyPayments.zelle)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <i className="fab fa-bitcoin text-2xl text-orange-600 mb-2"></i>
              <p className="text-sm text-gray-600">Binance</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(dailyPayments.binance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-history mr-2"></i>
            Movimientos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length > 0 ? (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      movement.tipo === "abrir" ? "bg-green-100 text-green-600" :
                      movement.tipo === "cerrar" ? "bg-red-100 text-red-600" :
                      movement.tipo === "deposito" || movement.tipo === "pago" ? "bg-blue-100 text-blue-600" :
                      "bg-orange-100 text-orange-600"
                    }`}>
                      <i className={`fas ${
                        movement.tipo === "abrir" ? "fa-unlock" :
                        movement.tipo === "cerrar" ? "fa-lock" :
                        movement.tipo === "deposito" || movement.tipo === "pago" ? "fa-plus" :
                        "fa-minus"
                      }`}></i>
                    </div>
                    <div>
                      <p className="font-medium">{movement.descripcion}</p>
                      <p className="text-sm text-gray-600">{formatDateTime(movement.fecha_hora)}</p>
                      {movement.metodo_pago && (
                        <p className="text-xs text-gray-500">Método: {movement.metodo_pago}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      movement.tipo === "deposito" || movement.tipo === "pago" || movement.tipo === "abrir" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {movement.tipo === "retiro" ? "-" : "+"}{formatCurrency(movement.monto)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-history text-4xl mb-4"></i>
              <p>No hay movimientos recientes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms */}
      {showMovementForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de movimiento</label>
                <select
                  value={formData.movementType}
                  onChange={(e) => setFormData({ ...formData, movementType: e.target.value as "deposit" | "withdrawal" })}
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
                  placeholder="Descripción del movimiento"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleMovement} className="bg-blue-600 hover:bg-blue-700">
                  Registrar Movimiento
                </Button>
                <Button onClick={() => setShowMovementForm(false)} variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
