"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabaseDb } from "@/lib/SupaBasClient"
import { supabase } from "@/lib/supabaseClient"
import type React from "react"
import { useEffect, useState } from "react"

interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
  quantity: number
  minStock: number
  supplier: string
  description: string
  associatedService: string
  createdAt: string
}

export default function Inventory() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
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

  const categories = [
    "Limpieza",
    "Aceites",
    "Accesorios",
    "Herramientas",
    "Filtros",
    "Neumáticos",
    "Baterías",
    "Lubricantes",
    "Otros",
  ]

  const services = [
    "Lavado estándar",
    "Lavado premium (con cera o espuma activa)",
    "Lavado de motor",
    "Aspirado interior",
    "Lavado de motos",
    "Pulitura",
    "Detailing interior/exterior",
    "Revisión de luces",
    "Cambio de aceite",
    "Ninguno",
  ]

  useEffect(() => {
    fetchSupabaseInventory()
  }, [])

  const fetchSupabaseInventory = async () => {
    try {
      const productsFromSupabase = await supabaseDb.getProductos()
      setProducts(productsFromSupabase)
    } catch (error) {
      console.error("Error cargando inventario desde Supabase:", error)
      setProducts([])
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
  }

  const resetForm = () => {
    setCurrentProduct(null)
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

    // Validaciones mejoradas
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Error",
        description: "La categoría es obligatoria",
        variant: "destructive",
      })
      return
    }

    const priceValue = Number.parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    const costValue = Number.parseFloat(cost || "0")
    if (isNaN(costValue) || costValue < 0) {
      toast({
        title: "Error",
        description: "El costo no puede ser negativo",
        variant: "destructive",
      })
      return
    }

    const quantityValue = Number.parseInt(quantity)
    if (isNaN(quantityValue) || quantityValue < 0) {
      toast({
        title: "Error",
        description: "La cantidad no puede ser negativa",
        variant: "destructive",
      })
      return
    }

    const minStockValue = Number.parseInt(minStock)
    if (isNaN(minStockValue) || minStockValue < 0) {
      toast({
        title: "Error",
        description: "El stock mínimo no puede ser negativo",
        variant: "destructive",
      })
      return
    }

    try {
      const productData: Product = {
        id: currentProduct?.id || Date.now().toString(),
        name: name.trim(),
        category,
        price: priceValue,
        cost: costValue,
        quantity: quantityValue,
        minStock: minStockValue,
        supplier: supplier.trim(),
        description: description.trim(),
        associatedService: associatedService === "Ninguno" ? "" : associatedService,
        createdAt: currentProduct?.createdAt || new Date().toISOString(),
      }
      let result
      if (currentProduct) {
        // Actualizar producto en Supabase
        result = await supabase
          .from("productos")
          .update({
            name: productData.name,
            category: productData.category,
            price: productData.price,
            cost: productData.cost,
            quantity: productData.quantity,
            minStock: productData.minStock,
            supplier: productData.supplier,
            description: productData.description,
            associatedService: productData.associatedService,
          })
          .eq("id", currentProduct.id)
        toast({
          title: "Actualizado",
          description: "Producto actualizado exitosamente",
          variant: "success",
        })
      } else {
        // Crear producto en Supabase (sin id ni createdAt)
        const newProduct = {
          name: productData.name,
          category: productData.category,
          price: productData.price,
          cost: productData.cost,
          quantity: productData.quantity,
          minStock: productData.minStock,
          supplier: productData.supplier,
          description: productData.description,
          associatedService: productData.associatedService,
        }
        result = await supabaseDb.createProducto(newProduct)
        toast({
          title: "Agregado",
          description: "Producto agregado exitosamente",
          variant: "success",
        })
      }
      fetchSupabaseInventory()
      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error("Error guardando producto en Supabase:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el producto en Supabase",
        variant: "destructive",
      })
    }
  }

  const editProduct = (product: Product) => {
    setCurrentProduct(product)
    setName(product.name)
    setCategory(product.category)
    setPrice(product.price.toString())
    setCost(product.cost.toString())
    setQuantity(product.quantity.toString())
    setMinStock(product.minStock.toString())
    setSupplier(product.supplier)
    setDescription(product.description)
    setAssociatedService(product.associatedService || "Ninguno")
    setShowForm(true)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este producto?")) return
    try {
      await supabase
        .from("productos")
        .delete()
        .eq("id", id)
      toast({
        title: "Eliminado",
        description: "Producto eliminado exitosamente",
        variant: "success",
      })
      fetchSupabaseInventory()
    } catch (error) {
      console.error("Error eliminando producto en Supabase:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el producto en Supabase",
        variant: "destructive",
      })
    }
  }

  const adjustStock = async (id: string, adjustment: number) => {
    try {
      const product = products.find((p) => p.id === id)
      if (!product) return
      const newQuantity = product.quantity + adjustment
      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "No se puede reducir el stock por debajo de 0",
          variant: "destructive",
        })
        return
      }
      await supabase
        .from("productos")
        .update({ quantity: newQuantity })
        .eq("id", id)
      toast({
        title: "Stock actualizado",
        description: `Stock ${adjustment > 0 ? "aumentado" : "reducido"} exitosamente`,
        variant: "success",
      })
      fetchSupabaseInventory()
    } catch (error) {
      console.error("Error actualizando stock en Supabase:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el stock en Supabase",
        variant: "destructive",
      })
    }
  }

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "" || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Get low stock products
  const lowStockProducts = products.filter((product) => product.quantity <= product.minStock)

  // Calculate total inventory value
  const totalValue = products.reduce((sum, product) => sum + product.price * product.quantity, 0)
  const totalCost = products.reduce((sum, product) => sum + product.cost * product.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Total Productos</h3>
            <p className="text-3xl font-bold text-yellow-600">{products.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Valor Inventario</h3>
            <p className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Costo Total</h3>
            <p className="text-3xl font-bold text-blue-600">${totalCost.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Stock Bajo</h3>
            <p className="text-3xl font-bold text-red-600">{lowStockProducts.length}</p>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center mb-2">
            <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
            <h3 className="text-lg font-bold text-red-700">Productos con Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="bg-white p-2 rounded border">
                <span className="font-semibold">{product.name}</span>
                <span className="text-red-600 ml-2">({product.quantity} unidades)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Inventory Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Inventario</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentProduct ? "Editando producto" : "Nuevo producto"}</span>
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
                <i className="fas fa-plus mr-2"></i>Nuevo Producto
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label htmlFor="searchTerm">Buscar Producto</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="filterCategory">Filtrar por Categoría</label>
            <select id="filterCategory" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-gray-100 rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-800">
                {currentProduct ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete los datos del producto en el formulario a continuación
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-box mr-2 text-blue-500"></i>
                    Información Básica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label htmlFor="productName" className="font-medium text-gray-700">
                        Nombre del Producto*
                      </label>
                      <input
                        type="text"
                        id="productName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombre del producto"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="productCategory" className="font-medium text-gray-700">
                        Categoría*
                      </label>
                      <select
                        id="productCategory"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="productService" className="font-medium text-gray-700">
                        Servicio Asociado
                      </label>
                      <select
                        id="productService"
                        value={associatedService}
                        onChange={(e) => setAssociatedService(e.target.value)}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {services.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-tag mr-2 text-blue-500"></i>
                    Precios y Stock
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label htmlFor="productPrice" className="font-medium text-gray-700">
                        Precio de Venta ($)*
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="productPrice"
                          step="0.01"
                          min="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          className="pl-7 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="productCost" className="font-medium text-gray-700">
                        Costo ($)
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="productCost"
                          step="0.01"
                          min="0"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                          className="pl-7 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="productQuantity" className="font-medium text-gray-700">
                        Cantidad Disponible*
                      </label>
                      <input
                        type="number"
                        id="productQuantity"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="productMinStock" className="font-medium text-gray-700">
                        Stock Mínimo*
                      </label>
                      <input
                        type="number"
                        id="productMinStock"
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        required
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="5"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="productSupplier" className="font-medium text-gray-700">
                        Proveedor
                      </label>
                      <input
                        type="text"
                        id="productSupplier"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-align-left mr-2 text-blue-500"></i>
                    Descripción del Producto
                  </h4>
                  <div className="form-group">
                    <label htmlFor="productDescription" className="font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      id="productDescription"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-3">
                  <Button type="submit" variant="yellow" className="px-6">
                    <i className="fas fa-save mr-2"></i>
                    {currentProduct ? "Actualizar" : "Guardar"}
                  </Button>
                  <Button type="button" onClick={toggleForm} variant="outline" className="border-gray-300">
                    <i className="fas fa-arrow-left mr-2"></i>Volver
                  </Button>
                </div>
                <Button type="button" onClick={toggleForm} variant="destructive" size="sm">
                  <i className="fas fa-times mr-2"></i>Salir
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Total de Productos en Inventario ({filteredProducts.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Producto</th>
                  <th className="py-2 px-4 border">Categoría</th>
                  <th className="py-2 px-4 border">Precio ($)</th>
                  <th className="py-2 px-4 border">Stock</th>
                  <th className="py-2 px-4 border">Min. Stock</th>
                  <th className="py-2 px-4 border">Proveedor</th>
                  <th className="py-2 px-4 border">Servicio</th>
                  <th className="py-2 px-4 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const isLowStock = product.quantity <= product.minStock

                    return (
                      <tr key={product.id} className={isLowStock ? "bg-red-50 border-red-200" : ""}>
                        <td className="py-2 px-4 border">
                          <div>
                            <div className="font-semibold">{product.name}</div>
                            {product.description && <div className="text-xs text-gray-500">{product.description}</div>}
                          </div>
                        </td>
                        <td className="py-2 px-4 border">{product.category}</td>
                        <td className="py-2 px-4 border">${product.price.toFixed(2)}</td>
                        <td className="py-2 px-4 border">
                          <div className="flex items-center">
                            <span className={isLowStock ? "text-red-600 font-bold" : ""}>{product.quantity}</span>
                            {isLowStock && <i className="fas fa-exclamation-triangle text-red-500 ml-2"></i>}
                          </div>
                        </td>
                        <td className="py-2 px-4 border">{product.minStock}</td>
                        <td className="py-2 px-4 border">{product.supplier || "-"}</td>
                        <td className="py-2 px-4 border">{product.associatedService || "-"}</td>
                        <td className="py-2 px-4 border">
                          <div className="flex flex-wrap gap-1">
                            <Button
                              onClick={() => adjustStock(product.id, 1)}
                              variant="default"
                              size="sm"
                              title="Agregar 1 unidad"
                            >
                              <i className="fas fa-plus"></i>
                            </Button>
                            <Button
                              onClick={() => adjustStock(product.id, -1)}
                              variant="outline"
                              size="sm"
                              title="Quitar 1 unidad"
                            >
                              <i className="fas fa-minus"></i>
                            </Button>
                            <Button onClick={() => editProduct(product)} variant="yellow" size="sm">
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button onClick={() => deleteProduct(product.id)} variant="destructive" size="sm">
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No hay productos que coincidan con los filtros
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
