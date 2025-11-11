import type { CSSProperties } from "react"

interface SidebarSurface {
  gradient: string
  base: string
  border: string
  shadow?: string
}

const surface = (from: string, to: string, base: string, border: string): SidebarSurface => ({
  gradient: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
  base,
  border,
  shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
})

const MATERIAL_SIDEBAR_SURFACES: Record<string, SidebarSurface> = {
  "bg-gradient-to-br from-blue-500 to-blue-300": surface(
    "rgba(37, 99, 235, 0.55)",
    "rgba(30, 64, 175, 0.82)",
    "rgba(17, 24, 39, 0.85)",
    "rgba(96, 165, 250, 0.28)",
  ),
  "bg-gradient-to-br from-purple-500 to-purple-300": surface(
    "rgba(168, 85, 247, 0.5)",
    "rgba(107, 33, 168, 0.8)",
    "rgba(59, 18, 99, 0.83)",
    "rgba(216, 180, 254, 0.26)",
  ),
  "bg-gradient-to-br from-green-500 to-green-300": surface(
    "rgba(34, 197, 94, 0.48)",
    "rgba(21, 128, 61, 0.78)",
    "rgba(12, 55, 37, 0.82)",
    "rgba(134, 239, 172, 0.26)",
  ),
  "bg-gradient-to-br from-orange-500 to-orange-300": surface(
    "rgba(249, 115, 22, 0.52)",
    "rgba(194, 65, 12, 0.8)",
    "rgba(87, 26, 7, 0.83)",
    "rgba(253, 186, 116, 0.28)",
  ),
  "bg-gradient-to-br from-pink-500 to-pink-300": surface(
    "rgba(236, 72, 153, 0.5)",
    "rgba(190, 24, 93, 0.8)",
    "rgba(111, 18, 56, 0.83)",
    "rgba(249, 168, 212, 0.28)",
  ),
  "bg-gradient-to-br from-teal-500 to-teal-300": surface(
    "rgba(20, 184, 166, 0.5)",
    "rgba(15, 118, 110, 0.8)",
    "rgba(7, 54, 51, 0.82)",
    "rgba(94, 234, 212, 0.26)",
  ),
  "bg-gradient-to-br from-red-500 to-red-300": surface(
    "rgba(239, 68, 68, 0.5)",
    "rgba(185, 28, 28, 0.8)",
    "rgba(100, 17, 24, 0.83)",
    "rgba(252, 165, 165, 0.26)",
  ),
  "bg-gradient-to-br from-indigo-500 to-indigo-300": surface(
    "rgba(99, 102, 241, 0.5)",
    "rgba(67, 56, 202, 0.82)",
    "rgba(48, 35, 135, 0.84)",
    "rgba(165, 180, 252, 0.28)",
  ),
}

const DEFAULT_SURFACE: SidebarSurface = surface(
  "rgba(71, 85, 105, 0.45)",
  "rgba(30, 41, 59, 0.78)",
  "rgba(15, 23, 42, 0.82)",
  "rgba(148, 163, 184, 0.22)",
)

const IMAGE_SURFACE: SidebarSurface = {
  gradient: "linear-gradient(160deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.2) 100%)",
  base: "rgba(15, 23, 42, 0.2)",
  border: "rgba(148, 163, 184, 0.22)",
  shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
}

const toStyle = (surface: SidebarSurface): CSSProperties => ({
  backgroundImage: surface.gradient,
  backgroundColor: surface.base,
  borderColor: surface.border,
  boxShadow: surface.shadow,
})

export function getSidebarSurfaceStyle(background?: string): CSSProperties {
  if (!background) return toStyle(DEFAULT_SURFACE)
  if (background.startsWith("url(")) {
    return toStyle(IMAGE_SURFACE)
  }
  const match = MATERIAL_SIDEBAR_SURFACES[background]
  return toStyle(match ?? DEFAULT_SURFACE)
}

