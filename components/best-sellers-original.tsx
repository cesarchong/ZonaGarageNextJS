// "use client"

// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { useToast } from "@/hooks/use-toast"
// import type { Productos } from "@/interfaces/productos.interface"
// import type { Promocion } from "@/interfaces/promociones.interface"
// import type { Servicios } from "@/interfaces/servicios.interface"
// import type { Venta } from "@/interfaces/ventas.interface"
// import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
// import { formatCurrency } from "@/lib/utils"
// import { useEffect, useState } from "react"

// // Tipos de datos para el análisis
// interface ProductSalesData {
//   id: string
//   nombre: string
//   categoria: string
//   precio_venta: number
//   cantidad_disponible: number
//   costo: number
//   cantidad_vendida: number
//   ingresos: number
// }

// interface ProductionStats {
//   totalSold: number
//   totalRevenue: number
//   averagePrice: number
//   uniqueProducts: number
// }

// export default function BestSellers() {
//   const { toast } = useToast()
//   const [products, setProducts] = useState<ProductSalesData[]>([])
//   const [promotions, setPromotions] = useState<Promocion[]>([])
//   const [allProducts, setAllProducts] = useState<Productos[]>([])
//   const [loading, setLoading] = useState(true)
//   const [timeFilter, setTimeFilter] = useState<string>("month")
//   const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
//     start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
//     end: new Date().toISOString().split("T")[0],
//   })
//   const [showCustomDateFilter, setShowCustomDateFilter] = useState(false)
//   const [showPromotionModal, setShowPromotionModal] = useState(false)
//   const [selectedProducts, setSelectedProducts] = useState<string[]>([])
//   const [promotionData, setPromotionData] = useState({
//     name: "",
//     discount: 10,
//     startDate: new Date().toISOString().split("T")[0],
//     endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
//   })

//   // Cargar datos
//   useEffect(() => {
//     loadData()
//   }, [])

//   const loadData = async () => {
//     try {
//       setLoading(true)
//       const [productosData, serviciosData, ventasData, promocionesData] = await Promise.all([
//         getCollection("productos") as Promise<Productos[]>,
//         getCollection("servicios") as Promise<Servicios[]>,
//         getCollection("ventas") as Promise<Venta[]>,
//         getCollection("promociones") as Promise<Promocion[]>,
//       ])

//       setAllProducts(productosData)
//       setPromotions(promocionesData)

//       // Procesar datos de ventas para calcular productos más vendidos
//       const productSalesMap = new Map<string, ProductSalesData>()

//       // Procesar servicios
//       serviciosData.forEach((servicio) => {
//         if (Array.isArray(servicio.productos) && servicio.productos.length > 0) {
//           servicio.productos.forEach((producto: any) => {
//             if (producto.id && !producto.id.startsWith("promo-")) {
//               processProductSale(producto, productSalesMap, productosData)
//             }
//           })
//         }
//       })

//       // Procesar ventas directas
//       ventasData.forEach((venta) => {
//         try {
//           const productos = JSON.parse(venta.productos)
//           if (Array.isArray(productos)) {
//             productos.forEach((producto: any) => {
//               if (producto.id && !producto.id.startsWith("promo-")) {
//                 processProductSale(producto, productSalesMap, productosData)
//               }
//             })
//           }
//         } catch (error) {
//           console.error("Error parsing products from venta:", error)
//         }
//       })

//       // Convertir Map a Array
//       const salesData = Array.from(productSalesMap.values())
//         .filter((product) => product.cantidad_vendida > 0)
//         .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)

//       setProducts(salesData)
//       console.log("Datos cargados:", {
//         productos: productosData.length,
//         servicios: serviciosData.length,
//         ventas: ventasData.length,
//         promociones: promocionesData.length,
//         productosConVentas: salesData.length,
//       })
//     } catch (error) {
//       console.error("Error loading data:", error)
//       toast({
//         title: "Error",
//         description: "Error al cargar los datos",
//         variant: "destructive",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Función auxiliar para procesar cada producto vendido
//   const processProductSale = (producto: any, productSalesMap: Map<string, ProductSalesData>, productosData: Productos[]) => {
//     const productId = producto.id || producto.producto_id
//     if (!productId) return

//     const cantidad = Number(producto.cantidad || producto.quantity || 1)
//     const precio = Number(producto.precio_venta || producto.price || 0)
//     const ingresos = precio * cantidad

