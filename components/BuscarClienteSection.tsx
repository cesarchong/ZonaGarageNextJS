import { where } from "firebase/firestore";
import React, { useState } from "react";
import { Clientes } from "../interfaces/clientes.interface";
import { getCollection } from "../lib/firebase";

interface BuscarClienteSectionProps {
  onSeleccionCliente: (cliente: Clientes) => void;
}

export default function BuscarClienteSection({ onSeleccionCliente }: BuscarClienteSectionProps) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Búsqueda en tiempo real
  React.useEffect(() => {
    const buscar = async () => {
      if (busqueda.trim().length < 3) {
        setResultados([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        let res: any[] = [];
        if (/^\d+$/.test(busqueda.trim())) {
          res = await getCollection("clientes", [where("cedula", "==", busqueda.trim())]);
        } else {
          const todos: any[] = await getCollection("clientes");
          res = todos.filter((c) => (c.nombre || "").toLowerCase().includes(busqueda.trim().toLowerCase()));
        }
        setResultados(res);
        if (res.length === 0) setError("No se encontró ningún cliente con esa búsqueda.");
      } catch (err) {
        setError("Error al buscar cliente");
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, [busqueda]);

  return (
    <section className="mb-4">
      <span className="font-medium block mb-2">Buscar cliente existente</span>
      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
        <input
          type="text"
          placeholder="Buscar por cédula o nombre"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full sm:w-auto"
          required
        />
      </div>
      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      {resultados.length > 0 && (
        <ul className="mt-3 space-y-2">
          {resultados.map(cliente => (
            <li key={cliente.id} className="bg-white border rounded p-2 flex flex-col cursor-pointer hover:bg-yellow-50" onClick={() => onSeleccionCliente(cliente)}>
              <span className="font-medium">{cliente.nombre}</span>
              <span className="text-xs text-gray-500">Cédula: {cliente.cedula}</span>
              <span className="text-xs text-gray-500">Teléfono: {cliente.telefono}</span>
              <span className="text-xs text-gray-500">Email: {cliente.email}</span>
              <span className="text-xs text-gray-500">Dirección: {cliente.direccion}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
