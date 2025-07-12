export interface PromocionProducto {
  id: string;
  nombre: string;
  precio_original: number;
  precio_promocion: number;
  cantidad_disponible: string;
  cantidad_promocion: number; // Cantidad específica incluida en la promoción
}

export interface PromocionServicio {
  id: string;
  nombre: string;
  precio_original: number;
  precio_promocion: number;
  descripcion?: string;
  cantidad_promocion: number; // Cantidad de servicios incluidos en la promoción
}

export interface Promocion {
  id: string;
  id_interno?: string; // ID interno para la lógica del negocio
  firebaseId?: string; // ID del documento en Firebase
  nombre: string;
  descripcion?: string;
  productos: PromocionProducto[]; // Array de productos con sus precios promocionales
  lista_servicios: PromocionServicio[]; // Array de servicios con sus precios promocionales
  precio_total_original: number; // Precio total sin descuento
  precio_total_promocional: number; // Precio final establecido manualmente
  activa: boolean;
  descuento?: number; // Porcentaje de descuento aplicado a la promoción
  tipo_descuento?: string;
  fecha_inicio: string; // ISO string
  fecha_fin: string; // ISO string
  fecha_creacion: string; // ISO string
  usos_realizados?: number; // Contador de usos actuales
}
