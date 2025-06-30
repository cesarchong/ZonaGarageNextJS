import { supabaseDb } from "./SupaBasClient"

// Función para inicializar conexión con Supabase
export async function initializeDataSync(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    console.log("🔄 Verificando conexión con Supabase...")
    
    const isConnected = await testSupabaseConnection()
    if (isConnected) {
      console.log("✅ Conexión con Supabase establecida")
    } else {
      console.warn("⚠️ No se pudo conectar con Supabase")
    }
  } catch (error) {
    console.error("❌ Error en inicialización:", error)
  }
}

// Cargar datos directamente desde Supabase
export async function loadFromSupabaseDirect(table: string): Promise<any[]> {
  try {
    switch (table) {
      case "clients":
        return await supabaseDb.getClientes()
      case "vehicles":
        return await supabaseDb.getVehiculos()
      case "services":
        return await supabaseDb.getServicios()
      case "inventory":
        return await supabaseDb.getProductos()
      case "employees":
        return await supabaseDb.getTrabajadores()
      case "payments":
        return await supabaseDb.getPagos()
      default:
        return []
    }
  } catch (error) {
    console.warn(`Error loading ${table} from Supabase:`, error)
    return []
  }
}

// Convertir datos de Supabase al formato que espera la aplicación
export function convertSupabaseToLocalFormat(item: any, table: string): any | null {
  try {
    switch (table) {
      case "clients":
        return {
          id: item.id?.toString() || Date.now().toString(),
          name: item.nombre,
          phone: item.telefono || "",
          email: item.correo || "",
          cedula: item.cedula || "",
          createdAt: item.created_at || new Date().toISOString(),
        }

      case "vehicles":
        return {
          id: item.id?.toString() || Date.now().toString(),
          clientId: item.cliente_id?.toString(),
          plate: item.placa,
          make: item.marca,
          model: item.modelo,
          year: item.año?.toString() || "",
          color: item.color || "",
          type: "Automóvil",
          createdAt: item.created_at || new Date().toISOString(),
        }

      case "services":
        return {
          id: item.id?.toString() || Date.now().toString(),
          clientId: item.cliente_id?.toString(),
          vehicleId: item.vehiculo_id?.toString(),
          typeName: item.tipo_servicio,
          total: item.precio || 0,
          notes: item.observaciones || "",
          createdAt: item.created_at || new Date().toISOString(),
        }

      case "inventory":
        return {
          id: item.id?.toString() || Date.now().toString(),
          name: item.nombre,
          category: item.categoria || "General",
          price: item.precio_venta || 0,
          cost: item.costo || 0,
          quantity: item.stock || 0,
          minStock: item.stock_minimo || 0,
          supplier: item.proveedor || "",
          associatedService: item.servicio_asociado || "",
          createdAt: item.created_at || new Date().toISOString(),
        }

      case "employees":
        return {
          id: item.id?.toString() || Date.now().toString(),
          name: item.nombre,
          position: item.cargo,
          startTime: item.horario_inicio || "08:00",
          endTime: item.horario_salida || "17:00",
          status: item.estado || "Activo",
          createdAt: item.created_at || new Date().toISOString(),
        }

      default:
        return null
    }
  } catch (error) {
    console.warn("Error converting Supabase data:", error)
    return null
  }
}

// Función para verificar conectividad con Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    await supabaseDb.getClientes()
    console.log("🟢 Conexión a Supabase: OK")
    return true
  } catch (error) {
    console.error("🔴 Conexión a Supabase: ERROR", error)
    return false
  }
}

// Función para subir datos específicos a Supabase
export async function uploadDataToSupabase(table: string, data: any[]): Promise<void> {
  if (typeof window === "undefined") return

  try {
    if (data.length > 0) {
      await uploadTableToSupabase(table, data)
      console.log(`📤 ${table}: ${data.length} registros subidos`)
    }
  } catch (error) {
    console.warn(`Error uploading ${table}:`, error)
  }
}

// Subir tabla específica a Supabase
async function uploadTableToSupabase(table: string, data: any[]): Promise<void> {
  for (const item of data) {
    try {
      switch (table) {
        case "clients":
          await supabaseDb.createCliente({
            nombre: item.name,
            cedula: item.cedula || "",
            telefono: item.phone || "",
            correo: item.email || "",
          })
          break

        case "vehicles":
          await supabaseDb.createVehiculo({
            cliente_id: item.clientId,
            marca: item.make,
            modelo: item.model,
            año: item.year ? Number.parseInt(item.year) : null,
            color: item.color || "",
            placa: item.plate,
            km: 0,
          })
          break

        case "services":
          await supabaseDb.createServicio({
            cliente_id: item.clientId,
            vehiculo_id: item.vehicleId,
            tipo_servicio: item.typeName || "Servicio general",
            precio: item.total || 0,
            observaciones: item.notes || "",
          })
          break

        case "inventory":
          await supabaseDb.createProducto({
            nombre: item.name,
            categoria: item.category || "General",
            precio_venta: item.price || 0,
            costo: item.cost || 0,
            stock: item.quantity || 0,
            stock_minimo: item.minStock || 0,
            proveedor: item.supplier || "",
            servicio_asociado: item.associatedService || "",
          })
          break

        case "employees":
          await supabaseDb.createTrabajador({
            nombre: item.name,
            cargo: item.position || "Empleado",
            horario_inicio: item.startTime || "08:00",
            horario_salida: item.endTime || "17:00",
            estado: item.status || "Activo",
          })
          break
      }
    } catch (error) {
      // Continuar con el siguiente item si hay error
      continue
    }
  }
}