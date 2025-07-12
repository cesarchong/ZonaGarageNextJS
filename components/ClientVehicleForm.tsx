import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { showToast } from "nextjs-toast-notify";
import React, { useState } from "react";

interface ClientVehicleFormProps {
  onSuccess: (client: any, vehicle: any) => void;
  onCancel: () => void;
}

export default function ClientVehicleForm({ onSuccess, onCancel }: ClientVehicleFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cedula, setCedula] = useState("");
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !cedula.trim() || !plate.trim() || !make.trim() || !model.trim() || !type) {
      showToast.error("Todos los campos marcados son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const clientData = {
        cedula: cedula.trim(),
        nombre: name.trim(),
        telefono: phone.trim(),
        email: email.trim() || "",
        direccion: address.trim() || "",
        activo: true,
        fecha_registro: new Date().toISOString(),
      };
      const clientRef = await addDoc(collection(db, "clientes"), clientData);
      const vehicleData = {
        placa: plate.toUpperCase().trim(),
        marca: make.trim(),
        modelo: model.trim(),
        anio: year ? parseInt(year) : 0,
        color: color.trim() || "",
        tipo: type,
        id_cliente: clientRef.id,
      };
      await addDoc(collection(db, "vehiculos"), vehicleData);
      showToast.success("Cliente y vehículo registrados exitosamente");
      onSuccess({ ...clientData, id: clientRef.id }, vehicleData);
    } catch (error: any) {
      showToast.error(error?.message || "Ocurrió un error al registrar el cliente y vehículo");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-semibold mb-2">Datos del Cliente</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="px-3 py-2 border rounded" />
        <input type="number" min={0} value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Cédula" className="px-3 py-2 border rounded" />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono" className="px-3 py-2 border rounded" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 border rounded" />
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección" className="px-3 py-2 border rounded" />
      </div>
      <h4 className="font-semibold mb-2 mt-4">Datos del Vehículo</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input type="text" value={plate} onChange={e => setPlate(e.target.value)} placeholder="Placa" className="px-3 py-2 border rounded" />
        <input type="text" value={make} onChange={e => setMake(e.target.value)} placeholder="Marca" className="px-3 py-2 border rounded" />
        <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Modelo" className="px-3 py-2 border rounded" />
        <input type="number" min={1900} value={year} onChange={e => setYear(e.target.value)} placeholder="Año" className="px-3 py-2 border rounded" />
        <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Color" className="px-3 py-2 border rounded" />
        <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="Tipo" className="px-3 py-2 border rounded" />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" onClick={onCancel} variant="outline">Cancelar</Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
          {loading ? "Registrando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
