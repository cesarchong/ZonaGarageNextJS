"use client"

interface ServiceReceiptProps {
  isOpen: boolean
  onClose: () => void
  receiptData: {
    service: any
    client: any
    vehicle: any
    employee: any
  } | null
}

export default function ServiceReceipt({ isOpen, onClose, receiptData }: ServiceReceiptProps) {
  if (!isOpen || !receiptData) return null

  const { service, client, vehicle, employee } = receiptData

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content")
    if (!printContent) return

    const originalContent = document.body.innerHTML
    const printableContent = printContent.innerHTML

    const printStyles = `
      <style>
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000 !important;
            background: #fff !important;
            margin: 0;
            padding: 20px;
            font-size: 12px;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .receipt-header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
            letter-spacing: 1px;
          }
          .receipt-header p {
            margin: 0 0 8px 0;
            font-size: 14px;
          }
          .receipt-header h2 {
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0 5px 0;
            color: #333;
          }
          .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-section {
            border: 2px solid #000;
            padding: 15px;
          }
          .info-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 10px 0;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .info-section p {
            margin: 8px 0;
            font-size: 13px;
            font-weight: 500;
          }
          .services-section {
            margin-bottom: 20px;
          }
          .services-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 15px 0;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
            font-size: 12px;
          }
          th {
            font-weight: bold;
            background-color: #f5f5f5;
          }
          .total-section {
            text-align: right;
            margin: 20px 0;
            border: 2px solid #000;
            padding: 15px;
            background-color: #f9f9f9;
          }
          .total-section p {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 15px;
          }
          .receipt-footer p {
            margin: 5px 0;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    `

    document.body.innerHTML = printStyles + "<div>" + printableContent + "</div>"
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Botones de acción - No imprimibles */}
        <div className="no-print flex justify-end p-4 border-b">
          <button onClick={onClose} className="mr-3 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            Cerrar
          </button>
          <button onClick={handlePrint} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Imprimir
          </button>
        </div>

        {/* Contenido imprimible */}
        <div id="receipt-content" className="p-6">
          {/* Header */}
          <div className="receipt-header">
            <h1>ZONA GARAJE</h1>
            <p>Tu carro en buenas manos</p>
            <h2>COMPROBANTE DE SERVICIO</h2>
            <p>No. {service.id?.slice(-8) || "N/A"}</p>
            <p>Fecha: {new Date(service.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>

          {/* Información del cliente y vehículo */}
          <div className="receipt-info">
            <div className="info-section">
              <h3>INFORMACIÓN DEL CLIENTE</h3>
              <p>
                <strong>Nombre:</strong> {client?.name || "N/A"}
              </p>
              <p>
                <strong>Teléfono:</strong> {client?.phone || "N/A"}
              </p>
              <p>
                <strong>Cédula:</strong> {client?.cedula || "N/A"}
              </p>
              {client?.email && (
                <p>
                  <strong>Email:</strong> {client.email}
                </p>
              )}
            </div>

            <div className="info-section">
              <h3>INFORMACIÓN DEL VEHÍCULO</h3>
              <p>
                <strong>Placa:</strong> {vehicle?.plate || "N/A"}
              </p>
              <p>
                <strong>Marca:</strong> {vehicle?.make || "N/A"}
              </p>
              <p>
                <strong>Modelo:</strong> {vehicle?.model || "N/A"}
              </p>
              <p>
                <strong>Año:</strong> {vehicle?.year || "N/A"}
              </p>
              {vehicle?.color && (
                <p>
                  <strong>Color:</strong> {vehicle.color}
                </p>
              )}
              <p>
                <strong>Empleado:</strong> {employee?.name || "No asignado"}
              </p>
            </div>
          </div>

          {/* Servicios realizados */}
          <div className="services-section">
            <h3>SERVICIOS REALIZADOS</h3>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Servicios base */}
                {service.selectedServices && service.selectedServices.length > 0 ? (
                  service.selectedServices.map((serviceItem: any, index: number) => (
                    <tr key={`service-${index}`}>
                      <td>{serviceItem.name}</td>
                      <td>1</td>
                      <td>${(serviceItem.basePrice || 0).toFixed(2)}</td>
                      <td>${(serviceItem.basePrice || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : service.basePrice > 0 ? (
                  <tr>
                    <td>{service.typeName || "Servicio general"}</td>
                    <td>1</td>
                    <td>${(service.basePrice || 0).toFixed(2)}</td>
                    <td>${(service.basePrice || 0).toFixed(2)}</td>
                  </tr>
                ) : null}

                {/* Productos utilizados */}
                {service.products &&
                  service.products.length > 0 &&
                  service.products.map((product: any, index: number) => (
                    <tr key={`product-${index}`}>
                      <td>{product.productName}</td>
                      <td>{product.quantity}</td>
                      <td>${product.unitPrice.toFixed(2)}</td>
                      <td>${product.total.toFixed(2)}</td>
                    </tr>
                  ))}

                {/* Trabajo adicional */}
                {service.additional > 0 && (
                  <tr>
                    <td>Trabajo adicional</td>
                    <td>1</td>
                    <td>${(service.additional || 0).toFixed(2)}</td>
                    <td>${(service.additional || 0).toFixed(2)}</td>
                  </tr>
                )}

                {/* Cobros extra */}
                {service.extraCharges > 0 && (
                  <tr>
                    <td>{service.extraChargesDescription || "Cobro adicional"}</td>
                    <td>1</td>
                    <td>${(service.extraCharges || 0).toFixed(2)}</td>
                    <td>${(service.extraCharges || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Descuentos aplicados */}
          {service.discount > 0 && (
            <div className="text-right mb-4 p-3 border border-green-500 bg-green-50">
              <p className="text-green-700 font-semibold">DESCUENTO APLICADO: -${(service.discount || 0).toFixed(2)}</p>
            </div>
          )}

          {/* Total */}
          <div className="total-section">
            <p>TOTAL A PAGAR: ${(service.finalTotal || service.total || 0).toFixed(2)}</p>
          </div>

          {/* Observaciones */}
          {service.notes && (
            <div className="mb-6 p-4 border border-gray-300">
              <h3 className="font-semibold mb-2">OBSERVACIONES</h3>
              <p className="text-sm">{service.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="receipt-footer">
            <p>Gracias por confiar en Zona Garaje</p>
            <p>Conserve este comprobante para consultas</p>
            <p>Este documento no constituye una factura fiscal</p>
          </div>
        </div>
      </div>
    </div>
  )
}
