"use client"

import AdminPanel from "@/components/admin-panel"
import BestSellers from "@/components/best-sellers"
import CashRegister from "@/components/cash-register"
import Categories from "@/components/categories"
import Clients from "@/components/clients"
import Dashboard from "@/components/dashboard"
import Employees from "@/components/employees"
import Header from "@/components/header"
// import { Inventory } from "@/components/inventory"
import Login from "@/components/login"
import LoyaltySystem from "@/components/loyalty-system"
import MobileLayout from "@/components/mobile-layout"
import Reports from "@/components/reports"
import ServiceTypes from "@/components/service-types"
import Services from "@/components/services"
import Sidebar from "@/components/sidebar"
import { useEffect, useState } from "react"
// Agregar el import del componente de debug
import Inventory from "@/components/inventory"
import Providers from "@/components/providers"
import SyncDebug from "@/components/sync-debug"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Rol del usuario (por defecto "empleado")
  const [userRole, setUserRole] = useState<string>("empleado")

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const initializeApp = async () => {
      // Verificar autenticación
      const authStatus = localStorage.getItem("isAuthenticated")
      const loginTime = localStorage.getItem("loginTime")

      // Leer rol desde localStorage o asignar por defecto
      const storedRole = localStorage.getItem("userRole")
      const userEmail = localStorage.getItem("userEmail")

      // ASIGNACIÓN PERMANENTE: cesarchong@zonagaraje.com SIEMPRE es administrador
      if (userEmail === "cesarchong@zonagaraje.com") {
        setUserRole("administrador")
        localStorage.setItem("userRole", "administrador")
      } else if (storedRole) {
        // Normalizar a minúsculas
        const normalized = storedRole.toLowerCase();
        setUserRole(normalized)
        localStorage.setItem("userRole", normalized)
      } else {
        setUserRole("empleado")
        localStorage.setItem("userRole", "empleado")
      }

      if (authStatus === "true" && loginTime) {
        const loginDate = new Date(loginTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)
        if (hoursDiff < 24) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("userEmail")
          localStorage.removeItem("loginTime")
          localStorage.removeItem("userRole")
        }
      }

      // NUEVA FUNCIONALIDAD: Auto-sincronización
      if (typeof window !== "undefined") {
        // Solo iniciar sincronización automática en producción
        if (process.env.NODE_ENV === "production") {
          setTimeout(async () => {
            try {
              const syncModule = await import("@/lib/auto-sync")
              syncModule.startSync()
            } catch (error) {
              // Si falla, continuar sin sincronización
              console.log("Sync not available")
            }
          }, 3000)
        }
      
      }

      setIsLoading(false)
    }

    initializeApp()

    // Navegación
    const handleNavigate = (event: CustomEvent) => {
      const section = event.detail
      if ((section === "reports" || section === "admin") && userRole !== "administrador") {
        setCurrentSection("dashboard")
        return
      }
      setCurrentSection(section)
    }

    window.addEventListener("navigate", handleNavigate as EventListener)

    return () => window.removeEventListener("navigate", handleNavigate as EventListener)
  }, [userRole])

  // Verificar acceso cuando cambia la sección
  useEffect(() => {
    if ((currentSection === "reports" || currentSection === "admin") && userRole !== "administrador") {
      setCurrentSection("dashboard")
    }
  }, [currentSection, userRole])

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("userRole")
    setUserRole("empleado")
  }
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)

  const renderSection = () => {
    // Acceso Denegado para reportes o admin si no es ADMINISTRADOR
    if ((currentSection === "reports" || currentSection === "admin") && userRole !== "administrador") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 text-6xl mb-4">
              <i className="fas fa-lock"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
            <button
              onClick={() => setCurrentSection("dashboard")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      )
    }

    switch (currentSection) {
      case "dashboard":
        return <Dashboard />
      case "services":
        return <Services />
      case "service-types":
        return <ServiceTypes />
      case "clients":
        return <Clients />
      case "inventory":
        return <Inventory />
      case "best-sellers":
        return <BestSellers />
      case "employees":
        return <Employees />
      case "categories":
        return <Categories />
      case "reports":
        return userRole === "administrador" ? <Reports /> : <Dashboard />
      case "cash-register":
        return <CashRegister />
      case "loyalty":
        return <LoyaltySystem />
      case "admin":
        return userRole === "administrador" ? <AdminPanel /> : <Dashboard />
      case "providers":
        return <Providers />
      default:
        return <Dashboard />
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="bg-black text-yellow-400 p-4 rounded-full inline-block mb-4">
            <i className="fas fa-car-side text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Zona Garaje</h1>
          <div className="flex items-center justify-center">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  // Login
  if (!isAuthenticated) return <Login />

  // Mobile
  if (isMobile) {
    return (
      <MobileLayout currentSection={currentSection} setCurrentSection={setCurrentSection} onLogout={handleLogout}>
        {renderSection()}
      </MobileLayout>
    )
  }

  // Desktop
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentSection={currentSection}
        setCurrentSectionAction={setCurrentSection}
        collapsed={sidebarCollapsed}
        toggleSidebarAction={toggleSidebar}
        userRole={userRole}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sectionTitle={getSectionTitle(currentSection)} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4">{renderSection()}</main>
      </div>
      <SyncDebug />
    </div>
  )
}

function getSectionTitle(section: string) {
  const titles: Record<string, string> = {
    dashboard: "Panel Principal",
    services: "Registro de Servicios",
    "service-types": "Gestión de Tipos de Servicios",
    clients: "Gestión de Clientes y Vehículos",
    inventory: "Gestión de Inventario",
    "best-sellers": "Productos más vendidos",
    employees: "Gestión de Trabajadores",
    reports: "Reportes y Estadísticas",
    "cash-register": "Gestión de Caja",
    loyalty: "Sistema de Lealtad",
    admin: "Panel de Administración",
    providers: "Gestión de Proveedores",
  }
  return titles[section] || ""
}
