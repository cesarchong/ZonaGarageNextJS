"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import type { Categorias } from "@/interfaces/categorias.interface"
import type { Tipo_Servicio } from "@/interfaces/tipo-servicios.interface"
import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
import { Edit3, Plus, ToggleLeft, ToggleRight, Trash } from "lucide-react"
import { showToast } from "nextjs-toast-notify"
import { useEffect, useState } from "react"

export default function ServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<Tipo_Servicio[]>([])
  const [categorias, setCategorias] = useState<Categorias[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioBase, setPrecioBase] = useState("")
  const [duracionEstimada, setDuracionEstimada] = useState("")
  const [idCategoria, setIdCategoria] = useState("")
  const [estado, setEstado] = useState(true)
  const [search, setSearch] = useState("")
  // Estados de error para validaciones
  const [errorNombre, setErrorNombre] = useState("")
  const [errorPrecio, setErrorPrecio] = useState("")
  const [errorDuracion, setErrorDuracion] = useState("")
  const [errorCategoria, setErrorCategoria] = useState("")
  // Estado para loading del submit
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  // Estado para confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchServiceTypes = async () => {
    setLoading(true)
    const data = await getCollection("tipos_servicio")
    setServiceTypes(data as Tipo_Servicio[])
    setLoading(false)
  }

  const fetchCategorias = async () => {
    const data = await getCollection("categorias")
    setCategorias(data as Categorias[])
  }

  useEffect(() => {
    fetchServiceTypes()
    fetchCategorias()
  }, [])

  const resetForm = () => {
    setEditId(null)
    setNombre("")
    setDescripcion("")
    setPrecioBase("")
    setDuracionEstimada("")
    setIdCategoria("")
    setEstado(true)
    setErrorNombre("")
    setErrorPrecio("")
    setErrorDuracion("")
    setErrorCategoria("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSubmit(true)
    let valid = true
    const nombreTrim = nombre.trim()
    const descripcionTrim = descripcion.trim()
    // Validar nombre vacío
    if (!nombreTrim) {
      setErrorNombre("El nombre del servicio es obligatorio.")
      valid = false
    } else {
      setErrorNombre("")
    }
    // Validar nombre duplicado (ignorando mayúsculas/minúsculas y espacios)
    const nombreNormalizado = nombreTrim.toLowerCase().replace(/\s+/g, " ")
    const existeNombre = serviceTypes.some(serv =>
      serv.nombre.trim().toLowerCase().replace(/\s+/g, " ") === nombreNormalizado && serv.id !== editId
    )
    if (existeNombre) {
      setErrorNombre("Ya existe un tipo de servicio con ese nombre.")
      valid = false
    }
    // Validar categoría
    if (!idCategoria) {
      setErrorCategoria("Debe seleccionar una categoría.")
      valid = false
    } else {
      setErrorCategoria("")
    }
    // Validar precio
    const precio = Number(precioBase)
    if (isNaN(precio) || precio <= 0) {
      setErrorPrecio("El precio debe ser mayor a 0.")
      valid = false
    } else {
      setErrorPrecio("")
    }
    // Validar duración
    const duracion = Number(duracionEstimada)
    if (isNaN(duracion) || duracion <= 0) {
      setErrorDuracion("La duración debe ser mayor a 0.")
      valid = false
    } else {
      setErrorDuracion("")
    }
    if (!valid) {
      setLoadingSubmit(false)
      return
    }
    try {
      if (editId) {
        await updateDocument(`tipos_servicio/${editId}`, {
          nombre: nombreTrim,
          descripcion: descripcionTrim,
          precio_base: precio,
          duracion_estimada: duracion,
          id_categoria: idCategoria,
          estado
        })
        showToast.success("¡El tipo de servicio fue actualizado con éxito!", { duration: 4000, progress: true, position: "top-center" })
      } else {
        await addDocument("tipos_servicio", {
          nombre: nombreTrim,
          descripcion: descripcionTrim,
          precio_base: precio,
          duracion_estimada: duracion,
          id_categoria: idCategoria,
          estado
        })
        showToast.success("¡El tipo de servicio fue registrado con éxito!", { duration: 4000, progress: true, position: "top-center" })
      }
      resetForm()
      setOpen(false)
      fetchServiceTypes()
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleEdit = (serv: Tipo_Servicio) => {
    setEditId(serv.id)
    setNombre(serv.nombre)
    setDescripcion(serv.descripcion || "")
    setPrecioBase(serv.precio_base ? String(serv.precio_base) : "")
    setDuracionEstimada(serv.duracion_estimada ? String(serv.duracion_estimada) : "")
    setIdCategoria(serv.id_categoria)
    setEstado(serv.estado)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteDocument(`tipos_servicio/${deleteId}`)
    showToast.success("¡El tipo de servicio fue eliminado con éxito!", { duration: 4000, progress: true, position: "top-center" })
    setDeleteDialogOpen(false)
    setDeleteId(null)
    fetchServiceTypes()
  }

  // Activar/desactivar tipo de servicio
  const toggleEstado = async (serv: Tipo_Servicio) => {
    try {
      await updateDocument(`tipos_servicio/${serv.id}`, { estado: !serv.estado })
      showToast.success(
        `Tipo de servicio ${!serv.estado ? "activado" : "desactivado"} correctamente`,
        { duration: 4000, progress: true, position: "top-center" }
      )
      fetchServiceTypes()
    } catch (error: any) {
      showToast.error("Error al cambiar el estado", { duration: 4000, progress: true, position: "top-center" })
    }
  }

  // Filtro de búsqueda
  const filteredServiceTypes = serviceTypes.filter(serv =>
    serv.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (serv.descripcion && serv.descripcion.toLowerCase().includes(search.toLowerCase()))
  )

  // Cálculos para los cards
  const totalServicios = serviceTypes.length
  const serviciosActivos = serviceTypes.filter(s => s.estado).length
  const precioPromedio =
    totalServicios > 0
      ? (serviceTypes.reduce((acc, s) => acc + (typeof s.precio_base === "number" ? s.precio_base : Number(s.precio_base) || 0), 0) / totalServicios).toFixed(2)
      : "0.00"

  return (
    <div className="p-6">
      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-yellow-600">{totalServicios}</span>
          <span className="text-gray-600 mt-1">Total servicios</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-green-600">{serviciosActivos}</span>
          <span className="text-gray-600 mt-1">Servicios activos</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">${precioPromedio}</span>
          <span className="text-gray-600 mt-1">Precio promedio</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">Tipos de Servicio</h2>
          <span className="text-sm text-gray-500 mt-1">Total: {serviceTypes.length}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Buscar tipo de servicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="yellow" onClick={() => { resetForm() }}>
                <Plus className="w-4 h-4 mr-2" /> Nuevo Tipo de Servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar tipo de servicio" : "Registrar tipo de servicio"}</DialogTitle>
                <DialogDescription>
                  {editId ? "Edita los datos del tipo de servicio." : "Agrega un nuevo tipo de servicio al sistema."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Nombre del servicio"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
                {errorNombre && (
                  <p className="text-red-500 text-sm mt-1">{errorNombre}</p>
                )}
                <Input
                  placeholder="Descripción (opcional)"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                />
                <Input
                  placeholder="Precio base"
                  type="number"
                  min={0}
                  value={precioBase}
                  onChange={e => {
                    // No permitir negativos
                    const val = e.target.value.replace(/^-/, "")
                    setPrecioBase(val)
                  }}
                  required
                />
                {errorPrecio && (
                  <p className="text-red-500 text-sm mt-1">{errorPrecio}</p>
                )}
                <Input
                  placeholder="Duración estimada (minutos)"
                  type="number"
                  min={0}
                  value={duracionEstimada}
                  onChange={e => {
                    // No permitir negativos
                    const val = e.target.value.replace(/^-/, "")
                    setDuracionEstimada(val)
                  }}
                  required
                />
                {errorDuracion && (
                  <p className="text-red-500 text-sm mt-1">{errorDuracion}</p>
                )}
                 <div>
                  <Select value={idCategoria} onValueChange={value => { setIdCategoria(value); setErrorCategoria("") }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errorCategoria && (
                    <p className="text-red-500 text-sm mt-1">{errorCategoria}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="estado" checked={estado} onCheckedChange={setEstado} />
                  <label htmlFor="estado">Activo</label>
                </div>
                <DialogFooter>
                  <Button variant="yellow" type="submit" disabled={loadingSubmit}>
                    {loadingSubmit && (
                      <svg className="animate-spin h-4 w-4 mr-2 inline-block text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    )}
                    {editId ? "Guardar cambios" : "Registrar"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-bold">Nombre</TableCell>
              <TableCell className="font-bold">Descripción</TableCell>
              <TableCell className="font-bold">Precio Base</TableCell>
              <TableCell className="font-bold">Duración</TableCell>
              <TableCell className="font-bold">Categoría</TableCell>
              <TableCell className="font-bold">Estado</TableCell>
              <TableCell className="font-bold">Opciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>Cargando...</TableCell>
              </TableRow>
            ) : filteredServiceTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No hay tipos de servicio registrados.</TableCell>
              </TableRow>
            ) : (
              filteredServiceTypes.map(serv => (
                <TableRow key={serv.id}>
                  <TableCell>{serv.nombre}</TableCell>
                  <TableCell>{serv.descripcion && serv.descripcion.trim() !== '' ? serv.descripcion : 'No asignada'}</TableCell>
                  <TableCell>${serv.precio_base}</TableCell>
                  <TableCell>{serv.duracion_estimada} min</TableCell>
                  <TableCell>{categorias.find(cat => cat.id === serv.id_categoria)?.nombre || 'Sin categoría'}</TableCell>
                  <TableCell>{serv.estado ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell>
                  <Button size="icon" variant="yellow" className="mr-2" onClick={() => handleEdit(serv)} title="Editar">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={serv.estado ? "outline" : "secondary"}
                    className="mr-2"
                    onClick={() => toggleEstado(serv)}
                    title={serv.estado ? "Desactivar" : "Activar"}
                  >
                    {serv.estado ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => { setDeleteId(serv.id); setDeleteDialogOpen(true); }} title="Eliminar">
                    <Trash className="w-4 h-4" />
                  </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogo de confirmación de borrado (fuera del mapeo de filas) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar tipo de servicio?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar este tipo de servicio? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
