export interface Clientes {
    id: string; // varchar(20) PK
    cedula: string; // varchar(100)
    nombre: string; // varchar(100)
    telefono: string; // varchar(25)
    email: string; // varchar(100)
    direccion: string; // varchar(255)
    activo: boolean; // tinyint(1)
    fecha_registro: string; // timestamp (ISO string)
}