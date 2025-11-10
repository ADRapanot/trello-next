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
    value: "bg-gradient-to-br from-blue-500 to-blue-300",
    color: "#3b82f6",
    type: "gradient",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    value: "bg-gradient-to-br from-green-500 to-green-300",
    color: "#22c55e",
    type: "gradient",
  },
  {
    id: "purple-dream",
    name: "Purple Dream",
    value: "bg-gradient-to-br from-purple-500 to-purple-300",
    color: "#a855f7",
    type: "gradient",
  },
  {
    id: "pink-blossom",
    name: "Pink Blossom",
    value: "bg-gradient-to-br from-pink-500 to-pink-300",
    color: "#ec4899",
    type: "gradient",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    value: "bg-gradient-to-br from-orange-500 to-orange-300",
    color: "#f97316",
    type: "gradient",
  },
  {
    id: "ruby-red",
    name: "Ruby Red",
    value: "bg-gradient-to-br from-red-500 to-red-300",
    color: "#ef4444",
    type: "gradient",
  },
  {
    id: "teal-wave",
    name: "Teal Wave",
    value: "bg-gradient-to-br from-teal-500 to-teal-300",
    color: "#14b8a6",
    type: "gradient",
  },
  {
    id: "indigo-night",
    name: "Indigo Night",
    value: "bg-gradient-to-br from-indigo-500 to-indigo-300",
    color: "#6366f1",
    type: "gradient",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    value: "bg-gradient-to-br from-yellow-500 to-yellow-300",
    color: "#eab308",
    type: "gradient",
  },
  {
    id: "aqua-splash",
    name: "Aqua Splash",
    value: "bg-gradient-to-br from-cyan-500 to-cyan-300",
    color: "#06b6d4",
    type: "gradient",
  },
  {
    id: "slate-storm",
    name: "Slate Storm",
    value: "bg-gradient-to-br from-slate-500 to-slate-300",
    color: "#64748b",
    type: "gradient",
  },
  {
    id: "foggy-dawn",
    name: "Foggy Dawn",
    value: "bg-gradient-to-br from-gray-500 to-gray-300",
    color: "#6b7280",
    type: "gradient",
  },
]

const solidBackgrounds: BackgroundColorDefinition[] = [
  { id: "solid-blue", name: "Blue", value: "bg-blue-500", color: "#3b82f6", type: "solid" },
  { id: "solid-green", name: "Green", value: "bg-green-500", color: "#22c55e", type: "solid" },
  { id: "solid-purple", name: "Purple", value: "bg-purple-500", color: "#a855f7", type: "solid" },
  { id: "solid-pink", name: "Pink", value: "bg-pink-500", color: "#ec4899", type: "solid" },
  { id: "solid-orange", name: "Orange", value: "bg-orange-500", color: "#f97316", type: "solid" },
  { id: "solid-red", name: "Red", value: "bg-red-500", color: "#ef4444", type: "solid" },
  { id: "solid-teal", name: "Teal", value: "bg-teal-500", color: "#14b8a6", type: "solid" },
  { id: "solid-indigo", name: "Indigo", value: "bg-indigo-500", color: "#6366f1", type: "solid" },
  { id: "solid-yellow", name: "Yellow", value: "bg-yellow-500", color: "#eab308", type: "solid" },
  { id: "solid-cyan", name: "Cyan", value: "bg-cyan-500", color: "#06b6d4", type: "solid" },
  { id: "solid-slate", name: "Slate", value: "bg-slate-500", color: "#64748b", type: "solid" },
  { id: "solid-gray", name: "Gray", value: "bg-gray-500", color: "#6b7280", type: "solid" },
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


