import type { Caja } from "../interfaces/caja.interface";

// Función auxiliar para registrar pagos en efectivo en la caja
export const registrarPagoEnCaja = async (monto: number, servicioId: string, clienteNombre: string, tipoOperacion: 'servicio' | 'venta' = 'servicio') => {
  try {
    const { getCollection, addDocument, updateDocument } = await import("./firebase");
    
    // Buscar la caja activa (abierta)
    const cajas = await getCollection("cajas");
    const cajaActiva = cajas.find((caja: any) => caja.esta_abierta === true) as Caja;
    
    if (!cajaActiva) {
      console.warn("No hay una caja abierta para registrar el pago en efectivo");
      return false;
    }

    // Registrar movimiento en la caja
    const movimientoDoc = {
      tipo: "pago",
      monto: monto,
      descripcion: tipoOperacion === 'servicio' 
        ? `Pago en efectivo - Servicio para ${clienteNombre}`
        : `Pago en efectivo - Venta de productos para ${clienteNombre}`,
      id_caja: cajaActiva.id,
      fecha_hora: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      metodo_pago: "efectivo",
      id_relacionado: servicioId,
    };
    
    await addDocument("movimientos_caja", movimientoDoc);
    
    // Actualizar el monto de efectivo en la caja
    const montoAnterior = cajaActiva.monto_efectivo || 0;
    const nuevoMontoEfectivo = montoAnterior + monto;
    
    console.log(`Actualizando caja: Monto anterior: $${montoAnterior}, Pago: $${monto}, Nuevo total: $${nuevoMontoEfectivo}`);
    
    await updateDocument(`cajas/${cajaActiva.id}`, {
      monto_efectivo: nuevoMontoEfectivo
    });
    
    console.log(`Pago en efectivo de $${monto} registrado en caja. Total en caja: $${nuevoMontoEfectivo}`);
    
    // Disparar evento personalizado para notificar que se actualizó la caja
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cajaUpdated', { 
        detail: { 
          nuevoMonto: nuevoMontoEfectivo,
          pago: monto,
          descripcion: movimientoDoc.descripcion
        } 
      }));
    }
    
    return true;
  } catch (error) {
    console.error("Error al registrar pago en caja:", error);
    return false;
  }
};

// Función auxiliar para revertir pagos en efectivo de la caja al eliminar un servicio
export const revertirPagoEnCaja = async (monto: number, servicioId: string, clienteNombre: string, tipoOperacion: 'servicio' | 'venta' = 'servicio') => {
  try {
    const { getCollection, addDocument, updateDocument } = await import("./firebase");
    
    // Buscar la caja activa (abierta)
    const cajas = await getCollection("cajas");
    const cajaActiva = cajas.find((caja: any) => caja.esta_abierta === true) as Caja;
    
    if (!cajaActiva) {
      console.warn("No hay una caja abierta para revertir el pago en efectivo");
      return false;
    }

    // Registrar movimiento de reversión en la caja
    const movimientoDoc = {
      tipo: "retiro",
      monto: monto,
      descripcion: tipoOperacion === 'servicio' 
        ? `Reversión - Eliminación de servicio para ${clienteNombre}`
        : `Reversión - Eliminación de venta para ${clienteNombre}`,
      id_caja: cajaActiva.id,
      fecha_hora: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      metodo_pago: "efectivo",
      id_relacionado: servicioId,
    };
    
    await addDocument("movimientos_caja", movimientoDoc);
    
    // Actualizar el monto de efectivo en la caja (restar el monto)
    const montoAnterior = cajaActiva.monto_efectivo || 0;
    const nuevoMontoEfectivo = Math.max(0, montoAnterior - monto);
    
    console.log(`Revirtiendo pago: Monto anterior: $${montoAnterior}, Revertir: $${monto}, Nuevo total: $${nuevoMontoEfectivo}`);
    
    await updateDocument(`cajas/${cajaActiva.id}`, {
      monto_efectivo: nuevoMontoEfectivo
    });
    
    console.log(`Pago en efectivo de $${monto} revertido de la caja. Total en caja: $${nuevoMontoEfectivo}`);
    
    // Disparar evento personalizado para notificar que se actualizó la caja
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cajaUpdated', { 
        detail: { 
          nuevoMonto: nuevoMontoEfectivo,
          reversion: monto,
          descripcion: movimientoDoc.descripcion
        } 
      }));
    }
    return true;
  } catch (error) {
    console.error("Error al revertir pago en caja:", error);
    return false;
  }
};