//     if (productSalesMap.has(productId)) {
//       const existing = productSalesMap.get(productId)!
//       productSalesMap.set(productId, {
//         ...existing,
//         cantidad_vendida: existing.cantidad_vendida + cantidad,
//         ingresos: existing.ingresos + ingresos,
//       })
//     } else {
//       // Buscar información del producto en la base de datos
//       const productInfo = productosData.find((p) => p.id === productId)
//       if (productInfo) {
//         productSalesMap.set(productId, {
//           id: productId,
//           nombre: productInfo.nombre,
//           categoria: productInfo.id_categoria,
//           precio_venta: productInfo.precio_venta,
//           costo: productInfo.costo,
//           cantidad_disponible: Number(productInfo.cantidad_disponible),
//           cantidad_vendida: cantidad,
//           ingresos: ingresos,
//         })
//       }
//     }
//   }

//   // Productos con ventas positivas (para mostrar en la lista principal)
//   const getProductsWithSales = () => {
//     return products.filter((product) => product.cantidad_vendida > 0)
//   }

//   // Productos recomendados (bajo stock pero con ventas)
//   const getRecommendedProducts = () => {
//     return allProducts
//       .filter((product) => product.cantidad_disponible > 5 && product.cantidad_disponible > 0)
//       .sort((a, b) => {
//         const aData = products.find(p => p.id === a.id)
//         const bData = products.find(p => p.id === b.id)
//         const aSold = aData?.cantidad_vendida || 0
//         const bSold = bData?.cantidad_vendida || 0
//         return bSold - aSold
//       })
//       .slice(0, 5)
//   }

//   // Obtener estadísticas del período
//   const getProductionStats = (): ProductionStats => {
//     const filtered = getProductsWithSales()
//     const totalSold = filtered.reduce((sum, product) => sum + product.cantidad_vendida, 0)
//     const totalRevenue = filtered.reduce((sum, product) => sum + product.ingresos, 0)

//     return {
//       totalSold,
//       totalRevenue,
//       averagePrice: totalRevenue / totalSold || 0,
//       uniqueProducts: filtered.length,
//     }
//   }

//   // Crear promoción
//   const createPromotion = async () => {
//     if (selectedProducts.length === 0) {
//       toast({
//         title: "Error",
//         description: "Selecciona al menos un producto para la promoción",
//         variant: "destructive",
//       })
//       return
//     }

//     if (!promotionData.name) {
//       toast({
//         title: "Error",
//         description: "Ingresa un nombre para la promoción",
//         variant: "destructive",
//       })
//       return
//     }

//     const newPromotion: Promocion = {
//       id: `promo-${Date.now()}`,
//       nombre: promotionData.name,
//       productos: selectedProducts,
//       lista_servicios: [],
//       precio: promotionData.discount,
//       fecha_inicio: promotionData.startDate,
//       fecha_fin: promotionData.endDate,
//       activa: true,
//     }

//     try {
//       await addDocument("promociones", newPromotion)
//       await loadData() // Recargar datos

//       toast({
//         title: "Promoción creada",
//         description: `La promoción "${promotionData.name}" ha sido creada exitosamente`,
//       })

//       // Resetear formulario
//       setShowPromotionModal(false)
//       setSelectedProducts([])
//       setPromotionData({
//         name: "",
//         discount: 10,
//         startDate: new Date().toISOString().split("T")[0],
//         endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
//       })
//     } catch (error) {
//       console.error("Error creating promotion:", error)
//       toast({
//         title: "Error",
//         description: "Error al crear la promoción",
//         variant: "destructive",
//       })
//     }
//   }

//   // Cambiar estado de promoción
//   const togglePromotionStatus = async (id: string) => {
//     try {
//       const promotion = promotions.find((p) => p.id === id)
//       if (!promotion) return

//       const updatedPromotion = { ...promotion, activa: !promotion.activa }
      
//       await updateDocument(`promociones/${id}`, updatedPromotion)
//       await loadData() // Recargar datos

//       toast({
//         title: updatedPromotion.activa ? "Promoción activada" : "Promoción desactivada",
//         description: `La promoción "${promotion.nombre}" ha sido ${updatedPromotion.activa ? "activada" : "desactivada"}`,
//       })
//     } catch (error) {
//       console.error("Error toggling promotion status:", error)
//       toast({
//         title: "Error",
//         description: "Error al cambiar el estado de la promoción",
//         variant: "destructive",
//       })
//     }
//   }

//   // Eliminar promoción
//   const deletePromotion = async (id: string) => {
//     try {
//       await deleteDocument(`promociones/${id}`)
//       await loadData() // Recargar datos

