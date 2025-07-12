export interface TipoServicio {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_estimada: number; // en minutos
  estado: boolean;
  id_categoria: string;
  precio_base: number;
  createAt?: string; // timestamp ISO string
}
