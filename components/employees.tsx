"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type React from "react"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

interface Employee {
  id: string
  nombre: string
  cargo: string
  horario_inicio: string
  horario_salida: string
  estado: string
  assignedServices?: string[]
  createdAt: string
}

export default function Employees() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPosition, setFilterPosition] = useState("")

  // Form state
  const [nombre, setNombre] = useState("")
  const [cargo, setCargo] = useState("")
  const [horarioInicio, setHorarioInicio] = useState("08:00")
  const [horarioSalida, setHorarioSalida] = useState("17:00")
  const [estado, setEstado] = useState("activo")
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([])

  
  // Positions list
  const positions = ["Lavador", "Detallador", "Cajero", "Supervisor", "Gerente", "Administrativo", "Otro"]

  useEffect(() => {
    refreshEmployees()
  }, [])

  const refreshEmployees = async () => {
    try {
      const { data: employeesData, error: employeesError } = await supabase.from("empleados").select("*")
      const { data: servicesData, error: servicesError } = await supabase.from("servicios").select("*")
      if (employeesError) throw employeesError
      if (servicesError) throw servicesError

      // Adaptar los datos a la interfaz Employee
      const validatedEmployees = employeesData?.map((emp: any) => ({
        id: emp.id,
        nombre: emp.nombre,
        cargo: emp.cargo,
        horario_inicio: emp.horario_inicio || "08:00",
        horario_salida: emp.horario_salida || "17:00",
        estado: emp.estado || "activo",
        assignedServices: emp.assignedServices || [],
        createdAt: emp.created_at || "",
      })) || []

      // Get today's services
      const today = new Date().toDateString()
      const todayServices = (servicesData || []).filter((service: any) => {
        const serviceDate = new Date(service.createdAt).toDateString()
        return serviceDate === today
      })

      setEmployees(validatedEmployees)
      setServices(todayServices)

      // Si tienes una tabla de asistencia, aquí deberías cargarla desde supabase
      // setAttendanceRecords(...)
    } catch (error) {
      console.error("Error refreshing employees:", error)
      setEmployees([])
      setServices([])
    }
  }

  const toggleForm = () => {
    setShowForm(!showForm)
    if (!showForm) {
      resetForm()
    }
  }

  const resetForm = () => {
    setCurrentEmployee(null)
    setNombre("")
    setCargo("")
    setHorarioInicio("08:00")
    setHorarioSalida("17:00")
    setEstado("activo")
    setAssignedServiceIds([])
  }

  const validateForm = (): boolean => {
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del trabajador es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!cargo) {
      toast({
        title: "Error",
        description: "El cargo es obligatorio",
        variant: "destructive",
      })
      return false
    }
    if (!horarioInicio) {
      toast({
        title: "Error",
        description: "La hora de llegada es obligatoria",
        variant: "destructive",
      })
      return false
    }
    if (!horarioSalida) {
      toast({
        title: "Error",
        description: "La hora de salida es obligatoria",
        variant: "destructive",
      })
      return false
    }
    if (horarioInicio >= horarioSalida) {
      toast({
        title: "Error",
        description: "La hora de salida debe ser posterior a la hora de llegada",
        variant: "destructive",
      })
      return false
    }
    return true
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validateForm()) return
  try {
    if (currentEmployee) {
      // Update solo con los campos válidos
      const { error } = await supabase.from("empleados").update({
        nombre: nombre.trim(),
        cargo,
        horario_inicio: horarioInicio,
        horario_salida: horarioSalida,
        estado,
      }).eq("id", currentEmployee.id)
      if (error) throw error
      toast({
        title: "Actualizado",
        description: "Trabajador actualizado exitosamente",
        variant: "success",
      })
    } else {
      // Insert solo con los campos válidos
      const { error } = await supabase.from("empleados").insert({
        nombre: nombre.trim(),
        cargo,
        horario_inicio: horarioInicio,
        horario_salida: horarioSalida,
        estado,
      })
      if (error) throw error
      toast({
        title: "Agregado",
        description: "Trabajador agregado exitosamente",
        variant: "success",
      })
    }
    toggleForm()
    refreshEmployees()
} catch (error: any) {
  // Si error es un objeto vacío, intenta mostrar el error de Supabase
  if (error && error.message) {
    console.error("Error Supabase:", error.message)
  } else {
    console.error("Error Supabase:", error)
  }
  toast({
    title: "Error",
    description: error?.message || "No se pudo guardar el trabajador",
    variant: "destructive",
  })
}
}

  const editEmployee = (employee: Employee) => {
    setCurrentEmployee(employee)
    setNombre(employee.nombre)
    setCargo(employee.cargo)
    setHorarioInicio(employee.horario_inicio)
    setHorarioSalida(employee.horario_salida)
    setEstado(employee.estado)
    setAssignedServiceIds(employee.assignedServices || [])
    setShowForm(true)
  }

  // Si tienes una tabla de asistencia en supabase, aquí deberías guardar el registro
  const handleCheckIn = async (employee: Employee) => {
    toast({
      title: "Check-in registrado",
      description: `${employee.nombre} ha marcado entrada`,
      variant: "success",
    })
  }

  const handleCheckOut = async (employee: Employee) => {
    toast({
      title: "Check-out registrado",
      description: `${employee.nombre} ha marcado salida`,
      variant: "success",
    })
  }

  // Dummy para la UI, deberías adaptar esto si usas asistencia en supabase
  const getEmployeeAttendanceStatus = (employeeId: string) => {
    return { status: "absent", checkIn: null, checkOut: null }
  }

  // Filter employees based on search and position
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = filterPosition === "" || employee.cargo === filterPosition
    return matchesSearch && matchesPosition
  })

  // Get assigned services for an employee
  const getAssignedServices = (employeeId: string) => {
    return services.filter((service: any) => service.employeeId === employeeId)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Total Trabajadores</h3>
            <p className="text-3xl font-bold text-yellow-600">{employees.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Presentes Hoy</h3>
            <p className="text-3xl font-bold text-green-600">
              {
                employees.filter((emp) => {
                  const status = getEmployeeAttendanceStatus(emp.id)
                  return status.status === "working" || status.status === "completed"
                }).length
              }
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Trabajando Ahora</h3>
            <p className="text-3xl font-bold text-blue-600">
              {employees.filter((emp) => getEmployeeAttendanceStatus(emp.id).status === "working").length}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Servicios Asignados</h3>
            <p className="text-3xl font-bold text-purple-600">{services.length}</p>
          </div>
        </Card>
      </div>

      {/* Main Employees Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Gestión de Trabajadores</h2>
            {showForm && (
              <div className="flex items-center text-sm text-gray-600">
                <i className="fas fa-arrow-right mr-2"></i>
                <span>{currentEmployee ? "Editando trabajador" : "Nuevo trabajador"}</span>
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
                <i className="fas fa-plus mr-2"></i>Nuevo Trabajador
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label htmlFor="searchTerm">Buscar Trabajador</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="filterPosition">Filtrar por Cargo</label>
            <select id="filterPosition" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
              <option value="">Todos los cargos</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 form-container">
            <form onSubmit={handleSubmit}>
              <h3 className="form-section-header">{currentEmployee ? "Editar Trabajador" : "Nuevo Trabajador"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="employeeName">Nombre Completo*</label>
                  <input
                    type="text"
                    id="employeeName"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employeePosition">Cargo*</label>
                  <select id="employeePosition" value={cargo} onChange={(e) => setCargo(e.target.value)} required>
                    <option value="">Seleccione...</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="employeeStartTime">Hora de Llegada*</label>
                  <input
                    type="time"
                    id="employeeStartTime"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employeeEndTime">Hora de Salida*</label>
                  <input
                    type="time"
                    id="employeeEndTime"
                    value={horarioSalida}
                    onChange={(e) => setHorarioSalida(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="employeeEstado">Estado*</label>
                  <select id="employeeEstado" value={estado} onChange={(e) => setEstado(e.target.value)} required>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Services Assignment Section */}
              {services.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Servicios Asignados Hoy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map((service) => {
                      const isAssigned = assignedServiceIds.includes(service.id)
                      return (
                        <div key={service.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`service-${service.id}`}
                            checked={isAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignedServiceIds([...assignedServiceIds, service.id])
                              } else {
                                setAssignedServiceIds(assignedServiceIds.filter((id) => id !== service.id))
                              }
                            }}
                          />
                          <label htmlFor={`service-${service.id}`} className="text-sm">
                            {service.typeName || "Servicio"} - {service.status}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="form-group flex justify-between mt-4">
                <div className="flex space-x-4">
                  <Button type="submit" variant="yellow">
                    <i className="fas fa-save mr-2"></i>
                    {currentEmployee ? "Actualizar" : "Guardar"}
                  </Button>
                  <Button type="button" onClick={toggleForm} variant="outline">
                    <i className="fas fa-arrow-left mr-2"></i>Volver a la Lista
                  </Button>
                </div>
                <Button type="button" onClick={toggleForm} variant="destructive">
                  <i className="fas fa-times mr-2"></i>Salir
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Employees Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Lista de Trabajadores ({filteredEmployees.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">Nombre</th>
                  <th className="py-2 px-4 border">Cargo</th>
                  <th className="py-2 px-4 border">Horario</th>
                  <th className="py-2 px-4 border">Estado</th>
                  <th className="py-2 px-4 border">Check-in/out</th>
                  <th className="py-2 px-4 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => {
                    const assignedServices = getAssignedServices(employee.id)
                    const attendanceStatus = getEmployeeAttendanceStatus(employee.id)

                    return (
                      <tr key={employee.id}>
                        <td className="py-2 px-4 border font-medium">{employee.nombre}</td>
                        <td className="py-2 px-4 border">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {employee.cargo}
                          </span>
                        </td>
                        <td className="py-2 px-4 border">
                          <div className="flex items-center">
                            <i className="fas fa-clock text-gray-400 mr-2"></i>
                            <span>
                              {employee.horario_inicio} - {employee.horario_salida}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 border">
                          <span className={`px-2 py-1 rounded-full text-xs ${employee.estado === "activo" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                            {employee.estado}
                          </span>
                        </td>
                        <td className="py-2 px-4 border">
                          <div className="flex flex-col gap-1">
                            {attendanceStatus.status === "absent" && (
                              <Button
                                onClick={() => handleCheckIn(employee)}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <i className="fas fa-sign-in-alt mr-1"></i>Check-in
                              </Button>
                            )}
                            {attendanceStatus.status === "working" && (
                              <Button onClick={() => handleCheckOut(employee)} variant="destructive" size="sm">
                                <i className="fas fa-sign-out-alt mr-1"></i>Check-out
                              </Button>
                            )}
                            {attendanceStatus.status === "completed" && (
                              <span className="text-green-600 text-xs font-medium">
                                <i className="fas fa-check mr-1"></i>Completo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4 border">
                          <div className="flex flex-wrap gap-1">
                            <Button onClick={() => editEmployee(employee)} variant="yellow" size="sm">
                              <i className="fas fa-edit mr-1"></i>Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No hay empleados que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Schedule Visualization */}
      <Card className="p-4">
        <CardHeader className="px-0">
          <CardTitle>Horarios de Trabajo</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="relative overflow-x-auto">
            <div className="min-w-full bg-gray-50 p-4 rounded-lg">
              <div className="flex border-b border-gray-200 pb-2 mb-2">
                <div className="w-1/4 font-semibold">Trabajador</div>
                <div className="w-3/4 flex">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 text-center text-xs">
                      {i + 8}:00
                    </div>
                  ))}
                </div>
              </div>

              {filteredEmployees.map((employee) => {
                // Verificar que horario_inicio y horario_salida existan y tengan el formato correcto
                const hasValidTimes =
                  employee.horario_inicio &&
                  employee.horario_salida &&
                  employee.horario_inicio.includes(":") &&
                  employee.horario_salida.includes(":")

                if (!hasValidTimes) {
                  // Mostrar una barra predeterminada si los tiempos no son válidos
                  return (
                    <div key={employee.id} className="flex items-center h-10 mb-2">
                      <div className="w-1/4 truncate pr-2">{employee.nombre}</div>
                      <div className="w-3/4 relative h-6">
                        <div
                          className="absolute h-full bg-gray-300 rounded-md flex items-center justify-center text-xs text-black"
                          style={{
                            left: "0%",
                            width: "100%",
                          }}
                        >
                          Horario no definido
                        </div>
                      </div>
                    </div>
                  )
                }

                // Si los tiempos son válidos, proceder con el cálculo normal
                const startHour = Number.parseInt(employee.horario_inicio.split(":")[0])
                const startMinute = Number.parseInt(employee.horario_inicio.split(":")[1])
                const endHour = Number.parseInt(employee.horario_salida.split(":")[0])
                const endMinute = Number.parseInt(employee.horario_salida.split(":")[1])

                // Calculate position and width for the schedule bar
                const startPosition = (startHour - 8 + startMinute / 60) * (100 / 12)
                const duration = endHour - startHour + (endMinute - startMinute) / 60
                const width = duration * (100 / 12)

                return (
                  <div key={employee.id} className="flex items-center h-10 mb-2">
                    <div className="w-1/4 truncate pr-2">{employee.nombre}</div>
                    <div className="w-3/4 relative h-6">
                      <div
                        className="absolute h-full bg-yellow-400 rounded-md flex items-center justify-center text-xs text-black"
                        style={{
                          left: `${startPosition}%`,
                          width: `${width}%`,
                        }}
                      >
                        {employee.horario_inicio} - {employee.horario_salida}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}