export interface Productos {
    id: string; // varchar(20) PK
    nombre: string; // varchar(100)
    descripcion: string; // text
    id_categoria: string; // varchar(50)
    id_tipo_servicio: string; // varchar(50)
    costo: number; // decimal(10,2)
    precio_venta: number; // decimal(10,2)
    cantidad_disponible: string;
    stock_minimo: string;
    id_proveedor: string; // varchar(50)
    }