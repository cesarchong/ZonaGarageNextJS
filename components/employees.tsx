"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trabajadores } from "@/interfaces/trabajadores.interface"
import { addDocument, createUser, deleteDocument, getCollection, updateDocument } from "@/lib/firebase"
import { showToast } from "nextjs-toast-notify"
import { useEffect, useState } from "react"
  // Estado para el dialog de ver detalles
  
  
  
  export default function Employees() {
  const [viewDialog, setViewDialog] = useState<{ open: boolean, trabajador: Trabajadores | null }>({ open: false, trabajador: null })
  



  const [trabajadores, setTrabajadores] = useState<Trabajadores[]>([])
  
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  // Campos del formulario
  const [cedula, setCedula] = useState("")
  const [nombre, setNombre] = useState("")
  const [cargo] = useState("TRABAJADOR")
  const [horarioInicio, setHorarioInicio] = useState("")
  const [horarioSalida, setHorarioSalida] = useState("")
  const [estado, setEstado] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // Campos para registro de horario diario
  const [horarioDia, setHorarioDia] = useState<{ fecha: string, entrada: string, salida: string }[]>([])

  // Búsqueda y filtro
  const [searchTerm, setSearchTerm] = useState("")
  // const [filterCargo, setFilterCargo] = useState("")

  // Cargos de ejemplo
  // const cargos = ["Administrador", "Mecánico", "Recepcionista", "Otro"]

  // Obtener trabajadores de Firebase
  const fetchTrabajadores = async () => {
    setLoading(true)
    const data = await getCollection("trabajadores")
    setTrabajadores(data as Trabajadores[])
    setLoading(false)
  }

  useEffect(() => {
    fetchTrabajadores()
  }, [])

  // Filtrado
  const trabajadoresFiltrados = trabajadores.filter(t => {
    const matchNombre = t.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchNombre
  })

  // Limpiar formulario
  const resetForm = () => {
    setCedula("")
    setNombre("")
    setHorarioInicio("")
    setHorarioSalida("")
    setEstado(true)
    setEmail("")
    setPassword("")
    setHorarioDia([])
    setEditId(null)
  }

  // Guardar trabajador
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Validación de horarios y duplicados
    if (!nombre.trim() || !cedula.trim() || !email.trim() || !password.trim()) {
      setLoading(false)
      return
    }
    // Validar duplicados (cedula y email)
    const cedulaExistente = trabajadores.some(t => t.cedula === cedula.trim() && t.id !== editId)
    if (cedulaExistente) {
      showToast.error("Ya existe un trabajador con esa cédula.")
      setLoading(false)
      return
    }
    const emailExistente = trabajadores.some(t => t.email === email.trim() && t.id !== editId)
    if (emailExistente) {
      showToast.error("Ya existe un trabajador con ese correo electrónico.")
      setLoading(false)
      return
    }
    if (!horarioInicio || !horarioSalida) {
      showToast.error("Debes ingresar horario de entrada y salida.")
      setLoading(false)
      return
    }
    if (horarioInicio >= horarioSalida) {
      showToast.error("La hora de entrada debe ser menor que la de salida.")
      setLoading(false)
      return
    }
    const trabajador: Omit<Trabajadores, "id" | "created_at"> & { horarioDia: any[] } = {
      cedula: cedula.trim(),
      nombre: nombre.trim(),
      cargo: "TRABAJADOR",
      horario_inicio: horarioInicio,
      horario_salida: horarioSalida,
      estado,
      rol: "TRABAJADOR",
      email: email.trim(),
      password: password.trim(),
      check_in: false,
      check_out: false,
      horarioDia,
    }
    try {
      if (editId) {
        await updateDocument(`trabajadores/${editId}`, trabajador)
        showToast.success("Trabajador actualizado correctamente.")
      } else {
        // Crear usuario en Firebase Auth
        try {
          await createUser({ email: trabajador.email, password: trabajador.password })
        } catch (authError: any) {
          if (authError.code === "auth/email-already-in-use") {
            showToast.error("El correo ya está registrado en autenticación.")
            setLoading(false)
            return
          } else {
            showToast.error("Error al crear usuario en autenticación.")
            setLoading(false)
            return
          }
        }
        await addDocument("trabajadores", trabajador)
        showToast.success("Trabajador agregado correctamente.")
      }
      resetForm()
      setOpenDialog(false)
      await fetchTrabajadores()
    } catch (error) {
      showToast.error("Ocurrió un error al guardar el trabajador.")
    } finally {
      setLoading(false)
    }
  }

  // Editar trabajador
  const handleEdit = (trab: Trabajadores) => {
    setCedula(trab.cedula)
    setNombre(trab.nombre)
    setHorarioInicio(trab.horario_inicio)
    setHorarioSalida(trab.horario_salida)
    setEstado(trab.estado)
    setEmail(trab.email)
    setPassword(trab.password)
    setHorarioDia((trab as any).horarioDia || [])
    setEditId(trab.id)
    setOpenDialog(true)
  }

  // Estado para el dialog de confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, trabajador: Trabajadores | null }>({ open: false, trabajador: null })

  // Eliminar trabajador (con confirmación y toast)
  const handleDelete = async (trab: Trabajadores) => {
    setDeleteDialog({ open: true, trabajador: trab })
  }

  const confirmDelete = async () => {
    if (deleteDialog.trabajador) {
      await deleteDocument(`trabajadores/${deleteDialog.trabajador.id}`)
      await fetchTrabajadores()
      showToast.success(`Trabajador eliminado correctamente.`)
    }
    setDeleteDialog({ open: false, trabajador: null })
  }

  // Check-in/out automático
  const getToday = () => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  // Determina el estado de asistencia del trabajador hoy
  const getAttendanceStatus = (trab: Trabajadores) => {
    const today = getToday()
    const dia = Array.isArray(trab.horarioDia) ? trab.horarioDia.find((h: any) => h.fecha === today) : undefined
    if (!dia) return 'absent'
    if (dia.entrada && !dia.salida) return 'working'
    if (dia.entrada && dia.salida) return 'completed'
    return 'absent'
  }

  // Marcar entrada (con confirmación y toast)
  const handleCheckIn = async (trab: Trabajadores) => {
    const today = getToday();
    const now = getCurrentTime();
    let horarioDia = Array.isArray(trab.horarioDia) ? [...trab.horarioDia] : [];
    if (horarioDia.some((h: any) => h.fecha === today && h.entrada)) {
      showToast.error(`El trabajador ya tiene un check-in hoy.`);
      return;
    }
    const idx = horarioDia.findIndex((h: any) => h.fecha === today);
    if (idx >= 0) {
      horarioDia[idx] = { ...horarioDia[idx], entrada: now };
    } else {
      horarioDia.push({ fecha: today, entrada: now, salida: '' });
    }
    await updateDocument(`trabajadores/${trab.id}`, { ...trab, horarioDia, check_in: true, check_out: false });
    showToast.success(`Entrada registrada para ${trab.nombre} a las ${now}.`);
    fetchTrabajadores();
  }

  // Marcar salida (con confirmación y toast)
  const handleCheckOut = async (trab: Trabajadores) => {
    const today = getToday();
    const now = getCurrentTime();
    let horarioDia = Array.isArray(trab.horarioDia) ? [...trab.horarioDia] : [];
    const idx = horarioDia.findIndex((h: any) => h.fecha === today);
    if (idx >= 0 && horarioDia[idx].entrada && !horarioDia[idx].salida) {
      horarioDia[idx] = { ...horarioDia[idx], salida: now };
      await updateDocument(`trabajadores/${trab.id}`, { ...trab, horarioDia, check_in: false, check_out: true });
      showToast.success(`Salida registrada para ${trab.nombre} a las ${now}.`);
      fetchTrabajadores();
    } else {
      showToast.error(`Primero debe registrar la entrada.`);
    }
  }

  // Estado para el dialog de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'in' | 'out' | null, trabajador: Trabajadores | null }>({ open: false, type: null, trabajador: null })

  // --- Manejo de clase dialog-open en el body para ocultar la barra flotante ---
  useEffect(() => {
    if (openDialog || viewDialog.open || deleteDialog.open || confirmDialog.open) {
      document.body.classList.add("dialog-open");
    } else {
      document.body.classList.remove("dialog-open");
    }
    // Limpieza por si el componente se desmonta con un dialog abierto
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, [openDialog, viewDialog.open, deleteDialog.open, confirmDialog.open]);

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-0">
      {/* Gestión de Trabajadores */}
      <Card className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-bold">Gestión de Trabajadores</h2>
          <Button onClick={() => setOpenDialog(true)} variant="yellow" className="w-full sm:w-auto">
            <i className="fas fa-plus mr-2"></i>Nuevo Trabajador
          </Button>
        </div>
        {/* Búsqueda y filtro */}
        <div className="mb-4">
          <div className="form-group flex flex-col gap-1 w-full max-w-xs">
            <label htmlFor="searchTerm">Buscar Trabajador</label>
            <Input
              type="text"
              id="searchTerm"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Tabla de empleados con shadcn/ui Table */}
        <div className="mt-6">
          <h3 className="text-base sm:text-lg font-bold mb-3">Lista de Trabajadores ({trabajadoresFiltrados.length})</h3>
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <Table className="min-w-[600px] text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Check-in/out</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trabajadoresFiltrados.length > 0 ? (
                  trabajadoresFiltrados.map((trab) => {
                    const attendance = getAttendanceStatus(trab)
                    return (
                      <TableRow key={trab.id}>
                        <TableCell className="font-medium max-w-[120px] truncate">{trab.nombre}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs whitespace-nowrap">
                            {trab.cargo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-clock text-gray-400"></i>
                            <span className="whitespace-nowrap">{trab.horario_inicio} - {trab.horario_salida}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${trab.estado ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                            {trab.estado ? "Activo" : "Inactivo"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 min-w-[110px]">
                            {attendance === 'absent' && (
                              <AlertDialog open={confirmDialog.open && confirmDialog.trabajador?.id === trab.id && confirmDialog.type === 'in'} onOpenChange={open => setConfirmDialog(open ? { open: true, type: 'in', trabajador: trab } : { open: false, type: null, trabajador: null })}>
                                <AlertDialogTrigger asChild>
                                  <Button onClick={() => setConfirmDialog({ open: true, type: 'in', trabajador: trab })} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                    <i className="fas fa-sign-in-alt mr-1"></i>Check-in
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar Check-in?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Deseas registrar la entrada de <b>{trab.nombre}</b> ahora?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => { await handleCheckIn(trab); setConfirmDialog({ open: false, type: null, trabajador: null }) }}>Confirmar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {attendance === 'working' && (
                              <AlertDialog open={confirmDialog.open && confirmDialog.trabajador?.id === trab.id && confirmDialog.type === 'out'} onOpenChange={open => setConfirmDialog(open ? { open: true, type: 'out', trabajador: trab } : { open: false, type: null, trabajador: null })}>
                                <AlertDialogTrigger asChild>
                                  <Button onClick={() => setConfirmDialog({ open: true, type: 'out', trabajador: trab })} variant="destructive" size="sm">
                                    <i className="fas fa-sign-out-alt mr-1"></i>Check-out
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar Check-out?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Deseas registrar la salida de <b>{trab.nombre}</b> ahora?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => { await handleCheckOut(trab); setConfirmDialog({ open: false, type: null, trabajador: null }) }}>Confirmar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {attendance === 'completed' && (
                              <span className="text-green-600 text-xs font-medium">
                                <i className="fas fa-check mr-1"></i>Completo
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-1 w-full">
                            <Button onClick={() => setViewDialog({ open: true, trabajador: trab })} variant="outline" size="sm" className="w-full sm:w-auto">
                              <i className="fas fa-eye mr-1"></i>Ver
                            </Button>
                            <Button onClick={() => handleEdit(trab)} variant="yellow" size="sm" className="w-full sm:w-auto">
                              <i className="fas fa-edit mr-1"></i>Editar
                            </Button>
                            <Button onClick={() => handleDelete(trab)} variant="destructive" size="sm" className="w-full sm:w-auto">
                              <i className="fas fa-trash mr-1"></i>Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center text-gray-500">
                      No hay empleados que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      {/* Dialogo para ver detalles del trabajador */}
      <Dialog open={viewDialog.open} onOpenChange={open => setViewDialog(open ? viewDialog : { open: false, trabajador: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datos del Trabajador</DialogTitle>
            <DialogDescription>
              Visualiza la información completa del trabajador seleccionado.
            </DialogDescription>
          </DialogHeader>
          {viewDialog.trabajador && (
            <div className="space-y-2">
              <div><b>Nombre:</b> {viewDialog.trabajador.nombre}</div>
              <div><b>Cédula:</b> {viewDialog.trabajador.cedula}</div>
              <div><b>Email:</b> {viewDialog.trabajador.email}</div>
              <div><b>Cargo:</b> {viewDialog.trabajador.cargo}</div>
              <div><b>Estado:</b> {viewDialog.trabajador.estado ? 'Activo' : 'Inactivo'}</div>
              <div><b>Horario:</b> {viewDialog.trabajador.horario_inicio} - {viewDialog.trabajador.horario_salida}</div>
              <div><b>Rol:</b> {viewDialog.trabajador.rol}</div>
              {/* Puedes agregar más campos si lo deseas */}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Card>

      {/* Diálogo para agregar/editar trabajador */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-full w-[98vw] sm:w-[500px] p-1 sm:p-6 max-h-[80dvh] sm:max-h-[90vh] overflow-y-auto mt-2 sm:mt-0">
          <DialogHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 pb-1 sm:pt-0 sm:pb-0">
            <DialogTitle className="text-base sm:text-lg">{editId ? "Editar Trabajador" : "Nuevo Trabajador"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Complete los campos para {editId ? "editar" : "agregar un nuevo"} trabajador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="cedula" className="text-sm font-medium">Cédula</label>
                <Input
                  id="cedula"
                  type="number"
                  min={0}
                  placeholder="Cédula"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="nombre" className="text-sm font-medium">Nombre Completo</label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Nombre Completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="horarioInicio" className="text-sm font-medium">Hora de Entrada</label>
                <Input
                  id="horarioInicio"
                  type="time"
                  placeholder="Hora de Entrada"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="horarioSalida" className="text-sm font-medium">Hora de Salida</label>
                <Input
                  id="horarioSalida"
                  type="time"
                  placeholder="Hora de Salida"
                  value={horarioSalida}
                  onChange={(e) => setHorarioSalida(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="estado" className="text-sm font-medium">Estado</label>
                <Select value={estado ? "activo" : "inactivo"} onValueChange={v => setEstado(v === "activo")}> 
                  <SelectTrigger id="estado" className="w-full text-xs sm:text-sm py-2 sm:py-2.5">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
                />
              </div>
            </div>
            {/* Horario diario (visualización solo) */}
            <div>
              <span className="font-semibold">Horarios diarios</span>
              <div className="text-xs text-gray-500">El registro de horarios diarios se realiza automáticamente con Check-in/out.</div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" variant="yellow" disabled={loading} className="w-full sm:w-auto">
                <i className="fas fa-save mr-2"></i>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  editId ? "Actualizar" : "Guardar"
                )}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visualización de horarios diarios */}
      <Card className="p-2 sm:p-4">
        <CardHeader className="px-0">
          <CardTitle className="text-base sm:text-lg">Horarios de Trabajo (por día)</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="relative overflow-x-auto">
            <div className="min-w-full bg-gray-50 p-2 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row border-b border-gray-200 pb-2 mb-2 gap-2 sm:gap-0">
                <div className="w-full sm:w-1/4 font-semibold">Trabajador</div>
                <div className="w-full sm:w-3/4 font-semibold">Horarios diarios</div>
              </div>
              {trabajadoresFiltrados.map((trab) => (
                <div key={trab.id} className="flex flex-col sm:flex-row items-start sm:items-center h-auto mb-2 gap-2 sm:gap-0">
                  <div className="w-full sm:w-1/4 truncate pr-2">{trab.nombre}</div>
                  <div className="w-full sm:w-3/4 relative">
                    {Array.isArray(trab.horarioDia) && trab.horarioDia.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {trab.horarioDia.map((h, idx) => {
                          const hasValidTimes = h.entrada && h.salida && h.entrada.includes(":") && h.salida.includes(":")
                          // Formatear fecha a dd/mm/yyyy
                          let fechaFormateada = h.fecha
                          if (h.fecha && h.fecha.includes("-")) {
                            const [yyyy, mm, dd] = h.fecha.split("-")
                            fechaFormateada = `${dd}/${mm}/${yyyy}`
                          }
                          if (!hasValidTimes) {
                            return (
                              <div key={idx} className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <div className="bg-gray-300 rounded px-2 py-1 text-xs text-black w-full">{fechaFormateada}: Horario no definido</div>
                              </div>
                            )
                          }
                          // Timeline visual
                          return (
                            <div key={idx} className="flex items-center gap-2 mb-1">
                              {/* Línea vertical */}
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 border-2 border-yellow-700"></div>
                                {Array.isArray(trab.horarioDia) && idx !== trab.horarioDia.length - 1 && (
                                  <div className="w-px h-8 bg-yellow-300"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 bg-yellow-100 rounded-lg px-3 py-2 shadow-sm border border-yellow-200">
                                  <span className="font-semibold text-yellow-800 text-xs flex items-center gap-1">
                                    <i className="fas fa-calendar-alt text-yellow-600"></i> {fechaFormateada}
                                  </span>
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <i className="fas fa-sign-in-alt text-green-600"></i> Entrada: <span className="font-bold">{h.entrada}</span>
                                  </span>
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <i className="fas fa-sign-out-alt text-red-600"></i> Salida: <span className="font-bold">{h.salida}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-200 rounded-md px-2 py-1 text-xs text-gray-600">Sin horarios diarios registrados</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Diálogo de confirmación para eliminar trabajador */}
      <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(open ? deleteDialog : { open: false, trabajador: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <b>{deleteDialog.trabajador?.nombre}</b>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, trabajador: null })}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}