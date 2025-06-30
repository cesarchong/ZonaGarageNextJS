import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SupabaseDebug() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setError(null);
      try {
        const { data: clientesData, error: clientesError } = await supabase.from("clientes").select("*");
        if (clientesError) throw clientesError;
        setClientes(clientesData || []);
      } catch (e: any) {
        setError((prev) => (prev ? prev + " | " : "") + "Error clientes: " + e.message);
      }
      try {
        const { data: empleadosData, error: empleadosError } = await supabase.from("empleados").select("*");
        if (empleadosError) throw empleadosError;
        setEmpleados(empleadosData || []);
      } catch (e: any) {
        setError((prev) => (prev ? prev + " | " : "") + "Error empleados: " + e.message);
      }
      try {
        const { data: serviciosData, error: serviciosError } = await supabase.from("servicios").select("*");
        if (serviciosError) throw serviciosError;
        setServicios(serviciosData || []);
      } catch (e: any) {
        setError((prev) => (prev ? prev + " | " : "") + "Error servicios: " + e.message);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Debug Supabase</h1>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <h2>Clientes</h2>
      <pre>{JSON.stringify(clientes, null, 2)}</pre>
      <h2>Empleados</h2>
      <pre>{JSON.stringify(empleados, null, 2)}</pre>
      <h2>Servicios</h2>
      <pre>{JSON.stringify(servicios, null, 2)}</pre>
    </div>
  );
}
