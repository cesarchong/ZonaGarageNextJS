
// --- COMPONENTES INTERNOS ---
// --- COMPONENTES INTERNOS ---
import { Checkbox } from "./ui/checkbox";

// Eliminar hooks de pago duplicados fuera de componentes. Todos los hooks deben estar dentro de componentes funcionales.

function SeleccionarTiposServicioSection({ vehiculo, onBack, onServiciosSeleccionados }: { vehiculo: any, onBack: () => void, onServiciosSeleccionados: (servicios: any[]) => void }) {
  const [tiposServicio, setTiposServicio] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    setLoading(true);
    import("../lib/firebase").then(({ getCollection }) => {
      getCollection("tipos_servicio").then((data: any[]) => {
        setTiposServicio(data);
        setLoading(false);
      });
    });
  }, []);

  const handleToggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleContinuar = () => {
    if (selected.length === 0) {
      showToast.error("Debes seleccionar al menos un tipo de servicio", { duration: 3000, position: "top-center" });
      return;
    }
    setShowConfirm(true);
  };

  // Solo permitir seleccionar servicios activos (estado === true)
  const serviciosActivos = tiposServicio.filter(s => s.estado === true);
  const serviciosSeleccionados = serviciosActivos.filter(s => selected.includes(s.id));

  // Filtrar tipos de servicio según búsqueda y solo activos
  const tiposServicioFiltrados = busqueda.trim().length === 0
    ? serviciosActivos
    : serviciosActivos.filter(s =>
        s.nombre?.toLowerCase().includes(busqueda.trim().toLowerCase())
      );

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">3. Seleccionar tipo(s) de servicio</h2>
          <Button variant="outline" onClick={onBack}>Regresar</Button>
        </div>
        <div className="mb-2 text-sm text-gray-600">Vehículo: <span className="font-bold">{vehiculo.placa}</span></div>
        <Separator className="mb-4" />
        {/* Buscador de tipos de servicio */}
        <div className="mb-4 flex items-center gap-2">
          <Input
            type="text"
            placeholder="Buscar tipo de servicio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full max-w-xs"
          />
        </div>
        {loading ? (
          <div className="text-gray-500">Cargando tipos de servicio...</div>
        ) : tiposServicio.length === 0 ? (
          <div className="text-gray-500">No hay tipos de servicio registrados.</div>
        ) : tiposServicioFiltrados.length === 0 ? (
          <div className="text-gray-500">No se encontraron tipos de servicio para la búsqueda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {tiposServicioFiltrados.map((tipo) => (
              <label key={tipo.id} className={`border rounded p-4 flex items-center gap-3 cursor-pointer ${selected.includes(tipo.id) ? 'bg-yellow-100 border-yellow-400' : 'hover:bg-yellow-50'}`}>
                <Checkbox checked={selected.includes(tipo.id)} onCheckedChange={() => handleToggle(tipo.id)} />
                <div>
                  <div className="font-bold text-yellow-700">{tipo.nombre}</div>
                  <div className="text-xs text-gray-500">{tipo.descripcion || 'Sin descripción'}</div>
                  <div className="text-xs text-gray-600 mt-1">Precio base: <span className="font-semibold">${tipo.precio_base}</span> | Duración: <span className="font-semibold">{tipo.duracion_estimada} min</span></div>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack}>Regresar</Button>
          <Button variant="yellow" onClick={handleContinuar} disabled={selected.length === 0}>Continuar</Button>
        </div>
      </Card>
      {/* Confirm Dialog */}
      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Confirmar servicios seleccionados?</DialogTitle>
              <DialogDescription>
                ¿Deseas continuar con los siguientes servicios?
              </DialogDescription>
              <div>
                <ul className="mt-2 list-disc pl-5">
                  {serviciosSeleccionados.map(s => (
                    <li key={s.id} className="font-semibold text-yellow-700">{s.nombre} <span className="text-xs text-gray-500">${s.precio_base}</span></li>
                  ))}
                </ul>
              </div>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button variant="yellow" onClick={() => { setShowConfirm(false); onServiciosSeleccionados(serviciosSeleccionados); }}>Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

import { Separator } from "@radix-ui/react-separator";
import { Plus, Trash } from "lucide-react";
import { showToast } from "nextjs-toast-notify";
import { useEffect, useState } from "react";
import { eliminarServicioCompleto, registrarPagoEnCaja } from "../lib/caja-utils";
import BuscarClienteSection from "./BuscarClienteSection";
import InternalInvoice from "./internal-invoice";
import InternalSheetClient from "./internal-sheet-client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
export default function Services() {
  // --- HOOKS PRINCIPALES ---
  const [facturaServicio, setFacturaServicio] = useState<any | null>(null);
  const [facturaPagos, setFacturaPagos] = useState<any[]>([]);
  const [facturaCliente, setFacturaCliente] = useState<any | null>(null);
  const [facturaVehiculo, setFacturaVehiculo] = useState<any | null>(null);
  const [facturaEmpleado, setFacturaEmpleado] = useState<any | null>(null);
  const [showFactura, setShowFactura] = useState(false);
  const [showHojaCliente, setShowHojaCliente] = useState(false);
  const [showNewService, setShowNewService] = useState(false);
 const [showProductSale, setShowProductSale] = useState(false);
  const [flujo, setFlujo] = useState<string | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [vehiculosCliente, setVehiculosCliente] = useState<any[]>([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Estados para eliminación de servicios
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState<any>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  
  const [showFormNuevoVehiculo, setShowFormNuevoVehiculo] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    placa: '', marca: '', modelo: '', anio: '', color: '', tipo: '', tipo_asiento: '',
  });
  const [errorVehiculo, setErrorVehiculo] = useState<string | null>(null);
  const [loadingGuardarVehiculo, setLoadingGuardarVehiculo] = useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<any[]>([]);
  const [showConfirmarServicio, setShowConfirmarServicio] = useState(false);

  // Manejar la clase 'dialog-open' en el body para ocultar la barra flotante móvil
  useEffect(() => {
    const anyDialogOpen = showFactura || showHojaCliente
    if (anyDialogOpen) {
      document.body.classList.add("dialog-open")
    } else {
      document.body.classList.remove("dialog-open")
    }
    return () => {
      document.body.classList.remove("dialog-open")
    }
  }, [showFactura, showHojaCliente])
  // Estado para flujo de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    cedula: '', nombre: '', telefono: '', email: '', direccion: '',
  });
  const [nuevoClienteActivo, setNuevoClienteActivo] = useState(true);
  const [nuevoClienteError, setNuevoClienteError] = useState<string | null>(null);
  const [nuevoClienteLoading, setNuevoClienteLoading] = useState(false);
  const [nuevoClienteVehiculo, setNuevoClienteVehiculo] = useState({
    placa: '', marca: '', modelo: '', anio: '', color: '', tipo: '', tipo_asiento: '',
  });
  const [nuevoClienteVehiculoError, setNuevoClienteVehiculoError] = useState<string | null>(null);
  // Manejar cambios en el formulario de nuevo cliente
  const handleNuevoClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({ ...prev, [name]: value }));
  };
  // Manejar cambios en el formulario de vehículo de nuevo cliente
  const handleNuevoClienteVehiculoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoClienteVehiculo(prev => ({ ...prev, [name]: value }));
  };
  // Guardar nuevo cliente y su vehículo
  const handleNuevoClienteSubmit = async () => {
    setNuevoClienteError(null);
    setNuevoClienteVehiculoError(null);
    setNuevoClienteLoading(true);
    try {
      // Validación básica
      if (!nuevoCliente.cedula || !nuevoCliente.nombre || !nuevoCliente.telefono) {
        setNuevoClienteError('Completa los campos obligatorios del cliente.');
        setNuevoClienteLoading(false);
        return;
      }
      if (!nuevoClienteVehiculo.placa || !nuevoClienteVehiculo.marca || !nuevoClienteVehiculo.modelo || !nuevoClienteVehiculo.tipo || !nuevoClienteVehiculo.tipo_asiento) {
        setNuevoClienteVehiculoError('Completa los campos obligatorios del vehículo.');
        setNuevoClienteLoading(false);
        return;
      }
      // Importar helpers de firebase
      const { db } = await import('../lib/firebase');
      const { addDoc, collection } = await import('firebase/firestore');
      const { getCollection } = await import('../lib/firebase');
      // Validar que no exista cliente con esa cédula
      const clientes = await getCollection('clientes');
      if (clientes.some((c: any) => String(c.cedula) === String(nuevoCliente.cedula))) {
        setNuevoClienteError('Ya existe un cliente registrado con esa cédula.');
        setNuevoClienteLoading(false);
        return;
      }
      // Validar que no exista vehículo con esa placa
      const vehiculos = await getCollection('vehiculos');
      if (vehiculos.some((v: any) => String(v.placa).toUpperCase() === String(nuevoClienteVehiculo.placa).toUpperCase())) {
        setNuevoClienteVehiculoError('Ya existe un vehículo registrado con esa placa.');
        setNuevoClienteLoading(false);
        return;
      }
      // Crear cliente
      const clienteData = {
        ...nuevoCliente,
        activo: true,
        fecha_registro: new Date().toISOString(),
      };
      const clienteRef = await addDoc(collection(db, 'clientes'), clienteData);
      const clienteId = clienteRef.id;
      // Crear vehículo asociado
      const vehiculoData = {
        ...nuevoClienteVehiculo,
        anio: nuevoClienteVehiculo.anio ? Number(nuevoClienteVehiculo.anio) : null,
        id_cliente: clienteId,
      };
      const vehiculoRef = await addDoc(collection(db, 'vehiculos'), vehiculoData);
      const vehiculoId = vehiculoRef.id;
      // Actualizar estados para pasar a sección 3
      setClienteSeleccionado({ ...clienteData, id: clienteId });
      setVehiculoSeleccionado({ ...vehiculoData, id: vehiculoId });
      setFlujo('existente');
      setShowNewService(true);
      setShowNuevoClienteSection(false);
      setShowConfirmarServicio(false);

      // Limpiar formularios
      setNuevoCliente({ cedula: '', nombre: '', telefono: '', email: '', direccion: '' });
      setNuevoClienteVehiculo({ placa: '', marca: '', modelo: '', anio: '', color: '', tipo: '', tipo_asiento: '' });

      showToast.success('Cliente y vehículo registrados correctamente', { duration: 3000, position: 'top-center' });
    } catch (e: any) {
      setNuevoClienteError('Error al guardar: ' + (e?.message || ''));
    } finally {
      setNuevoClienteLoading(false);
    }
  };

  // Estado para mostrar sección de nuevo cliente
  const [showNuevoClienteSection, setShowNuevoClienteSection] = useState(false);
  const [empleado, setEmpleado] = useState<any>(null);
  // Estado para lista de servicios ---
  const [servicios, setServicios] = useState<any[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState<any | null>(null); // Filtro por cliente

  // Función para resetear todo el estado y volver a la vista principal
  const resetearEstadoCompleto = () => {
    setShowNewService(false);
    setShowProductSale(false);
    setFlujo(null);
    setClienteSeleccionado(null);
    setVehiculoSeleccionado(null);
    setVehiculosCliente([]);
    setServiciosSeleccionados([]);
    setShowConfirmarServicio(false);
    setShowNuevoClienteSection(false);
    setShowFormNuevoVehiculo(false);
    setShowConfirmDialog(false);
    // Recargar servicios para mostrar los más recientes
    cargarServicios();
  };

  // Función para cargar servicios
  const cargarServicios = async () => {
    setLoadingServicios(true);
    try {
      const [serviciosData, clientesData, vehiculosData] = await Promise.all([
        import("../lib/firebase").then(async ({ db }) => {
          const { getDocs, collection } = await import("firebase/firestore");
          const snap = await getDocs(collection(db, "servicios"));
          return snap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
        }),
        import("../lib/firebase").then(({ getCollection }) => getCollection("clientes")),
        import("../lib/firebase").then(({ getCollection }) => getCollection("vehiculos")),
      ]);

      // Crear mapas de clientes y vehículos por id para acceso rápido
      const clientesMap = new Map();
      clientesData.forEach((c: any) => clientesMap.set(c.id, c));
      const vehiculosMap = new Map();
      vehiculosData.forEach((v: any) => vehiculosMap.set(v.id, v));

      // Agregar el nombre del cliente y datos del vehículo a cada servicio
      const serviciosConDatos = serviciosData.map((s: any) => {
        const vehiculo = vehiculosMap.get(s.vehiculo_id);
        return {
          ...s,
          cliente_nombre: clientesMap.get(s.cliente_id)?.nombre || s.cliente_id,
          vehiculo_placa: vehiculo?.placa || s.vehiculo_id,
          vehiculo_marca: vehiculo?.marca || '',
          vehiculo_modelo: vehiculo?.modelo || '',
        };
      });

      setServicios(serviciosConDatos.sort((a, b) => new Date(b.fecha_servicio).getTime() - new Date(a.fecha_servicio).getTime()));
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setLoadingServicios(false);
    }
  };
  // Estado para edición de observación
  const [editObsId, setEditObsId] = useState<string | null>(null);
  const [editObsValue, setEditObsValue] = useState("");
  const [editObsLoading, setEditObsLoading] = useState(false);

  // Obtener datos del empleado desde userData en localStorage
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) setEmpleado(JSON.parse(userDataStr));
    } catch {}
  }, []);

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (!showFormNuevoVehiculo) {
      setNuevoVehiculo({ placa: '', marca: '', modelo: '', anio: '', color: '', tipo: '', tipo_asiento: '' });
      setErrorVehiculo(null);
    }
  }, [showFormNuevoVehiculo]);

  // Manejar cambios en el formulario
  const handleNuevoVehiculoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoVehiculo((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar vehículo en Firebase
  const handleNuevoVehiculoSubmit = async () => {
    setErrorVehiculo(null);
    setLoadingGuardarVehiculo(true);
    if (!nuevoVehiculo.placa.trim()) { setErrorVehiculo('La placa es obligatoria'); setLoadingGuardarVehiculo(false); return; }
    if (!nuevoVehiculo.marca.trim()) { setErrorVehiculo('La marca es obligatoria'); setLoadingGuardarVehiculo(false); return; }
    if (!nuevoVehiculo.modelo.trim()) { setErrorVehiculo('El modelo es obligatorio'); setLoadingGuardarVehiculo(false); return; }
    if (!nuevoVehiculo.tipo.trim()) { setErrorVehiculo('El tipo es obligatorio'); setLoadingGuardarVehiculo(false); return; }
    if (!nuevoVehiculo.tipo_asiento.trim()) { setErrorVehiculo('El tipo de asiento es obligatorio'); setLoadingGuardarVehiculo(false); return; }
    const placaTrim = nuevoVehiculo.placa.trim().toUpperCase();
    if (vehiculosCliente.some(v => v.placa === placaTrim)) { setErrorVehiculo('Ya existe un vehículo con esa placa para este cliente'); setLoadingGuardarVehiculo(false); return; }
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "vehiculos"), {
        placa: placaTrim,
        marca: nuevoVehiculo.marca.trim(),
        modelo: nuevoVehiculo.modelo.trim(),
        anio: nuevoVehiculo.anio ? parseInt(nuevoVehiculo.anio) : 0,
        color: nuevoVehiculo.color.trim() || "",
        tipo: nuevoVehiculo.tipo,
        tipo_asiento: nuevoVehiculo.tipo_asiento,
        id_cliente: clienteSeleccionado.id,
        fecha_registro: new Date().toISOString(),
      });
      setShowFormNuevoVehiculo(false);
      showToast.success('Vehículo registrado correctamente', {
        duration: 3500, position: 'top-center', progress: true, transition: 'bottomToTopBounce', icon: '', sound: true,
      });
      // Recargar lista de vehículos
      const { getCollection } = await import("../lib/firebase");
      const vehiculos = await getCollection("vehiculos");
      setVehiculosCliente(vehiculos.filter((v: any) => v.id_cliente === clienteSeleccionado.id));
    } catch (error: any) {
      setErrorVehiculo(error?.message || "Error al guardar el vehículo");
    } finally {
      setLoadingGuardarVehiculo(false);
    }
  };

  // useEffect para cargar vehículos del cliente seleccionado
  useEffect(() => {
    if (showNewService && flujo === 'existente' && clienteSeleccionado) {
      const fetchVehiculos = async () => {
        setLoadingVehiculos(true);
        try {
          const { getCollection } = await import("../lib/firebase");
          const vehiculos = await getCollection("vehiculos");
          setVehiculosCliente(vehiculos.filter((v: any) => v.id_cliente === clienteSeleccionado.id));
        } catch (e) {
          setVehiculosCliente([]);
        } finally {
          setLoadingVehiculos(false);
        }
      };
      fetchVehiculos();
    } else {
      setVehiculosCliente([]);
    }
  }, [showNewService, flujo, clienteSeleccionado]);

  // Maneja la clase 'dialog-open' en el body para ocultar la barra flotante móvil
  useEffect(() => {
    const anyDialogOpen = showFormNuevoVehiculo || showConfirmDialog;
    if (anyDialogOpen) document.body.classList.add("dialog-open");
    else document.body.classList.remove("dialog-open");
    return () => { document.body.classList.remove("dialog-open"); };
  }, [showFormNuevoVehiculo, showConfirmDialog]);

  // Cargar servicios, clientes y vehículos al montar
  useEffect(() => {
    cargarServicios();
  }, []);

  // Función para abrir la factura
  const handleAbrirFactura = async (servicio: any) => {
    setFacturaServicio(servicio);
    setShowFactura(true);
    try {
      const [{ getCollection }] = await Promise.all([
        import("../lib/firebase")
      ]);
      const [clientes, vehiculos, empleados, pagos] = await Promise.all([
        getCollection("clientes"),
        getCollection("vehiculos"),
        getCollection("trabajadores"),
        getCollection("pagos", [
          (await import("firebase/firestore")).where("servicio_id", "==", servicio.id)
        ])
      ]);
      setFacturaCliente(clientes.find((c: any) => c.id === servicio.cliente_id) || null);
      setFacturaVehiculo(vehiculos.find((v: any) => v.id === servicio.vehiculo_id) || null);
      setFacturaEmpleado(empleados.find((e: any) => e.id === servicio.empleado_id) || null);
      setFacturaPagos(pagos);
    } catch (e) {
      setFacturaCliente(null);
      setFacturaVehiculo(null);
      setFacturaEmpleado(null);
      setFacturaPagos([]);
    }
  };

  // Función para abrir la hoja del cliente
  const handleAbrirHojaCliente = async (servicio: any) => {
    setFacturaServicio(servicio);
    setShowHojaCliente(true);
    try {
      const [{ getCollection }] = await Promise.all([
        import("../lib/firebase")
      ]);
      const [clientes, vehiculos, empleados, pagos] = await Promise.all([
        getCollection("clientes"),
        getCollection("vehiculos"),
        getCollection("trabajadores"),
        getCollection("pagos", [
          (await import("firebase/firestore")).where("servicio_id", "==", servicio.id)
        ])
      ]);
      setFacturaCliente(clientes.find((c: any) => c.id === servicio.cliente_id) || null);
      setFacturaVehiculo(vehiculos.find((v: any) => v.id === servicio.vehiculo_id) || null);
      setFacturaEmpleado(empleados.find((e: any) => e.id === servicio.empleado_id) || null);
      setFacturaPagos(pagos);
    } catch (e) {
      setFacturaCliente(null);
      setFacturaVehiculo(null);
      setFacturaEmpleado(null);
      setFacturaPagos([]);
    }
  };

  // Función para guardar la observación editada
  const handleGuardarObservacion = async (servicioId: string) => {
    setEditObsLoading(true);
    try {
      // Buscar el servicio por id o firestoreId
      const servicio = servicios.find(s => s.id === servicioId || s.firestoreId === servicioId);
      const firestoreId = servicio?.firestoreId;
      if (!firestoreId) {
        showToast.error("No se encontró el ID principal de Firestore para este servicio. No se puede editar.");
        setEditObsLoading(false);
        return;
      }
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      // Actualizar directamente el campo observaciones usando el ID principal
      const servicioRef = doc(db, "servicios", String(firestoreId));
      await updateDoc(servicioRef, { observaciones: editObsValue });
      setServicios(prev => prev.map(s => (s.firestoreId === firestoreId ? { ...s, observaciones: editObsValue } : s)));
      setEditObsId(null);
      setEditObsValue("");
      showToast.success("Observación actualizada correctamente");
    } catch (e: any) {
      showToast.error("Error al guardar la observación: " + (e?.message || ""));
    } finally {
      setEditObsLoading(false);
    }
  };

  // Función para confirmar eliminación de servicio
  const handleConfirmarEliminacion = (servicio: any) => {
    setServicioAEliminar(servicio);
    setShowDeleteDialog(true);
  };

  // Función para eliminar servicio completo
  const handleEliminarServicio = async () => {
    if (!servicioAEliminar) return;
    
    setLoadingDelete(true);
    try {
      // Usar el firestoreId (ID principal) para eliminar el servicio
      const firestoreId = servicioAEliminar.firestoreId;
      if (!firestoreId) {
        throw new Error("No se encontró el ID principal de Firestore para este servicio");
      }
      
      await eliminarServicioCompleto(firestoreId);
      
      // Actualizar la lista de servicios localmente usando el firestoreId
      setServicios(prev => prev.filter(s => s.firestoreId !== firestoreId));
      
      showToast.success("Servicio eliminado correctamente. Se han revertido todos los cambios en inventario y caja.");
      setShowDeleteDialog(false);
      setServicioAEliminar(null);
    } catch (error: any) {
      showToast.error("Error al eliminar el servicio: " + (error?.message || "Error desconocido"));
    } finally {
      setLoadingDelete(false);
    }
  };

  if (showProductSale) {
  return <ProductSaleSection onBack={() => setShowProductSale(false)} onComplete={resetearEstadoCompleto} />;
}

  // --- RENDER FLUJOS ---
  if (showNuevoClienteSection) {
    // Sección independiente: Nuevo Cliente y Vehículo
    return (
      <Card className="p-6">
        <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Registrar Nuevo Cliente y Vehículo</h2>
            <Button variant="outline" onClick={() => setShowNuevoClienteSection(false)}>Regresar</Button>
          </div>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleNuevoClienteSubmit(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Datos del Cliente</h3>
                <label className="text-sm font-medium mb-1 block">Cédula <span className="text-red-500">*</span></label>
                <Input type="number" min={1} name="cedula" value={nuevoCliente.cedula} onChange={handleNuevoClienteChange} maxLength={100} required placeholder="Cédula" pattern="[0-9]*" inputMode="numeric" />
                <label className="text-sm font-medium mb-1 block mt-2">Nombre <span className="text-red-500">*</span></label>
                <Input type="text" name="nombre" value={nuevoCliente.nombre} onChange={handleNuevoClienteChange} maxLength={100} required placeholder="Nombre completo" />
                <label className="text-sm font-medium mb-1 block mt-2">Teléfono <span className="text-red-500">*</span></label>
                <Input type="text" name="telefono" value={nuevoCliente.telefono} onChange={handleNuevoClienteChange} maxLength={25} required placeholder="Teléfono" />
                <label className="text-sm font-medium mb-1 block mt-2">Email</label>
                <Input type="email" name="email" value={nuevoCliente.email} onChange={handleNuevoClienteChange} maxLength={100} placeholder="Correo electrónico" />
                <label className="text-sm font-medium mb-1 block mt-2">Dirección</label>
                <Input type="text" name="direccion" value={nuevoCliente.direccion} onChange={handleNuevoClienteChange} maxLength={255} placeholder="Dirección" />
                {nuevoClienteError && <div className="text-red-600 text-sm mt-1 font-semibold flex items-center gap-1"><span className="i-lucide-alert-triangle" />{nuevoClienteError}</div>}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Datos del Vehículo</h3>
                <label className="text-sm font-medium mb-1 block">Placa <span className="text-red-500">*</span></label>
                <Input type="text" name="placa" value={nuevoClienteVehiculo.placa} onChange={handleNuevoClienteVehiculoChange} maxLength={10} required placeholder="Ej: ABC123" />
                <label className="text-sm font-medium mb-1 block mt-2">Marca <span className="text-red-500">*</span></label>
                <Input type="text" name="marca" value={nuevoClienteVehiculo.marca} onChange={handleNuevoClienteVehiculoChange} maxLength={50} required placeholder="Ej: Toyota" />
                <label className="text-sm font-medium mb-1 block mt-2">Modelo <span className="text-red-500">*</span></label>
                <Input type="text" name="modelo" value={nuevoClienteVehiculo.modelo} onChange={handleNuevoClienteVehiculoChange} maxLength={50} required placeholder="Ej: Corolla" />
                <label className="text-sm font-medium mb-1 block mt-2">Año</label>
                <Input type="number" name="anio" value={nuevoClienteVehiculo.anio} onChange={handleNuevoClienteVehiculoChange} min={1900} max={2100} placeholder="Ej: 2020" />
                <label className="text-sm font-medium mb-1 block mt-2">Color</label>
                <Input type="text" name="color" value={nuevoClienteVehiculo.color} onChange={handleNuevoClienteVehiculoChange} maxLength={30} placeholder="Ej: Rojo" />
                <label className="text-sm font-medium mb-1 block mt-2">Tipo <span className="text-red-500">*</span></label>
                <Select value={nuevoClienteVehiculo.tipo} onValueChange={value => handleNuevoClienteVehiculoChange({ target: { name: 'tipo', value } } as any)} name="tipo" required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automóvil">Automóvil</SelectItem>
                    <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                    <SelectItem value="Camioneta">Camioneta</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <label className="text-sm font-medium mb-1 block mt-2">Tipo de asiento <span className="text-red-500">*</span></label>
                <Select value={nuevoClienteVehiculo.tipo_asiento} onValueChange={value => handleNuevoClienteVehiculoChange({ target: { name: 'tipo_asiento', value } } as any)} name="tipo_asiento" required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo de asiento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cuero">Cuero</SelectItem>
                    <SelectItem value="Tela">Tela</SelectItem>
                  </SelectContent>
                </Select>
                {nuevoClienteVehiculoError && <div className="text-red-600 text-sm mt-1 font-semibold flex items-center gap-1"><span className="i-lucide-alert-triangle" />{nuevoClienteVehiculoError}</div>}
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" type="button" onClick={() => setShowNuevoClienteSection(false)} disabled={nuevoClienteLoading}>Cancelar</Button>
              <Button variant="yellow" type="submit" disabled={nuevoClienteLoading} className="font-bold">
                {nuevoClienteLoading ? <span className="animate-spin i-lucide-loader" /> : <span className="i-lucide-save" />} {nuevoClienteLoading ? 'Guardando...' : 'Guardar y continuar'}
              </Button>
            </DialogFooter>
          </form>
        </section>
      </Card>
    );
  }

  if (showNewService) {
    // Sección 2: Seleccionar vehículo del cliente
    if (flujo === 'existente' && clienteSeleccionado && !vehiculoSeleccionado) {
      return (
        <Card className="p-6">
          <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">2. Seleccionar Vehículo</h2>
              <Button variant="outline" onClick={() => setClienteSeleccionado(null)}>Regresar</Button>
            </div>
            <div className="mb-4">
              <span className="font-medium">Cliente seleccionado:</span> {clienteSeleccionado.nombre} ({clienteSeleccionado.cedula})
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Vehículos del cliente</span>
                <Button variant="yellow" size="sm" onClick={() => setShowFormNuevoVehiculo(true)}>Agregar vehículo</Button>
              </div>
              {loadingVehiculos ? (
                <div className="text-sm text-gray-500">Cargando vehículos...</div>
              ) : vehiculosCliente.length === 0 ? (
                <div className="text-sm text-gray-500">Este cliente no tiene vehículos registrados.</div>
              ) : (
                <ul className="space-y-2">
                  {vehiculosCliente.map((vehiculo) => (
                    <li
                      key={vehiculo.id}
                      className={`border rounded p-2 cursor-pointer flex flex-col ${vehiculoSeleccionado?.id === vehiculo.id ? 'bg-yellow-100 border-yellow-400' : 'hover:bg-yellow-50'}`}
                      onClick={() => { setVehiculoSeleccionado(vehiculo); setShowConfirmDialog(true); }}
                    >
                      <span className="font-medium">{vehiculo.placa}</span>
                      <span className="text-xs text-gray-500">{vehiculo.marca} {vehiculo.modelo} - {vehiculo.anio}</span>
                      <span className="text-xs text-gray-500">Color: {vehiculo.color || '-'} | Tipo: {vehiculo.tipo || '-'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Modal o formulario para agregar vehículo */}
            <Dialog open={showFormNuevoVehiculo} onOpenChange={setShowFormNuevoVehiculo}>
              <DialogContent className="max-w-md w-full p-0">
                <Card className="p-6 border-0 shadow-none">
                  <DialogHeader>
                    <DialogTitle className="text-yellow-700 flex items-center gap-2">
                      <span className="i-lucide-car" />
                      Agregar nuevo vehículo para <span className="text-black">{clienteSeleccionado.nombre}</span>
                    </DialogTitle>
                    <DialogDescription className="mb-2">Completa los datos del vehículo a registrar.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleNuevoVehiculoSubmit(); }}>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-1">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Placa <span className="text-red-500">*</span></label>
                        <Input type="text" name="placa" value={nuevoVehiculo.placa} onChange={handleNuevoVehiculoChange} maxLength={10} autoFocus placeholder="Ej: ABC123" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Marca <span className="text-red-500">*</span></label>
                          <Input type="text" name="marca" value={nuevoVehiculo.marca} onChange={handleNuevoVehiculoChange} maxLength={50} placeholder="Ej: Toyota" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Modelo <span className="text-red-500">*</span></label>
                          <Input type="text" name="modelo" value={nuevoVehiculo.modelo} onChange={handleNuevoVehiculoChange} maxLength={50} placeholder="Ej: Corolla" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Año</label>
                          <Input type="number" name="anio" value={nuevoVehiculo.anio} onChange={handleNuevoVehiculoChange} min={1900} max={2100} placeholder="Ej: 2020" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-1 block">Color</label>
                          <Input type="text" name="color" value={nuevoVehiculo.color} onChange={handleNuevoVehiculoChange} maxLength={30} placeholder="Ej: Rojo" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Tipo <span className="text-red-500">*</span></label>
                        <Select value={nuevoVehiculo.tipo} onValueChange={value => handleNuevoVehiculoChange({ target: { name: 'tipo', value } } as any)} name="tipo" required>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Automóvil">Automóvil</SelectItem>
                            <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                            <SelectItem value="Camioneta">Camioneta</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Tipo de asiento <span className="text-red-500">*</span></label>
                        <Select value={nuevoVehiculo.tipo_asiento} onValueChange={value => handleNuevoVehiculoChange({ target: { name: 'tipo_asiento', value } } as any)} name="tipo_asiento" required>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo de asiento" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cuero">Cuero</SelectItem>
                            <SelectItem value="Tela">Tela</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {errorVehiculo && <div className="text-red-600 text-sm mt-1 font-semibold flex items-center gap-1"><span className="i-lucide-alert-triangle" />{errorVehiculo}</div>}
                    <DialogFooter className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" type="button" onClick={() => setShowFormNuevoVehiculo(false)} disabled={loadingGuardarVehiculo}>Cancelar</Button>
                      <Button variant="yellow" type="submit" disabled={loadingGuardarVehiculo} className="font-bold">
                        {loadingGuardarVehiculo ? <span className="animate-spin i-lucide-loader" /> : <span className="i-lucide-save" />} {loadingGuardarVehiculo ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Card>
              </DialogContent>
            </Dialog>
            {/* Diálogo de confirmación */}
            {vehiculoSeleccionado && (
              <>
                <div className="mt-4">
                  <div className="text-green-700 font-semibold">Vehículo seleccionado: {vehiculoSeleccionado.placa}</div>
                </div>
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <DialogContent className="max-w-sm w-full">
                    <DialogHeader>
                      <DialogTitle>¿Estás seguro?</DialogTitle>
                      <DialogDescription>
                        ¿Deseas continuar con el vehículo <span className='text-yellow-700 font-bold'>{vehiculoSeleccionado.placa}</span>?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
                      <Button variant="yellow" onClick={() => { setShowConfirmDialog(false); }}>Continuar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </section>
        </Card>
      );
    }
    // Sección 3: Seleccionar tipos de servicio
    if (flujo === 'existente' && clienteSeleccionado && vehiculoSeleccionado && !showConfirmarServicio) {
      return <SeleccionarTiposServicioSection vehiculo={vehiculoSeleccionado} onBack={() => setVehiculoSeleccionado(null)} onServiciosSeleccionados={(servicios) => { setServiciosSeleccionados(servicios); setShowConfirmarServicio(true); }} />;
    }
    // Sección 5: Confirmar Servicio
    if (flujo === 'existente' && clienteSeleccionado && vehiculoSeleccionado && showConfirmarServicio) {
      return <ConfirmarServicioSection cliente={clienteSeleccionado} vehiculo={vehiculoSeleccionado} servicios={serviciosSeleccionados} empleado={empleado} onBack={() => setShowConfirmarServicio(false)} onComplete={resetearEstadoCompleto} />;
    }
    // Sección 1.5: Cliente existente
    if (flujo === 'existente') {
      return (
        <Card className="p-6">
          <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">1.5 Seleccionar Cliente Existente</h2>
              <Button variant="outline" onClick={() => setFlujo(null)}>Regresar</Button>
            </div>
            <BuscarClienteSection onSeleccionCliente={(cliente) => setClienteSeleccionado(cliente)} />
          </section>
        </Card>
      );
    }
    // Sección 1: Selección de tipo de servicio
    return (
      <Card className="p-6">
        <section className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Registro de Nuevo Servicio</h2>
            <Button variant="outline" onClick={() => setShowNewService(false)}>Regresar</Button>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Button variant="yellow" onClick={() => { setShowNuevoClienteSection(true); setShowNewService(false); }}>Nuevo cliente</Button>
            <Button variant="yellow" onClick={() => setShowProductSale(true)}>Venta de Productos</Button>
          </div>
          <SeleccionTipoServicioSection onSeleccion={setFlujo} />
        </section>
      </Card>
    );
  }


  // Vista principal
  // Filtrar servicios a mostrar según cliente seleccionado
  const serviciosFiltrados = filtroCliente
    ? servicios.filter(s => s.cliente_id === filtroCliente.id)
    : servicios;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <Button variant="yellow" className="shadow" onClick={() => setShowNewService(true)}>
          <Plus/>
          Nuevo Servicio</Button>
      </div>
      <Separator className="mb-4" />
      {/* Buscador de cliente para filtrar */}
      <div className="mb-4">
        {!filtroCliente ? (
          <BuscarClienteSection onSeleccionCliente={setFiltroCliente} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Servicios de: {filtroCliente.nombre}</span>
            <Button size="sm" variant="outline" onClick={() => setFiltroCliente(null)}>
              Limpiar filtro
            </Button>
          </div>
        )}
      </div>
      {/* Listado de servicios en cards */}
      {loadingServicios ? (
        <div className="text-gray-500">Cargando servicios...</div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="text-gray-500">
          {filtroCliente ? 'No hay servicios para este cliente.' : 'No hay servicios registrados.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviciosFiltrados.map(servicio => (
            <Card key={servicio.id} className="p-4 flex flex-col gap-2 border-yellow-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-600 font-bold">
              {servicio.tipos_servicio_realizados?.length > 0
                ? servicio.tipos_servicio_realizados.map((s: any) => s.nombre).join(", ")
                : "Venta de productos"}
            </span>
                <span className="ml-auto text-xs text-gray-400">{new Date(servicio.fecha_servicio).toLocaleDateString()}</span>
              </div>
              <div className="text-sm text-gray-700">Cliente: <span className="font-semibold">{servicio.cliente_nombre || servicio.cliente_id}</span></div>
              <div className="text-sm text-gray-700">Vehículo: <span className="font-semibold">{servicio.vehiculo_placa}</span> <span className="text-xs text-gray-500">{servicio.vehiculo_marca} {servicio.vehiculo_modelo}</span></div>
              <div className="text-sm text-gray-700">Total: <span className="font-bold text-green-700">${servicio.precio_total}</span></div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Obs: {servicio.observaciones || <span className="italic text-gray-400">Sin observación</span>}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setEditObsId(servicio.id); setEditObsValue(servicio.observaciones || ""); }}>Editar</Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="yellow" className="w-full font-bold" onClick={() => handleAbrirFactura(servicio)}>
                  Generar Factura
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="yellow" className="w-full font-bold" onClick={() => handleAbrirHojaCliente(servicio)}>
                  Generar Hoja Cliente
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="w-full font-bold" 
                  onClick={() => handleConfirmarEliminacion(servicio)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Eliminar Servicio
                </Button>
              </div>
              {/* Modal para editar observación */}
              {editObsId === servicio.id && (
                <Dialog open={true} onOpenChange={() => setEditObsId(null)}>
                  <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle>Editar observación</DialogTitle>
                    </DialogHeader>
                    <div className="mb-2">
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={3}
                        value={editObsValue}
                        onChange={e => setEditObsValue(e.target.value)}
                        placeholder="Escribe la observación..."
                        autoFocus
                      />
                    </div>
                    <DialogFooter className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" onClick={() => setEditObsId(null)} disabled={editObsLoading}>Cancelar</Button>
                      <Button variant="yellow" className="font-bold" onClick={() => handleGuardarObservacion(servicio.id)} disabled={editObsLoading}>
                        {editObsLoading ? <span className="animate-spin i-lucide-loader" /> : <span className="i-lucide-save" />} Guardar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          ))}
        </div>
      )}
      {/* Modal de Factura */}
      {showFactura && (
        <Dialog open={showFactura} onOpenChange={setShowFactura}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle>Factura del Servicio</DialogTitle>
            </DialogHeader>
            {facturaServicio && (
              <div className="my-4">
                <InternalInvoice
                  service={facturaServicio}
                  client={facturaCliente}
                  vehicle={facturaVehiculo}
                  pagos={facturaPagos}
                  employee={facturaEmpleado}
                  onClose={() => setShowFactura(false)}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Hoja Del CLiente */}

      {showHojaCliente && (
        <Dialog open={showHojaCliente} onOpenChange={setShowHojaCliente}>
          <DialogContent className="max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle>Factura del Servicio</DialogTitle>
            </DialogHeader>
            {facturaServicio && (
              <div className="my-4">
                <InternalSheetClient
                  service={facturaServicio}
                  client={facturaCliente}
                  vehicle={facturaVehiculo}
                  pagos={facturaPagos}
                  employee={facturaEmpleado}
                  onClose={() => setShowHojaCliente(false)}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo de confirmación para eliminar servicio */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>¿Eliminar servicio?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el servicio y realizará las siguientes reversiones automáticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Eliminará todos los pagos relacionados</li>
              <li>Reintegrará productos al inventario</li>
              <li>Reintegrará productos de promociones al inventario</li>
              <li>Revertirá pagos en efectivo de la caja</li>
            </ul>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>
            
            {servicioAEliminar && (
              <div className="p-3 bg-gray-50 border rounded">
                <p className="text-sm font-semibold">Servicio a eliminar:</p>
                <p className="text-sm">Cliente: {servicioAEliminar.cliente_nombre}</p>
                <p className="text-sm">Total: ${servicioAEliminar.precio_total}</p>
                <p className="text-sm">Fecha: {new Date(servicioAEliminar.fecha_servicio).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setServicioAEliminar(null);
              }} 
              disabled={loadingDelete}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEliminarServicio} 
              disabled={loadingDelete}
            >
              {loadingDelete ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Sección 5: Confirmar Servicio


function ConfirmarServicioSection({ cliente, vehiculo, servicios, empleado, onBack, onComplete }: { cliente: any, vehiculo: any, servicios: any[], empleado: any, onBack: () => void, onComplete: () => void }) {
  // --- Estado para productos/promos y pago ---
  const [productosPromos, setProductosPromos] = useState<any[]>([]); // [{...producto, cantidad: number}]
  const [opciones, setOpciones] = useState<any[]>([]);
  const [tipoSeleccion, setTipoSeleccion] = useState<'producto' | 'promocion'>('producto');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string>("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState<number>(1);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [descuentoValor, setDescuentoValor] = useState(0);
  const [cobroExtraValor, setCobroExtraValor] = useState(0);
  const [cobroExtraDesc, setCobroExtraDesc] = useState("");
  const [observacionServicio, setObservacionServicio] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [loadingPago, setLoadingPago] = useState(false);
  const [promocionSeleccionadaDetalles, setPromocionSeleccionadaDetalles] = useState<any>(null);

  // Cargar productos y promociones al montar
  useEffect(() => {
    async function fetchData() {
      const [{ getCollection }] = await Promise.all([
        import("../lib/firebase")
      ]);
      const productos = await getCollection("productos");
      const promociones = await getCollection("promociones");
      
      // Filtrar solo promociones activas
      const promocionesActivas = promociones.filter((p: any) => p.activa === true);
      
      setOpciones([
        ...productos.map((p: any) => ({
          ...p,
          tipo: 'producto',
          stock: p.cantidad_disponible ? parseInt(p.cantidad_disponible) : 0 // Usar cantidad_disponible como stock
        })),
        ...promocionesActivas.map((p: any) => ({ ...p, tipo: 'promocion' })),
      ]);
    }
    fetchData();
  }, []);

  // Calcular totales y lógica de pago
  const totalServicios = servicios.reduce((acc, s) => acc + (parseFloat(s.precio_base || s.precio || 0)), 0);
  // Sumar el precio de cada producto/promoción por su cantidad
  const totalProductos = productosPromos.reduce((acc, p) => {
    if (p.tipo === 'promocion') {
      // Para promociones, buscar precio en múltiples campos posibles
      const precio = Number(p.precio_total_promocional || p.precio || 0);
      return acc + (precio * (Number(p.cantidad) || 1));
    } else {
      // Para productos, usar precio_venta
      return acc + ((Number(p.precio_venta || p.precio || 0)) * (Number(p.cantidad) || 1));
    }
  }, 0);
  const descuento = tipoDescuento === 'valor'
    ? descuentoValor
    : (descuentoPorcentaje > 0 ? ((totalServicios + totalProductos) * descuentoPorcentaje / 100) : 0);
  const totalFinal = Math.max(0, totalServicios + totalProductos + cobroExtraValor - descuento);

  const handleRegistrarServicio = async () => {
    if (!cliente?.id || !vehiculo?.id || servicios.length === 0) {
      showToast.error("Faltan datos obligatorios para registrar el servicio.");
      return;
    }
    if (!metodoPago) {
      showToast.error("Selecciona un método de pago.");
      return;
    }
    setLoadingPago(true);
    const tipos_servicio_realizados = servicios.map(s => ({
      id: s.id,
      nombre: s.nombre,
      precio_base: s.precio_base
    }));
    const now = new Date();
    const fecha = now.toISOString().slice(0,10);
    const hora = now.toTimeString().substr(0,5);
    
    // Separar productos y promociones
    const productos = productosPromos.filter(item => item.tipo === 'producto');
    const promociones = productosPromos.filter(item => item.tipo === 'promocion');
    
    try {
      const { addDoc, collection, doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      // Crear el objeto de pago primero
      const pagoObj = {
        id: crypto.randomUUID(),
        servicio_id: '', // Se actualizará después con el ID del servicio
        metodo_pago: metodoPago,
        monto: Number(totalFinal),
        fecha_pago: new Date().toISOString(),
        estado: true,
        observaciones: cobroExtraDesc || '',
        cliente_id: cliente.id,
      };
      
      // Registrar el pago y obtener su ID de Firestore
      const pagoRef = await addDoc(collection(db, "pagos"), pagoObj);
      const pagoFirestoreId = pagoRef.id;
      
      // Crear el objeto del servicio con la referencia al pago
      const servicioObj = {
        id: crypto.randomUUID(),
        cliente_id: cliente.id,
        vehiculo_id: vehiculo.id,
        tipos_servicio_realizados,
        precio: totalServicios.toFixed(2),
        productos: productos,
        promociones: promociones, // Agregar promociones separadas
        precio_total: totalFinal.toFixed(2),
        descuento: descuento.toFixed(2),
        pagado: true,
        fecha_servicio: now.toISOString(),
        fecha: fecha,
        hora: hora,
        observaciones: observacionServicio || '',
        cobros_extra: cobroExtraValor,
        empleado_id: empleado?.id || null,
        pago_id: pagoFirestoreId, // Guardar el ID del pago
      };
      
      // Registrar el servicio y obtener su ID principal de Firestore
      const servicioRef = await addDoc(collection(db, "servicios"), servicioObj);
      const servicioFirestoreId = servicioRef.id;
      
      // Actualizar el pago con el ID del servicio
      await updateDoc(doc(db, "pagos", pagoFirestoreId), {
        servicio_id: servicioFirestoreId
      });
      
      // Si el pago es en efectivo, registrarlo en la caja usando el ID principal
      if (metodoPago === "efectivo") {
        const registrado = await registrarPagoEnCaja(Number(totalFinal), servicioFirestoreId, cliente.nombre, 'servicio');
        if (registrado) {
          showToast.info(`Pago en efectivo de $${totalFinal} registrado en caja`, { 
            duration: 3000, 
            position: "top-center" 
          });
        }
      }
      
      for (const p of productosPromos) {
        if (p.tipo === 'producto' && p.id) {
          const productoRef = doc(db, "productos", p.id);
          let nuevoStock = 0;
          if (typeof p.stock === 'number') {
            nuevoStock = p.stock - (p.cantidad || 1);
          } else {
            nuevoStock = (parseInt(p.stock) || 0) - (p.cantidad || 1);
          }
          if (nuevoStock < 0) nuevoStock = 0;
          await updateDoc(productoRef, { cantidad_disponible: String(nuevoStock) });
        } else if (p.tipo === 'promocion' && p.productos && Array.isArray(p.productos)) {
          // Procesar productos incluidos en la promoción
          for (const prodPromo of p.productos) {
            if (prodPromo.id) {
              const productoRef = doc(db, "productos", prodPromo.id);
              // Obtener el producto actual para conocer su stock
              const { getDoc } = await import("firebase/firestore");
              const productoDoc = await getDoc(productoRef);
              if (productoDoc.exists()) {
                const productoData = productoDoc.data();
                const stockActual = parseInt(productoData.cantidad_disponible || '0');
                const cantidadADescontar = (prodPromo.cantidad || 1) * (p.cantidad || 1);
                const nuevoStock = Math.max(0, stockActual - cantidadADescontar);
                await updateDoc(productoRef, { cantidad_disponible: String(nuevoStock) });
              }
            }
          }
        }
      }
      showToast.success("Servicio y pago registrados correctamente.");
      showToast.info("Redirigiendo a la vista principal...", { duration: 2000, position: "top-center" });
      setShowPagoDialog(false);
      
      // Usar la función onComplete para volver a la vista principal
      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }, 1000); // Delay para que se vea el toast
    } catch (e) {
      showToast.error("Error al registrar el servicio y pago.");
    } finally {
      setLoadingPago(false);
    }
  };

  // Opciones filtradas según tipo
  const opcionesFiltradas = opciones.filter(o => o.tipo === tipoSeleccion);

  const handleAgregar = () => {
    if (!opcionSeleccionada) return;
    const yaExiste = productosPromos.some(p => p.id === opcionSeleccionada && p.tipo === tipoSeleccion);
    if (yaExiste) {
      showToast.error("Este item ya está agregado.", { duration: 2000, position: "top-center" });
      return;
    }
    const obj = opcionesFiltradas.find(o => o.id === opcionSeleccionada);
    if (!obj) return;
    
    // Si es producto, validar stock
    if (obj.tipo === 'producto') {
      const stock = typeof obj.stock === 'number' ? obj.stock : (parseInt(obj.stock) || 0);
      // Calcular la cantidad ya agregada de este producto
      const cantidadYaAgregada = productosPromos.filter(p => p.id === obj.id && p.tipo === 'producto').reduce((acc, p) => acc + (p.cantidad || 0), 0);
      const disponible = stock - cantidadYaAgregada;
      if (cantidadSeleccionada > disponible) {
        showToast.error(`La cantidad no puede exceder el stock disponible (${disponible}).`, { duration: 3000, position: "top-center" });
        return;
      }
      showToast.success(`Producto agregado. Quedan ${disponible - cantidadSeleccionada} disponibles.`, { duration: 2500, position: "top-center" });
    } else if (obj.tipo === 'promocion') {
      // Para promociones, la cantidad siempre es 1
      setCantidadSeleccionada(1);
      showToast.success(`Promoción "${obj.nombre}" agregada.`, { duration: 2500, position: "top-center" });
    }
    
    setProductosPromos(prev => [...prev, { ...obj, cantidad: tipoSeleccion === 'promocion' ? 1 : cantidadSeleccionada }]);
    setOpcionSeleccionada("");
    setCantidadSeleccionada(1);
    setPromocionSeleccionadaDetalles(null);
  };

  const handleQuitar = (id: string, tipo: string) => {
    setProductosPromos(prev => prev.filter(p => !(p.id === id && p.tipo === tipo)));
  };

  // Cambiar cantidad de un producto/promoción ya agregado
  const handleCantidadChange = (id: string, tipo: string, nuevaCantidad: number) => {
    setProductosPromos(prev => prev.map(p => {
      if (p.id === id && p.tipo === tipo) {
        // Para promociones, la cantidad siempre es 1
        if (p.tipo === 'promocion') return p;
        
        // Validar stock si es producto
        if (p.tipo === 'producto') {
          const stock = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock) || 0);
          if (nuevaCantidad > stock) return { ...p, cantidad: stock };
        }
        return { ...p, cantidad: nuevaCantidad };
      }
      return p;
    }));
  };

  // Función para manejar cambio de selección y mostrar detalles de promoción
  const handleSeleccionChange = (value: string) => {
    setOpcionSeleccionada(value);
    if (tipoSeleccion === 'promocion' && value) {
      const promocion = opcionesFiltradas.find(o => o.id === value);
      setPromocionSeleccionadaDetalles(promocion);
    } else {
      setPromocionSeleccionadaDetalles(null);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl font-bold bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center">5</span>
        <h2 className="text-xl font-bold ml-2">Confirmar Servicio</h2>
      </div>
      <div className="mb-2 text-gray-600">Confirme los detalles del servicio antes de guardar.</div>
      <Separator className="mb-4" />
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <div>
            <div className="font-semibold">Cliente: <span className="text-black">{cliente.nombre}</span></div>
            <div className="text-sm text-gray-500">Teléfono: {cliente.telefono || 'No asignado'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <div className="font-semibold">Vehículo: <span className="text-black">{vehiculo.marca} {vehiculo.modelo}</span></div>
            <div className="text-sm text-gray-500">Placa: {vehiculo.placa}</div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Servicios Seleccionados:</div>
          <ul className="pl-5 list-disc">
            {servicios.map((s) => (
              <li key={s.id} className="mb-1">
                <span className="font-bold text-yellow-700">{s.nombre}</span> <span className="text-gray-500">${s.precio_base}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Observación del servicio */}
        <div>
          <label className="font-semibold mb-1 block">Observación del servicio:</label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={2}
            placeholder="Agrega una observación para el servicio (opcional)"
            value={observacionServicio}
            onChange={e => setObservacionServicio(e.target.value)}
          />
        </div>

        {/* Combobox productos/promociones */}
        <div className="mt-4">
          <div className="font-semibold mb-1">Agregar producto o promoción:</div>
          <div className="flex gap-2 mb-2 items-end">
            <Select value={tipoSeleccion} onValueChange={v => { setTipoSeleccion(v as any); setOpcionSeleccionada(""); setCantidadSeleccionada(1); setPromocionSeleccionadaDetalles(null); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="promocion">Promoción</SelectItem>
              </SelectContent>
            </Select>
            <Select value={opcionSeleccionada} onValueChange={handleSeleccionChange}>
              <SelectTrigger className="w-64"><SelectValue placeholder={`Selecciona un ${tipoSeleccion}`} /></SelectTrigger>
              <SelectContent>
                {opcionesFiltradas.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nombre} {o.tipo === 'promocion' && `- $${o.precio_total_promocional || 0}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoSeleccion === 'producto' && opcionSeleccionada && (
              <Input
                type="number"
                min={1}
                max={(() => {
                  const obj = opcionesFiltradas.find(o => o.id === opcionSeleccionada);
                  return obj && obj.stock ? obj.stock : 1;
                })()}
                value={cantidadSeleccionada}
                onChange={e => {
                  let val = parseInt(e.target.value) || 1;
                  const obj = opcionesFiltradas.find(o => o.id === opcionSeleccionada);
                  const max = obj && obj.stock ? obj.stock : 1;
                  if (val > max) val = max;
                  if (val < 1) val = 1;
                  setCantidadSeleccionada(val);
                }}
                className="w-20"
                placeholder="Cantidad"
              />
            )}
            <Button variant="yellow" onClick={handleAgregar} disabled={!opcionSeleccionada}>Agregar</Button>
          </div>
          
          {/* Mostrar detalles de la promoción seleccionada */}
          {promocionSeleccionadaDetalles && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                📋 Detalles de la promoción: {promocionSeleccionadaDetalles.nombre}
              </h4>
              {promocionSeleccionadaDetalles.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{promocionSeleccionadaDetalles.descripcion}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Precio original:</span>
                    <span className="text-gray-600">${promocionSeleccionadaDetalles.precio_total_original || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-green-700">Precio promocional:</span>
                    <span className="font-bold text-green-700">${promocionSeleccionadaDetalles.precio_total_promocional || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-green-600">Ahorro:</span>
                    <span className="font-bold text-green-600">
                      ${((promocionSeleccionadaDetalles.precio_total_original || 0) - (promocionSeleccionadaDetalles.precio_total_promocional || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div>
                  {/* Productos incluidos */}
                  {promocionSeleccionadaDetalles.productos && promocionSeleccionadaDetalles.productos.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-1">📦 Productos incluidos:</h5>
                      <ul className="text-xs space-y-1">
                        {promocionSeleccionadaDetalles.productos.map((producto: any, index: number) => (
                          <li key={index} className="bg-blue-50 px-2 py-1 rounded">
                            {producto.nombre} x{producto.cantidad_promocion || 1}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Servicios incluidos */}
                  {promocionSeleccionadaDetalles.lista_servicios && promocionSeleccionadaDetalles.lista_servicios.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-orange-700 mb-1">🔧 Servicios incluidos:</h5>
                      <ul className="text-xs space-y-1">
                        {promocionSeleccionadaDetalles.lista_servicios.map((servicio: any, index: number) => (
                          <li key={index} className="bg-orange-50 px-2 py-1 rounded">
                            {servicio.nombre} x{servicio.cantidad_promocion || 1}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Válido desde {new Date(promocionSeleccionadaDetalles.fecha_inicio).toLocaleDateString()} 
                hasta {new Date(promocionSeleccionadaDetalles.fecha_fin).toLocaleDateString()}
              </div>
            </div>
          )}
          
          {/* Listado de productos/promociones seleccionados */}
          {productosPromos.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Items seleccionados:</h4>
              <div className="space-y-2">
                {productosPromos.map((p) => (
                  <div key={p.id + p.tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">{p.nombre}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          p.tipo === 'producto' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {p.tipo === 'producto' ? '📦 Producto' : '🎯 Promoción'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {p.tipo === 'producto' ? (
                          `Precio: $${p.precio_venta} • Stock: ${p.stock}`
                        ) : (
                          `Precio promocional: $${p.precio_total_promocional} • Ahorro: $${((p.precio_total_original || 0) - (p.precio_total_promocional || 0)).toFixed(2)}`
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {p.tipo === 'producto' ? (
                        <Input
                          type="number"
                          min={1}
                          value={p.cantidad}
                          onChange={e => {
                            let val = parseInt(e.target.value) || 1;
                            const max = p.stock || 1;
                            if (val > max) {
                              showToast.error(`La cantidad excede el stock disponible (${max}).`, { duration: 3000, position: "top-center" });
                              val = max;
                            }
                            if (val < 1) val = 1;
                            handleCantidadChange(p.id, p.tipo, val);
                          }}
                          className="w-16"
                          style={{ fontSize: 13 }}
                          title={`Stock: ${p.stock}`}
                        />
                      ) : (
                        <span className="w-16 text-center text-sm font-medium">x1</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuitar(p.id, p.tipo)}
                        className="ml-1 p-1 rounded hover:bg-red-100"
                        title="Quitar"
                      >
                        <Trash size={18} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">👷</span>
          <div>
            <div className="font-semibold">Empleado: <span className="text-black">{empleado?.nombre || 'Sin nombre'}</span></div>
           
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onBack}>Regresar</Button>
        <Button variant="yellow" className="font-bold" onClick={() => setShowPagoDialog(true)}>Registrar servicio</Button>
      </div>

      {/* Dialogo para procesar pago */}
      <Dialog open={showPagoDialog} onOpenChange={setShowPagoDialog}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Servicio: <span className="font-semibold">{servicios[0]?.nombre || '-'} </span> - Cliente: <span className="font-semibold">{cliente?.nombre || 'Cliente no encontrado'}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Descuento */}
            <div className="flex gap-2 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-sm font-medium">Tipo de descuento</label>
                <Select value={tipoDescuento} onValueChange={v => setTipoDescuento(v as 'porcentaje' | 'valor')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo de descuento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                    <SelectItem value="valor">Valor fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tipoDescuento === 'porcentaje' && (
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium">Descuento (%)</label>
                  <Input type="number" min={0} max={100} value={descuentoPorcentaje} onChange={e => setDescuentoPorcentaje(Number(e.target.value))} />
                </div>
              )}
              {tipoDescuento === 'valor' && (
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-medium">Valor del descuento</label>
                  <Input type="number" min={0} value={0} disabled readOnly />
                </div>
              )}
            </div>
            {/* Cobros extra */}
            <div className="flex gap-2 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-sm font-medium">Cobros Extra</label>
                <Input type="number" min={0} value={cobroExtraValor} onChange={e => setCobroExtraValor(Number(e.target.value))} />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm font-medium">Descripción de cobros extra</label>
                <Input type="text" value={cobroExtraDesc} onChange={e => setCobroExtraDesc(e.target.value)} />
              </div>
            </div>
            {/* Método de pago */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona método de pago" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="pagomovil">Pago Móvil</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Total final */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Total Final</label>
              <div className="text-2xl font-bold text-green-700">${totalFinal.toFixed(2)}</div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPagoDialog(false)} disabled={loadingPago}>Cancelar</Button>
            <Button variant="yellow" className="font-bold" onClick={handleRegistrarServicio} disabled={loadingPago}>
              {loadingPago ? <span className="animate-spin i-lucide-loader" /> : <span className="i-lucide-save" />} {loadingPago ? 'Registrando...' : 'Registrar y cobrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Sección 1: Selección de tipo de servicio
function SeleccionTipoServicioSection({ onSeleccion }: { onSeleccion: (tipo: string) => void }) {
  return (
    <section className="mb-4">
      {/* <span className="font-medium block mb-2">1. Selecciona el tipo de servicio</span> */}
      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
        <Button variant="yellow" className="w-full sm:w-auto" onClick={() => onSeleccion('existente')}>Cliente existente</Button>
        {/* <Button variant="yellow" className="w-full sm:w-auto" onClick={() => onSeleccion('nuevo')}>Nuevo cliente</Button> */}
       {/* <Button variant="yellow" className="w-full sm:w-auto" onClick={() => onSeleccion('solo-productos')}>Solo venta de productos</Button> */}
      </div>
    </section>
  );
}

function ProductSaleSection({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) {
  const [cliente, setCliente] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [opciones, setOpciones] = useState<any[]>([]);
  const [tipoSeleccion, setTipoSeleccion] = useState<'producto' | 'promocion'>('producto');
  const [cart, setCart] = useState<any[]>([]);
  const [opcion, setOpcion] = useState<string>("");
  const [cantidad, setCantidad] = useState(1);
  const [showPago, setShowPago] = useState(false);
  const [tipoDesc, setTipoDesc] = useState<'porcentaje'|'valor'>('porcentaje');
  const [descPct, setDescPct] = useState(0);
  const [descVal, setDescVal] = useState(0);
  const [extraVal, setExtraVal] = useState(0);
  const [extraDesc, setExtraDesc] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  const [observacion, setObservacion] = useState(""); // Observación de la venta
  const [promocionSeleccionadaDetalles, setPromocionSeleccionadaDetalles] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ getCollection }] = await Promise.all([
        import("../lib/firebase")
      ]);
      
      const [productosData, promocionesData] = await Promise.all([
        getCollection("productos"),
        getCollection("promociones")
      ]);
      
      // Filtrar solo promociones activas
      const promocionesActivas = promocionesData.filter((p: any) => p.activa === true);
      
      const productosConStock = productosData.map((p: any) => ({
        ...p,
        tipo: 'producto',
        stock: p.cantidad_disponible ? parseInt(p.cantidad_disponible) : 0
      }));
      
      const promocionesConTipo = promocionesActivas.map((p: any) => ({
        ...p,
        tipo: 'promocion'
      }));
      
      setProductos(productosConStock);
      setPromociones(promocionesConTipo);
      setOpciones([...productosConStock, ...promocionesConTipo]);
    }
    fetchData();
  }, []);

  const agregar = () => {
    if (!opcion) return;
    
    const opcionesFiltradas = opciones.filter(o => o.tipo === tipoSeleccion);
    const item = opcionesFiltradas.find(x => x.id === opcion);
    if (!item) return;
    
    // Verificar si ya está en el carrito
    if (cart.some(c => c.id === item.id && c.tipo === tipoSeleccion)) {
      showToast.error("Este item ya está en el carrito.");
      return;
    }
    
    // Si es producto, validar stock
    if (item.tipo === 'producto') {
      if (cantidad > item.stock) {
        showToast.error(`Cantidad excede stock (${item.stock}).`);
        return;
      }
      showToast.success("Producto agregado al carrito.");
    } else if (item.tipo === 'promocion') {
      // Para promociones, la cantidad siempre es 1
      setCantidad(1);
      showToast.success(`Promoción "${item.nombre}" agregada al carrito.`);
    }
    
    setCart([...cart, { ...item, cantidad: tipoSeleccion === 'promocion' ? 1 : cantidad }]);
    setOpcion(""); 
    setCantidad(1);
    setPromocionSeleccionadaDetalles(null);
  };

  const quitar = (id: string) =>
    setCart(cart.filter(c => c.id !== id));

  const totalProd = cart.reduce((s, c) => {
    if (c.tipo === 'promocion') {
      // Buscar precio en múltiples campos posibles
      const precio = Number(c.precio_total_promocional || c.precio || 0);
      return s + precio;
    } else {
      return s + ((c.precio_venta||c.precio||0) * c.cantidad);
    }
  }, 0);
  const descuento = tipoDesc === 'valor'
    ? descVal
    : (descPct > 0 ? totalProd * descPct / 100 : 0);
  const totalFinal = Math.max(0, totalProd + extraVal - descuento);

  const procesar = async () => {
    if (!cliente?.id) { showToast.error("Selecciona un cliente."); return; }
    if (cart.length === 0) { showToast.error("Agrega productos."); return; }
    setLoading(true);
    // Validar método de pago
    if (!metodo) { showToast.error("Selecciona un método de pago."); setLoading(false); return; }
    // Construir objeto de servicio para venta de productos (sin tipos de servicio)
    const now = new Date();
    const fecha = now.toISOString().slice(0, 10);
    const hora = now.toTimeString().substr(0, 5);
    
    // Separar productos y promociones
    const productos = cart.filter(item => item.tipo === 'producto');
    const promociones = cart.filter(item => item.tipo === 'promocion');
    
    const servicioObj = {
      id: crypto.randomUUID(),
      cliente_id: cliente.id,
      vehiculo_id: null,
      tipos_servicio_realizados: [],
      productos: productos,
      promociones: promociones, // Agregar promociones al servicio
      precio_total: totalFinal.toFixed(2),
      descuento: descuento.toFixed(2),
      pagado: true,
      fecha_servicio: now.toISOString(),
      fecha: fecha,
      hora: hora,
      observaciones: observacion,
      cobros_extra: extraVal,
      empleado_id: null
    };
    
    try {
      const { addDoc, collection, doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      // Registrar el servicio y obtener su ID principal de Firestore
      const servicioRef = await addDoc(collection(db, "servicios"), servicioObj);
      const servicioFirestoreId = servicioRef.id;
      
      // Crear el objeto de pago usando el ID principal del servicio
      const pago = {
        id: crypto.randomUUID(),
        servicio_id: servicioFirestoreId, // Usar el ID principal de Firestore
        metodo_pago: metodo,
        monto: Number(totalFinal),
        fecha_pago: new Date().toISOString(),
        estado: true,
        observaciones: extraDesc,
        cliente_id: cliente.id
      };
      
      await addDoc(collection(db, "pagos"), pago);
      
      // Si el pago es en efectivo, registrarlo en la caja usando el ID principal
      if (metodo === "efectivo") {
        const registrado = await registrarPagoEnCaja(Number(totalFinal), servicioFirestoreId, cliente.nombre, 'venta');
        if (registrado) {
          showToast.info(`Pago en efectivo de $${totalFinal} registrado en caja`, { 
            duration: 3000, 
            position: "top-center" 
          });
        }
      }
      
      // Actualizar stock para productos y productos incluidos en promociones
      for (let c of cart) {
        if (c.tipo === 'producto') {
          const ref = doc(db, "productos", c.id);
          const nuevoStock = Math.max(0, (c.stock||0) - c.cantidad);
          await updateDoc(ref, { cantidad_disponible: String(nuevoStock) });
        } else if (c.tipo === 'promocion' && c.productos && Array.isArray(c.productos)) {
          // Procesar productos incluidos en la promoción
          for (const prodPromo of c.productos) {
            if (prodPromo.id) {
              const productoRef = doc(db, "productos", prodPromo.id);
              // Obtener el producto actual para conocer su stock
              const { getDoc } = await import("firebase/firestore");
              const productoDoc = await getDoc(productoRef);
              if (productoDoc.exists()) {
                const productoData = productoDoc.data();
                const stockActual = parseInt(productoData.cantidad_disponible || '0');
                const cantidadADescontar = (prodPromo.cantidad || 1) * (c.cantidad || 1);
                const nuevoStock = Math.max(0, stockActual - cantidadADescontar);
                await updateDoc(productoRef, { cantidad_disponible: String(nuevoStock) });
              }
            }
          }
        }
      }
      
      showToast.success("Venta registrada correctamente.");
      showToast.info("Redirigiendo a la vista principal...", { duration: 2000, position: "top-center" });
      setShowPago(false);
      
      // Usar la función onComplete para volver a la vista principal
      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }, 1000); // Delay para que se vea el toast
    } catch (e: any) {
      console.error(e);
      showToast.error("Error al registrar la venta: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        {/* <span className="text-2xl font-bold bg-green-400 rounded-full w-8 h-8 flex items-center justify-center">
          Venta
        </span> */}
        <h2 className="text-xl font-bold">Venta de Productos</h2>
      </div>

      {!cliente && <BuscarClienteSection onSeleccionCliente={setCliente} />}
      {cliente && (
        <div className="mb-4 flex items-center gap-2">
          Cliente: <span className="font-semibold">{cliente.nombre}</span>
          <Button size="sm" variant="outline" onClick={() => setCliente(null)}>Cambiar cliente</Button>
        </div>
      )}

      <div className="flex gap-2 mb-4 items-end">
        <Select value={tipoSeleccion} onValueChange={v => { setTipoSeleccion(v as any); setOpcion(""); setCantidad(1); setPromocionSeleccionadaDetalles(null); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="producto">Productos</SelectItem>
            <SelectItem value="promocion">Promociones</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={opcion} onValueChange={(value) => {
          setOpcion(value);
          if (tipoSeleccion === 'promocion') {
            const promo = promociones.find(p => p.id === value);
            setPromocionSeleccionadaDetalles(promo || null);
          } else {
            setPromocionSeleccionadaDetalles(null);
          }
        }}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={`Selecciona ${tipoSeleccion === 'promocion' ? 'una promoción' : 'un producto'}`} />
          </SelectTrigger>
          <SelectContent>
            {opciones.filter(item => {
              if (item.tipo !== tipoSeleccion) return false;
              if (item.tipo === 'producto') {
                const used = cart.filter(c => c.id === item.id && c.tipo === 'producto').reduce((a, c) => a + c.cantidad, 0);
                return (item.stock - used) > 0;
              }
              return item.activa;
            }).map(item => (
              <SelectItem key={item.id} value={item.id}>
                {item.nombre} {item.tipo === 'producto' && `($${item.precio_venta || item.precio})`}
                {item.tipo === 'promocion' && `($${item.precio_total_promocional})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {opcion && tipoSeleccion === 'producto' && (
          <Input
            type="number"
            min={1}
            max={(() => {
              const p = productos.find(x => x.id === opcion);
              const used = cart.filter(c => c.id === opcion && c.tipo === 'producto').reduce((a, c) => a + c.cantidad, 0);
              return p ? Math.max(1, p.stock - used) : 1;
            })()}
            value={cantidad}
            onChange={e => {
              const val = Number(e.target.value) || 1;
              const p = productos.find(x => x.id === opcion);
              const used = cart.filter(c => c.id === opcion && c.tipo === 'producto').reduce((a, c) => a + c.cantidad, 0);
              const max = p ? Math.max(1, p.stock - used) : 1;
              setCantidad(Math.min(Math.max(1, val), max));
            }}
            className="w-20"
            placeholder="Cant."
          />
        )}
        {opcion && tipoSeleccion === 'promocion' && (
          <div className="w-20 px-3 py-2 border rounded text-center bg-gray-50">
            1
          </div>
        )}
        <Button 
          variant="yellow" 
          onClick={agregar} 
          disabled={!opcion || (() => {
            if (tipoSeleccion === 'producto') {
              const p = productos.find(x => x.id === opcion);
              const used = cart.filter(c => c.id === opcion && c.tipo === 'producto').reduce((a, c) => a + c.cantidad, 0);
              return !p || (p.stock - used) <= 0;
            } else {
              return cart.some(c => c.id === opcion && c.tipo === 'promocion');
            }
          })()}
        >
          Añadir al carrito
        </Button>
      </div>

      {/* Detalles de promoción seleccionada */}
      {promocionSeleccionadaDetalles && (
        <Card className="mb-4 p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Detalles de la Promoción</h3>
          <div className="grid gap-2 text-sm">
            <div><strong>Nombre:</strong> {promocionSeleccionadaDetalles.nombre}</div>
            <div><strong>Precio Total:</strong> ${promocionSeleccionadaDetalles.precio_total_promocional}</div>
            {promocionSeleccionadaDetalles.descripcion && (
              <div><strong>Descripción:</strong> {promocionSeleccionadaDetalles.descripcion}</div>
            )}
            
            {/* Productos incluidos */}
            {promocionSeleccionadaDetalles.productos && promocionSeleccionadaDetalles.productos.length > 0 && (
              <div>
                <strong>Productos incluidos:</strong>
                <ul className="ml-4 mt-1">
                  {promocionSeleccionadaDetalles.productos.map((producto: any, index: number) => (
                    <li key={index} className="flex justify-between">
                      <span>• {producto.nombre}</span>
                      <span className="text-gray-600">x{producto.cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Servicios incluidos */}
            {promocionSeleccionadaDetalles.servicios && promocionSeleccionadaDetalles.servicios.length > 0 && (
              <div>
                <strong>Servicios incluidos:</strong>
                <ul className="ml-4 mt-1">
                  {promocionSeleccionadaDetalles.servicios.map((servicio: any, index: number) => (
                    <li key={index} className="flex justify-between">
                      <span>• {servicio.nombre}</span>
                      <span className="text-gray-600">x{servicio.cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {cart.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio U.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map(c => {
                let precio, subtotal;
                if (c.tipo === 'promocion') {
                  // Buscar precio en múltiples campos posibles para promociones
                  precio = Number(c.precio_total_promocional || c.precio || 0);
                  subtotal = precio; // Las promociones siempre tienen cantidad 1
                } else {
                  precio = Number(c.precio_venta || c.precio || 0);
                  subtotal = precio * c.cantidad;
                }
                
                return (
                  <TableRow key={`${c.id}-${c.tipo}`}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs ${c.tipo === 'promocion' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {c.tipo === 'promocion' ? 'Promoción' : 'Producto'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{c.cantidad}</TableCell>
                    <TableCell className="text-right">${precio.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${subtotal.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" onClick={() => quitar(c.id)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableHead colSpan={3} className="text-right">Total</TableHead>
                <TableCell className="text-right">${totalProd.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      <Button
        variant="yellow"
        onClick={() => setShowPago(true)}
        disabled={cart.length === 0}
      >
        Procesar Pago
      </Button>

      <Dialog open={showPago} onOpenChange={setShowPago}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Cliente: <span className="font-semibold">{cliente?.nombre}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2 items-end">
              <Select value={tipoDesc} onValueChange={v => setTipoDesc(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de descuento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="valor">Valor fijo ($)</SelectItem>
                </SelectContent>
              </Select>
              {tipoDesc === 'porcentaje' ? (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={descPct}
                  onChange={e => setDescPct(Number(e.target.value))}
                />
              ) : (
                <Input
                  type="number"
                  min={0}
                  value={descVal}
                  onChange={e => setDescVal(Number(e.target.value))}
                />
              )}
            </div>
            <div className="flex gap-2 items-end">
              <Input
                type="number"
                min={0}
                value={extraVal}
                onChange={e => setExtraVal(Number(e.target.value))}
                placeholder="Cobros Extra"
              />
              <Input
                type="text"
                value={extraDesc}
                onChange={e => setExtraDesc(e.target.value)}
                placeholder="Descripción de cobros extra"
              />
            </div>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Método de Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="pagomovil">Pago Móvil</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            <div>
              Total Final:{" "}
              <span className="font-bold text-green-700">
                ${totalFinal.toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPago(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="yellow" onClick={procesar} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4">
        <Button variant="outline" onClick={onBack}>Regresar</Button>
      </div>
    </Card>
  );
}