"use client"

import type React from "react"

import { useState } from "react"

interface MobileCardProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
  actions?: React.ReactNode
  expandable?: boolean
  defaultExpanded?: boolean
  onClick?: () => void
}

export default function MobileCard({
  title,
  subtitle,
  badge,
  badgeColor = "bg-yellow-400 text-black",
  children,
  actions,
  expandable = false,
  defaultExpanded = false,
  onClick,
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else if (expandable) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="mobile-card mobile-fade-in" onClick={expandable || onClick ? handleCardClick : undefined}>
      <div className="mobile-card-header">
        <div className="flex-1">
          <div className="mobile-card-title">{title}</div>
          {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
        </div>
        {badge && <span className={`mobile-card-badge ${badgeColor}`}>{badge}</span>}
        {expandable && (
          <button className="ml-2 text-gray-400">
            <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`}></i>
          </button>
        )}
      </div>

      <div className={`mobile-card-content ${expandable && !isExpanded ? "hidden" : ""}`}>{children}</div>

      {actions && <div className="mobile-card-actions">{actions}</div>}
    </div>
  )
}
