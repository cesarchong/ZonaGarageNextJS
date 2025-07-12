"use client"

interface ClientReceptionSheetProps {
  service: any
  client: any
  vehicle: any
  employee: any
  onClose: () => void
}

export default function ClientReceptionSheet({
  service,
  client,
  vehicle,
  employee,
  onClose,
}: ClientReceptionSheetProps) {
  const printDocument = () => {
    const printContent = document.getElementById("client-reception-content")
    if (!printContent) return

    // Crear ventana de impresión en lugar de modificar el DOM actual
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Por favor, permita ventanas emergentes para imprimir la hoja de recepción");
      return;
    }

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
          .reception-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            min-height: 297mm;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
          }
          .logo-img {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px auto;
            display: block;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 10px 0;
          }
          .date-field {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 12px;
            font-weight: bold;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-column h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .info-row {
            margin-bottom: 8px;
            font-size: 12px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            min-width: 60px;
          }
          .km-field {
            border-bottom: 2px solid #000;
            display: inline-block;
            min-width: 100px;
            height: 20px;
          }
          .services-section {
            margin-bottom: 30px;
          }
          .services-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .services-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
          }
          .services-table th,
          .services-table td {
            border: 1px solid #000;
            padding: 12px 8px;
            text-align: left;
            font-size: 12px;
          }
          .services-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .observations-section {
            margin-bottom: 40px;
          }
          .observations-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .dotted-lines {
            border: none;
            border-bottom: 1px dotted #000;
            margin: 8px 0;
            height: 20px;
          }
          .signature-section {
            text-align: center;
            margin: 40px 0;
          }
          .signature-section h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 30px;
            text-transform: uppercase;
          }
          .signature-line {
            border-bottom: 2px solid #000;
            width: 300px;
            margin: 0 auto;
            height: 30px;
          }
          .legal-text {
            font-size: 10px;
            text-align: center;
            margin: 30px 0;
            line-height: 1.3;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            margin-top: auto;
            padding-top: 20px;
          }
        }
        @media screen {
          .reception-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            background: white;
          }
        }
      </style>
    `

    // Escribir el HTML completo en la nueva ventana
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hoja de Recepción - Zona Garaje</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${printStyles}
      </head>
      <body>
        ${printContent.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Hoja de Recepción para el Cliente</h2>
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

        <div id="client-reception-content" className="reception-container p-8">
          {/* Header */}
          <div className="header">
            <div className="date-field">FECHA de pasped: {getCurrentDate()}</div>
            <img
              src="/images/zona-garaje-logo.svg"
              alt="Zona Garaje Logo"
              className="logo-img w-20 h-20 mx-auto mb-4"
            />
            <div className="company-name">ZONA GARAJE</div>
          </div>

          {/* Client and Vehicle Info */}
          <div className="info-section">
            <div className="info-column">
              <h3>Datos del Cliente</h3>
              <div className="info-row">
                <span className="info-label">Nombre:</span> {client?.name || "N/A"}
              </div>
              <div className="info-row">
                <span className="info-label">Teléfono:</span> {client?.phone || "N/A"}
              </div>
              <div className="info-row">
                <span className="info-label">Dirección:</span> {client?.address || "N/A"}
              </div>
            </div>
            <div className="info-column">
              <h3>Características del Vehículo</h3>
              <div className="info-row">
                <span className="info-label">Marca:</span> {vehicle?.make || "N/A"} {vehicle?.model || ""}
              </div>
              <div className="info-row">
                <span className="info-label">Año:</span> {vehicle?.year || "N/A"}
              </div>
              <div className="info-row">
                <span className="info-label">Color:</span> {vehicle?.color || "N/A"}
              </div>
              <div className="info-row">
                <span className="info-label">KM:</span> <span className="km-field"></span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="services-section">
            <h3>Tipo de Servicio</h3>
            <table className="services-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {service?.selectedServices && service.selectedServices.length > 0 ? (
                  service.selectedServices.map((serviceItem: any, index: number) => (
                    <tr key={index}>
                      <td>{serviceItem.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{service?.typeName || "Servicio general"}</td>
                  </tr>
                )}
                {service?.products &&
                  service.products.length > 0 &&
                  service.products.map((product: any, index: number) => (
                    <tr key={`product-${index}`}>
                      <td>
                        {product.productName} (x{product.quantity})
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Observations */}
          <div className="observations-section">
            <h3>Observaciones del Servicio</h3>
            {service?.notes ? (
              <div style={{ minHeight: "80px", padding: "10px", border: "1px solid #ccc" }}>{service.notes}</div>
            ) : (
              <>
                <div className="dotted-lines"></div>
                <div className="dotted-lines"></div>
                <div className="dotted-lines"></div>
                <div className="dotted-lines"></div>
              </>
            )}
          </div>

          {/* Signature */}
          <div className="signature-section">
            <h3>Firma Cliente</h3>
            <div className="signature-line"></div>
          </div>

          {/* Legal Text */}
          <div className="legal-text">
            El cliente reconoce que ha recibido el servicio y que el mismo se completó a su satisfacción, y que el
            vehículo se recibió en buen estado y su rangon pahe vielzie.
          </div>

          {/* Footer */}
          <div className="footer">www.zonagaraje.com</div>
        </div>
      </div>
    </div>
  )
}
