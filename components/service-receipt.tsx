"use client"

import { useEffect } from "react";

interface ServiceReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    service: any;
    client: any;
    vehicle: any;
    employee: any;
    pagos?: any[];
  } | null;
}

export default function ServiceReceipt({ isOpen, onClose, receiptData }: ServiceReceiptProps) {
  // Manejar la clase 'dialog-open' en el body para ocultar la barra flotante móvil
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("dialog-open")
    } else {
      document.body.classList.remove("dialog-open")
    }
    return () => {
      document.body.classList.remove("dialog-open")
    }
  }, [isOpen])

  if (!isOpen || !receiptData) return null;
  const { service, client, vehicle, employee, pagos = [] } = receiptData;

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;
    // ...existing code...
  };
  // ...existing code...
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
                <strong>Nombre:</strong> {client?.name || client?.nombre || "N/A"}
              </p>
              <p>
                <strong>Teléfono:</strong> {client?.phone || client?.telefono || "N/A"}
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
                <strong>Placa:</strong> {vehicle?.plate || vehicle?.placa || "N/A"}
              </p>
              <p>
                <strong>Marca:</strong> {vehicle?.make || vehicle?.marca || "N/A"}
              </p>
              <p>
                <strong>Modelo:</strong> {vehicle?.model || vehicle?.modelo || "N/A"}
              </p>
              <p>
                <strong>Año:</strong> {vehicle?.year || vehicle?.anio || "N/A"}
              </p>
              {vehicle?.color && (
                <p>
                  <strong>Color:</strong> {vehicle.color}
                </p>
              )}
              <p>
                <strong>Empleado:</strong> {employee?.name || employee?.nombre || "No asignado"}
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
                {service.tipos_servicio_realizados && service.tipos_servicio_realizados.length > 0 ? (
                  service.tipos_servicio_realizados.map((serviceItem: any, index: number) => (
                    <tr key={`service-${index}`}>
                      <td>{serviceItem.nombre}</td>
                      <td>1</td>
                      <td>${parseFloat(serviceItem.precio_base || 0).toFixed(2)}</td>
                      <td>${parseFloat(serviceItem.precio_base || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : null}
                {/* Productos utilizados */}
                {service.productos &&
                  service.productos.length > 0 &&
                  service.productos.map((product: any, index: number) => (
                    <tr key={`product-${index}`}>
                      <td>{product.nombre || product.productName}</td>
                      <td>{product.cantidad || product.quantity || 1}</td>
                      <td>${parseFloat(product.precio_venta || product.unitPrice || 0).toFixed(2)}</td>
                      <td>${(parseFloat(product.precio_venta || product.unitPrice || "0") * parseFloat(product.cantidad || product.quantity || "1")).toFixed(2)}</td>
                    </tr>
                  ))}
                {/* Cobros extra */}
                {service.cobros_extra && (
                  <tr>
                    <td>Cobros extra</td>
                    <td>1</td>
                    <td>${parseFloat(service.cobros_extra).toFixed(2)}</td>
                    <td>${parseFloat(service.cobros_extra).toFixed(2)}</td>
                  </tr>
                )}
                {/* Descuento */}
                {service.descuento && parseFloat(service.descuento) > 0 && (
                  <tr>
                    <td className="text-green-700 font-semibold">Descuento</td>
                    <td></td>
                    <td></td>
                    <td className="text-green-700">-${parseFloat(service.descuento).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagos */}
          {pagos && pagos.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Pagos registrados</h3>
              <table>
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago, idx) => (
                    <tr key={`pago-${idx}`}>
                      <td>{pago.metodo_pago}</td>
                      <td>${parseFloat(pago.monto).toFixed(2)}</td>
                      <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                      <td>{pago.estado ? 'Pagado' : 'Pendiente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Total */}
          <div className="total-section">
            <p>TOTAL A PAGAR: ${(service.precio_total || service.finalTotal || service.total || 0).toFixed(2)}</p>
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
  );
}
