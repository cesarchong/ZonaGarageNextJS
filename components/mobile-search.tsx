"use client"

interface MobileSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function MobileSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}: MobileSearchProps) {
  return (
    <div className={`mobile-search ${className}`}>
      <i className="mobile-search-icon fas fa-search"></i>
      <input
        type="search"
        className="mobile-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {value && (
        <button type="button" className="mobile-search-clear" onClick={() => onChange("")}>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  )
}
