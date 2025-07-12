import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ClipboardList, DollarSign, Edit, Eye, Filter, Layers, Minus, Package, Plus, Search, Trash2 } from "lucide-react"
import { showToast } from "nextjs-toast-notify"
import { useEffect, useState } from "react"
import type { Categorias } from "../interfaces/categorias.interface"
import type { Productos } from "../interfaces/productos.interface"
import type { Proveedor } from "../interfaces/proveedores.interface"
import { addDocument, getCollection } from "../lib/firebase"
// Definir la interfaz para tipos de servicio
interface TipoServicio {
  id: string
  nombre: string
  descripcion?: string
  id_categoria: string
  duracion_estimada?: number
  estado?: boolean
  precio_base?: number
}

export default function Inventory() {
  const [products, setProducts] = useState<Productos[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categorias[]>([])
  const [servicios, setServicios] = useState<TipoServicio[]>([])
  const [currentProduct, setCurrentProduct] = useState<Productos | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [cost, setCost] = useState("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("5")
  const [supplier, setSupplier] = useState("")
  const [description, setDescription] = useState("")
  const [associatedService, setAssociatedService] = useState("")

  // Loading state for submit button
  const [loading, setLoading] = useState(false)

  // Cargar categorías y servicios desde Firebase
  useEffect(() => {
    fetchCategorias()
    fetchServicios()
  }, [])

  const fetchCategorias = async () => {
    try {
      const categoriasFromFirebase = await getCollection("categorias")
      setCategorias(
        categoriasFromFirebase.map((c: any) => ({
          id: c.id,
          nombre: c.nombre || "",
          descripcion: c.descripcion || ""
        }))
      )
    } catch (error) {
      setCategorias([])
    }
  }

  const fetchServicios = async () => {
    try {
      const serviciosFromFirebase = await getCollection("tipos_servicio")
      setServicios(
        serviciosFromFirebase.map((s: any) => ({
          id: s.id,
          nombre: s.nombre || "",
          descripcion: s.descripcion || "",
          id_categoria: s.id_categoria || "",
          duracion_estimada: s.duracion_estimada,
          estado: s.estado,
          precio_base: s.precio_base
        }))
      )
    } catch (error) {
      setServicios([])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      const proveedoresFromFirebase = await getCollection("proveedores")
      setProveedores(
        proveedoresFromFirebase.map((p: any) => ({
          id: p.id,
          rif: p.rif || "",
          nombre: p.nombre || "",
          contacto: p.contacto || "",
          telefono: p.telefono || "",
          email: p.email || "",
          direccion: p.direccion || "",
          activo: typeof p.activo === "boolean" ? p.activo : true,
          fecha_registro: p.fecha_registro || "",
        }))
      )
    } catch (error) {
      setProveedores([])
    }
  }

  const fetchProducts = async () => {
    try {
      const productsFromFirebase = await getCollection("productos")
      // Map or cast the fetched data to match the Productos interface
      setProducts(
        productsFromFirebase.map((p: any) => ({
          id: p.id,
          nombre: p.nombre || "",
          descripcion: p.descripcion || "",
          id_categoria: p.id_categoria || "",
          id_tipo_servicio: p.id_tipo_servicio || "",
          costo: p.costo ?? 0,
          precio_venta: p.precio_venta ?? 0,
          cantidad_disponible: p.cantidad_disponible ?? "0",
          stock_minimo: p.stock_minimo ?? "0",
          id_proveedor: p.id_proveedor || "",
        }))
      )
    } catch (error) {
      console.error("Error cargando inventario desde Firebase:", error)
      setProducts([])
    }
  }

  const openFormDialog = () => {
    setCurrentProduct(null)
    setFormDialogOpen(true)
    resetForm()
  }
  const closeFormDialog = () => {
    setFormDialogOpen(false)
    setCurrentProduct(null)
    resetForm()
  }

  const resetForm = () => {
    setName("")
    setCategory("")
    setPrice("")
    setCost("")
    setQuantity("")
    setMinStock("5")
    setSupplier("")
    setDescription("")
    setAssociatedService("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast.error("El nombre del producto es obligatorio", { duration: 4000, position: "top-center" })
      return
    }
    if (!category) {
      showToast.error("La categoría es obligatoria", { duration: 4000, position: "top-center" })
      return
    }
    if (!price || isNaN(Number(price))) {
      showToast.error("El precio de venta es obligatorio y debe ser numérico", { duration: 4000, position: "top-center" })
      return
    }
    if (!quantity || isNaN(Number(quantity))) {
      showToast.error("La cantidad disponible es obligatoria y debe ser numérica", { duration: 4000, position: "top-center" })
      return
    }
    if (!minStock || isNaN(Number(minStock))) {
      showToast.error("El stock mínimo es obligatorio y debe ser numérico", { duration: 4000, position: "top-center" })
      return
    }
    // Validar nombre único (ignorando espacios y mayúsculas/minúsculas)
    const nombreNormalizado = name.trim().toLowerCase().replace(/\s+/g, " ")
    const existe = products.some(p => p.nombre.trim().toLowerCase().replace(/\s+/g, " ") === nombreNormalizado && (!currentProduct || p.id !== currentProduct.id))
    if (existe) {
      showToast.error("Ya existe un producto con ese nombre", { duration: 4000, position: "top-center" })
      return
    }
    setLoading(true)
    try {
      const productData = {
        nombre: name.trim(),
        descripcion: description.trim(),
        id_categoria: category,
        id_tipo_servicio: associatedService && associatedService !== "ninguno" ? associatedService : "",
        costo: cost ? Number(cost) : 0,
        precio_venta: Number(price),
        cantidad_disponible: quantity.toString(),
        stock_minimo: minStock.toString(),
        id_proveedor: supplier || "",
      }
      if (currentProduct) {
        // Actualizar producto existente
        const { updateDocument } = await import("../lib/firebase")
        await updateDocument(`productos/${currentProduct.id}`, productData)
        showToast.success("Producto actualizado exitosamente", { duration: 4000, position: "top-center" })
      } else {
        // Crear nuevo producto
        await addDocument("productos", productData)
        showToast.success("Producto registrado exitosamente", { duration: 4000, position: "top-center" })
      }
      await fetchProducts()
      setFormDialogOpen(false)
      resetForm()
    } catch (error: any) {
      showToast.error(error?.message || "Ocurrió un error al guardar el producto", { duration: 4000, position: "top-center" })
    } finally {
      setLoading(false)
    }
  }

  // Editar producto: llena el formulario con los datos del producto seleccionado
  const editProduct = (product: Productos) => {
    setCurrentProduct(product)
    setName(product.nombre)
    setCategory(product.id_categoria)
    setPrice(product.precio_venta?.toString() || "")
    setCost(product.costo?.toString() || "")
    setQuantity(product.cantidad_disponible?.toString() || "")
    setMinStock(product.stock_minimo?.toString() || "")
    setSupplier(product.id_proveedor || "")
    setDescription(product.descripcion || "")
    setAssociatedService(product.id_tipo_servicio || "ninguno")
    setFormDialogOpen(true)
  }

  // Estado para el diálogo de confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  // Eliminar producto de Firebase
  const deleteProduct = async (id: string) => {
    try {
      await import("../lib/firebase").then(({ deleteDocument }) => deleteDocument(`productos/${id}`))
      showToast.success("Producto eliminado exitosamente", { duration: 4000, position: "top-center" })
      fetchProducts()
    } catch (error: any) {
      showToast.error(error?.message || "Ocurrió un error al eliminar el producto", { duration: 4000, position: "top-center" })
    }
  }

  // Ajustar stock en Firebase
  const adjustStock = async (id: string, adjustment: number) => {
    try {
      const product = products.find((p) => p.id === id)
      if (!product) return
      const currentStock = Number(product.cantidad_disponible)
      const newQuantity = currentStock + adjustment
      if (newQuantity < 0) {
        showToast.error("No se puede reducir el stock por debajo de 0", { duration: 4000, position: "top-center" })
        return
      }
      await import("../lib/firebase").then(({ updateDocument }) =>
        updateDocument(`productos/${id}`, { cantidad_disponible: newQuantity.toString() })
      )
      showToast.success(`Stock ${adjustment > 0 ? "aumentado" : "reducido"} exitosamente`, { duration: 4000, position: "top-center" })
      fetchProducts()
    } catch (error: any) {
      showToast.error(error?.message || "Ocurrió un error al actualizar el stock", { duration: 4000, position: "top-center" })
    }
  }

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "" || product.id_categoria === filterCategory
    return matchesSearch && matchesCategory
  })

  // Get low stock products
  const lowStockProducts = products.filter((product) => Number(product.cantidad_disponible) <= Number(product.stock_minimo))

  // Calculate total inventory value
  const totalValue = products.reduce((sum, product) => sum + (Number(product.precio_venta) * Number(product.cantidad_disponible)), 0)
  const totalCost = products.reduce((sum, product) => sum + (Number(product.costo) * Number(product.cantidad_disponible)), 0)

  // Estado para mostrar el dialog de información
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [infoProduct, setInfoProduct] = useState<Productos | null>(null)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center gap-2">
          <Package className="w-8 h-8 text-yellow-500" />
          <span className="text-lg font-bold text-gray-800">Total Productos</span>
          <span className="text-3xl font-bold text-yellow-600">{products.length}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-2">
          <DollarSign className="w-8 h-8 text-green-500" />
          <span className="text-lg font-bold text-gray-800">Valor Inventario</span>
          <span className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-2">
          <Layers className="w-8 h-8 text-blue-500" />
          <span className="text-lg font-bold text-gray-800">Costo Total</span>
          <span className="text-3xl font-bold text-blue-600">${totalCost.toFixed(2)}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <span className="text-lg font-bold text-gray-800">Stock Bajo</span>
          <span className="text-3xl font-bold text-red-600">{lowStockProducts.length}</span>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center mb-2 gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-red-700">Productos con Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="bg-white p-2 rounded border flex items-center gap-2">
                <Badge variant="destructive">{product.cantidad_disponible} unidades</Badge>
                <span className="font-semibold">{product.nombre}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Inventory Management */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Gestión de Inventario</h2>
          </div>
          <Button onClick={openFormDialog} variant="yellow" className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nuevo Producto
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="searchTerm" className="font-medium">Buscar Producto</Label>
            <div className="relative">
              <Input
                id="searchTerm"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="filterCategory" className="font-medium">Filtrar por Categoría</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger id="filterCategory" className="pl-10">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                {/* No SelectItem with value="" */}
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dialog para registrar producto */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-2xl w-full p-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-8 pt-6 pb-2 sticky top-0 z-10 bg-white">
              <DialogTitle className="text-2xl">Registrar Producto</DialogTitle>
              <DialogDescription className="text-base text-gray-500">
                Completa los datos para registrar un nuevo producto en el inventario.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Datos principales */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productName">Nombre del Producto*</Label>
                    <Input
                      id="productName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productCategory">Categoría*</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger id="productCategory">
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productService">Servicio Asociado</Label>
                    <Select value={associatedService} onValueChange={setAssociatedService}>
                      <SelectTrigger id="productService">
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        {category && servicios.filter(s => s.id_categoria === (categorias.find(c => c.nombre === category)?.id || "")).length > 0
                          ? servicios.filter(s => s.id_categoria === (categorias.find(c => c.nombre === category)?.id || "")).map(service => (
                              <SelectItem key={service.id} value={service.id}>{service.nombre}</SelectItem>
                            ))
                          : null}
                        <SelectItem value="ninguno">Ninguno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Columna 2: Precios y stock */}
                <div className="space-y-4">

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productCost">Precio de Compra ($)</Label>
                    <Input
                      id="productCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productPrice">Precio de Venta ($)*</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productQuantity">Cantidad Disponible*</Label>
                    <Input
                      id="productQuantity"
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productMinStock">Stock Mínimo*</Label>
                    <Input
                      id="productMinStock"
                      type="number"
                      min="0"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      required
                      placeholder="5"
                    />
                  </div>
                </div>
                {/* Columna 3: Proveedor y descripción */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productSupplier">Proveedor</Label>
                    <Select value={supplier} onValueChange={setSupplier}>
                      <SelectTrigger id="productSupplier">
                        <SelectValue placeholder="Seleccione proveedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.length === 0 ? (
                          <SelectItem value="" disabled>No hay proveedores</SelectItem>
                        ) : (
                          proveedores.map((prov) => (
                            <SelectItem key={prov.id} value={prov.id}>{prov.nombre} ({prov.rif})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="productDescription">Descripción</Label>
                    <Input
                      id="productDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-row justify-between gap-2 pt-8 border-t border-gray-200 mt-8">
                <div className="flex space-x-3">
                  <Button type="submit" variant="yellow" className="px-6 min-h-[48px] text-base flex items-center gap-2" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center"><Plus className="w-4 h-4 animate-spin" />Guardando...</span>
                    ) : (
                      <><Plus className="w-4 h-4" />Guardar</>
                    )}
                  </Button>
                </div>
                <DialogClose asChild>
                  <Button type="button" variant="destructive" size="sm" className="min-h-[48px] text-base flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />Cancelar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de información de producto */}
        <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Información del Producto</DialogTitle>
              <DialogDescription>
                Detalles completos del producto seleccionado.
              </DialogDescription>
            </DialogHeader>
            {infoProduct && (
              <div className="space-y-2">
                <div><span className="font-semibold">Nombre:</span> {infoProduct.nombre}</div>
                <div><span className="font-semibold">Descripción:</span> {infoProduct.descripcion || '-'}</div>
                <div><span className="font-semibold">Categoría:</span> {categorias.find(c => c.id === infoProduct.id_categoria)?.nombre || infoProduct.id_categoria}</div>
                <div><span className="font-semibold">Servicio Asociado:</span> {servicios.find(s => s.id === infoProduct.id_tipo_servicio)?.nombre || '-'}</div>
                <div><span className="font-semibold">Precio de Venta:</span> ${Number(infoProduct.precio_venta).toFixed(2)}</div>
                <div><span className="font-semibold">Costo:</span> ${Number(infoProduct.costo).toFixed(2)}</div>
                <div><span className="font-semibold">Cantidad Disponible:</span> {infoProduct.cantidad_disponible}</div>
                <div><span className="font-semibold">Stock Mínimo:</span> {infoProduct.stock_minimo}</div>
                <div><span className="font-semibold">Proveedor:</span> {proveedores.find(p => p.id === infoProduct.id_proveedor)?.nombre || '-'}</div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setInfoDialogOpen(false)} variant="yellow">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de borrado */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro de eliminar este producto?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El producto será eliminado permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (deleteProductId) {
                    await deleteProduct(deleteProductId)
                    setDeleteDialogOpen(false)
                    setDeleteProductId(null)
                  }
                }}
              >
                Eliminar
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Products Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-500" /> Total de Productos en Inventario ({filteredProducts.length})
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio ($)</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min. Stock</TableHead>
                  {/* <TableHead>Proveedor</TableHead> */}
                  <TableHead>Servicio</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isLowStock = Number(product.cantidad_disponible) <= Number(product.stock_minimo)
                    return (
                      <TableRow key={product.id} className={isLowStock ? "bg-red-50 border-red-200" : ""}>
                        <TableCell>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              {product.nombre}
                            </div>
                            {product.descripcion && <div className="text-xs text-gray-500">{product.descripcion}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{product.id_categoria}</TableCell>
                        <TableCell>${Number(product.precio_venta).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={isLowStock ? "destructive" : "outline"}>{product.cantidad_disponible}</Badge>
                        </TableCell>
                        <TableCell>{product.stock_minimo}</TableCell>
                        {/* <TableCell>{
                          proveedores.find((prov) => prov.id === product.id_proveedor)?.nombre || "-"
                        }</TableCell> */}
                        <TableCell>{
                          servicios.find(s => s.id === product.id_tipo_servicio)?.nombre || "-"
                        }</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              onClick={() => adjustStock(product.id, 1)}
                              variant="outline"
                              size="icon"
                              title="Agregar 1 unidad"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => adjustStock(product.id, -1)}
                              variant="outline"
                              size="icon"
                              title="Quitar 1 unidad"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => editProduct(product)} variant="secondary" size="icon" title="Editar">
                              <Edit className="w-4 h-4 text-yellow-600" />
                            </Button>
                            <Button onClick={() => { setDeleteProductId(product.id); setDeleteDialogOpen(true) }} variant="destructive" size="icon" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => { setInfoProduct(product); setInfoDialogOpen(true) }} variant="outline" size="icon" title="Ver información">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4 text-center text-gray-500">
                      No hay productos que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  )
}