//       toast({
//         title: "Promoción eliminada",
//         description: "La promoción ha sido eliminada exitosamente",
//       })
//     } catch (error) {
//       console.error("Error deleting promotion:", error)
//       toast({
//         title: "Error",
//         description: "Error al eliminar la promoción",
//         variant: "destructive",
//       })
//     }
//   }

//   // Obtener el nombre del período actual
//   const getCurrentPeriodName = () => {
//     switch (timeFilter) {
//       case "week":
//         return "esta semana"
//       case "month":
//         return "este mes"
//       case "quarter":
//         return "este trimestre"
//       case "year":
//         return "este año"
//       case "custom":
//         return "período personalizado"
//       default:
//         return "este mes"
//     }
//   }

//   // Funciones auxiliares para verificar si un producto está incluido en promoción
//   const isProductInPromotion = (productId: string) => {
//     return promotions.some((promo) => promo.activa && promo.productos.includes(productId))
//   }

//   const getProductPromotion = (productId: string) => {
//     return promotions.find((promo) => promo.activa && promo.productos.includes(productId))
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Cargando análisis de productos más vendidos...</p>
//         </div>
//       </div>
//     )
//   }

//   const stats = getProductionStats()
//   const productsWithSales = getProductsWithSales()
//   const recommendedProducts = getRecommendedProducts()

//   return (
//     <div className="space-y-6 p-6">
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Productos Más Vendidos</h1>
//         <p className="text-gray-600">Análisis de productos con mejor rendimiento en {getCurrentPeriodName()}</p>
//       </div>

//       {/* Filtros de tiempo */}
//       <Card className="p-6">
//         <div className="flex flex-wrap items-center gap-4">
//           <div className="flex items-center space-x-2">
//             <span className="text-sm font-medium text-gray-700">Período:</span>
//             <select
//               className="border rounded px-3 py-1 text-sm"
//               value={timeFilter}
//               onChange={(e) => {
//                 setTimeFilter(e.target.value)
//                 if (e.target.value !== "custom") {
//                   setShowCustomDateFilter(false)
//                   loadData()
//                 }
//               }}
//             >
//               <option value="week">Esta semana</option>
//               <option value="month">Este mes</option>
//               <option value="quarter">Este trimestre</option>
//               <option value="year">Este año</option>
//               <option value="custom">Personalizado</option>
//             </select>
//           </div>

//           {timeFilter === "custom" && (
//             <div className="flex items-center space-x-2">
//               <input
//                 type="date"
//                 className="border rounded px-2 py-1 text-sm"
//                 value={customDateRange.start}
//                 onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
//               />
//               <span className="text-sm">hasta</span>
//               <input
//                 type="date"
//                 className="border rounded px-2 py-1 text-sm"
//                 value={customDateRange.end}
//                 onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
//               />
//               <Button size="sm" onClick={loadData}>
//                 Aplicar
//               </Button>
//             </div>
//           )}

//           <Button
//             onClick={() => setShowPromotionModal(true)}
//             className="ml-auto bg-green-600 hover:bg-green-700"
//           >
//             <i className="fas fa-plus mr-2"></i>
//             Crear Promoción
//           </Button>
//         </div>
//       </Card>

//       {/* Estadísticas generales */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <Card className="p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm text-gray-500">Total Vendido</p>
//               <p className="text-2xl font-bold text-gray-900">{stats.totalSold}</p>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm text-gray-500">Ingresos</p>
//               <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-yellow-100 rounded-lg">
//               <i className="fas fa-chart-line text-yellow-600 text-xl"></i>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm text-gray-500">Precio Promedio</p>
//               <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averagePrice)}</p>
//             </div>
//           </div>
//         </Card>

//         <Card className="p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <i className="fas fa-box text-purple-600 text-xl"></i>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm text-gray-500">Productos Únicos</p>
//               <p className="text-2xl font-bold text-gray-900">{stats.uniqueProducts}</p>
//             </div>
//           </div>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           {/* Recomendaciones para promociones */}
//           <Card className="p-6 mb-8">
//             <h2 className="text-xl font-bold mb-4">
//               <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
//               Recomendaciones para promociones
//             </h2>

//             <div className="space-y-4">
//               {recommendedProducts.map((product) => {
//                 const productSales = products.find(p => p.id === product.id)
//                 return (
//                   <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="font-medium">{product.nombre}</h3>
//                         <p className="text-sm text-gray-500">{product.id_categoria}</p>
//                       </div>
//                       {product.cantidad_disponible < 10 && (
//                         <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
//                           Stock bajo: {product.cantidad_disponible}
//                         </span>
//                       )}
//                     </div>

