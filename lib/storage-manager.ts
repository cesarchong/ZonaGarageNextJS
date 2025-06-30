// import { dbSync } from "./database-sync"

// // Wrapper que funciona exclusivamente con Supabase
// export class StorageManager {
//   // Reemplaza localStorage.setItem - ahora solo guarda en Supabase
//   static async setItem(key: string, value: string): Promise<void> {
//     try {
//       // Sincronizar con Supabase si es una tabla conocida
//       const data = JSON.parse(value)
//       if (Array.isArray(data)) {
//         await dbSync.saveData(key, data)
//       }
//     } catch (error) {
//       console.warn(`Error in StorageManager.setItem for ${key}:`, error)
//     }
//   }

//   // Reemplaza localStorage.getItem - ahora solo lee desde Supabase
//   static async getItem(key: string): Promise<string | null> {
//     try {
//       // Cargar desde Supabase
//       const data = await dbSync.loadData(key)
//       if (data && data.length > 0) {
//         return JSON.stringify(data)
//       }
//       return null
//     } catch (error) {
//       console.warn(`Error in StorageManager.getItem for ${key}:`, error)
//       return null
//     }
//   }

//   // Función síncrona para compatibilidad - programa sincronización con Supabase
//   static setItemSync(key: string, value: string): void {
//     // Programar sincronización asíncrona
//     setTimeout(async () => {
//       try {
//         const data = JSON.parse(value)
//         const excludedTables = ["employees"]
//         if (Array.isArray(data) && !excludedTables.includes(key)) {
//           await dbSync.saveData(key, data)
//         }
//       } catch (error) {
//         console.warn(`Error syncing ${key}:`, error)
//       }
//     }, 100)
//   }

//   // Función síncrona para compatibilidad - retorna null ya que no hay datos locales
//   static getItemSync(key: string): string | null {
//     console.warn(`getItemSync called for ${key} - no local storage available, use async getItem instead`)
//     return null
//   }
// }