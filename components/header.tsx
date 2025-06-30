"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  sectionTitle: string
  onLogout: () => void
}

export default function Header({ sectionTitle, onLogout }: HeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Update date and time initially
    updateDateTime()

    // Get user email from localStorage
    const email = localStorage.getItem("userEmail") || ""
    setUserEmail(email)

    // Update date and time every minute
    const interval = setInterval(updateDateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  const updateDateTime = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    setCurrentDateTime(now.toLocaleDateString("es-VE", options))
  }

  const handleLogout = () => {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
      // Limpiar datos de sesión
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("loginTime")

      onLogout()
    }
  }

  return (
    <header className="bg-black text-yellow-400 p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img src="/images/zona-garaje-logo.svg" alt="Zona Garaje" className="h-10 w-auto" />
        <h1 className="text-2xl font-bold">{sectionTitle}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm">{currentDateTime}</div>
          <div className="text-xs text-yellow-300">{userEmail}</div>
        </div>
        <Button onClick={handleLogout} className="bg-yellow-400 text-black hover:bg-yellow-300">
          <i className="fas fa-sign-out-alt mr-2"></i> Salir
        </Button>
      </div>
    </header>
  )
}
