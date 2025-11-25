// Reusable Inventory logo component

export function InventoryLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        {/* Colorful cube logo */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue top face */}
          <path d="M20 5 L32 12 L20 19 L8 12 Z" fill="#0066FF" />
          {/* Yellow left face */}
          <path d="M8 12 L8 26 L20 33 L20 19 Z" fill="#FFB800" />
          {/* Red right face */}
          <path d="M20 19 L20 33 L32 26 L32 12 Z" fill="#FF3B30" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
    </div>
  )
}
