"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface MobileLayoutProps {
  currentSection: string
  setCurrentSection: (section: string) => void
  onLogout: () => void
  children: React.ReactNode
}


export default function MobileLayout({ currentSection, setCurrentSection, onLogout, children }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isTrabajador, setIsTrabajador] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Detectar si el usuario es TRABAJADOR desde localStorage
    try {
      const user = localStorage.getItem("userData");
      if (user) {
        const parsed = JSON.parse(user);
        setIsTrabajador(parsed?.rol === "TRABAJADOR");
      } else {
        setIsTrabajador(false);
      }
    } catch {
      setIsTrabajador(false);
    }
  }, []);
  // Detectar si el usuario es ADMIN desde localStorage
  // Detectar si el usuario es ADMINISTRADOR desde localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const role = storedRole ? storedRole.toLowerCase() : "";
    setIsAdmin(role === "administrador");
  }, []);
  useEffect(() => {
    // Observa cambios en la clase del body para detectar si hay un dialog abierto
    const observer = new MutationObserver(() => {
      setDialogOpen(document.body.classList.contains("dialog-open") || document.body.classList.contains("\n  dialog-open"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    // Inicializa el estado
    setDialogOpen(document.body.classList.contains("dialog-open") || document.body.classList.contains("\n  dialog-open"));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrollingDown(true)
      } else {
        setIsScrollingDown(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const handleSectionClick = (section: string) => {
    setCurrentSection(section)
    setSidebarOpen(false)
    const event = new CustomEvent("navigate", { detail: section })
    window.dispatchEvent(event)
  }

  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: "Panel Principal",
      services: "Servicios",
      "service-types": "Tipos de Servicios",
      clients: "Clientes",
      inventory: "Inventario",
      sales: "Ventas",
      employees: "Trabajadores",
      reports: "Reportes",
      "cash-register": "Caja",
      loyalty: "Lealtad",
      admin: "Admin",
      "best-sellers": "Productos más vendidos",
      categories: "Categorías",
      providers: "Proveedores",
    }
    return titles[section] || ""
  }

  return (
    <div className="mobile-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <Button
          variant="ghost"
          size="sm"
          className="text-yellow-400 hover:bg-gray-800"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="fas fa-bars text-xl"></i>
        </Button>
        <h1 className="mobile-header-title">{getSectionTitle(currentSection)}</h1>
        <Button variant="ghost" size="sm" className="text-yellow-400 hover:bg-gray-800" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i>
        </Button>
      </header>

      {/* Main Content */}
      <main className="mobile-main-content">{children}</main>

      {/* Floating Bottom Navigation: ocultar todo el nav si hay dialog */}
      {!dialogOpen && (
        <nav className={`mobile-floating-nav ${isScrollingDown ? "hidden" : "visible"}`}>
          <div className="mobile-nav-grid">
            <button
              className={`mobile-nav-button ${currentSection === "dashboard" ? "active" : ""}`}
              onClick={() => handleSectionClick("dashboard")}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Panel</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "services" ? "active" : ""}`}
              onClick={() => handleSectionClick("services")}
            >
              <i className="fas fa-tools"></i>
              <span>Servicios</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "clients" ? "active" : ""}`}
              onClick={() => handleSectionClick("clients")}
            >
              <i className="fas fa-users"></i>
              <span>Clientes</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "best-sellers" ? "active" : ""}`}
              onClick={() => handleSectionClick("best-sellers")}
            >
              <i className="fas fa-trophy"></i>
              <span>Más vendidos</span>
            </button>
          </div>
          <div className="mobile-nav-grid mobile-nav-grid-second">
            <button
              className={`mobile-nav-button ${currentSection === "inventory" ? "active" : ""}`}
              onClick={() => handleSectionClick("inventory")}
            >
              <i className="fas fa-boxes"></i>
              <span>Inventario</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "categories" ? "active" : ""}`}
              onClick={() => handleSectionClick("categories")}
            >
              <i className="fas fa-layer-group"></i>
              <span>Categorías</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "providers" ? "active" : ""}`}
              onClick={() => handleSectionClick("providers")}
            >
              <i className="fas fa-truck"></i>
              <span>Proveedores</span>
            </button>
            {/* Solo mostrar Personal si NO es trabajador */}
            {isTrabajador ? null : (
              <button
                className={`mobile-nav-button ${currentSection === "employees" ? "active" : ""}`}
                onClick={() => handleSectionClick("employees")}
              >
                <i className="fas fa-user-gear"></i>
                <span>Personal</span>
              </button>
            )}
          </div>
          <div className="mobile-nav-grid mobile-nav-grid-third">
            {/* Caja siempre visible */}
            <button
              className={`mobile-nav-button ${currentSection === "cash-register" ? "active" : ""}`}
              onClick={() => handleSectionClick("cash-register")}
            >
              <i className="fas fa-cash-register"></i>
              <span>Caja</span>
            </button>
            <button
              className={`mobile-nav-button ${currentSection === "loyalty" ? "active" : ""}`}
              onClick={() => handleSectionClick("loyalty")}
            >
              <i className="fas fa-star"></i>
              <span>Lealtad</span>
            </button>
            {/* Opciones solo para ADMINISTRADOR */}
            {isAdmin && (
              <>
                <button
                  className={`mobile-nav-button ${currentSection === "reports" ? "active" : ""}`}
                  onClick={() => handleSectionClick("reports")}
                >
                  <i className="fas fa-chart-bar"></i>
                  <span>Reportes</span>
                </button>
                <button
                  className={`mobile-nav-button ${currentSection === "admin" ? "active" : ""}`}
                  onClick={() => handleSectionClick("admin")}
                >
                  <i className="fas fa-cog"></i>
                  <span>Administración</span>
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="mobile-sidebar-overlay">
          <div className="mobile-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>
          <div className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <div className="mobile-sidebar-logo">
                <div className="mobile-sidebar-icon">
                  <i className="fas fa-car-side"></i>
                </div>
                <h1>Zona Garaje</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-800"
                onClick={() => setSidebarOpen(false)}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            <nav className="mobile-sidebar-nav">
              <ul className="mobile-sidebar-list">
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "dashboard" ? "active" : ""}`}
                    onClick={() => handleSectionClick("dashboard")}
                  >
                    <i className="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "services" ? "active" : ""}`}
                    onClick={() => handleSectionClick("services")}
                  >
                    <i className="fas fa-tools"></i>
                    <span>Servicios</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "service-types" ? "active" : ""}`}
                    onClick={() => handleSectionClick("service-types")}
                  >
                    <i className="fas fa-tags"></i>
                    <span>Tipos de Servicios</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "clients" ? "active" : ""}`}
                    onClick={() => handleSectionClick("clients")}
                  >
                    <i className="fas fa-users"></i>
                    <span>Clientes</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "inventory" ? "active" : ""}`}
                    onClick={() => handleSectionClick("inventory")}
                  >
                    <i className="fas fa-boxes"></i>
                    <span>Inventario</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "best-sellers" ? "active" : ""}`}
                    onClick={() => handleSectionClick("best-sellers")}
                  >
                    <i className="fas fa-trophy"></i>
                    <span>Productos más vendidos</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "categories" ? "active" : ""}`}
                    onClick={() => handleSectionClick("categories")}
                  >
                    <i className="fas fa-layer-group"></i>
                    <span>Categorías</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "providers" ? "active" : ""}`}
                    onClick={() => handleSectionClick("providers")}
                  >
                    <i className="fas fa-truck"></i>
                    <span>Proveedores</span>
                  </button>
                </li>
                {/* Solo mostrar Trabajadores si NO es trabajador */}
                {!isTrabajador && (
                  <li>
                    <button
                      className={`mobile-sidebar-button ${currentSection === "employees" ? "active" : ""}`}
                      onClick={() => handleSectionClick("employees")}
                    >
                      <i className="fas fa-user-gear"></i>
                      <span>Trabajadores</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "cash-register" ? "active" : ""}`}
                    onClick={() => handleSectionClick("cash-register")}
                  >
                    <i className="fas fa-cash-register"></i>
                    <span>Caja</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`mobile-sidebar-button ${currentSection === "loyalty" ? "active" : ""}`}
                    onClick={() => handleSectionClick("loyalty")}
                  >
                    <i className="fas fa-star"></i>
                    <span>Sistema de Lealtad</span>
                  </button>
                </li>
                {/* Opciones solo para administradores */}
                {isAdmin && (
                  <li>
                    <button
                      className={`mobile-sidebar-button ${currentSection === "reports" ? "active" : ""}`}
                      onClick={() => handleSectionClick("reports")}
                    >
                      <i className="fas fa-chart-bar"></i>
                      <span>Reportes</span>
                    </button>
                  </li>
                )}
                {isAdmin && (
                  <li>
                    <button
                      className={`mobile-sidebar-button ${currentSection === "admin" ? "active" : ""}`}
                      onClick={() => handleSectionClick("admin")}
                    >
                      <i className="fas fa-cog"></i>
                      <span>Administración</span>
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-layout {
          min-height: 100vh;
          background: #f3f4f6;
        }

        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
          color: #fbbf24;
          padding: 12px 16px;
          z-index: 999;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          border-bottom: 2px solid #fbbf24;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-header-title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }

        .mobile-main-content {
          padding-top: 70px;
          padding-bottom: 140px;
          min-height: 100vh;
        }

        .mobile-floating-nav {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(251, 191, 36, 0.3);
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px;
        }

        .mobile-floating-nav.hidden {
          transform: translateY(120px);
          opacity: 0;
        }

        .mobile-floating-nav.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .mobile-nav-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .mobile-nav-grid-second {
          margin-top: 4px;
        }

        .mobile-nav-grid-third {
          margin-top: 4px;
        }

        .mobile-nav-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          color: #9ca3af;
          background: none;
          border: none;
          border-radius: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          min-height: 60px;
        }

        .mobile-nav-button:hover {
          background: rgba(75, 85, 99, 0.5);
        }

        .mobile-nav-button.active {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.15);
        }

        .mobile-nav-button i {
          font-size: 18px;
          margin-bottom: 4px;
        }

        .mobile-nav-button span {
          font-size: 10px;
          font-weight: 500;
          text-align: center;
        }

        .mobile-sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 1001;
        }

        .mobile-sidebar-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }

        .mobile-sidebar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 320px;
          background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          animation: slideInLeft 0.3s ease;
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .mobile-sidebar-header {
          padding: 20px;
          border-bottom: 2px solid #fbbf24;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-sidebar-logo {
          display: flex;
          align-items: center;
        }

        .mobile-sidebar-icon {
          background: #fbbf24;
          color: #000;
          padding: 12px;
          border-radius: 50%;
          margin-right: 12px;
        }

        .mobile-sidebar-logo h1 {
          font-size: 20px;
          font-weight: bold;
          color: #fbbf24;
          margin: 0;
        }

        .mobile-sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }

        .mobile-sidebar-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .mobile-sidebar-button {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 16px 24px;
          color: #d1d5db;
          background: none;
          border: none;
          border-radius: 0;
          transition: all 0.3s ease;
          cursor: pointer;
          font-size: 16px;
        }

        .mobile-sidebar-button:hover {
          background: rgba(75, 85, 99, 0.5);
          color: #fff;
        }

        .mobile-sidebar-button.active {
          background: #fbbf24;
          color: #000;
        }

        .mobile-sidebar-button i {
          font-size: 18px;
          margin-right: 16px;
          width: 20px;
        }

        @media (min-width: 768px) {
          .mobile-layout {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
