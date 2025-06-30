"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseTest() {
  const [mounted, setMounted] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Solo ejecutar en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔄 Cargando pruebas...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  // Resto del componente permanece igual...
}