// Función auxiliar para eliminar servicio con todas las reversiones necesarias
export const eliminarServicioCompleto = async (servicioId: string) => {
  try {
    console.log(`🚀 Iniciando eliminación completa del servicio: ${servicioId}`);
    
    const { getCollection, deleteDocument, updateDocument } = await import("./firebase");
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    
    // 1. Obtener los datos del servicio usando el ID principal de Firestore
    console.log(`📄 Obteniendo datos del servicio desde Firestore...`);
    const servicioRef = doc(db, "servicios", servicioId);
    const servicioDoc = await getDoc(servicioRef);
    
    if (!servicioDoc.exists()) {
      console.error(`❌ Servicio no encontrado con ID: ${servicioId}`);
      throw new Error("Servicio no encontrado");
    }
    
    const servicio: any = servicioDoc.data();
    console.log(`✅ Servicio encontrado:`, {
      cliente_id: servicio.cliente_id,
      precio_total: servicio.precio_total,
      fecha_servicio: servicio.fecha_servicio
    });

    // 2. Obtener los pagos relacionados usando consulta específica
    console.log(`📋 Buscando pagos con servicio_id: ${servicioId}`);
    
    // Usar consulta específica para obtener solo los pagos relacionados
    const { where } = await import("firebase/firestore");
    const pagosServicio = await getCollection("pagos", [where("servicio_id", "==", servicioId)]);
    
    console.log(`🎯 Pagos encontrados para este servicio: ${pagosServicio.length}`);
    
    // Log detallado de los pagos relacionados
    pagosServicio.forEach((pago: any, index) => {
      console.log(`💳 Pago ${index + 1}:`, {
        firestoreId: pago.id, // ID principal de Firestore
        servicio_id: pago.servicio_id,
        monto: pago.monto,
        metodo_pago: pago.metodo_pago,
        // Mostrar también todos los campos para debug
        allFields: pago
      });
    });

    // 3. Revertir productos del inventario
    if (servicio.productos && Array.isArray(servicio.productos)) {
      for (const producto of servicio.productos) {
        if (producto.id) {
          const productoRef = doc(db, "productos", producto.id);
          const productoDoc = await getDoc(productoRef);
          
          if (productoDoc.exists()) {
            const productoData = productoDoc.data();
            const stockActual = parseInt(productoData.cantidad_disponible || '0');
            const cantidadARevertir = producto.cantidad || 1;
            const nuevoStock = stockActual + cantidadARevertir;
            
            await updateDocument(`productos/${producto.id}`, {
              cantidad_disponible: String(nuevoStock)
            });
            
            console.log(`Stock revertido para producto ${producto.nombre}: +${cantidadARevertir} (Total: ${nuevoStock})`);
          }
        }
      }
    }

    // 4. Revertir productos incluidos en promociones
    if (servicio.promociones && Array.isArray(servicio.promociones)) {
      for (const promocion of servicio.promociones) {
        if (promocion.productos && Array.isArray(promocion.productos)) {
          for (const prodPromo of promocion.productos) {
            if (prodPromo.id) {
              const productoRef = doc(db, "productos", prodPromo.id);
              const productoDoc = await getDoc(productoRef);
              
              if (productoDoc.exists()) {
                const productoData = productoDoc.data();
                const stockActual = parseInt(productoData.cantidad_disponible || '0');
                const cantidadARevertir = (prodPromo.cantidad || 1) * (promocion.cantidad || 1);
                const nuevoStock = stockActual + cantidadARevertir;
                
                await updateDocument(`productos/${prodPromo.id}`, {
                  cantidad_disponible: String(nuevoStock)
                });
                
                console.log(`Stock revertido para producto en promoción ${prodPromo.nombre}: +${cantidadARevertir} (Total: ${nuevoStock})`);
              }
            }
          }
        }
      }
    }

    // 5. Revertir pagos en efectivo de la caja
    for (const pago of pagosServicio) {
      if ((pago as any).metodo_pago === "efectivo") {
        // Obtener el nombre del cliente desde la colección de clientes
        let clienteNombre = "Cliente desconocido";
        if (servicio.cliente_id) {
          try {
            const clientes = await getCollection("clientes");
            const cliente: any = clientes.find((c: any) => c.id === servicio.cliente_id);
            if (cliente && cliente.nombre) {
              clienteNombre = cliente.nombre;
            }
          } catch (error) {
            console.warn("Error al obtener nombre del cliente:", error);
          }
        }
        
        await revertirPagoEnCaja(Number((pago as any).monto), servicioId, clienteNombre, 'servicio');
      }
    }

    // 6. Eliminar los pagos relacionados
    console.log(`🗑️ Iniciando eliminación de pagos...`);
    
    // Método 1: Eliminar usando el pago_id del servicio (más directo)
    if (servicio.pago_id) {
      try {
        console.log(`🔥 Eliminando pago directo con ID: ${servicio.pago_id}`);
        await deleteDocument(`pagos/${servicio.pago_id}`);
        console.log(`✅ Pago principal eliminado exitosamente: ${servicio.pago_id}`);
      } catch (error) {
        console.error(`❌ Error al eliminar pago principal ${servicio.pago_id}:`, error);
        // Continuar con el método de respaldo
      }
    }
    
    // Método 2: Eliminar usando consulta por servicio_id (respaldo para pagos adicionales)
    console.log(`🔍 Buscando pagos adicionales con servicio_id: ${servicioId}`);
    for (const pago of pagosServicio) {
      try {
        // Solo eliminar si no es el mismo pago que ya eliminamos
        if (pago.id !== servicio.pago_id) {
          const pagoId = pago.id;
          console.log(`🔥 Eliminando pago adicional con ID: ${pagoId}`);
          console.log(`📋 Datos del pago:`, {
            id: pago.id,
            servicio_id: (pago as any).servicio_id,
            monto: (pago as any).monto,
            metodo_pago: (pago as any).metodo_pago
          });
          
          await deleteDocument(`pagos/${pagoId}`);
          console.log(`✅ Pago adicional eliminado exitosamente: ${pagoId}`);
        }
      } catch (error) {
        console.error(`❌ Error al eliminar pago adicional ${pago.id}:`, error);
        throw error; // Re-lanzar el error para que se maneje en el nivel superior
      }
    }

    // 7. Eliminar el servicio
    await deleteDocument(`servicios/${servicioId}`);
    console.log(`Servicio eliminado: ${servicioId}`);

    return true;
  } catch (error) {
    console.error("Error al eliminar servicio completo:", error);
    throw error;
  }
};

