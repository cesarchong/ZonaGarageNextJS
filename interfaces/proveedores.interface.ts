export interface Proveedor {
    id: string; // varchar(20) PK
    rif: string;
    nombre: string; // varchar(100)
    contacto: string; // varchar(100)
    telefono: string; // varchar(25)
    email: string; // varchar(100)
    direccion: string; // varchar(255)
    activo: boolean; // tinyint(1)
    fecha_registro: string; // timestamp (ISO string)
}