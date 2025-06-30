"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from "@/lib/utils"

interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  clientId?: string
  notes: string
  createdAt: string
}

interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  minStock: number
}

export default function Sales() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentSale, setCurrentSale] = useState<Sale | null>(null)

  // Form state
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([])
  const [clientId, setClientId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Efectivo")
  const [discount, setDiscount] = useState("0")
  const [notes, setNotes] = useState("")

  // Product selection state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState("1")

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    const salesData = JSON.parse(localStorage.getItem("sales") || "[]")
    const inventoryData = JSON.parse(localStorage.getItem("inventory") || "[]")
    const clientsData = JSON.parse(localStorage.getItem("clients") || "[]")

    setSales(salesData)
    setProducts(inventoryData)
    setClients(clientsData)
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
  }

  const resetForm = () => {
    setCurrentSale(null)
    setSelectedProducts([])
    setClientId("")
    setPaymentMethod("Efectivo")
    setDiscount("0")
    setNotes("")
    setSelectedProductId("")
    setSelectedQuantity("1")
  }

  const addProductToSale = () => {
    if (!selectedProductId) {
      toast({
        title: "Error",
        description: "Seleccione un producto",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const quantity = Number.parseInt(selectedQuantity)
    if (quantity <= 0) {
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

    // Check if product is already in the sale
    const existingItemIndex = selectedProducts.findIndex((item) => item.productId === selectedProductId)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedProducts = [...selectedProducts]
      const newQuantity = updatedProducts[existingItemIndex].quantity + quantity

      if (newQuantity > product.quantity) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${product.quantity} unidades disponibles de ${product.name}`,
          variant: "destructive",
        })
        return
      }

      updatedProducts[existingItemIndex].quantity = newQuantity
      updatedProducts[existingItemIndex].total = newQuantity * product.price
      setSelectedProducts(updatedProducts)
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: selectedProductId,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total: quantity * product.price,
      }
      setSelectedProducts([...selectedProducts, newItem])
    }

    // Reset product selection
    setSelectedProductId("")
    setSelectedQuantity("1")
  }

  const removeProductFromSale = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((item) => item.productId !== productId))
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromSale(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity > product.quantity) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${product.quantity} unidades disponibles`,
        variant: "destructive",
      })
      return
    }

    const updatedProducts = selectedProducts.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice } : item,
    )
    setSelectedProducts(updatedProducts)
  }

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.total, 0)
    const discountAmount = (subtotal * Number.parseFloat(discount)) / 100
    const tax = (subtotal - discountAmount) * 0.16 // 16% IVA
    const total = subtotal - discountAmount + tax

    return { subtotal, discountAmount, tax, total }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Agregue al menos un producto a la venta",
        variant: "destructive",
      })
      return
    }

    const { subtotal, tax, total } = calculateTotals()

    const saleData: Sale = {
      id: Date.now().toString(),
      items: selectedProducts,
      subtotal,
      tax,
      discount: Number.parseFloat(discount),
      total,
      paymentMethod,
      clientId: clientId || undefined,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    }

    // Update inventory
    const inventoryData = [...products]
    selectedProducts.forEach((item) => {
      const productIndex = inventoryData.findIndex((p) => p.id === item.productId)
      if (productIndex >= 0) {
        inventoryData[productIndex].quantity -= item.quantity
      }
    })

    // Save sale and updated inventory
    const salesData = [...sales, saleData]
    localStorage.setItem("sales", JSON.stringify(salesData))
    localStorage.setItem("inventory", JSON.stringify(inventoryData))

    toast({
      title: "Venta registrada",
      description: `Venta por $${total.toFixed(2)} registrada exitosamente`,
      variant: "success",
    })

    // Reset form and refresh
    toggleForm()
    refreshData()
  }

  const { subtotal, discountAmount, tax, total } = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ventas Hoy</h3>
            <p className="text-3xl font-bold text-green-600">
              {
                sales.filter((sale) => {
                  const today = new Date()
                  const saleDate = new Date(sale.createdAt)
                  return (
                    saleDate.getDate() === today.getDate() &&
                    saleDate.getMonth() === today.getMonth() &&
                    saleDate.getFullYear() === today.getFullYear()
                  )
                }).length
              }
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Total Ventas</h3>
            <p className="text-3xl font-bold text-blue-600">{sales.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-yellow-600">
              ${sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Sales Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Ventas</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>Nueva venta</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {showForm ? (
              <>
                <Button onClick={toggleForm} variant="outline">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
                <Button onClick={toggleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={toggleForm} variant="yellow">
                <i className="fas fa-plus mr-2"></i>Nueva Venta
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mb-6 form-container">
            <form onSubmit={handleSubmit}>
              <h3 className="form-section-header">Nueva Venta</h3>

              {/* Product Selection */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">Agregar Productos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="form-group">
                    <label htmlFor="productSelect">Producto</label>
                    <select
                      id="productSelect"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">Seleccione un producto...</option>
                      {products
                        .filter((p) => p.quantity > 0)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price.toFixed(2)} (Stock: {product.quantity})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantitySelect">Cantidad</label>
                    <input
                      type="number"
                      id="quantitySelect"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex items-end">
                    <Button type="button" onClick={addProductToSale} variant="yellow">
                      <i className="fas fa-plus mr-2"></i>Agregar
                    </Button>
                  </div>
                </div>

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="bg-white rounded-lg border p-4">
                    <h5 className="font-semibold mb-3">Productos Seleccionados</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-2 px-4 text-left">Producto</th>
                            <th className="py-2 px-4 text-left">Precio Unit.</th>
                            <th className="py-2 px-4 text-left">Cantidad</th>
                            <th className="py-2 px-4 text-left">Total</th>
                            <th className="py-2 px-4 text-left">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((item) => (
                            <tr key={item.productId}>
                              <td className="py-2 px-4">{item.productName}</td>
                              <td className="py-2 px-4">${item.unitPrice.toFixed(2)}</td>
                              <td className="py-2 px-4">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateProductQuantity(item.productId, Number.parseInt(e.target.value))
                                  }
                                  className="w-20 p-1 border rounded"
                                />
                              </td>
                              <td className="py-2 px-4">${item.total.toFixed(2)}</td>
                              <td className="py-2 px-4">
                                <Button
                                  type="button"
                                  onClick={() => removeProductFromSale(item.productId)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Sale Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="form-group">
                  <label htmlFor="saleClient">Cliente (Opcional)</label>
                  <select id="saleClient" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    <option value="">Cliente general</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Método de Pago</label>
                  <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="saleDiscount">Descuento (%)</label>
                  <input
                    type="number"
                    id="saleDiscount"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="form-group md:col-span-2 lg:col-span-3">
                  <label htmlFor="saleNotes">Notas</label>
                  <textarea id="saleNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              {/* Totals */}
              {selectedProducts.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-right">
                      <p>Subtotal:</p>
                      <p>Descuento ({discount}%):</p>
                      <p>IVA (16%):</p>
                      <p className="font-bold text-lg">Total:</p>
                    </div>
                    <div>
                      <p>${subtotal.toFixed(2)}</p>
                      <p>- ${discountAmount.toFixed(2)}</p>
                      <p>${tax.toFixed(2)}</p>
                      <p className="font-bold text-lg">${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group flex justify-between">
                <div className="flex space-x-4">
                  <Button type="submit" variant="yellow" disabled={selectedProducts.length === 0}>
                    <i className="fas fa-cash-register mr-2"></i>Procesar Venta
                  </Button>
                  <Button type="button" onClick={toggleForm} variant="outline">
                    <i className="fas fa-arrow-left mr-2"></i>Volver a la Lista
                  </Button>
                </div>
                <Button type="button" onClick={toggleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Salir
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Sales History */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Historial de Ventas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">ID</th>
                  <th className="py-2 px-4 border">Fecha</th>
                  <th className="py-2 px-4 border">Cliente</th>
                  <th className="py-2 px-4 border">Productos</th>
                  <th className="py-2 px-4 border">Total ($)</th>
                  <th className="py-2 px-4 border">Pago</th>
                </tr>
              </thead>
              <tbody>
                {sales.length > 0 ? (
                  sales
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((sale) => {
                      const client = clients.find((c) => c.id === sale.clientId)

                      return (
                        <tr key={sale.id}>
                          <td className="py-2 px-4 border">{sale.id.slice(-6)}</td>
                          <td className="py-2 px-4 border">{formatDateTime(sale.createdAt)}</td>
                          <td className="py-2 px-4 border">{client?.name || "Cliente general"}</td>
                          <td className="py-2 px-4 border">
                            <div className="text-xs">
                              {sale.items.map((item, index) => (
                                <div key={index}>
                                  {item.productName} x{item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-4 border font-semibold">${sale.total.toFixed(2)}</td>
                          <td className="py-2 px-4 border">{sale.paymentMethod}</td>
                        </tr>
                      )
                    })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No hay ventas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
