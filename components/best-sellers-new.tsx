// "use client"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useToast } from "@/hooks/use-toast"
// import { Productos } from "@/interfaces/productos.interface"
// import { Promocion } from "@/interfaces/promociones.interface"
// import { Servicios } from "@/interfaces/servicios.interface"
// import { Venta } from "@/interfaces/ventas.interface"
// import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
// import { useEffect, useState } from "react"

// interface ProductSalesData {
//   id: string
//   nombre: string
//   categoria: string
//   precio_venta: number
//   costo: number
//   cantidad_disponible: number
//   cantidad_vendida: number
//   ingresos: number
// }

// type TimeFilter = "week" | "month" | "quarter" | "year" | "custom"
// type SortBy = "sold" | "revenue" | "name" | "stock"

// export default function BestSellers() {
//   const { toast } = useToast()
//   const [products, setProducts] = useState<ProductSalesData[]>([])
//   const [allProducts, setAllProducts] = useState<Productos[]>([])
//   const [promotions, setPromotions] = useState<Promocion[]>([])
//   const [loading, setLoading] = useState(true)
//   const [timeFilter, setTimeFilter] = useState<TimeFilter>("month")
//   const [searchTerm, setSearchTerm] = useState("")
//   const [categoryFilter, setCategoryFilter] = useState("all")
//   const [sortBy, setSortBy] = useState<SortBy>("sold")
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
//       descuento: promotionData.discount,
//       fecha_inicio: promotionData.startDate,
//       fecha_fin: promotionData.endDate,
//       activa: true,
//       fecha_creacion: new Date().toISOString(),
//       tipo_descuento: "porcentaje",
//       productos: selectedProducts.map(productId => {
//         const product = allProducts.find(p => p.id === productId)
//         return {
//           id: productId,
//           nombre: product?.nombre || '',
//           precio_original: product?.precio_venta || 0,
//           precio_promocional: product ? product.precio_venta * (1 - promotionData.discount / 100) : 0,
//           cantidad: 1
//         }
//       }),
//       lista_servicios: [],
//       precio_total_original: 0,
//       precio_total_promocional: 0
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
      
//       await updateDocument("promociones", updatedPromotion)
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
//       await deleteDocument("promociones", id)
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

//   // Filtrar productos
//   const filteredProducts = products.filter((product) => {
//     const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesCategory = categoryFilter === "all" || product.categoria === categoryFilter
//     return matchesSearch && matchesCategory
//   })

//   // Ordenar productos
//   const sortedProducts = [...filteredProducts].sort((a, b) => {
//     switch (sortBy) {
//       case "sold":
//         return b.cantidad_vendida - a.cantidad_vendida
//       case "revenue":
//         return b.ingresos - a.ingresos
//       case "name":
//         return a.nombre.localeCompare(b.nombre)
//       case "stock":
//         return b.cantidad_disponible - a.cantidad_disponible
//       default:
//         return 0
//     }
//   })

//   // Productos recomendados para promociones
//   const recommendedProducts = products
//     .filter((product) => product.cantidad_disponible > 5 && product.cantidad_vendida > 0)
//     .slice(0, 5)

//   // Formatear moneda
//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("es-ES", {
//       style: "currency",
//       currency: "USD",
//       minimumFractionDigits: 2,
//     }).format(amount)
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Cargando datos de ventas...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Encabezado */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">Productos Más Vendidos</h1>
//         <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
//           <DialogTrigger asChild>
//             <Button>
//               <i className="fas fa-plus mr-2"></i>
//               Crear Promoción
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Crear Nueva Promoción</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <div>
//                 <Label htmlFor="promo-name">Nombre de la promoción</Label>
//                 <Input
//                   id="promo-name"
//                   value={promotionData.name}
//                   onChange={(e) => setPromotionData({ ...promotionData, name: e.target.value })}
//                   placeholder="Ej: Descuento de verano"
//                 />
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="discount">Descuento (%)</Label>
//                   <Input
//                     id="discount"
//                     type="number"
//                     value={promotionData.discount}
//                     onChange={(e) => setPromotionData({ ...promotionData, discount: Number(e.target.value) })}
//                     min="1"
//                     max="100"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="start-date">Fecha de inicio</Label>
//                   <Input
//                     id="start-date"
//                     type="date"
//                     value={promotionData.startDate}
//                     onChange={(e) => setPromotionData({ ...promotionData, startDate: e.target.value })}
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="end-date">Fecha de fin</Label>
//                 <Input
//                   id="end-date"
//                   type="date"
//                   value={promotionData.endDate}
//                   onChange={(e) => setPromotionData({ ...promotionData, endDate: e.target.value })}
//                 />
//               </div>

//               <div>
//                 <Label>Productos seleccionados</Label>
//                 <div className="border rounded p-3 min-h-[80px]">
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

