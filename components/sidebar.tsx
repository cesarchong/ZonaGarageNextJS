"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function Sidebar({
  currentSection,
  setCurrentSectionAction,
  collapsed,
  toggleSidebarAction,
  userRole = "empleado", // Valor por defecto
}: {
  currentSection: string
  setCurrentSectionAction: (section: string) => void
  collapsed: boolean
  toggleSidebarAction: () => void
  userRole?: string
}) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  // Actualizar la URL cuando cambia la sección
  useEffect(() => {
    window.location.hash = `#${currentSection}`
  }, [currentSection])

  // Establecer la sección activa basada en el hash de la URL al cargar
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash) {
      setCurrentSectionAction(hash)
    }
  }, [setCurrentSectionAction])

  const handleSectionClick = (section: string) => {
    setCurrentSectionAction(section)
    // Disparar un evento personalizado para la navegación
    const event = new CustomEvent("navigate", { detail: section })
    window.dispatchEvent(event)
  }

  const toggleSubmenu = (submenu: string) => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu)
  }

  return (
    <div
      className={`bg-black text-white transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col relative`}
    >
      {/* Logo y título */}
      <div className="flex items-center p-4 border-b border-gray-800">
        <div className="bg-yellow-400 text-black p-2 rounded-full">
          <i className="fas fa-car-side"></i>
        </div>
        {!collapsed && <h1 className="ml-3 font-bold text-xl">Zona Garaje</h1>}
  <Button
          variant="ghost"
          size="sm"
          className={`ml-auto text-white hover:bg-gray-800 ${collapsed ? "mx-auto" : ""}`}
          onClick={toggleSidebarAction}
        >
          <i className={`fas ${collapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
        </Button>
      </div>

      {/* Botón de colapsar/expandir mejorado - visible en el borde derecho */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-4 top-20 bg-black text-yellow-400 hover:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-yellow-400 z-50"
        onClick={toggleSidebarAction}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <i className={`fas ${collapsed ? "fa-chevron-right" : "fa-chevron-left"} text-xs`}></i>
      </Button>

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "dashboard" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("dashboard")}
              data-section="dashboard"
              title={collapsed ? "Dashboard" : undefined}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Dashboard</span>
            </button>
          </li>

          {/* Servicios */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                activeSubmenu === "services" ? "bg-gray-700" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => toggleSubmenu("services")}
              title={collapsed ? "Servicios" : undefined}
            >
              <i className="fas fa-tools"></i>
              {!collapsed && (
                <>
                  <span className="ml-3">Servicios</span>
                  <i
                    className={`fas fa-chevron-down ml-auto transition-transform ${
                      activeSubmenu === "services" ? "rotate-180" : ""
                    }`}
                  ></i>
                </>
              )}
            </button>
            {activeSubmenu === "services" && !collapsed && (
              <ul className="bg-gray-900 py-2">
                <li>
                  <button
                    className={`w-full flex items-center py-2 px-8 hover:bg-gray-800 ${
                      currentSection === "services" ? "text-yellow-400" : ""
                    }`}
                    onClick={() => handleSectionClick("services")}
                    data-section="services"
                  >
                    <i className="fas fa-clipboard-list text-sm"></i>
                    <span className="ml-3">Registro de Servicios</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center py-2 px-8 hover:bg-gray-800 ${
                      currentSection === "service-types" ? "text-yellow-400" : ""
                    }`}
                    onClick={() => handleSectionClick("service-types")}
                    data-section="service-types"
                  >
                    <i className="fas fa-tags text-sm"></i>
                    <span className="ml-3">Tipos de Servicios</span>
                  </button>
                </li>
              </ul>
            )}
          </li>

          {/* Clientes */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "clients" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("clients")}
              data-section="clients"
              title={collapsed ? "Clientes y Vehículos" : undefined}
            >
              <i className="fas fa-users"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Clientes y Vehículos</span>
            </button>
          </li>

          {/* Inventario */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "inventory" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("inventory")}
              data-section="inventory"
              title={collapsed ? "Inventario" : undefined}
            >
              <i className="fas fa-boxes"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Inventario</span>
            </button>
          </li>

          {/* Productos más vendidos (antes Ventas) */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "best-sellers" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("best-sellers")}
              data-section="best-sellers"
              title={collapsed ? "Productos más vendidos" : undefined}
            >
              <i className="fas fa-trophy"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Productos más vendidos</span>
            </button>
          </li>

          {/* Empleados */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "employees" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("employees")}
              data-section="employees"
              title={collapsed ? "Trabajadores" : undefined}
            >
              <i className="fas fa-user-gear"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Trabajadores</span>
            </button>
          </li>

          {/* Categorias */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "categories" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("categories")}
              data-section="categories"
              title={collapsed ? "Categorías" : undefined}
            >
              <i className="fas fa-layer-group"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Categorias</span>
            </button>
          </li>

          {/* Proveedores */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "providers" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("providers")}
              data-section="providers"
              title={collapsed ? "Proveedores" : undefined}
            >
              <i className="fas fa-truck"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Proveedores</span>
            </button>
          </li>

          {/* Caja */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "cash-register" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("cash-register")}
              data-section="cash-register"
              title={collapsed ? "Caja" : undefined}
            >
              <i className="fas fa-cash-register"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Caja</span>
            </button>
          </li>

          {/* Sistema de Lealtad */}
          <li>
            <button
              className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                currentSection === "loyalty" ? "bg-yellow-600 text-white" : ""
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => handleSectionClick("loyalty")}
              data-section="loyalty"
              title={collapsed ? "Sistema de Lealtad" : undefined}
            >
              <i className="fas fa-star"></i>
              <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Sistema de Lealtad</span>
            </button>
          </li>

          {/* Reportes - Solo visible para Administrador */}
          {userRole === "administrador" && (
            <li>
              <button
                className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                  currentSection === "reports" ? "bg-yellow-600 text-white" : ""
                } ${collapsed ? "justify-center" : ""}`}
                onClick={() => handleSectionClick("reports")}
                data-section="reports"
                title={collapsed ? "Reportes" : undefined}
              >
                <i className="fas fa-chart-bar"></i>
                <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Reportes</span>
              </button>
            </li>
          )}

          {/* Administración - Solo visible para Administrador */}
          {userRole === "administrador" && (
            <li>
              <button
                className={`w-full flex items-center p-3 hover:bg-gray-800 ${
                  currentSection === "admin" ? "bg-yellow-600 text-white" : ""
                } ${collapsed ? "justify-center" : ""}`}
                onClick={() => handleSectionClick("admin")}
                data-section="admin"
                title={collapsed ? "Administración" : undefined}
              >
                <i className="fas fa-cog"></i>
                <span className={`ml-3 ${collapsed ? "hidden sm:block" : ""}`}>Administración</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-400">
        {!collapsed && <div>Zona Garaje © 2023</div>}
      </div>
    </div>
  )
}
