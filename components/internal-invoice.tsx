"use client"

interface InternalInvoiceProps {
  service: any
  client: any
  vehicle: any
  employee: any
  onClose: () => void
}

export default function InternalInvoice({ service, client, vehicle, employee, onClose }: InternalInvoiceProps) {
  const printDocument = () => {
    const printContent = document.getElementById("internal-invoice-content")
    if (!printContent) return

    const originalContent = document.body.innerHTML
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
            color: #000;
            background: #fff;
            margin: 0;
            padding: 20mm;
            font-size: 12px;
          }
          .invoice-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            border: 2px solid #000;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            margin-bottom: 8px;
          }
          .company-subtitle {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-contact {
            font-size: 10px;
            margin-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
            border: 2px solid #000;
            padding: 0;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            background: #000;
            color: #fff;
            padding: 8px;
            margin: 0;
          }
          .section-content {
            padding: 15px;
          }
          .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .field-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-size: 11px;
          }
          .field-label {
            font-weight: bold;
            min-width: 90px;
            margin-right: 10px;
          }
          .field-line {
            flex: 1;
            border-bottom: 1px solid #000;
            height: 20px;
            padding-left: 5px;
            display: flex;
            align-items: center;
          }
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }
          .services-table th,
          .services-table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
          }
          .services-table th {
            background-color: #f8f8f8;
            font-weight: bold;
            text-align: center;
          }
          .services-table .center {
            text-align: center;
          }
          .services-table .right {
            text-align: right;
          }
          .observations-box {
            border: 1px solid #000;
            min-height: 100px;
            padding: 10px;
            margin: 0;
          }
          .signature-area {
            text-align: center;
            margin-top: 40px;
          }
          .signature-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 30px;
          }
          .signature-line {
            border-bottom: 2px solid #000;
            width: 300px;
            height: 40px;
            margin: 0 auto;
          }
        }
        @media screen {
          .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            background: white;
          }
        }
      </style>
    `

    document.body.innerHTML = printStyles + printContent.outerHTML
    window.print()
    document.body.innerHTML = originalContent
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getServiceNumber = () => {
    return `${Date.now().toString().slice(-6)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Comprobante de Servicio</h2>
            <div className="flex gap-2">
              <button onClick={printDocument} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Imprimir
              </button>
              <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div id="internal-invoice-content" className="invoice-container p-8">
          <div className="header">
            <div className="company-name">ZONA GARAJE</div>
            <div className="company-subtitle">CARACTERÍSTICAS DEL VEHÍCULO - SERVICIO</div>
            <div className="company-contact">TELÉFONO: 0414-1234567 - EMAIL: info@zonagaraje.com</div>
          </div>

          <div className="section">
            <div className="section-title">DATOS DEL CLIENTE</div>
            <div className="section-content">
              <div className="two-columns">
                <div>
                  <div className="field-row">
                    <span className="field-label">NOMBRE:</span>
                    <div className="field-line">{client?.name || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">TELÉFONO:</span>
                    <div className="field-line">{client?.phone || ""}</div>
                  </div>
                </div>
                <div>
                  <div className="field-row">
                    <span className="field-label">CÉDULA:</span>
                    <div className="field-line">{client?.idNumber || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">DIRECCIÓN:</span>
                    <div className="field-line">{client?.address || ""}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">CARACTERÍSTICAS DEL VEHÍCULO</div>
            <div className="section-content">
              <div className="two-columns">
                <div>
                  <div className="field-row">
                    <span className="field-label">MARCA:</span>
                    <div className="field-line">{vehicle?.make || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">MODELO:</span>
                    <div className="field-line">{vehicle?.model || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">AÑO:</span>
                    <div className="field-line">{vehicle?.year || ""}</div>
                  </div>
                </div>
                <div>
                  <div className="field-row">
                    <span className="field-label">COLOR:</span>
                    <div className="field-line">{vehicle?.color || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">PLACA:</span>
                    <div className="field-line">{vehicle?.licensePlate || ""}</div>
                  </div>
                  <div className="field-row">
                    <span className="field-label">TIPO TAPICERÍA:</span>
                    <div className="field-line">{vehicle?.upholstery || ""}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">TIPO DE SERVICIO</div>
            <div className="section-content">
              <table className="services-table">
                <thead>
                  <tr>
                    <th>DESCRIPCIÓN</th>
                    <th>CANTIDAD</th>
                    <th>PRECIO UNIT.</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {service?.selectedServices && service.selectedServices.length > 0 ? (
                    service.selectedServices.map((serviceItem, index) => (
                      <tr key={index}>
                        <td>{serviceItem.name}</td>
                        <td className="center">1</td>
                        <td className="right">${(serviceItem.basePrice || 0).toFixed(2)}</td>
                        <td className="right">${(serviceItem.basePrice || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : service?.basePrice > 0 ? (
                    <tr>
                      <td>{service?.typeName || "Servicio general"}</td>
                      <td className="center">1</td>
                      <td className="right">${(service.basePrice || 0).toFixed(2)}</td>
                      <td className="right">${(service.basePrice || 0).toFixed(2)}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  )}
                  {service?.products &&
                    service.products.length > 0 &&
                    service.products.map((product, index) => (
                      <tr key={`product-${index}`}>
                        <td>{product.productName}</td>
                        <td className="center">{product.quantity}</td>
                        <td className="right">${(product.total / product.quantity).toFixed(2)}</td>
                        <td className="right">${product.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  {service?.extraCharges > 0 && (
                    <tr>
                      <td>{service.extraChargesDescription || "Cobro adicional"}</td>
                      <td className="center">1</td>
                      <td className="right">${(service.extraCharges || 0).toFixed(2)}</td>
                      <td className="right">${(service.extraCharges || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "2px solid #000", fontWeight: "bold" }}>
                    <td colSpan={3} className="right">
                      TOTAL A PAGAR:
                    </td>
                    <td className="right">
                      ${((service?.totalAmount || service?.basePrice || 0) + (service?.extraCharges || 0)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <div className="section-title">OBSERVACIONES DEL SERVICIO</div>
            <div className="section-content">
              <div className="observations-box">{service?.notes || ""}</div>
            </div>
          </div>

          <div className="signature-area">
            <div className="signature-label">FIRMA DEL CLIENTE</div>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
