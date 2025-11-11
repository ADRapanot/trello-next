"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"

export type BackgroundColorType = "gradient" | "solid"

export interface BackgroundColorDefinition {
  id: string
  name: string
  value: string
  color: string
  type: BackgroundColorType
}

const gradientBackgrounds: BackgroundColorDefinition[] = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    value: "bg-gradient-to-br from-blue-900 to-blue-700",
    color: "#1d4ed8",
    type: "gradient",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    value: "bg-gradient-to-br from-emerald-900 to-emerald-700",
    color: "#047857",
    type: "gradient",
  },
  {
    id: "purple-dream",
    name: "Purple Dream",
    value: "bg-gradient-to-br from-purple-900 to-purple-700",
    color: "#5b21b6",
    type: "gradient",
  },
  {
    id: "pink-blossom",
    name: "Pink Blossom",
    value: "bg-gradient-to-br from-rose-900 to-rose-700",
    color: "#9f1239",
    type: "gradient",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    value: "bg-gradient-to-br from-orange-900 to-orange-700",
    color: "#9a3412",
    type: "gradient",
  },
  {
    id: "ruby-red",
    name: "Ruby Red",
    value: "bg-gradient-to-br from-red-900 to-red-700",
    color: "#991b1b",
    type: "gradient",
  },
  {
    id: "teal-wave",
    name: "Teal Wave",
    value: "bg-gradient-to-br from-cyan-900 to-cyan-700",
    color: "#0e7490",
    type: "gradient",
  },
  {
    id: "indigo-night",
    name: "Indigo Night",
    value: "bg-gradient-to-br from-indigo-950 to-indigo-800",
    color: "#3730a3",
    type: "gradient",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    value: "bg-gradient-to-br from-amber-900 to-amber-700",
    color: "#92400e",
    type: "gradient",
  },
  {
    id: "aqua-splash",
    name: "Aqua Splash",
    value: "bg-gradient-to-br from-sky-900 to-sky-700",
    color: "#0c4a6e",
    type: "gradient",
  },
  {
    id: "slate-storm",
    name: "Slate Storm",
    value: "bg-gradient-to-br from-slate-900 to-slate-700",
    color: "#1f2937",
    type: "gradient",
  },
  {
    id: "foggy-dawn",
    name: "Foggy Dawn",
    value: "bg-gradient-to-br from-zinc-900 to-zinc-700",
    color: "#3f3f46",
    type: "gradient",
  },
]

const solidBackgrounds: BackgroundColorDefinition[] = [
  { id: "solid-blue", name: "Blue", value: "bg-blue-900", color: "#1d4ed8", type: "solid" },
  { id: "solid-green", name: "Green", value: "bg-emerald-900", color: "#047857", type: "solid" },
  { id: "solid-purple", name: "Purple", value: "bg-purple-900", color: "#5b21b6", type: "solid" },
  { id: "solid-pink", name: "Pink", value: "bg-rose-900", color: "#9f1239", type: "solid" },
  { id: "solid-orange", name: "Orange", value: "bg-orange-900", color: "#9a3412", type: "solid" },
  { id: "solid-red", name: "Red", value: "bg-red-900", color: "#991b1b", type: "solid" },
  { id: "solid-teal", name: "Teal", value: "bg-cyan-900", color: "#0e7490", type: "solid" },
  { id: "solid-indigo", name: "Indigo", value: "bg-indigo-950", color: "#3730a3", type: "solid" },
  { id: "solid-yellow", name: "Yellow", value: "bg-amber-900", color: "#92400e", type: "solid" },
  { id: "solid-cyan", name: "Cyan", value: "bg-sky-900", color: "#0c4a6e", type: "solid" },
  { id: "solid-slate", name: "Slate", value: "bg-slate-900", color: "#1f2937", type: "solid" },
  { id: "solid-gray", name: "Gray", value: "bg-zinc-900", color: "#3f3f46", type: "solid" },
]

const allBackgrounds: BackgroundColorDefinition[] = [...gradientBackgrounds, ...solidBackgrounds]

export interface ColorStoreValue {
  gradientBackgrounds: BackgroundColorDefinition[]
  solidBackgrounds: BackgroundColorDefinition[]
  backgrounds: BackgroundColorDefinition[]
  findBackgroundByValue: (value: string) => BackgroundColorDefinition | undefined
}

const ColorStoreContext = createContext<ColorStoreValue | undefined>(undefined)

const defaultColorStoreValue: ColorStoreValue = {
  gradientBackgrounds,
  solidBackgrounds,
  backgrounds: allBackgrounds,
  findBackgroundByValue: (value: string) => allBackgrounds.find((background) => background.value === value),
}

export function ColorStoreProvider({ children }: { children: ReactNode }) {
  return <ColorStoreContext.Provider value={defaultColorStoreValue}>{children}</ColorStoreContext.Provider>
}

export function useColorStore() {
  const context = useContext(ColorStoreContext)
  if (!context) {
    throw new Error("useColorStore must be used within a ColorStoreProvider")
  }
  return context
}

export const defaultGradientBackground = gradientBackgrounds[0]!
export const defaultGradientBackgroundValue = defaultGradientBackground.value


