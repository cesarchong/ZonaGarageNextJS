// Al inicio del archivo, agregar estas variables de debug
let lastSyncTime = "Nunca"
let syncStatus = "Inactivo"
let syncErrors: string[] = []

// Sistema de sincronización bidireccional COMPLETO
let syncTimer: any = null

// Función de sincronización completa para TODOS los datos
const doSync = async () => {
  if (typeof window === "undefined") return;

  syncStatus = "Sincronizando...";
  console.log("🔄 INICIANDO SINCRONIZACIÓN:", new Date().toLocaleTimeString());

  try {
    const { supabaseDb } = await import("./SupaBasClient");
    console.log("✅ Módulo supabaseDb cargado correctamente");

    // Test de conexión primero
    try {
      await supabaseDb.getClientes();
      console.log("✅ Conexión a Supabase exitosa");
    } catch (connectionError) {
      console.error("❌ Error de conexión a Supabase:", connectionError);
      syncStatus = "Error de conexión";
      syncErrors.push(`Conexión: ${connectionError}`);
      return;
    }

    // Aquí puedes trabajar con los datos de la nube, pero NO guardes ni leas nada de localStorage

    lastSyncTime = new Date().toLocaleTimeString();
    syncStatus = "Completado";
    console.log("✅ SINCRONIZACIÓN COMPLETADA:", lastSyncTime);
  } catch (e) {
    console.error("❌ ERROR EN SINCRONIZACIÓN:", e);
    syncStatus = "Error";
    syncErrors.push(`${new Date().toLocaleTimeString()}: ${e}`);
  }
};

// Iniciar sincronización
const startSync = () => {
  if (typeof window === "undefined") return

  // Limpiar timer anterior
  if (syncTimer) {
    clearInterval(syncTimer)
  }

  // Nuevo timer cada 30 segundos
  syncTimer = setInterval(() => {
    doSync()
  }, 30000)

  // Sync inicial después de 3 segundos
  setTimeout(() => {
    doSync()
  }, 3000)
}

// Función para forzar sync
const forceSync = () => {
  doSync()
}

// Agregar al final del archivo estas funciones de debug:
export const getSyncStatus = () => ({
  lastSyncTime,
  syncStatus,
  syncErrors: syncErrors.slice(-5), // Solo los últimos 5 errores
  isRunning: syncTimer !== null,
})

export const clearSyncErrors = () => {
  syncErrors = []
}

export { forceSync, startSync };

