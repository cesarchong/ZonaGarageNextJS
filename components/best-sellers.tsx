"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

// Tipos de datos
interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  cost: number
  sold: number
  revenue: number
}

interface Promotion {
  id: string
  name: string
  products: string[]
  discount: number
  startDate: string
  endDate: string
  active: boolean
  createdAt: string
}

export default function BestSellers() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [timeFilter, setTimeFilter] = useState<string>("month")
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [showCustomDateFilter, setShowCustomDateFilter] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [promotionData, setPromotionData] = useState({
    name: "",
    discount: 10,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
  })

  // Cargar datos
  useEffect(() => {
    loadRealSalesData()
  }, [])

  const loadRealSalesData = () => {
    try {
      // Cargar datos reales del localStorage
      const servicesData = JSON.parse(localStorage.getItem("services") || "[]")
      const inventoryData = JSON.parse(localStorage.getItem("inventory") || "[]")
      const promotionsData = JSON.parse(localStorage.getItem("promotions") || "[]")

      // Procesar ventas reales para calcular productos vendidos
      const productSalesMap = new Map()

      // Recorrer todos los servicios para extraer productos vendidos
      servicesData.forEach((service: any) => {
        if (service.products && service.products.length > 0) {
          service.products.forEach((soldProduct: any) => {
            // Si es una promoción, procesar los productos incluidos
            if (soldProduct.isPromotion && soldProduct.includedProducts) {
              soldProduct.includedProducts.forEach((includedProduct: any) => {
                processProductSale(includedProduct, productSalesMap, inventoryData)
              })
            } else {
              // Procesar producto normal
              processProductSale(soldProduct, productSalesMap, inventoryData)
            }
          })
        }
      })

      // Convertir Map a Array y filtrar productos que existen en inventario
      const realProductsData = Array.from(productSalesMap.values())
        .filter((product) => {
          // Solo incluir productos que aún existen en el inventario
          const inventoryProduct = inventoryData.find((p: any) => p.id === product.id)
          return inventoryProduct !== undefined
        })
        .map((product) => {
          // Actualizar stock actual del inventario
          const inventoryProduct = inventoryData.find((p: any) => p.id === product.id)
          return {
            ...product,
            stock: inventoryProduct ? inventoryProduct.quantity : 0,
          }
        })

      setProducts(realProductsData)
      setPromotions(promotionsData)

      console.log("Productos con ventas reales cargados:", realProductsData.length)
      console.log("Total servicios procesados:", servicesData.length)
    } catch (error) {
      console.error("Error loading real sales data:", error)
      setProducts([])
      setPromotions([])
    }
  }

  // Función auxiliar para procesar cada producto vendido
  const processProductSale = (soldProduct: any, productSalesMap: Map<string, any>, inventoryData: any[]) => {
    const productId = soldProduct.productId
    // Ignorar productos de promoción (que empiezan con "promo-")
    if (productId.startsWith("promo-")) return

    const quantity = soldProduct.quantity || 0
    const revenue = soldProduct.total || 0

    if (productSalesMap.has(productId)) {
      const existing = productSalesMap.get(productId)
      productSalesMap.set(productId, {
        ...existing,
        sold: existing.sold + quantity,
        revenue: existing.revenue + revenue,
      })
    } else {
      // Buscar información del producto en el inventario
      const productInfo = inventoryData.find((p: any) => p.id === productId)
      if (productInfo) {
        productSalesMap.set(productId, {
          id: productId,
          name: productInfo.name,
          category: productInfo.category,
          price: productInfo.price,
          cost: productInfo.cost || 0,
          stock: productInfo.quantity || 0,
          sold: quantity,
          revenue: revenue,
        })
      }
    }
  }

  // Filtrar productos por período de tiempo
  const getFilteredProducts = () => {
    // Filtrar por período de tiempo si es necesario
    // Para este ejemplo, devolvemos todos los productos con ventas reales
    return products.filter((product) => product.sold > 0)
  }

  // Obtener productos más vendidos
  const getBestSellingProducts = () => {
    return getFilteredProducts()
      .filter((product) => product.sold > 0) // Solo productos que se han vendido
      .sort((a, b) => b.sold - a.sold) // Ordenar por cantidad vendida
      .slice(0, 10)
  }

  // Obtener productos recomendados para promociones
  const getRecommendedProducts = () => {
    const filtered = getFilteredProducts()

    // Algoritmo: productos con buenas ventas, buen margen y stock suficiente
    return filtered
      .filter((product) => product.stock > 5 && product.sold > 0) // Stock suficiente y que se haya vendido
      .sort((a, b) => {
        // Puntuación basada en ventas y margen
        const marginA = (a.price - a.cost) / a.price
        const marginB = (b.price - b.cost) / b.price
        const scoreA = a.sold * marginA
        const scoreB = b.sold * marginB
        return scoreB - scoreA
      })
      .slice(0, 5)
  }

  // Calcular estadísticas
  const calculateStats = () => {
    const filtered = getFilteredProducts()
    const totalSold = filtered.reduce((sum, product) => sum + product.sold, 0)
    const totalRevenue = filtered.reduce((sum, product) => sum + product.revenue, 0)
    const averagePrice = totalSold > 0 ? totalRevenue / totalSold : 0

    return {
      totalSold,
      totalRevenue,
      averagePrice,
      uniqueProducts: filtered.length,
    }
  }

  // Crear nueva promoción
  const createPromotion = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un producto para la promoción",
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

    const newPromotion: Promotion = {
      id: `promo-${Date.now()}`,
      name: promotionData.name,
      products: selectedProducts,
      discount: promotionData.discount,
      startDate: promotionData.startDate,
      endDate: promotionData.endDate,
      active: true,
      createdAt: new Date().toISOString(),
    }

    const updatedPromotions = [...promotions, newPromotion]
    setPromotions(updatedPromotions)
    localStorage.setItem("promotions", JSON.stringify(updatedPromotions))

    toast({
      title: "Promoción creada",
      description: `La promoción "${promotionData.name}" ha sido creada exitosamente`,
    })

    // Resetear formulario
    setShowPromotionModal(false)
    setSelectedProducts([])
    setPromotionData({
      name: "",
      discount: 10,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
    })
  }

  // Cambiar estado de promoción
  const togglePromotionStatus = (id: string) => {
    const updatedPromotions = promotions.map((promo) => (promo.id === id ? { ...promo, active: !promo.active } : promo))
    setPromotions(updatedPromotions)
    localStorage.setItem("promotions", JSON.stringify(updatedPromotions))

    const promotion = updatedPromotions.find((p) => p.id === id)
    toast({
      title: promotion?.active ? "Promoción activada" : "Promoción desactivada",
      description: `La promoción "${promotion?.name}" ha sido ${promotion?.active ? "activada" : "desactivada"}`,
    })
  }

  // Eliminar promoción
  const deletePromotion = (id: string) => {
    const updatedPromotions = promotions.filter((promo) => promo.id !== id)
    setPromotions(updatedPromotions)
    localStorage.setItem("promotions", JSON.stringify(updatedPromotions))

    toast({
      title: "Promoción eliminada",
      description: "La promoción ha sido eliminada exitosamente",
    })
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

  // Obtener el color de la medalla según la posición
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-400 text-black"
      case 1:
        return "bg-gray-300 text-black"
      case 2:
        return "bg-amber-600 text-white"
      default:
        return "bg-gray-200 text-gray-700"
    }
  }

  // Obtener el ícono de la medalla según la posición
  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return "fa-trophy"
      case 1:
        return "fa-medal"
      case 2:
        return "fa-award"
      default:
        return "fa-circle"
    }
  }

  // Función para refrescar datos cuando se detecten cambios en ventas
  const refreshSalesData = () => {
    loadRealSalesData()
  }

  // Escuchar eventos de cambios en ventas (opcional)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "services" || e.key === "inventory") {
        refreshSalesData()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Estadísticas calculadas
  const stats = calculateStats()
  const bestSellers = getBestSellingProducts()
  const recommendedProducts = getRecommendedProducts()

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Título y descripción */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Productos más vendidos</h1>
        <p className="text-gray-600">Análisis de productos con mejor rendimiento y recomendaciones para promociones.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <i className="fas fa-shopping-bag text-blue-500 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Productos vendidos</p>
              <h3 className="text-2xl font-bold">{stats.totalSold}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ingresos totales</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <i className="fas fa-tag text-purple-500 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Precio promedio</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats.averagePrice)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <i className="fas fa-boxes text-yellow-500 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-500">Productos únicos</p>
              <h3 className="text-2xl font-bold">{stats.uniqueProducts}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros de tiempo */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-gray-700 font-medium">Filtrar por:</span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={timeFilter === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTimeFilter("week")
              setShowCustomDateFilter(false)
            }}
          >
            <i className="fas fa-calendar-week mr-2"></i>
            Esta semana
          </Button>

          <Button
            variant={timeFilter === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTimeFilter("month")
              setShowCustomDateFilter(false)
            }}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Este mes
          </Button>

          <Button
            variant={timeFilter === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTimeFilter("quarter")
              setShowCustomDateFilter(false)
            }}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Este trimestre
          </Button>

          <Button
            variant={timeFilter === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTimeFilter("year")
              setShowCustomDateFilter(false)
            }}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Este año
          </Button>

          <Button
            variant={timeFilter === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setTimeFilter("custom")
              setShowCustomDateFilter(!showCustomDateFilter)
            }}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Personalizado
          </Button>
        </div>
      </div>

      {/* Selector de fechas personalizado */}
      {showCustomDateFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicial</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha final</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowCustomDateFilter(false)} size="sm">
              Aplicar filtro
            </Button>
          </div>
        </div>
      )}

      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: Ranking y gráfico */}
        <div className="lg:col-span-2">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-trophy text-yellow-500 mr-2"></i>
              Ranking de productos más vendidos {getCurrentPeriodName()}
            </h2>

            {/* Tabla de productos más vendidos */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">#</th>
                    <th className="py-2 text-left">Producto</th>
                    <th className="py-2 text-right">Unidades</th>
                    <th className="py-2 text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <i className="fas fa-chart-line text-4xl mb-2 text-gray-300"></i>
                          <p className="text-lg font-semibold">No hay productos vendidos aún</p>
                          <p className="text-sm">Los productos aparecerán aquí cuando se registren ventas</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bestSellers.map((product, index) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getMedalColor(index)}`}
                          >
                            <i className={`fas ${getMedalIcon(index)}`}></i>
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category}</div>
                        </td>
                        <td className="py-3 text-right font-medium">{product.sold}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Gráfico de barras */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-chart-bar text-blue-500 mr-2"></i>
              Visualización de ventas
            </h2>

            <div className="space-y-4">
              {bestSellers.slice(0, 6).map((product, index) => {
                // Calcular el porcentaje para la barra
                const maxRevenue = Math.max(...bestSellers.map((p) => p.revenue))
                const percentage = (product.revenue / maxRevenue) * 100

                return (
                  <div key={product.id} className="relative">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-sm text-gray-500">{product.sold} unidades</span>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gradient-to-r from-blue-400 to-blue-600"}`}
                        style={{ width: `${percentage}%`, transition: "width 1s ease-in-out" }}
                      ></div>
                    </div>
                    <span className="absolute right-2 top-7 text-xs font-bold text-white">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Columna derecha: Recomendaciones y promociones */}
        <div>
          {/* Recomendaciones para promociones */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              Recomendaciones para promociones
            </h2>

            <div className="space-y-4">
              {recommendedProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    {product.stock < 10 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        Stock bajo: {product.stock}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Precio:</span>
                      <span className="font-medium ml-1">{formatCurrency(product.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Vendidos:</span>
                      <span className="font-medium ml-1">{product.sold}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Margen:</span>
                      <span className="font-medium ml-1">
                        {Math.round(((product.price - product.cost) / product.price) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-medium ml-1">{product.stock}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProducts((prev) =>
                          prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id],
                        )
                      }}
                    >
                      {selectedProducts.includes(product.id) ? (
                        <>
                          <i className="fas fa-check-circle text-green-500 mr-2"></i>
                          Seleccionado
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus mr-2"></i>
                          Seleccionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={() => setShowPromotionModal(true)}
                disabled={selectedProducts.length === 0}
              >
                <i className="fas fa-tag mr-2"></i>
                Crear promoción rápida
                {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
              </Button>
            </div>
          </Card>

          {/* Promociones activas */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <i className="fas fa-percentage text-purple-500 mr-2"></i>
              Promociones activas
            </h2>

            {promotions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-tag text-4xl mb-2"></i>
                <p>No hay promociones activas</p>
                <p className="text-sm">Crea una promoción para aumentar tus ventas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {promotions.map((promo) => {
                  // Obtener productos de la promoción
                  const promoProducts = products.filter((p) => promo.products.includes(p.id))

                  return (
                    <div
                      key={promo.id}
                      className={`border rounded-lg p-4 ${promo.active ? "border-green-500" : "border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{promo.name}</h3>
                          <p className="text-sm text-gray-500">
                            {promo.discount}% de descuento • {promoProducts.length} productos
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${promo.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {promo.active ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <div className="mt-2 text-sm">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {promoProducts.slice(0, 3).map((product) => (
                            <span key={product.id} className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {product.name}
                            </span>
                          ))}
                          {promoProducts.length > 3 && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              +{promoProducts.length - 3} más
                            </span>
                          )}
                        </div>

                        <div className="text-gray-500">
                          Válido: {new Date(promo.startDate).toLocaleDateString()} -{" "}
                          {new Date(promo.endDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
                          {promo.active ? (
                            <>
                              <i className="fas fa-pause mr-1"></i>
                              Pausar
                            </>
                          ) : (
                            <>
                              <i className="fas fa-play mr-1"></i>
                              Activar
                            </>
                          )}
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
        </div>
      </div>

      {/* Modal para crear promoción */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Crear nueva promoción</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la promoción</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Ej: Oferta especial de verano"
                    value={promotionData.name}
                    onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Productos seleccionados ({selectedProducts.length})
                  </label>
                  <div className="border rounded p-3 max-h-32 overflow-y-auto">
                    {selectedProducts.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay productos seleccionados</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedProducts.map((id) => {
                          const product = products.find((p) => p.id === id)
                          return product ? (
                            <div key={id} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                              <span>{product.name}</span>
                              <button
                                className="ml-2 text-gray-500 hover:text-red-500"
                                onClick={() => setSelectedProducts((prev) => prev.filter((pid) => pid !== id))}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de descuento</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      className="flex-1 mr-4"
                      value={promotionData.discount}
                      onChange={(e) =>
                        setPromotionData({ ...promotionData, discount: Number.parseInt(e.target.value) })
                      }
                    />
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {promotionData.discount}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={promotionData.startDate}
                      onChange={(e) => setPromotionData({ ...promotionData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={promotionData.endDate}
                      onChange={(e) => setPromotionData({ ...promotionData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPromotionModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={createPromotion} disabled={selectedProducts.length === 0 || !promotionData.name}>
                  <i className="fas fa-save mr-2"></i>
                  Crear promoción
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
