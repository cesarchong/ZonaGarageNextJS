export interface Venta {
  id: string;
  cliente_id: string;
  vehiculo_id?: string | null;
  empleado_id?: string | null;
  productos: string; // JSON.stringify de los productos vendidos
  total: number;
  descuento: number;
  fecha_venta: string; // ISO string
  observaciones?: string;
  metodo_pago: string;
  estado: string; // "finalizado", "pendiente", etc.
}
