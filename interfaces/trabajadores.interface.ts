import { Timestamp } from "firebase/firestore";

export interface HorarioDia {
    fecha: string; // yyyy-mm-dd
    entrada: string; // HH:mm
    salida: string; // HH:mm
}

export interface Trabajadores {
    id: string; // varchar(20) PK
    cedula: string; // varchar(20)
    nombre: string; // varchar(100)
    cargo: string; // varchar(50)
    horario_inicio: string; // time (ISO string)
    horario_salida: string; // time (ISO string)
    estado: boolean; // tinyint(1)
    rol: string; // varchar(50)
    created_at: Timestamp; // timestamp (ISO string)
    email: string; // varchar(100)
    password: string; // varchar(100)
    uid?: string; // varchar(50) (Firebase UID)
    check_in : boolean; // indica si el trabajador ha hecho check-in
    check_out: boolean; // indica si el trabajador ha hecho check-out
    horarioDia?: HorarioDia[]; // array de horarios diarios
}