export interface Pagos {
    id: string; // varchar(20) PK
    servicio_id: string; // ID del servicio asociado
    metodo_pago: string; // Método de pago (efectivo, tarjeta, etc.)
    monto: number; // Monto del pago
    fecha_pago: string; // Fecha del pago (timestamp ISO string)
    estado: boolean; // Estado del pago (true = pagado, false = pendiente)
    observaciones?: string; // Observaciones opcionales
    cliente_id: string; // ID del cliente que realizó el pago
}