// Función auxiliar para verificar el estado actual de la caja (debug)
export const verificarEstadoCaja = async () => {
  try {
    const { getCollection } = await import("./firebase");
    const cajas = await getCollection("cajas");
    const cajaActiva = cajas.find((caja: any) => caja.esta_abierta === true) as Caja;
    
    if (cajaActiva) {
      console.log("🔍 Estado actual de la caja:", {
        id: cajaActiva.id,
        esta_abierta: cajaActiva.esta_abierta,
        monto_inicial: cajaActiva.monto_inicial,
        monto_efectivo: cajaActiva.monto_efectivo,
        fecha_apertura: cajaActiva.fecha_apertura
      });
      return cajaActiva;
    } else {
      console.log("❌ No hay caja abierta");
      return null;
    }
  } catch (error) {
    console.error("Error al verificar estado de caja:", error);
    return null;
  }
};

// Función de debug para verificar un pago específico
export const verificarPago = async (pagoId: string) => {
  try {
    console.log(`🔍 Verificando pago con ID: ${pagoId}`);
    
    const { getDocument } = await import("./firebase");
    const pago = await getDocument(`pagos/${pagoId}`);
    
    if (pago) {
      console.log(`✅ Pago encontrado:`, pago);
      return pago;
    } else {
      console.log(`❌ Pago no encontrado con ID: ${pagoId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error al verificar pago ${pagoId}:`, error);
    return null;
  }
};