//                     <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
//                       <div>
//                         <span className="text-gray-500">Precio:</span>
//                         <span className="font-medium ml-1">{formatCurrency(product.precio_venta)}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Vendidos:</span>
//                         <span className="font-medium ml-1">{productSales?.cantidad_vendida || 0}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Margen:</span>
//                         <span className="font-medium ml-1">
//                           {Math.round(((product.precio_venta - product.costo) / product.precio_venta) * 100)}%
//                         </span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Stock:</span>
//                         <span className="font-medium ml-1">{product.cantidad_disponible}</span>
//                       </div>
//                     </div>

//                     <div className="mt-3 flex justify-end">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setSelectedProducts((prev) =>
//                             prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id],
//                           )
//                         }}
//                       >
//                         {selectedProducts.includes(product.id) ? "Quitar" : "Agregar"}
//                       </Button>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           </Card>

//           {/* Lista de productos más vendidos */}
//           <Card className="p-6">
//             <h2 className="text-xl font-bold mb-4">
//               <i className="fas fa-trophy text-gold mr-2"></i>
//               Top Productos ({productsWithSales.length})
//             </h2>

//             {productsWithSales.length === 0 ? (
//               <div className="text-center py-8">
//                 <i className="fas fa-chart-line text-gray-300 text-4xl mb-4"></i>
//                 <p className="text-gray-500">No hay datos de ventas para mostrar en {getCurrentPeriodName()}</p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {productsWithSales.slice(0, 10).map((product, index) => {
//                   const isInPromotion = isProductInPromotion(product.id)
//                   const promotion = getProductPromotion(product.id)

//                   return (
//                     <div
//                       key={product.id}
//                       className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
//                         isInPromotion ? "border-green-200 bg-green-50" : ""
//                       }`}
//                     >
//                       <div className="flex items-center space-x-4">
//                         <div className="flex-shrink-0">
//                           <div
//                             className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
//                               index === 0
//                                 ? "bg-yellow-500"
//                                 : index === 1
//                                 ? "bg-gray-400"
//                                 : index === 2
//                                 ? "bg-orange-500"
//                                 : "bg-blue-500"
//                             }`}
//                           >
//                             {index + 1}
//                           </div>
//                         </div>

//                         <div className="flex-grow">
//                           <div className="flex items-center space-x-2">
//                             <h3 className="font-medium text-gray-900">{product.nombre}</h3>
//                             {isInPromotion && (
//                               <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
//                                 {promotion?.precio}% OFF
//                               </span>
//                             )}
//                           </div>
//                           <p className="text-sm text-gray-500">{product.categoria}</p>
//                           <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
//                             <span>Stock: {product.cantidad_disponible}</span>
//                             <span>Precio: {formatCurrency(product.precio_venta)}</span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="text-right">
//                         <p className="text-lg font-bold text-gray-900">{product.cantidad_vendida}</p>
//                         <p className="text-sm text-gray-500">vendidos</p>
//                         <p className="text-sm font-medium text-green-600">{formatCurrency(product.ingresos)}</p>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </Card>
//         </div>

//         {/* Panel lateral de promociones */}
//         <div>
//           <Card className="p-6">
//             <h2 className="text-xl font-bold mb-4">
//               <i className="fas fa-tags text-blue-500 mr-2"></i>
//               Promociones Activas ({promotions.filter((p) => p.activa).length})
//             </h2>

//             {promotions.filter((p) => p.activa).length === 0 ? (
//               <div className="text-center py-8">
//                 <i className="fas fa-tags text-gray-300 text-3xl mb-4"></i>
//                 <p className="text-gray-500 mb-4">No hay promociones activas</p>
//                 <Button onClick={() => setShowPromotionModal(true)} size="sm">
//                   Crear primera promoción
//                 </Button>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {promotions
//                   .filter((promo) => promo.activa)
//                   .map((promo) => {
//                     // Obtener productos de la promoción
//                     const promoProducts = allProducts.filter((p) => promo.productos?.includes(p.id))

//                     return (
//                       <div
//                         key={promo.id}
//                         className="border rounded-lg p-4 border-green-200 bg-green-50"
//                       >
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <h3 className="font-medium">{promo.nombre}</h3>
//                             <p className="text-sm text-gray-500">
//                               {promo.precio}% de descuento • {promoProducts.length} productos
//                             </p>
//                           </div>
//                           <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
//                             Activa
//                           </span>
//                         </div>

