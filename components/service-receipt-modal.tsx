"use client"

import { X, Printer } from "lucide-react"

interface ServiceReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  serviceData: {
    id: string
    date: string
    client: {
      name: string
      cedula: string
      phone: string
      address: string
    }
    vehicle: {
      make: string
      model: string
      year: string
      color: string
      plate: string
      upholsteryType: string
      mileage: string
    }
    services: Array<{
      name: string
      price: number
    }>
    subtotal: number
    discount?: number
    finalTotal: number
    paymentMethod: string
  } | null
}

export default function ServiceReceiptModal({ isOpen, onClose, serviceData }: ServiceReceiptModalProps) {
  if (!isOpen || !serviceData) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          {/* Botones de control */}
          <div className="no-print flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">Comprobante de Servicio</h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>
          </div>

          {/* Contenido imprimible */}
          <div className="print-area p-8 bg-white">
            {/* Encabezado */}
            <div className="text-center mb-8 pb-4 border-b-2 border-black">
              <h1 className="text-3xl font-bold mb-2 tracking-widest">ZONA GARAJE</h1>
              <h2 className="text-lg font-bold uppercase">Comprobante de Servicio</h2>
              <div className="flex justify-between mt-4 text-sm">
                <span>
                  <strong>No.:</strong> {serviceData.id}
                </span>
                <span>
                  <strong>Fecha:</strong> {new Date(serviceData.date).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>

            {/* Datos en dos columnas */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Datos del Cliente */}
              <div className="border-2 border-black p-4">
                <h3 className="text-center font-bold mb-4 p-2 bg-gray-100 border border-black uppercase text-sm">
                  Datos del Cliente
                </h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">Nombre:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.client.name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">Cédula:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.client.cedula}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">Teléfono:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.client.phone}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-20 text-sm">Dirección:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.client.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos del Vehículo */}
              <div className="border-2 border-black p-4">
                <h3 className="text-center font-bold mb-4 p-2 bg-gray-100 border border-black uppercase text-sm">
                  Datos del Vehículo
                </h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Marca:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.make}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Modelo:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.model}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Año:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.year}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Color:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.color}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Placa:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.plate}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Tapicería:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.upholsteryType}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-bold w-24 text-sm">Kilometraje:</span>
                    <span className="flex-1 border-b border-dotted border-black text-sm">
                      {serviceData.vehicle.mileage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Servicios realizados */}
            <div className="border-2 border-black p-4 mb-6">
              <h3 className="text-center font-bold mb-4 p-2 bg-gray-100 border border-black uppercase text-sm">
                Servicios Realizados
              </h3>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="border border-black p-2 bg-gray-100 font-bold text-center text-sm">
                      Descripción del Servicio
                    </th>
                    <th className="border border-black p-2 bg-gray-100 font-bold text-center text-sm w-24">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.services.map((service, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2 text-sm">{service.name}</td>
                      <td className="border border-black p-2 text-sm text-right">${service.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="text-right">
                <div className="inline-block border-2 border-black p-4 bg-gray-50">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-bold">Subtotal:</span>
                    <span className="ml-8">${serviceData.subtotal.toFixed(2)}</span>
                  </div>
                  {serviceData.discount && serviceData.discount > 0 && (
                    <div className="flex justify-between mb-2 text-sm text-green-700">
                      <span className="font-bold">Descuento:</span>
                      <span className="ml-8">-${serviceData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t-2 border-black pt-2 mt-2">
                    <span>TOTAL A PAGAR:</span>
                    <span className="ml-8">${serviceData.finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-3 text-sm">
                    <span className="font-bold">Método de pago:</span>
                    <span className="ml-8">{serviceData.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página */}
            <div className="text-center mt-8 pt-4 border-t-2 border-black text-sm">
              <p className="font-bold mb-1">ZONA GARAJE - Tu carro en buenas manos</p>
              <p className="mb-1">Gracias por confiar en nuestros servicios</p>
              <p className="text-xs">Conserve este comprobante para futuras consultas</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
