"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type React from "react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

interface ServiceType {
  id: string
  name: string
  description: string
  base_price: number
  estimated_duration: number
  category: string
  is_active: boolean
  created_at: string
}

export default function ServiceTypes() {
  const { toast } = useToast()
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentServiceType, setCurrentServiceType] = useState<ServiceType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [basePrice, setBasePrice] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("60")
  const [category, setCategory] = useState("")
  const [isActive, setIsActive] = useState(true)

  const categories = ["Lavado Básico", "Lavado Premium", "Detailing", "Mantenimiento", "Servicios Especiales"]

  useEffect(() => {
    refreshServiceTypes()
  }, [])

  const refreshServiceTypes = async () => {
    try {
      const { data, error } = await supabase.from("tipos_servicio").select("*")
      if (error) throw error
      setServiceTypes(data || [])
    } catch (error: any) {
      console.error("Error loading service types:", error?.message || error)
      setServiceTypes([])
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
  }

  const resetForm = () => {
    setCurrentServiceType(null)
    setName("")
    setDescription("")
    setBasePrice("")
    setEstimatedDuration("60")
    setCategory("")
    setIsActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validaciones mejoradas
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del servicio es obligatorio",
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
    const priceParsed = Number.parseFloat(basePrice)
    if (isNaN(priceParsed) || priceParsed <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }
    const durationParsed = Number.parseInt(estimatedDuration)
    if (isNaN(durationParsed) || durationParsed <= 0) {
      toast({
        title: "Error",
        description: "La duración debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }
    try {
      const serviceTypeData = {
        name: name.trim(),
        description: description.trim(),
        base_price: priceParsed,
        estimated_duration: durationParsed,
        category,
        is_active: isActive,
      }
      let successMessage = ""
      if (currentServiceType) {
        const { error } = await supabase.from("tipos_servicio").update(serviceTypeData).eq("id", currentServiceType.id)
        if (error) throw error
        successMessage = "Tipo de servicio actualizado exitosamente"
      } else {
        const { error } = await supabase.from("tipos_servicio").insert([serviceTypeData])
        if (error) throw error
        successMessage = "Tipo de servicio agregado exitosamente"
      }
      toast({
        title: "Éxito",
        description: successMessage,
        variant: "success",
      })
      refreshServiceTypes()
      resetForm()
      setShowForm(false)
    } catch (error: any) {
      console.error("Error saving service type:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Ocurrió un error al guardar el tipo de servicio",
        variant: "destructive",
      })
    }
  }

  const editServiceType = (serviceType: ServiceType) => {
    setCurrentServiceType(serviceType)
    setName(serviceType.name)
    setDescription(serviceType.description)
    setBasePrice(serviceType.base_price.toString())
    setEstimatedDuration(serviceType.estimated_duration.toString())
    setCategory(serviceType.category)
    setIsActive(serviceType.is_active)
    setShowForm(true)
  }

  const deleteServiceType = async (id: string) => {
    try {
      if (!confirm("¿Está seguro de eliminar este tipo de servicio?")) return
      const { error } = await supabase.from("tipos_servicio").delete().eq("id", id)
      if (error) throw error
      toast({
        title: "Eliminado",
        description: "Tipo de servicio eliminado exitosamente",
        variant: "success",
      })
      refreshServiceTypes()
    } catch (error: any) {
      console.error("Error deleting service type:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Ocurrió un error al eliminar el tipo de servicio",
        variant: "destructive",
      })
    }
  }

  const toggleActiveStatus = async (id: string) => {
    try {
      const serviceType = serviceTypes.find((st) => st.id === id)
      if (!serviceType) return
      const { error } = await supabase.from("tipos_servicio").update({ is_active: !serviceType.is_active }).eq("id", id)
      if (error) throw error
      toast({
        title: "Estado actualizado",
        description: "Estado del servicio actualizado exitosamente",
        variant: "success",
      })
      refreshServiceTypes()
    } catch (error: any) {
      console.error("Error toggling service status:", error?.message || error)
      toast({
        title: "Error",
        description: error?.message || "Ocurrió un error al actualizar el estado del servicio",
        variant: "destructive",
      })
    }
  }

  // Filter service types based on search and category
  const filteredServiceTypes = serviceTypes.filter((serviceType) => {
    const matchesSearch =
      serviceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceType.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "" || serviceType.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Calculate stats
  const activeServices = serviceTypes.filter((st) => st.is_active).length
  const averagePrice =
    serviceTypes.length > 0 ? serviceTypes.reduce((sum, st) => sum + st.base_price, 0) / serviceTypes.length : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Total Servicios</h3>
            <p className="text-3xl font-bold text-yellow-600">{serviceTypes.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Servicios Activos</h3>
            <p className="text-3xl font-bold text-green-600">{activeServices}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Precio Promedio</h3>
            <p className="text-3xl font-bold text-blue-600">${averagePrice.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      {/* Main Service Types Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Tipos de Servicios</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentServiceType ? "Editando servicio" : "Nuevo servicio"}</span>
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
                <i className="fas fa-plus mr-2"></i>Nuevo Tipo de Servicio
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label htmlFor="searchTerm">Buscar Servicio</label>
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
            <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-gray-100 rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-800">
                {currentServiceType ? "Editar Tipo de Servicio" : "Nuevo Tipo de Servicio"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete los datos del servicio en el formulario a continuación
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-cog mr-2 text-green-500"></i>
                    Información del Servicio
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label htmlFor="serviceName" className="font-medium text-gray-700">
                        Nombre del Servicio*
                      </label>
                      <input
                        type="text"
                        id="serviceName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 focus:ring-green-500 focus:border-green-500"
                        placeholder="Ej: Lavado Premium con Cera"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="serviceCategory" className="font-medium text-gray-700">
                        Categoría*
                      </label>
                      <select
                        id="serviceCategory"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="mt-1 focus:ring-green-500 focus:border-green-500"
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
                      <label htmlFor="serviceStatus" className="font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        id="serviceStatus"
                        value={isActive ? "active" : "inactive"}
                        onChange={(e) => setIsActive(e.target.value === "active")}
                        className="mt-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="servicePrice" className="font-medium text-gray-700">
                        Precio Base ($)*
                      </label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="servicePrice"
                          step="0.01"
                          min="0.01"
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          required
                          className="pl-7 focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="serviceDuration" className="font-medium text-gray-700">
                        Duración Estimada (minutos)*
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          id="serviceDuration"
                          min="1"
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          required
                          className="focus:ring-green-500 focus:border-green-500"
                          placeholder="60"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-align-left mr-2 text-green-500"></i>
                    Descripción del Servicio
                  </h4>
                  <div className="form-group">
                    <label htmlFor="serviceDescription" className="font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      id="serviceDescription"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full focus:ring-green-500 focus:border-green-500"
                      placeholder="Describe qué incluye este servicio..."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-3">
                  <Button type="submit" variant="yellow" className="px-6">
                    <i className="fas fa-save mr-2"></i>
                    {currentServiceType ? "Actualizar" : "Guardar"}
                  </Button>
                  <Button type="button" onClick={toggleForm} variant="outline" className="border-gray-300">
                    <i className="fas fa-arrow-left mr-2"></i>Volver
                  </Button>
                </div>
                <Button type="button" onClick={toggleForm} variant="destructive" size="sm">
                  <i className="fas fa-times mr-2"></i>Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Service Types Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Tipos de Servicios ({filteredServiceTypes.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Servicio</th>
                  <th className="py-2 px-4 border">Categoría</th>
                  <th className="py-2 px-4 border">Precio ($)</th>
                  <th className="py-2 px-4 border">Duración</th>
                  <th className="py-2 px-4 border">Estado</th>
                  <th className="py-2 px-4 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredServiceTypes.length > 0 ? (
                  filteredServiceTypes.map((serviceType) => (
                    <tr key={serviceType.id} className={!serviceType.is_active ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border">
                        <div>
                          <div className="font-semibold">{serviceType.name}</div>
                          {serviceType.description && (
                            <div className="text-xs text-gray-500">{serviceType.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 border">{serviceType.category}</td>
                      <td className="py-2 px-4 border font-semibold">${serviceType.base_price.toFixed(2)}</td>
                      <td className="py-2 px-4 border">{serviceType.estimated_duration} min</td>
                      <td className="py-2 px-4 border">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            serviceType.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {serviceType.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => toggleActiveStatus(serviceType.id)}
                            variant={serviceType.is_active ? "outline" : "default"}
                            size="sm"
                            title={serviceType.is_active ? "Desactivar" : "Activar"}
                          >
                            <i className={`fas ${serviceType.is_active ? "fa-eye-slash" : "fa-eye"}`}></i>
                          </Button>
                          <Button onClick={() => editServiceType(serviceType)} variant="yellow" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button onClick={() => deleteServiceType(serviceType.id)} variant="destructive" size="sm">
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No hay tipos de servicios que coincidan con los filtros
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
