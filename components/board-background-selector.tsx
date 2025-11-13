"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image, Link as LinkIcon, Upload, Check } from "lucide-react"
import { useColorStore } from "@/store/color-store"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BoardBackgroundSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentBackground: string
  onBackgroundChange: (background: string) => void
}

export function BoardBackgroundSelector({
  isOpen,
  onClose,
  currentBackground,
  onBackgroundChange,
}: BoardBackgroundSelectorProps) {
  const { gradientBackgrounds, solidBackgrounds } = useColorStore()
  const [imageUrl, setImageUrl] = useState("")
  const [selectedBackground, setSelectedBackground] = useState(currentBackground)

  // Sync selected background when currentBackground changes
  useEffect(() => {
    setSelectedBackground(currentBackground)
  }, [currentBackground])

  const handleColorSelect = (value: string) => {
    setSelectedBackground(value)
    onBackgroundChange(value)
  }

  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      const backgroundStyle = `url("${imageUrl}")`
      setSelectedBackground(backgroundStyle)
      onBackgroundChange(backgroundStyle)
      setImageUrl("") // Clear input after submission
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        const backgroundStyle = `url("${imageUrl}")`
        setSelectedBackground(backgroundStyle)
        onBackgroundChange(backgroundStyle)
      }
      reader.readAsDataURL(file)
    }
  }

  const isSelected = (value: string) => {
    if (value.startsWith("url(")) {
      return selectedBackground.startsWith("url(") && selectedBackground === value
    }
    return selectedBackground === value
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border border-slate-200 rounded-[26px] shadow-[0_26px_56px_-30px_rgba(15,23,42,0.18)] bg-white text-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="relative px-5 pt-5 pb-3 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_60%)]" />
          <DialogTitle className="relative text-lg font-semibold text-slate-900">Change Background</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[600px]">
          <div className="px-5 pt-4 pb-1 text-slate-700 max-h-[600px]">
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                <TabsTrigger
                  value="colors"
                  className="rounded-xl text-sm transition-all text-slate-600 data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 data-[state=active]:shadow-[0_12px_24px_-18px_rgba(56,189,248,0.4)]"
                >
                  Colors
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="rounded-xl text-sm transition-all text-slate-600 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-[0_12px_24px_-18px_rgba(99,102,241,0.35)]"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="rounded-xl text-sm transition-all text-slate-600 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:shadow-[0_12px_24px_-18px_rgba(45,212,191,0.35)]"
                >
                  Custom
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-2.5 mt-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                    Gradient Colors
                  </Label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {gradientBackgrounds.map((swatch) => (
                      <button
                        key={swatch.value}
                        onClick={() => handleColorSelect(swatch.value)}
                        className={`relative aspect-square rounded-2xl ${swatch.value} transition-all hover:scale-[1.03] hover:ring-2 hover:ring-sky-400/80 hover:ring-offset-2 hover:ring-offset-white ${
                          isSelected(swatch.value)
                            ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-white shadow-[0_16px_32px_-20px_rgba(56,189,248,0.35)]"
                            : ""
                        }`}
                        title={swatch.name}
                      >
                        {isSelected(swatch.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-1.5 shadow-sm">
                              <Check className="h-3.5 w-3.5 text-sky-500" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                    Solid Colors
                  </Label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {solidBackgrounds.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorSelect(color.value)}
                        className={`relative aspect-square rounded-2xl ${color.value} transition-all hover:scale-[1.03] hover:ring-2 hover:ring-sky-400/80 hover:ring-offset-2 hover:ring-offset-white ${
                          isSelected(color.value)
                            ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-white shadow-[0_16px_32px_-20px_rgba(56,189,248,0.35)]"
                            : ""
                        }`}
                        title={color.name}
                      >
                        {isSelected(color.value) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-1.5 shadow-sm">
                              <Check className="h-3.5 w-3.5 text-sky-500" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-2.5 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="image-url" className="text-sm font-medium text-slate-700">
                    Image URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleImageUrlSubmit()
                        }
                      }}
                      className="flex-1 h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-400"
                    />
                    <Button
                      onClick={handleImageUrlSubmit}
                      size="icon"
                      className="h-10 w-10 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="image-upload" className="text-sm font-medium text-slate-700">
                    Upload Image
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      className="w-full h-10 rounded-xl border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>

                {selectedBackground.startsWith("url(") && (
                  <div className="mt-3">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Preview</Label>
                    <div
                      className="w-full h-40 rounded-2xl bg-cover bg-center bg-no-repeat border border-slate-200 shadow-[0_18px_36px_-26px_rgba(15,118,110,0.25)]"
                      style={{ 
                        backgroundImage: selectedBackground,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-2.5 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="custom-css" className="text-sm font-medium text-slate-700">
                    Custom CSS Background
                  </Label>
                  <Input
                    id="custom-css"
                    type="text"
                    placeholder="bg-gradient-to-r from-purple-400 to-pink-400"
                    value={selectedBackground.startsWith("url(") ? "" : selectedBackground}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedBackground(value)
                      if (value.trim()) {
                        onBackgroundChange(value)
                      }
                    }}
                    className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-emerald-400"
                  />
                  <p className="text-xs text-slate-500">
                    Enter a Tailwind CSS class or custom CSS value
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-full border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