//               <div className="flex justify-end space-x-2">
//                 <Button variant="outline" onClick={() => setShowPromotionModal(false)}>
//                   Cancelar
//                 </Button>
//                 <Button onClick={createPromotion}>Crear Promoción</Button>
//               </div>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Filtros */}
//       <Card>
//         <CardContent className="p-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <Label>Buscar producto</Label>
//               <Input
//                 placeholder="Buscar por nombre..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <div>
//               <Label>Categoría</Label>
//               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Todas las categorías</SelectItem>
//                   <SelectItem value="aceites">Aceites</SelectItem>
//                   <SelectItem value="repuestos">Repuestos</SelectItem>
//                   <SelectItem value="herramientas">Herramientas</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <Label>Ordenar por</Label>
//               <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="sold">Más vendidos</SelectItem>
//                   <SelectItem value="revenue">Mayor ingreso</SelectItem>
//                   <SelectItem value="name">Nombre (A-Z)</SelectItem>
//                   <SelectItem value="stock">Stock disponible</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Recomendaciones para promociones */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center">
//             <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
//             Recomendaciones para promociones
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {recommendedProducts.map((product) => (
//               <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-medium">{product.nombre}</h3>
//                     <p className="text-sm text-gray-500">{product.categoria}</p>
//                   </div>
//                   {product.cantidad_disponible < 10 && (
//                     <Badge variant="destructive">
//                       Stock bajo: {product.cantidad_disponible}
//                     </Badge>
//                   )}
//                 </div>

//                 <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
//                   <div>
//                     <span className="text-gray-500">Precio:</span>
//                     <span className="font-medium ml-1">{formatCurrency(product.precio_venta)}</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Vendidos:</span>
//                     <span className="font-medium ml-1">{product.cantidad_vendida}</span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Margen:</span>
//                     <span className="font-medium ml-1">
//                       {Math.round(((product.precio_venta - product.costo) / product.precio_venta) * 100)}%
//                     </span>
//                   </div>
//                   <div>
//                     <span className="text-gray-500">Stock:</span>
//                     <span className="font-medium ml-1">{product.cantidad_disponible}</span>
//                   </div>
//                 </div>

//                 <div className="mt-3 flex justify-end">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       setSelectedProducts((prev) =>
//                         prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id],
//                       )
//                     }}
//                   >
//                     {selectedProducts.includes(product.id) ? "Quitar" : "Agregar"}
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Lista de productos */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Productos Más Vendidos ({sortedProducts.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {sortedProducts.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">No se encontraron productos con ventas.</p>
//           ) : (
//             <div className="space-y-4">
//               {sortedProducts.map((product, index) => (
//                 <div key={product.id} className="border rounded-lg p-4">
//                   <div className="flex justify-between items-start">
//                     <div className="flex items-center space-x-3">
//                       <Badge variant="secondary">#{index + 1}</Badge>
//                       <div>
//                         <h3 className="font-medium">{product.nombre}</h3>
//                         <p className="text-sm text-gray-500">{product.categoria}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-medium">{formatCurrency(product.ingresos)}</p>
//                       <p className="text-sm text-gray-500">{product.cantidad_vendida} vendidos</p>
//                     </div>
//                   </div>

//                   <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
//                     <div>
//                       <span className="text-gray-500">Precio:</span>
//                       <span className="font-medium ml-1">{formatCurrency(product.precio_venta)}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Stock:</span>
//                       <span className="font-medium ml-1">{product.cantidad_disponible}</span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Margen:</span>
//                       <span className="font-medium ml-1">
//                         {Math.round(((product.precio_venta - product.costo) / product.precio_venta) * 100)}%
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-gray-500">Ingresos:</span>
//                       <span className="font-medium ml-1">{formatCurrency(product.ingresos)}</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Promociones activas */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Promociones Activas ({promotions.length})</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {promotions.length === 0 ? (
//             <p className="text-gray-500 text-center py-8">No hay promociones configuradas.</p>
//           ) : (
//             <div className="space-y-4">
//               {promotions.map((promo) => (
//                 <div
//                   key={promo.id}
//                   className={`border rounded-lg p-4 ${promo.activa ? "border-green-500" : "border-gray-300"}`}
//                 >
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h3 className="font-medium">{promo.nombre}</h3>
//                       {promo.precio_total_promocional ? (
//                         <p className="text-sm text-gray-500">
//                           Precio promocional: ${promo.precio_total_promocional}
//                         </p>
//                       ) : promo.descuento ? (
//                         <p className="text-sm text-gray-500">
//                           {promo.descuento}% de descuento
//                         </p>
//                       ) : (
//                         <p className="text-sm text-gray-500">
//                           Promoción especial
//                         </p>
//                       )}
//                     </div>
//                     <Badge variant={promo.activa ? "default" : "secondary"}>
//                       {promo.activa ? "Activa" : "Inactiva"}
//                     </Badge>
//                   </div>

//                   <div className="mt-2 text-sm text-gray-500">
//                     Válido: {new Date(promo.fecha_inicio).toLocaleDateString()} -{" "}
//                     {new Date(promo.fecha_fin).toLocaleDateString()}
//                   </div>

//                   <div className="mt-3 flex justify-end space-x-2">
//                     <Button variant="outline" size="sm" onClick={() => togglePromotionStatus(promo.id)}>
//                       {promo.activa ? (
//                         <>
//                           <i className="fas fa-pause mr-1"></i>
//                           Pausar
//                         </>
//                       ) : (
//                         <>
//                           <i className="fas fa-play mr-1"></i>
//                           Activar
//                         </>
//                       )}
//                     </Button>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="text-red-500 hover:text-red-700"
//                       onClick={() => deletePromotion(promo.id)}
//                     >
//                       <i className="fas fa-trash-alt"></i>
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
