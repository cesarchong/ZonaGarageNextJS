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
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import type { Categorias } from "@/interfaces/categorias.interface"
import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { showToast } from "nextjs-toast-notify"
import React, { useEffect, useState } from "react"

export default function Categories() {
  const [categorias, setCategorias] = useState<Categorias[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  // Estado para el diálogo de confirmación de borrado
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // Estado para el buscador
  const [search, setSearch] = useState("")

  const fetchCategorias = async () => {
    setLoading(true)
    const data = await getCollection("categorias")
    setCategorias(data as Categorias[])
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombreTrim = nombre.trim()
    const descripcionTrim = descripcion.trim()
    if (!nombreTrim) {
      showToast.error("El nombre de la categoría no puede estar vacío ni tener solo espacios.", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
      return
    }
    if (editId) {
      await updateDocument(`categorias/${editId}`, { nombre: nombreTrim, descripcion: descripcionTrim })
      showToast.success("¡La categoría fue actualizada con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
    } else {
      await addDocument("categorias", { nombre: nombreTrim, descripcion: descripcionTrim })
      showToast.success("¡La categoría fue registrada con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
    }
    setNombre("")
    setDescripcion("")
    setEditId(null)
    setOpen(false)
    fetchCategorias()
  }

  const handleEdit = (cat: Categorias) => {
    setNombre(cat.nombre)
    setDescripcion(cat.descripcion || "")
    setEditId(cat.id)
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDocument(`categorias/${deleteId}`)
      setDeleteDialogOpen(false)
      setDeleteId(null)
      showToast.success("¡La categoría fue eliminada con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
      fetchCategorias()
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">Categorías</h2>
          <span className="text-sm text-gray-500 mt-1">Total: {categorias.length}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="yellow" onClick={() => { setEditId(null); setNombre(""); setDescripcion("") }}>
                <Plus className="w-4 h-4 mr-2" /> Registrar categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar categoría" : "Registrar categoría"}</DialogTitle>
                <DialogDescription>
                  {editId ? "Edita los datos de la categoría." : "Agrega una nueva categoría al sistema."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Nombre de la categoría"
                  value={nombre}
                  onChange={e => setNombre(e.target.value.replace(/^\s+|\s+$/g, ""))}
                  required
                />
                <Input
                  placeholder="Descripción (opcional)"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value.replace(/^\s+|\s+$/g, ""))}
                />
                <DialogFooter>
                  <Button variant="yellow" type="submit">{editId ? "Guardar cambios" : "Registrar"}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Diálogo de confirmación de borrado */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro de eliminar esta categoría?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-white rounded shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-bold">Nombre</TableCell>
              <TableCell className="font-bold">Descripción</TableCell>
              <TableCell className="font-bold">Opciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3}>Cargando...</TableCell>
              </TableRow>
            ) : categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No hay categorías registradas.</TableCell>
              </TableRow>
            ) : (
              categorias
                .filter(cat =>
                  cat.nombre.toLowerCase().includes(search.toLowerCase()) ||
                  (cat.descripcion && cat.descripcion.toLowerCase().includes(search.toLowerCase()))
                )
                .map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.nombre}</TableCell>
                    <TableCell>{cat.descripcion && cat.descripcion.trim() !== '' ? cat.descripcion : 'No asignada'}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="yellow" className="mr-2" onClick={() => handleEdit(cat)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(cat.id)} title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
