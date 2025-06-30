"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

interface MobileFormProps {
  title: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  children: React.ReactNode
  submitText?: string
  submitIcon?: string
  isSubmitting?: boolean
}

export default function MobileForm({
  title,
  onSubmit,
  onCancel,
  children,
  submitText = "Guardar",
  submitIcon = "fa-save",
  isSubmitting = false,
}: MobileFormProps) {
  return (
    <div className="mobile-modal">
      <div className="mobile-modal-content">
        <div className="mobile-modal-header">
          <h2 className="mobile-modal-title">{title}</h2>
          <button className="mobile-modal-close" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4">
          {children}

          <div className="mobile-btn-group mt-6">
            <Button type="submit" className="mobile-btn mobile-btn-primary w-full" disabled={isSubmitting}>
              <i className={`fas ${submitIcon} ${isSubmitting ? "fa-spin fa-spinner" : ""}`}></i>
              {isSubmitting ? "Guardando..." : submitText}
            </Button>
            <Button type="button" onClick={onCancel} className="mobile-btn mobile-btn-secondary w-full">
              <i className="fas fa-times"></i>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
