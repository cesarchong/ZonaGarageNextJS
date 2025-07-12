export interface Vehiculos {
    id: string; // varchar(20) PK
    placa: string; // varchar(10)
    marca: string; // varchar(50)
    modelo: string; // varchar(50)
    anio: number; // int
    color: string; // varchar(30)
    tipo: string; // varchar(30)
    tipo_asiento?: string; // varchar(30) nullable
    id_cliente: string;

}