//                         <div className="mt-2 text-sm">
//                           <div className="flex flex-wrap gap-1 mb-2">
//                             {promoProducts.slice(0, 3).map((product) => (
//                               <span key={product.id} className="bg-gray-100 px-2 py-1 rounded text-xs">
//                                 {product.nombre}
//                               </span>
//                             ))}
//                             {promoProducts.length > 3 && (
//                               <span className="bg-gray-100 px-2 py-1 rounded text-xs">
//                                 +{promoProducts.length - 3} más
//                               </span>
//                             )}
//                           </div>

//                           <div className="text-gray-500">
//                             Válido: {promo.fecha_inicio ? new Date(promo.fecha_inicio).toLocaleDateString() : "N/A"} -{" "}
//                             {promo.fecha_fin ? new Date(promo.fecha_fin).toLocaleDateString() : "N/A"}
//                           </div>
//                         </div>

//                         <div className="mt-3 flex justify-end space-x-2">
//                           <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
//                             <i className="fas fa-pause mr-1"></i>
//                             Pausar
//                           </Button>

//                           <Button
//                             variant="outline"
//                             size="sm"
//                             className="text-red-500 hover:text-red-700"
//                             onClick={() => deletePromotion(promo.id)}
//                           >
//                             <i className="fas fa-trash-alt"></i>
//                           </Button>
//                         </div>
//                       </div>
//                     )
//                   })}
//               </div>
//             )}
//           </Card>

//           {/* Promociones inactivas */}
//           {promotions.filter((p) => !p.activa).length > 0 && (
//             <Card className="p-6 mt-6">
//               <h2 className="text-lg font-bold mb-4 text-gray-600">
//                 <i className="fas fa-pause text-gray-400 mr-2"></i>
//                 Promociones Pausadas ({promotions.filter((p) => !p.activa).length})
//               </h2>

//               <div className="space-y-3">
//                 {promotions
//                   .filter((promo) => !promo.activa)
//                   .map((promo) => (
//                     <div key={promo.id} className="border rounded-lg p-3 border-gray-200">
//                       <div className="flex justify-between items-center">
//                         <div>
//                           <h3 className="font-medium text-gray-700">{promo.nombre}</h3>
//                           <p className="text-sm text-gray-500">{promo.precio}% descuento</p>
//                         </div>
//                         <div className="flex space-x-1">
//                           <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
//                             <i className="fas fa-play"></i>
//                           </Button>
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             className="text-red-500"
//                             onClick={() => deletePromotion(promo.id)}
//                           >
//                             <i className="fas fa-trash-alt"></i>
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             </Card>
//           )}
//         </div>
//       </div>

//       {/* Modal de crear promoción */}
//       {showPromotionModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
//             <h2 className="text-xl font-bold mb-4">Crear Nueva Promoción</h2>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Nombre de la promoción
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full border rounded px-3 py-2"
//                   value={promotionData.name}
//                   onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
//                   placeholder="Ej: Descuento de verano"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
//                   <input
//                     type="number"
//                     className="w-full border rounded px-3 py-2"
//                     value={promotionData.discount}
//                     onChange={(e) => setPromotionData({ ...promotionData, discount: Number(e.target.value) })}
//                     min="1"
//                     max="100"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
//                   <input
//                     type="date"
//                     className="w-full border rounded px-3 py-2"
//                     value={promotionData.startDate}
//                     onChange={(e) => setPromotionData({ ...promotionData, startDate: e.target.value })}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
//                 <input
//                   type="date"
//                   className="w-full border rounded px-3 py-2"
//                   value={promotionData.endDate}
//                   onChange={(e) => setPromotionData({ ...promotionData, endDate: e.target.value })}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Productos seleccionados ({selectedProducts.length})
//                 </label>
//                 <div className="border rounded p-3 max-h-32 overflow-y-auto">
//                   {selectedProducts.length === 0 ? (
//                     <p className="text-gray-500 text-sm">No hay productos seleccionados</p>
//                   ) : (
//                     <div className="flex flex-wrap gap-2">
//                       {selectedProducts.map((id) => {
//                         const product = allProducts.find((p) => p.id === id)
//                         return product ? (
//                           <div key={id} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
//                             <span>{product.nombre}</span>
//                             <button
//                               className="ml-2 text-gray-500 hover:text-red-500"
//                               onClick={() => setSelectedProducts((prev) => prev.filter((pid) => pid !== id))}
//                             >
//                               <i className="fas fa-times"></i>
//                             </button>
//                           </div>
//                         ) : null
//                       })}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//               <Button variant="outline" onClick={() => setShowPromotionModal(false)}>
//                 Cancelar
//               </Button>
//               <Button onClick={createPromotion} className="bg-green-600 hover:bg-green-700">
//                 Crear Promoción
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
