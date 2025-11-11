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
  shadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
})

const MATERIAL_SIDEBAR_SURFACES: Record<string, SidebarSurface> = {
  "bg-gradient-to-br from-blue-900 to-blue-700": surface(
    "rgba(59, 130, 246, 0.58)",
    "rgba(37, 99, 235, 0.78)",
    "rgba(30, 64, 175, 0.52)",
    "rgba(191, 219, 254, 0.35)",
  ),
  "bg-gradient-to-br from-emerald-900 to-emerald-700": surface(
    "rgba(16, 185, 129, 0.56)",
    "rgba(5, 150, 105, 0.76)",
    "rgba(6, 95, 70, 0.48)",
    "rgba(134, 239, 172, 0.32)",
  ),
  "bg-gradient-to-br from-purple-900 to-purple-700": surface(
    "rgba(139, 92, 246, 0.58)",
    "rgba(109, 40, 217, 0.78)",
    "rgba(76, 29, 149, 0.5)",
    "rgba(221, 214, 254, 0.36)",
  ),
  "bg-gradient-to-br from-rose-900 to-rose-700": surface(
    "rgba(244, 114, 182, 0.56)",
    "rgba(225, 29, 72, 0.76)",
    "rgba(136, 19, 55, 0.48)",
    "rgba(252, 205, 236, 0.34)",
  ),
  "bg-gradient-to-br from-orange-900 to-orange-700": surface(
    "rgba(251, 146, 60, 0.56)",
    "rgba(249, 115, 22, 0.76)",
    "rgba(124, 45, 18, 0.5)",
    "rgba(254, 215, 170, 0.34)",
  ),
  "bg-gradient-to-br from-red-900 to-red-700": surface(
    "rgba(248, 113, 113, 0.56)",
    "rgba(239, 68, 68, 0.78)",
    "rgba(127, 29, 29, 0.52)",
    "rgba(254, 202, 202, 0.34)",
  ),
  "bg-gradient-to-br from-cyan-900 to-cyan-700": surface(
    "rgba(103, 232, 249, 0.54)",
    "rgba(14, 165, 233, 0.76)",
    "rgba(8, 84, 108, 0.48)",
    "rgba(186, 230, 253, 0.32)",
  ),
  "bg-gradient-to-br from-indigo-950 to-indigo-800": surface(
    "rgba(129, 140, 248, 0.56)",
    "rgba(99, 102, 241, 0.78)",
    "rgba(30, 27, 75, 0.5)",
    "rgba(199, 210, 254, 0.36)",
  ),
  "bg-gradient-to-br from-amber-900 to-amber-700": surface(
    "rgba(251, 191, 36, 0.54)",
    "rgba(217, 119, 6, 0.74)",
    "rgba(120, 53, 15, 0.48)",
    "rgba(254, 240, 199, 0.32)",
  ),
  "bg-gradient-to-br from-sky-900 to-sky-700": surface(
    "rgba(125, 211, 252, 0.54)",
    "rgba(56, 189, 248, 0.75)",
    "rgba(7, 89, 133, 0.48)",
    "rgba(186, 230, 253, 0.32)",
  ),
  "bg-gradient-to-br from-slate-900 to-slate-700": surface(
    "rgba(148, 163, 184, 0.46)",
    "rgba(100, 116, 139, 0.7)",
    "rgba(30, 41, 59, 0.46)",
    "rgba(203, 213, 225, 0.28)",
  ),
  "bg-gradient-to-br from-zinc-900 to-zinc-700": surface(
    "rgba(212, 212, 216, 0.46)",
    "rgba(161, 161, 170, 0.7)",
    "rgba(39, 39, 42, 0.46)",
    "rgba(228, 228, 231, 0.28)",
  ),
  "bg-blue-900": surface(
    "rgba(59, 130, 246, 0.58)",
    "rgba(37, 99, 235, 0.78)",
    "rgba(30, 64, 175, 0.52)",
    "rgba(191, 219, 254, 0.35)",
  ),
  "bg-emerald-900": surface(
    "rgba(16, 185, 129, 0.56)",
    "rgba(5, 150, 105, 0.76)",
    "rgba(6, 95, 70, 0.48)",
    "rgba(134, 239, 172, 0.32)",
  ),
  "bg-purple-900": surface(
    "rgba(139, 92, 246, 0.58)",
    "rgba(109, 40, 217, 0.78)",
    "rgba(76, 29, 149, 0.5)",
    "rgba(221, 214, 254, 0.36)",
  ),
  "bg-rose-900": surface(
    "rgba(244, 114, 182, 0.56)",
    "rgba(225, 29, 72, 0.76)",
    "rgba(136, 19, 55, 0.48)",
    "rgba(252, 205, 236, 0.34)",
  ),
  "bg-orange-900": surface(
    "rgba(251, 146, 60, 0.56)",
    "rgba(249, 115, 22, 0.76)",
    "rgba(124, 45, 18, 0.5)",
    "rgba(254, 215, 170, 0.34)",
  ),
  "bg-red-900": surface(
    "rgba(248, 113, 113, 0.56)",
    "rgba(239, 68, 68, 0.78)",
    "rgba(127, 29, 29, 0.52)",
    "rgba(254, 202, 202, 0.34)",
  ),
  "bg-cyan-900": surface(
    "rgba(103, 232, 249, 0.54)",
    "rgba(14, 165, 233, 0.76)",
    "rgba(8, 84, 108, 0.48)",
    "rgba(186, 230, 253, 0.32)",
  ),
  "bg-indigo-950": surface(
    "rgba(129, 140, 248, 0.56)",
    "rgba(99, 102, 241, 0.78)",
    "rgba(30, 27, 75, 0.5)",
    "rgba(199, 210, 254, 0.36)",
  ),
  "bg-amber-900": surface(
    "rgba(251, 191, 36, 0.54)",
    "rgba(217, 119, 6, 0.74)",
    "rgba(120, 53, 15, 0.48)",
    "rgba(254, 240, 199, 0.32)",
  ),
  "bg-sky-900": surface(
    "rgba(125, 211, 252, 0.54)",
    "rgba(56, 189, 248, 0.75)",
    "rgba(7, 89, 133, 0.48)",
    "rgba(186, 230, 253, 0.32)",
  ),
  "bg-slate-900": surface(
    "rgba(148, 163, 184, 0.46)",
    "rgba(100, 116, 139, 0.7)",
    "rgba(30, 41, 59, 0.46)",
    "rgba(203, 213, 225, 0.28)",
  ),
  "bg-zinc-900": surface(
    "rgba(212, 212, 216, 0.46)",
    "rgba(161, 161, 170, 0.7)",
    "rgba(39, 39, 42, 0.46)",
    "rgba(228, 228, 231, 0.28)",
  ),
}

const DEFAULT_SURFACE: SidebarSurface = surface(
  "rgba(148, 163, 184, 0.4)",
  "rgba(100, 116, 139, 0.68)",
  "rgba(30, 41, 59, 0.42)",
  "rgba(203, 213, 225, 0.26)",
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

export function getBoardBackgroundPresentation(
  background?: string,
): { className: string; style: CSSProperties; isImage: boolean } {
  if (!background) {
    return { className: "", style: {}, isImage: false }
  }

  if (background.startsWith("url(")) {
    return {
      className: "",
      style: {
        backgroundImage: background,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "rgba(15, 23, 42, 0.2)",
        backgroundBlendMode: "multiply",
      },
      isImage: true,
    }
  }

  return { className: background, style: {}, isImage: false }
}

