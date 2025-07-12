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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import type { Proveedor } from "@/interfaces/proveedores.interface"
import { addDocument, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
import { CheckCircle, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react"
import { showToast } from "nextjs-toast-notify"
import React, { useEffect, useState } from "react"

export default function Providers() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // Estado para búsqueda
  const [searchField, setSearchField] = useState<'rif' | 'nombre'>('rif')
  const [searchValue, setSearchValue] = useState("")

  // Campos del formulario
  const [rif, setRif] = useState("")
  const [nombre, setNombre] = useState("")
  const [contacto, setContacto] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [direccion, setDireccion] = useState("")
  const [activo, setActivo] = useState(true)

  const fetchProveedores = async () => {
    setLoading(true)
    const data = await getCollection("proveedores")
    setProveedores(data as Proveedor[])
    setLoading(false)
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombreTrim = nombre.trim()
    const rifTrim = rif.trim()
    if (!nombreTrim || !rifTrim) {
      showToast.error("El nombre y el RIF son obligatorios.", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
      return
    }
    const proveedorData = {
      rif: rifTrim,
      nombre: nombreTrim,
      contacto: contacto.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      activo,
      fecha_registro: new Date().toISOString(),
    }
    if (editId) {
      await updateDocument(`proveedores/${editId}`, proveedorData)
      showToast.success("¡El proveedor fue actualizado con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
    } else {
      await addDocument("proveedores", proveedorData)
      showToast.success("¡El proveedor fue registrado con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
    }
    setRif("")
    setNombre("")
    setContacto("")
    setTelefono("")
    setEmail("")
    setDireccion("")
    setActivo(true)
    setEditId(null)
    setOpen(false)
    fetchProveedores()
  }

  const handleEdit = (prov: Proveedor) => {
    setRif(prov.rif)
    setNombre(prov.nombre)
    setContacto(prov.contacto)
    setTelefono(prov.telefono)
    setEmail(prov.email)
    setDireccion(prov.direccion)
    setActivo(prov.activo)
    setEditId(prov.id)
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDocument(`proveedores/${deleteId}`)
      setDeleteDialogOpen(false)
      setDeleteId(null)
      showToast.success("¡El proveedor fue eliminado con éxito!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "bounceIn",
        icon: '',
        sound: true,
      })
      fetchProveedores()
    }
  }

  // Filtrado de proveedores según búsqueda
  const proveedoresFiltrados = proveedores.filter(prov => {
    if (!searchValue.trim()) return true;
    const val = searchValue.trim().toLowerCase();
    if (searchField === 'rif') {
      return prov.rif?.toLowerCase().includes(val);
    } else {
      return prov.nombre?.toLowerCase().includes(val);
    }
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Proveedores</h2>
        {/* Buscador y select con shadcn */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Select value={searchField} onValueChange={val => setSearchField(val as 'rif' | 'nombre')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Buscar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rif">Buscar por RIF</SelectItem>
              <SelectItem value="nombre">Buscar por Nombre</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-full sm:w-56"
            placeholder={`Buscar por ${searchField === 'rif' ? 'RIF' : 'Nombre'}...`}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="yellow" onClick={() => { setEditId(null); setRif(""); setNombre(""); setContacto(""); setTelefono(""); setEmail(""); setDireccion(""); setActivo(true) }}>
              <Plus className="w-4 h-4 mr-2" /> Registrar proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar proveedor" : "Registrar proveedor"}</DialogTitle>
              <DialogDescription>
                {editId ? "Edita los datos del proveedor." : "Agrega un nuevo proveedor al sistema."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="rif">RIF</Label>
                <Input id="rif" placeholder="RIF" value={rif} onChange={e => setRif(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="contacto">Contacto</Label>
                <Input id="contacto" placeholder="Contacto" value={contacto} onChange={e => setContacto(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input type="number" min={0} id="telefono" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Activo</span>
                <Switch id="activo" checked={activo} onCheckedChange={setActivo} />
              </div>
              <DialogFooter>
                <Button variant="yellow" type="submit">{editId ? "Guardar cambios" : "Registrar"}</Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Diálogo de confirmación de borrado */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro de eliminar este proveedor?</DialogTitle>
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
      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-bold">RIF</TableCell>
              <TableCell className="font-bold">Nombre</TableCell>
              <TableCell className="font-bold">Contacto</TableCell>
              {/* <TableCell className="font-bold">Teléfono</TableCell> */}
              {/* <TableCell className="font-bold">Email</TableCell> */}
              <TableCell className="font-bold">Dirección</TableCell>
              <TableCell className="font-bold">Activo</TableCell>
              <TableCell className="font-bold">Opciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Cargando...</TableCell>
              </TableRow>
            ) : proveedoresFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No hay proveedores encontrados.</TableCell>
              </TableRow>
            ) : (
              proveedoresFiltrados.map(prov => (
                <TableRow key={prov.id}>
                  <TableCell>{prov.rif}</TableCell>
                  <TableCell>{prov.nombre}</TableCell>
                  <TableCell>{prov.contacto}</TableCell>
                  {/* <TableCell>{prov.telefono}</TableCell> */}
                  {/* <TableCell>{prov.email}</TableCell> */}
                  <TableCell>{prov.direccion}</TableCell>
                  <TableCell>{prov.activo ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    {/* Botón para ver datos */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="outline" className="mr-2" title="Ver datos">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Datos del proveedor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <div><b>RIF:</b> {prov.rif}</div>
                          <div><b>Nombre:</b> {prov.nombre}</div>
                          <div><b>Contacto:</b> {prov.contacto}</div>
                          <div><b>Teléfono:</b> {prov.telefono}</div>
                          <div><b>Email:</b> {prov.email}</div>
                          <div><b>Dirección:</b> {prov.direccion}</div>
                          <div><b>Activo:</b> {prov.activo ? "Sí" : "No"}</div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Botón para activar/desactivar */}
                    <Button size="icon" variant={prov.activo ? "secondary" : "default"} className="mr-2" title={prov.activo ? "Desactivar" : "Activar"} onClick={async () => {
                      await updateDocument(`proveedores/${prov.id}`, { ...prov, activo: !prov.activo });
                      fetchProveedores();
                      showToast.success(`Proveedor ${prov.activo ? 'desactivado' : 'activado'} correctamente.`, {
                        duration: 3000,
                        progress: true,
                        position: "top-center",
                        transition: "bounceIn",
                        icon: '',
                        sound: true,
                      });
                    }}>
                      {prov.activo ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    {/* Botón editar */}
                    <Button size="icon" variant="yellow" className="mr-2" onClick={() => handleEdit(prov)} title="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {/* Botón eliminar */}
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(prov.id)} title="Eliminar">
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
