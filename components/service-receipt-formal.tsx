"use client"

import { X, Printer } from "lucide-react"

interface ServiceReceiptFormalProps {
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

export default function ServiceReceiptFormal({ isOpen, onClose, serviceData }: ServiceReceiptFormalProps) {
  if (!isOpen || !serviceData) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 25px;
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
          }
          .print-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 8px 0;
            letter-spacing: 3px;
          }
          .print-header h2 {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .print-two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .print-section {
            border: 2px solid #000;
            padding: 12px;
          }
          .print-section-title {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 0 0 10px 0;
            padding: 5px;
            background-color: #f0f0f0;
            border: 1px solid #000;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .print-field {
            display: flex;
            margin: 4px 0;
            font-size: 11px;
          }
          .print-field-label {
            font-weight: bold;
            width: 80px;
            flex-shrink: 0;
          }
          .print-field-value {
            flex: 1;
            border-bottom: 1px dotted #000;
            padding-bottom: 1px;
          }
          .print-services-section {
            margin: 20px 0;
            border: 2px solid #000;
            padding: 12px;
          }
          .print-services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .print-services-table th,
          .print-services-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-size: 11px;
          }
          .print-services-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .print-services-table td:last-child {
            text-align: right;
          }
          .print-totals-section {
            margin: 15px 0;
            text-align: right;
          }
          .print-totals-box {
            display: inline-block;
            border: 2px solid #000;
            padding: 10px;
            background-color: #f9f9f9;
            min-width: 200px;
          }
          .print-total-line {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 12px;
          }
          .print-final-total {
            font-size: 14px !important;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .print-footer {
            margin-top: 25px;
            text-align: center;
            border-top: 2px solid #000;
            padding-top: 12px;
            font-size: 10px;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
          {/* Botones de control - No se imprimen */}
          <div className="no-print flex justify-between items-center p-4 border-b bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Comprobante de Servicio</h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>
          </div>

          {/* Contenido imprimible */}
          <div className="print-content p-6">
            {/* Encabezado */}
            <div className="print-header text-center mb-6 pb-4 border-b-4 border-black">
              <h1 className="text-4xl font-bold mb-2 tracking-widest">ZONA GARAJE</h1>
              <h2 className="text-lg font-bold uppercase tracking-wide">Comprobante de Servicio</h2>
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
            <div className="print-two-columns grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Datos del Cliente */}
              <div className="print-section border-2 border-black p-3">
                <h3 className="print-section-title text-xs font-bold text-center mb-3 p-2 bg-gray-100 border border-black uppercase tracking-wide">
                  Datos del Cliente
                </h3>
                <div className="space-y-1">
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Nombre:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.client.name}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Cédula:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.client.cedula}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Teléfono:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.client.phone}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Dirección:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.client.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos del Vehículo */}
              <div className="print-section border-2 border-black p-3">
                <h3 className="print-section-title text-xs font-bold text-center mb-3 p-2 bg-gray-100 border border-black uppercase tracking-wide">
                  Datos del Vehículo
                </h3>
                <div className="space-y-1">
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Marca:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.make}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Modelo:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.model}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Año:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.year}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Color:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.color}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Placa:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.plate}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Tapicería:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.upholsteryType}
                    </span>
                  </div>
                  <div className="print-field flex text-xs">
                    <span className="print-field-label font-bold w-20">Kilometraje:</span>
                    <span className="print-field-value flex-1 border-b border-dotted border-black pb-1">
                      {serviceData.vehicle.mileage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Servicios realizados */}
            <div className="print-services-section border-2 border-black p-3 mb-5">
              <h3 className="print-section-title text-xs font-bold text-center mb-3 p-2 bg-gray-100 border border-black uppercase tracking-wide">
                Servicios Realizados
              </h3>
              <table className="print-services-table w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-black p-2 bg-gray-100 font-bold text-center text-xs">
                      Descripción del Servicio
                    </th>
                    <th className="border border-black p-2 bg-gray-100 font-bold text-center text-xs w-24">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.services.map((service, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2 text-xs">{service.name}</td>
                      <td className="border border-black p-2 text-xs text-right">${service.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="print-totals-section text-right mt-4">
                <div className="print-totals-box inline-block border-2 border-black p-3 bg-gray-50">
                  <div className="print-total-line flex justify-between text-xs mb-1">
                    <span className="font-bold">Subtotal:</span>
                    <span>${serviceData.subtotal.toFixed(2)}</span>
                  </div>
                  {serviceData.discount && serviceData.discount > 0 && (
                    <div className="print-total-line flex justify-between text-xs mb-1 text-green-700">
                      <span className="font-bold">Descuento:</span>
                      <span>-${serviceData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="print-final-total flex justify-between text-sm font-bold border-t-2 border-black pt-2 mt-2">
                    <span>TOTAL A PAGAR:</span>
                    <span>${serviceData.finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="print-total-line flex justify-between text-xs mt-2">
                    <span className="font-bold">Método de pago:</span>
                    <span>{serviceData.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página */}
            <div className="print-footer text-center mt-6 pt-3 border-t-2 border-black text-xs">
              <p className="mb-1 font-bold">ZONA GARAJE - Tu carro en buenas manos</p>
              <p className="mb-1">Gracias por confiar en nuestros servicios</p>
              <p>Conserve este comprobante para futuras consultas</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
