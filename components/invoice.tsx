"use client"

import { useEffect, useRef } from "react"
import React from "react"

interface InvoiceProps {
  service: any
  client: any
  vehicle: any
  employee: any
  onClose: () => void
  autoPrint?: boolean
}

export default function Invoice({ service, client, vehicle, employee, onClose, autoPrint = false }: InvoiceProps) {
  const invoiceContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoPrint) {
      // Pequeño delay para asegurar que el componente se renderice completamente
      setTimeout(() => {
        handlePrint()
      }, 500)
    }
  }, [autoPrint])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha no disponible"
    }
  }

  // Método principal de impresión que decide qué estrategia usar
  const handlePrint = () => {
    // Intentamos primero con la ventana emergente para mayor compatibilidad
    try {
      printInNewWindow()
    } catch (error) {
      console.error("Error al imprimir en ventana nueva:", error)
      // Si falla, usamos el método tradicional
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }

  // Método para imprimir en una nueva ventana (mejor para dispositivos lentos)
  const printInNewWindow = () => {
    if (!invoiceContentRef.current) return

    // Clonamos el contenido de la factura
    const invoiceContent = invoiceContentRef.current.innerHTML

    // Creamos una nueva ventana
    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) {
      alert("Por favor, permita ventanas emergentes para imprimir la factura")
      return
    }

    // Escribimos el HTML necesario con estilos inline
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura - Zona Garaje</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 15mm;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 5px 0;
            letter-spacing: 1px;
          }
          .header p {
            margin: 0 0 8px 0;
            font-size: 12px;
          }
          .header h2 {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0 5px 0;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .client-section, .vehicle-section {
            border: 1px solid #000;
            padding: 10px;
          }
          .client-section h3, .vehicle-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .client-section p, .vehicle-section p {
            margin: 4px 0;
            font-size: 12px;
          }
          .services-section {
            margin-bottom: 20px;
          }
          .services-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
            font-size: 11px;
          }
          th {
            font-weight: bold;
            text-align: center;
          }
          td:nth-child(2), td:nth-child(3), td:nth-child(4),
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: center;
          }
          .total-section {
            text-align: right;
            margin: 15px 0;
            border: 1px solid #000;
            padding: 10px;
          }
          .total-section p {
            font-size: 14px;
            font-weight: bold;
            margin: 0;
          }
          .notes-section {
            margin: 15px 0;
            border: 1px solid #000;
            padding: 10px;
          }
          .notes-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 8px 0;
          }
          .notes-section p {
            margin: 0;
            font-size: 12px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .footer p {
            margin: 4px 0;
            font-size: 12px;
          }
          @media (max-width: 500px) {
            body {
              padding: 10px;
            }
            .info-section {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            th, td {
              padding: 4px 2px;
              font-size: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div id="factura">
          ${invoiceContent}
        </div>
        <script>
          // Auto-imprimir después de cargar completamente
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Opcional: cerrar después de imprimir
              // setTimeout(function() { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="invoice-container">
      {/* Overlay y controles - solo visibles en pantalla */}
      <div className="invoice-overlay no-print">
        <div className="invoice-controls">
          <button onClick={handlePrint} className="print-btn">
            Imprimir Factura
          </button>
          <button onClick={onClose} className="close-btn">
            Cerrar
          </button>
        </div>
      </div>

      {/* Contenido de factura - optimizado para impresión */}
      <div id="factura" ref={invoiceContentRef}>
        {/* Encabezado */}
        <div className="header">
          <h1>ZONA GARAJE</h1>
          <p>Tu carro en buenas manos</p>
          <h2>FACTURA DE SERVICIO</h2>
          <p>No. {service.id?.slice(-8) || "N/A"}</p>
        </div>

        {/* Información principal */}
        <div className="info-section">
          <div className="client-section">
            <h3>CLIENTE</h3>
            <p>Nombre: {client?.name || "No disponible"}</p>
            <p>Telefono: {client?.phone || "No disponible"}</p>
            <p>Fecha: {formatDate(service.createdAt)}</p>
          </div>

          <div className="vehicle-section">
            <h3>VEHICULO</h3>
            <p>Placa: {vehicle?.plate || "No disponible"}</p>
            <p>Marca: {vehicle?.make || "No disponible"}</p>
            <p>Modelo: {vehicle?.model || "No disponible"}</p>
            <p>Trabajador: {employee?.name || "No asignado"}</p>
          </div>
        </div>

        {/* Tabla de servicios */}
        <div className="services-section">
          <h3>SERVICIOS Y PRODUCTOS</h3>
          <table>
            <thead>
              <tr>
                <th>Descripcion</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Servicio principal */}
              {service.basePrice > 0 && (
                <tr>
                  <td>{service.typeName || "Servicio general"}</td>
                  <td>1</td>
                  <td>${(service.basePrice || 0).toFixed(2)}</td>
                  <td>${(service.basePrice || 0).toFixed(2)}</td>
                </tr>
              )}

              {/* Trabajo adicional */}
              {service.additional > 0 && (
                <tr>
                  <td>Trabajo adicional</td>
                  <td>1</td>
                  <td>${(service.additional || 0).toFixed(2)}</td>
                  <td>${(service.additional || 0).toFixed(2)}</td>
                </tr>
              )}

              {/* Productos */}
              {service.products &&
                service.products.length > 0 &&
                service.products.map((product: any, index: number) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td>{product.productName}</td>
                      <td>{product.quantity}</td>
                      <td>${product.unitPrice.toFixed(2)}</td>
                      <td>${product.total.toFixed(2)}</td>
                    </tr>
                    {/* Si es una promoción, mostrar los productos incluidos */}
                    {product.isPromotion &&
                      product.includedProducts &&
                      product.includedProducts.map((includedProduct: any, idx: number) => (
                        <tr key={`included-${index}-${idx}`} className="included-product">
                          <td className="pl-6 text-sm">- {includedProduct.productName}</td>
                          <td className="text-sm">{includedProduct.quantity}</td>
                          <td className="text-sm">${includedProduct.unitPrice.toFixed(2)}</td>
                          <td className="text-sm">${includedProduct.total.toFixed(2)}</td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="total-section">
          <p>TOTAL A PAGAR: ${(service.total || 0).toFixed(2)}</p>
        </div>

        {/* Notas */}
        {service.notes && (
          <div className="notes-section">
            <h3>OBSERVACIONES</h3>
            <p>{service.notes}</p>
          </div>
        )}

        {/* Pie de página */}
        <div className="footer">
          <p>Gracias por confiar en Zona Garaje</p>
          <p>Conserve esta factura para consultas</p>
        </div>
      </div>

      <style jsx>{`
        /* Estilos para pantalla - overlay y controles */
        .invoice-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.8);
        }

        .invoice-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .invoice-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1001;
        }

        .print-btn, .close-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          font-family: Arial, sans-serif;
        }

        .print-btn {
          background-color: #000;
          color: white;
        }

        .close-btn {
          background-color: #666;
          color: white;
        }

        /* Contenido de factura - minimalista */
        #factura {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #000;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #000;
          padding-bottom: 15px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 5px 0;
          letter-spacing: 2px;
        }

        .header p {
          margin: 0 0 10px 0;
          font-size: 12px;
        }

        .header h2 {
          font-size: 18px;
          font-weight: bold;
          margin: 15px 0 5px 0;
        }

        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 25px;
        }

        .client-section, .vehicle-section {
          border: 1px solid #000;
          padding: 15px;
        }

        .client-section h3, .vehicle-section h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }

        .client-section p, .vehicle-section p {
          margin: 5px 0;
          font-size: 13px;
        }

        .services-section {
          margin-bottom: 20px;
        }

        .services-section h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 10px 0;
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }

        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }

        th {
          font-weight: bold;
          text-align: center;
        }

        td:nth-child(2), td:nth-child(3), td:nth-child(4),
        th:nth-child(2), th:nth-child(3), th:nth-child(4) {
          text-align: center;
        }

        .total-section {
          text-align: right;
          margin: 20px 0;
          border: 1px solid #000;
          padding: 15px;
        }

        .total-section p {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }

        .notes-section {
          margin: 20px 0;
          border: 1px solid #000;
          padding: 15px;
        }

        .notes-section h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }

        .notes-section p {
          margin: 0;
          font-size: 12px;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          border-top: 1px solid #000;
          padding-top: 15px;
        }

        .footer p {
          margin: 5px 0;
          font-size: 12px;
        }

        /* Estilos para impresión - ultra optimizados */
        @media print {
          /* Ocultar todo excepto la factura */
          body * {
            visibility: hidden;
          }
          
          #factura, #factura * {
            visibility: visible;
          }
          
          #factura {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 15mm;
            background: white;
            font-size: 12px;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }

          .invoice-container {
            position: static;
            background: none;
            padding: 0;
            display: block;
          }

          .header h1 {
            font-size: 20px;
          }

          .header h2 {
            font-size: 16px;
          }

          .info-section {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          th, td {
            padding: 6px;
            font-size: 11px;
          }

          .total-section p {
            font-size: 14px;
          }

          /* Forzar salto de página si es necesario */
          .services-section {
            page-break-inside: avoid;
          }
        }

        /* Optimización para móviles */
        @media (max-width: 768px) {
          #factura {
            padding: 15px;
            font-size: 13px;
          }

          .info-section {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .header h1 {
            font-size: 20px;
          }

          .header h2 {
            font-size: 16px;
          }

          th, td {
            padding: 6px 4px;
            font-size: 11px;
          }

          .print-btn, .close-btn {
            padding: 10px 16px;
            font-size: 14px;
          }

          .invoice-controls {
            top: 10px;
            right: 10px;
            flex-direction: column;
          }
        }

        /* Optimización para móviles muy pequeños */
        @media (max-width: 480px) {
          #factura {
            padding: 10px;
            font-size: 12px;
          }

          .header h1 {
            font-size: 18px;
          }

          .header h2 {
            font-size: 14px;
          }

          th, td {
            padding: 4px 2px;
            font-size: 10px;
          }

          .total-section p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
