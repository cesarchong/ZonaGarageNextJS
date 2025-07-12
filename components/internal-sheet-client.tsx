"use client"

interface InternalInvoiceProps {
  service: any;
  client: any;
  vehicle: any;
  pagos?: any[];
  employee: any;
  onClose: () => void;
}

export default function InternalSheetClient({ service, client, vehicle, pagos = [], employee, onClose }: InternalInvoiceProps) {
  // Normalización de datos para compatibilidad con la plantilla
  const cliente = client || {};
  const vehic = vehicle || {};
  // Servicios
  const servicios = (service?.tipos_servicio_realizados || []).map((s: any) => ({
    descripcion: s.nombre,
    cantidad: 1,
    precio: parseFloat(s.precio_base) || 0,
    tipo: 'servicio',
  }));
  // Productos vendidos
  const productos = (service?.productos || []).map((p: any) => ({
    descripcion: p.nombre || p.productName || '',
    cantidad: p.cantidad || p.quantity || 1,
    precio: parseFloat(p.precio_venta || p.unitPrice || p.precio || 0) || 0,
    tipo: 'producto',
  }));
  
  // Promociones (procesar tanto del campo promociones como productos que sean promociones)
  const promocionesDirectas = (service?.promociones || []).map((promo: any) => {
    const precioPromocion = parseFloat(promo.precio_total_promocional || promo.precio || 0);
    return {
      descripcion: `PROMOCIÓN: ${promo.nombre}${promo.descripcion ? ` - ${promo.descripcion}` : ''}`,
      cantidad: 1,
      precio: precioPromocion,
      tipo: 'promocion',
    };
  });
  
  // Buscar promociones que puedan estar en el array de productos (datos antiguos)
  const promocionesEnProductos = (service?.productos || []).filter((p: any) => 
    p.tipo === 'promocion' || p.nombre?.includes('PROMOCIÓN') || p.nombre?.toLowerCase().includes('promoción')
  ).map((promo: any) => {
    const precioPromocion = parseFloat(promo.precio_total_promocional || promo.precio_venta || promo.precio || 0);
    const nombreLimpio = promo.nombre?.replace(/^PROMOCIÓN:\s*/i, '') || '';
    return {
      descripcion: `PROMOCIÓN: ${nombreLimpio}${promo.descripcion ? ` - ${promo.descripcion}` : ''}`,
      cantidad: 1,
      precio: precioPromocion,
      tipo: 'promocion',
    };
  });
  
  // Combinar todas las promociones y filtrar productos para evitar duplicados
  const promociones = [...promocionesDirectas, ...promocionesEnProductos];
  const productosLimpios = productos.filter((p: any) => 
    !p.descripcion?.toLowerCase().includes('promoción') && p.tipo !== 'promocion'
  );
  
  // Unir servicios, productos y promociones para la tabla
  const items = [...servicios, ...productosLimpios, ...promociones];
  // Calcular el total
  const total = items.reduce((acc, item) => acc + (parseFloat(item.precio) * (parseFloat(item.cantidad) || 1)), 0);
  // Fecha
  const fecha = service?.fecha_servicio ? new Date(service.fecha_servicio).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

  // Para impresión
  const printDocument = () => {
    const printContent = document.getElementById("internal-invoice-content");
    if (!printContent) return;
    
    // Crear ventana de impresión en lugar de modificar el DOM actual
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Por favor, permita ventanas emergentes para imprimir la hoja");
      return;
    }

    // Elimina cualquier texto de resolución de hoja, localhost y encabezados automáticos
    let html = printContent.outerHTML
      .replace(/Resoluci[oó]n[^<]*<br\s*\/?\s*>/gi, '')
      .replace(/localhost(:\d+)?/gi, '')
      .replace(/127\.0\.0\.1(:\d+)?/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4},? ?\d{1,2}:\d{2} ?[ap]\.m\.?.*Zona Garaje - Sistema de Gestión/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{4}.*Zona Garaje.*Sistema.*Gestión/gi, '')
      .replace(/\d{1,2}:\d{2}.*[ap]\.m\.?/gi, '');

    const printStyles = `
      <style>
        @page {
          margin: 0.5in;
          size: A4;
          /* Ocultar encabezados y pies de página del navegador */
          @top-left { content: ""; }
          @top-center { content: ""; }
          @top-right { content: ""; }
          @bottom-left { content: ""; }
          @bottom-center { content: ""; }
          @bottom-right { content: ""; }
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body { 
            background: #fff !important; 
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12pt !important;
          }
          
          .zona-factura { 
            box-shadow: none !important; 
            border: none !important; 
            background: white !important;
            page-break-inside: avoid;
          }
          
          /* Ocultar cualquier elemento que pueda mostrar URL o información del navegador */
          .no-print,
          .print-header,
          .print-footer,
          header,
          footer,
          nav,
          .navbar,
          .header,
          .footer {
            display: none !important;
          }
        }
      </style>
    `;

    // Escribir el HTML completo en la nueva ventana
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hoja Cliente - Zona Garaje</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${printStyles}
      </head>
      <body>
        ${html}
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
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-auto zona-factura border shadow-lg">
        <div className="flex justify-end p-4 gap-2">
          <button onClick={printDocument} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Imprimir</button>
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Cerrar</button>
        </div>
        <div id="internal-invoice-content" className="p-10 pt-2 pb-8 zona-factura bg-white" style={{ fontFamily: 'Arial, sans-serif', color: '#111' }}>
          <div className="flex flex-col items-center mb-6">
            {/* Logo y nombre */}
            {/* <div style={{ fontWeight: 'bold', fontSize: 36, letterSpacing: 2, marginBottom: 4 }}>ZONA GARAJE</div> */}

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            {/* Logo en base64, reemplaza el valor de src por el base64 real de tu imagen */}
            <img
            src="data:image/jpeg;base64,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"
              alt="Zona Garaje Logo"
              style={{ maxWidth: 120, height: 'auto', display: 'block' }}
            />
          </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>FECHA: <span style={{ fontWeight: 400 }}>{fecha}</span></div>
          </div>
          <div className="flex flex-row gap-8 mb-4">
            {/* Datos del cliente */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>DATOS DEL CLIENTE</div>
              <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 14 }}>{cliente.nombre || cliente.name || ''}</div>
              <div style={{ fontSize: 13 }}>{cliente.telefono || cliente.phone || ''}</div>
              <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 2 }}>Prado <span style={{ fontWeight: 400 }}>{cliente.direccion || cliente.address || ''}</span></div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>ADRESGO</div>
            </div>
            {/* Características del vehículo */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>CARACTERÍSTICAS DEL VEHICULO</div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>Marca: <span style={{ fontWeight: 400 }}>{vehic.marca || vehic.make || ''} {vehic.modelo || vehic.model || ''}</span></div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>Año: <span style={{ fontWeight: 400 }}>{vehic.anio || vehic.year || ''}</span></div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>Color: <span style={{ fontWeight: 400 }}>{vehic.color || ''}</span></div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>KM: <span style={{ fontWeight: 400 }}>_____________</span></div>
            </div>
          </div>
          {/* Tabla de servicios, productos y promociones */}
          <div className="mb-4">
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>DETALLE DE SERVICIOS, PRODUCTOS Y PROMOCIONES</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #111', padding: 6, fontWeight: 'bold', background: '#f8f8f8' }}>Descripción</th>
                  <th style={{ border: '1px solid #111', padding: 6, fontWeight: 'bold', background: '#f8f8f8' }}>Cantidad</th>
                  {/* <th style={{ border: '1px solid #111', padding: 6, fontWeight: 'bold', background: '#f8f8f8' }}>Precio</th> */}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #111', padding: 6 }}>{item.descripcion}</td>
                    <td style={{ border: '1px solid #111', padding: 6, textAlign: 'center' }}>{item.cantidad}</td>
                    {/* <td style={{ border: '1px solid #111', padding: 6, textAlign: 'right' }}>{parseFloat(item.precio).toFixed(2)}</td> */}
                  </tr>
                ))}
                {/* Fila de total */}
                {/* <tr>
                  <td style={{ border: '1px solid #111', padding: 6, fontWeight: 'bold', textAlign: 'right' }} colSpan={2}>TOTAL</td>
                  <td style={{ border: '1px solid #111', padding: 6, fontWeight: 'bold', textAlign: 'right' }}>{total.toFixed(2)}</td>
                </tr> */}
              </tbody>
            </table>
          </div>
          {/* Observaciones */}
          <div className="mb-6" style={{ marginTop: 32 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>OBSERVACIONES DEL SERVICIO</div>
            <div style={{ border: '1px solid #111', minHeight: 60, padding: 8, fontSize: 13, color: '#222', marginBottom: 2 }}>
              {service?.observaciones || service?.notes || ''}
            </div>
            {/* Líneas punteadas extra para escribir */}
            <div style={{ color: '#aaa', fontSize: 13, lineHeight: 2.5, marginTop: 18, textAlign: 'center' }}>
              {'-'.repeat(160)}<br />{'-'.repeat(160)}<br />{'-'.repeat(160)}<br />{'-'.repeat(160)}<br />{'-'.repeat(160)}
            </div>
          </div>
          {/* Firma */}
          <div className="flex flex-col items-center mt-8 mb-2" style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 18 }}>FIRMA CLIENTE</div>
            <div style={{ borderBottom: '2px solid #111', width: 260, height: 40, margin: '0 auto' }}></div>
          </div>
          {/* Nota legal */}
          <div style={{ fontSize: 11, color: '#444', textAlign: 'center', marginTop: 18 }}>
            El cliente reconoce que ha recibido el servicio y que el instalaci&oacute;n se complet&oacute; a su satisfacci&oacute;n, y que el veh&iacute;culo se recibi&oacute; en buen estado y a su rango satisfactoriamente.
          </div>
          
        </div>
      </div>
    </div>
  );
}
