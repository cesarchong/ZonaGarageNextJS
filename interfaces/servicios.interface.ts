export interface TipoServicioRealizado {
    id: string;
    nombre: string;
    precio_base: string;
}

export interface Servicios {
    id: string;
    cliente_id: string;
    vehiculo_id: string;
    tipos_servicio_realizados: TipoServicioRealizado[]; // Array de objetos tipo de servicio realizado
    precio: string;
    productos: any[]; // Array de productos/promociones
    precio_total: string;
    descuento: string;
    pagado: boolean;
    fecha_servicio: string; // timestamp (ISO string)
    fecha: string;
    hora: string;
    observaciones: string;
    cobros_extra?: number;
    empleado_id?: string;
}