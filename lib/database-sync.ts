import { supabaseDb } from "./SupaBasClient";

// Sistema de base de datos usando solo Supabase
export class DatabaseSync {
  private static instance: DatabaseSync
  private isOnline: boolean = typeof window !== "undefined" ? navigator.onLine : false
  private syncQueue: Array<{ table: string; action: string; data: any }> = []

  constructor() {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    // Detectar cambios de conectividad
    this.isOnline = navigator.onLine

    window.addEventListener("online", () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
    })
  }

  static getInstance(): DatabaseSync {
    if (!DatabaseSync.instance) {
      DatabaseSync.instance = new DatabaseSync()
    }
    return DatabaseSync.instance
  }

  // Función principal: guarda en Supabase
  async saveData(table: string, data: any[]): Promise<void> {
    try {
      // Solo ejecutar en el cliente
      if (typeof window === "undefined") return

      // Si hay internet, sincronizar con Supabase
      if (this.isOnline) {
        await this.syncToSupabase(table, data)
      } else {
        // Si no hay internet, agregar a la cola de sincronización
        this.addToSyncQueue(table, "update", data)
      }
    } catch (error) {
      console.warn(`Error syncing ${table} to Supabase:`, error)
    }
  }

  // Función principal: lee desde Supabase
  async loadData(table: string): Promise<any[]> {
    try {
      // Solo ejecutar en el cliente
      if (typeof window === "undefined") return []

      // Si hay internet, cargar desde Supabase
      if (this.isOnline) {
        try {
          const cloudData = await this.loadFromSupabase(table)
          return cloudData || []
        } catch (error) {
          console.warn(`Error loading ${table} from Supabase:`, error)
          return []
        }
      }

      // Si no hay internet, devolver array vacío
      return []
    } catch (error) {
      console.warn(`Error in loadData for ${table}:`, error)
      return []
    }
  }

  // Sincronizar datos específicos con Supabase
  private async syncToSupabase(table: string, data: any[]): Promise<void> {
    try {
      switch (table) {
        case "clients":
          await this.syncClients(data)
          break
        case "vehicles":
          await this.syncVehicles(data)
          break
        case "services":
          await this.syncServices(data)
          break
        case "inventory":
          await this.syncProducts(data)
          break
       
        case "payments":
          await this.syncPayments(data)
          break
        default:
          console.log(`Sync not implemented for table: ${table}`)
      }
    } catch (error) {
      console.warn(`Error syncing ${table}:`, error)
      throw error
    }
  }

  // Cargar datos específicos desde Supabase
  private async loadFromSupabase(table: string): Promise<any[]> {
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

  // Sincronizar clientes
  private async syncClients(clients: any[]): Promise<void> {
    for (const client of clients) {
      try {
        await supabaseDb.createCliente({
          nombre: client.name,
          cedula: client.cedula || "",
          telefono: client.phone || "",
          correo: client.email || "",
        })
      } catch (error) {
        continue
      }
    }
  }

  // Sincronizar vehículos
  private async syncVehicles(vehicles: any[]): Promise<void> {
    for (const vehicle of vehicles) {
      try {
        await supabaseDb.createVehiculo({
          cliente_id: vehicle.clientId,
          marca: vehicle.make,
          modelo: vehicle.model,
          año: vehicle.year ? Number.parseInt(vehicle.year) : null,
          color: vehicle.color || "",
          placa: vehicle.plate,
          km: 0,
        })
      } catch (error) {
        continue
      }
    }
  }

  // Sincronizar servicios
  private async syncServices(services: any[]): Promise<void> {
    for (const service of services) {
      try {
        await supabaseDb.createServicio({
          cliente_id: service.clientId,
          vehiculo_id: service.vehicleId,
          tipo_servicio: service.typeName || "Servicio general",
          precio: service.total || 0,
          observaciones: service.notes || "",
        })
      } catch (error) {
        continue
      }
    }
  }

  // Sincronizar productos
  private async syncProducts(products: any[]): Promise<void> {
    for (const product of products) {
      try {
        await supabaseDb.createProducto({
          nombre: product.name,
          categoria: product.category || "General",
          precio_venta: product.price || 0,
          costo: product.cost || 0,
          stock: product.quantity || 0,
          stock_minimo: product.minStock || 0,
          proveedor: product.supplier || "",
          servicio_asociado: product.associatedService || "",
        })
      } catch (error) {
        continue
      }
    }
  }


  // Sincronizar pagos
  private async syncPayments(payments: any[]): Promise<void> {
    for (const payment of payments) {
      try {
        await supabaseDb.createPago({
          servicio_id: payment.paymentId,
          metodo_pago: payment.paymentMethod || "efectivo",
          monto: payment.total || 0,
          estado: "completado",
        })
      } catch (error) {
        continue
      }
    }
  }

  // Agregar a cola de sincronización
  private addToSyncQueue(table: string, action: string, data: any): void {
    this.syncQueue.push({ table, action, data })
  }

  // Procesar cola de sincronización cuando vuelva la conexión
  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()
      if (item) {
        try {
          await this.syncToSupabase(item.table, item.data)
        } catch (error) {
          console.warn("Error processing sync queue item:", error)
          // Volver a agregar a la cola si falla
          this.syncQueue.unshift(item)
          break
        }
      }
    }
  }

  // Función para forzar sincronización completa
  async forceSyncAll(): Promise<void> {
    // Sin localStorage, no hay datos locales para sincronizar
    console.log("ForceSyncAll: No local data to sync (localStorage disabled)")
  }
}

// Instancia global
export const dbSync = DatabaseSync.getInstance()