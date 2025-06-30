import { supabase } from './supabaseClient'

export const supabaseDb = {
  // Clientes
  async getClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching clientes:', error)
      return []
    }
    return data || []
  },

  async createCliente(cliente: any) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
    if (error) {
      console.error('Error creating cliente:', error)
      console.log('Cliente enviado a Supabase:', cliente)
      return null
    }
    return data?.[0] || null
  },

  // Vehículos
  async getVehiculos() {
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*, clientes(nombre)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching vehiculos:', error)
      return []
    }
    return data || []
  },

  async createVehiculo(vehiculo: any) {
    const { data, error } = await supabase
      .from('vehiculos')
      .insert([vehiculo])
      .select()
    if (error) {
      console.error('Error creating vehiculo:', error)
      return null
    }
    return data?.[0] || null
  },

  // Servicios
  async getServicios() {
    const { data, error } = await supabase
      .from('servicios')
      .select('*, clientes(nombre), vehiculos(placa)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      console.error('Error fetching servicios:', error)
      return []
    }
    return data || []
  },

  async createServicio(servicio: any) {
    const { data, error } = await supabase
      .from('servicios')
      .insert([servicio])
      .select()
    if (error) {
      console.error('Error creating servicio:', error)
      return null
    }
    return data?.[0] || null
  },

  // Productos
  async getProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      console.error('Error fetching productos:', error)
      return []
    }
    return data || []
  },

  async createProducto(producto: any) {
    const response = await supabase
      .from('productos')
      .insert([producto])
      .select()
    const { data, error, status, statusText } = response
    if (error || !data) {
      console.error('Error creating producto:', {
        error,
        data,
        producto,
        response,
        status,
        statusText,
        message: 'Verifica los campos requeridos, tipos de datos y las políticas RLS en Supabase.'
      })
      if (response && response.error && response.error.message) {
        alert('Error Supabase: ' + response.error.message)
      }
      return null
    }
    return data?.[0] || null
  },

  // Trabajadores
  async getTrabajadores() {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) {
      console.error('Error fetching trabajadores:', error)
      return []
    }
    return data || []
  },

  async createTrabajador(trabajador: any) {
    const { data, error } = await supabase
      .from('trabajadores')
      .insert([trabajador])
      .select()
    if (error) {
      console.error('Error creating trabajador:', error)
      return null
    }
    return data?.[0] || null
  },

  // Pagos
  async getPagos() {
    const { data, error } = await supabase
      .from('pagos')
      .select('*, servicios(tipo_servicio,clientes(nombre))')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching pagos:', error)
      return []
    }
    return data || []
  },

  async createPago(pago: any) {
    const { data, error } = await supabase
      .from('pagos')
      .insert([pago])
      .select()
    if (error) {
      console.error('Error creating pago:', error)
      return null
    }
    return data?.[0] || null
  },

  // Lealtad
  async getLealtad() {
    const { data, error } = await supabase
      .from('lealtad')
      .select('*, clientes(nombre)')
      .order('puntos', { ascending: false })
    if (error) {
      console.error('Error fetching lealtad:', error)
      return []
    }
    return data || []
  },

  async updateLealtad(clienteId: string, puntos: number, canjes: number) {
    const { data, error } = await supabase
      .from('lealtad')
      .upsert({ cliente_id: clienteId, puntos, canjes, updated_at: new Date().toISOString() }, { onConflict: 'cliente_id' })
      .select()
    if (error) {
      console.error('Error updating lealtad:', error)
      return null
    }
    return data?.[0] || null
  },
}

export default supabaseDb
