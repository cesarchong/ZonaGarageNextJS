"use client"

import { useRef } from "react"

interface ServicePrintSheetProps {
  service: any
  client: any
  vehicle: any
  employee: any
  pagos?: any[]
  onClose: () => void
  printType?: "complete" | "client"
}

export default function ServicePrintSheet({
  service,
  client,
  vehicle,
  employee,
  pagos = [],
  onClose,
  printType = "complete",
}: ServicePrintSheetProps) {
  const printContentRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return "Fecha no disponible"
    }
  }

  // Flag para bloquear la UI durante la impresión (opcional, por si quieres deshabilitar botones)
  // const [printing, setPrinting] = useState(false)

  const handlePrint = (type: "complete" | "client") => {
    // Cierra el modal automáticamente después de imprimir o guardar PDF
    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint)
      onClose()
    }
    window.addEventListener('afterprint', onAfterPrint)
    printInNewWindow(type)
  }

  const printInNewWindow = (type: "complete" | "client") => {
    if (!printContentRef.current) return

    const printWindow = window.open("", "_blank", "width=800,height=600")
    if (!printWindow) {
      alert("Por favor, permita ventanas emergentes para imprimir")
      return
    }

    const hideClass = type === "client" ? "hide-prices" : ""

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zona Garaje - Hoja de Recepción</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          
          .print-sheet {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm 10mm;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 10px;
          }
          
          .logo {
            width: 100px;
            height: auto;
            margin: 0 auto 15px;
            display: block;
            max-width: 100px;
          }
          
          .header h1 {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .header h2 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .document-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 0;
          }
          
          .document-info p {
            margin: 5px 0;
            font-size: 12px;
          }
          
          .info-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          
          .client-info, .vehicle-info {
            width: 48%;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: bold;
            width: 80px;
            margin-right: 10px;
          }
          
          .info-value {
            flex: 1;
          }
          
          .services-section {
            margin-bottom: 20px;
          }
          
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .services-table th,
          .services-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          
          .services-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .price-column {
            text-align: right;
            width: 100px;
          }
          
          .total-section {
            text-align: right;
            margin: 15px 0;
            padding: 10px;
            border-top: 1px solid #000;
          }
          
          .total-section p {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
          }
          
          .observations-section {
            margin-bottom: 20px;
          }
          
          .observations-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .observations-content {
            border: 1px solid #000;
            padding: 10px;
            min-height: 80px;
          }
          
          .signature-section {
            margin-top: 30px;
            margin-bottom: 20px;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            height: 40px;
            margin-bottom: 5px;
          }
          
          .signature-label {
            font-size: 12px;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #000;
            font-size: 10px;
            color: #666;
          }
          
          /* Ocultar precios para versión cliente */
          .hide-prices .price-column,
          .hide-prices .total-section {
            display: none !important;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .print-sheet {
              width: 100%;
              height: 100%;
              padding: 10mm;
              border: none;
            }
            
            .hide-prices .price-column,
            .hide-prices .total-section {
              display: none !important;
            }
          }
        </style>
      </head>
      <body class="${hideClass}">
        ${generatePrintContent()}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  const generatePrintContent = () => {
    // Tabla de pagos
    const pagosTable = pagos && pagos.length > 0 ? `
      <div class="services-section">
        <div class="section-title">PAGOS REGISTRADOS</div>
        <table class="services-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Método</th>
              <th>Monto</th>
              <th>Referencia</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${pagos
              .map(
                (p: any) => `
                  <tr>
                    <td>${formatDate(p.fecha_pago)}</td>
                    <td>${p.metodo_pago || "-"}</td>
                    <td>$${Number(p.monto || 0).toFixed(2)}</td>
                    <td>${p.referencia || "-"}</td>
                    <td>${p.observaciones || ""}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    ` : '';
    return `
      <div class="print-sheet">
        <!-- Header con Logo Centrado -->
        <div class="header">
          <img src="/images/zona-garaje-logo.svg" alt="Zona Garaje Logo" class="logo" />
          <h1>ZONA GARAJE</h1>
          <h2>HOJA DE RECEPCIÓN</h2>
          <p>Tu carro en buenas manos</p>
        </div>

        <!-- Información del Documento -->
        <div class="document-info">
          <div>
            <p><strong>No. Servicio:</strong> ${service.id?.slice(-8) || "N/A"}</p>
          </div>
          <div>
            <p><strong>Fecha:</strong> ${formatDate(service.createdAt)}</p>
            <p><strong>Técnico:</strong> ${employee?.name || "No asignado"}</p>
          </div>
        </div>

        <!-- Información del Cliente y Vehículo -->
        <div class="info-grid">
          <div class="client-info">
            <div class="section-title">DATOS DEL CLIENTE</div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${client?.name || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${client?.phone || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dirección:</span>
              <span class="info-value">${client?.address || ""}</span>
            </div>
          </div>

          <div class="vehicle-info">
            <div class="section-title">DATOS DEL VEHÍCULO</div>
            <div class="info-row">
              <span class="info-label">Marca:</span>
              <span class="info-value">${vehicle?.make || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Modelo:</span>
              <span class="info-value">${vehicle?.model || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Placa:</span>
              <span class="info-value">${vehicle?.plate || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Año:</span>
              <span class="info-value">${vehicle?.year || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tapicería:</span>
              <span class="info-value">${vehicle?.seatType || ""}</span>
            </div>
          </div>
        </div>

        <!-- Servicios Realizados -->
        <div class="services-section">
          <div class="section-title">SERVICIOS APLICADOS</div>
          <table class="services-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Servicio</th>
                <th>Descripción</th>
                <th class="price-column">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${
                service.basePrice > 0
                  ? `
                <tr>
                  <td>S001</td>
                  <td>${service.typeName || "Servicio general"}</td>
                  <td>Servicio estándar</td>
                  <td class="price-column">$${(service.basePrice || 0).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              
              ${
                service.additional > 0
                  ? `
                <tr>
                  <td>A001</td>
                  <td>Trabajo adicional</td>
                  <td>${service.additionalDescription || "Trabajo adicional requerido"}</td>
                  <td class="price-column">$${(service.additional || 0).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              
              ${
                service.products
                  ? service.products
                      .map(
                        (product: any, index: number) => `
                <tr>
                  <td>P${(index + 1).toString().padStart(3, "0")}</td>
                  <td>${product.productName}</td>
                  <td>Cantidad: ${product.quantity}</td>
                  <td class="price-column">$${product.total.toFixed(2)}</td>
                </tr>
              `,
                      )
                      .join("")
                  : ""
              }
              
              ${
                service.extraCharges > 0
                  ? `
                <tr>
                  <td>E001</td>
                  <td>Cargo extra</td>
                  <td>${service.extraChargesDescription || "Cargo adicional"}</td>
                  <td class="price-column">$${(service.extraCharges || 0).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
            </tbody>
          </table>

          ${
            service.discount > 0
              ? `
            <div class="total-section">
              <p>Subtotal: $${((service.finalTotal || service.total || 0) + (service.discount || 0)).toFixed(2)}</p>
              <p>Descuento: -$${(service.discount || 0).toFixed(2)}</p>
            </div>
          `
              : ""
          }

          <div class="total-section">
            <p>TOTAL: $${(service.finalTotal || service.total || 0).toFixed(2)}</p>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="observations-section">
          <div class="observations-title">OBSERVACIONES</div>
          <div class="observations-content">
            ${service.notes || service.observaciones || ""}
          </div>
        </div>

        <!-- Pagos -->
        ${pagosTable}

        <!-- Firma del Cliente -->
        <div class="signature-section">
          <div class="signature-line"></div>
          <div class="signature-label">Firma del Cliente</div>
        </div>

        <!-- Pie de página -->
        <div class="footer">
          <p>ZONA GARAJE - Todos los derechos reservados</p>
          <p>Este documento certifica la recepción del vehículo y los servicios solicitados.</p>
          <p>Para cualquier consulta o reclamo, conserve este documento.</p>
        </div>
      </div>
    `
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Hoja de Recepción - Zona Garaje</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handlePrint("complete")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <i className="fas fa-print"></i>
                Imprimir Hoja Completa
              </button>
              <button
                onClick={() => handlePrint("client")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <i className="fas fa-print"></i>
                Imprimir Hoja para Cliente
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                ✕
              </button>
            </div>
          </div>

          {/* Vista previa */}
          <div
            ref={printContentRef}
            className="border border-gray-300 bg-white p-8 max-w-full overflow-x-auto"
            style={{ minHeight: "297mm", width: "210mm", margin: "0 auto" }}
            dangerouslySetInnerHTML={{ __html: generatePrintContent() }}
          />
        </div>
      </div>
    </div>
  )
}
