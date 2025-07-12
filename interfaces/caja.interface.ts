export interface Caja {
  id: string;
  esta_abierta: boolean;
  monto_efectivo: number;
  abierta_por: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_final?: number;
  fecha_creacion: string;
}

export interface CashMovement {
  id: string;
  tipo: "abrir" | "cerrar" | "deposito" | "retiro" | "pago";
  monto: number;
  descripcion: string;
  fecha_hora: string;
  metodo_pago?: string;
  id_relacionado?: string;
  id_caja: string;
  fecha_creacion: string;
}

export interface DailyPayment {
  id: string;
  id_pago: string;
  tipo: "venta" | "servicio";
  nombre_cliente: string;
  total: number;
  metodo_pago: string;
  monto_recibido: number;
  cambio: number;
  id_cajero: string;
  fecha_creacion: string;
  productos: string[];
}