"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image, Link as LinkIcon, Upload, Check } from "lucide-react"
import { useColorStore } from "@/store/color-store"

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Background</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Gradient Colors</Label>
              <div className="grid grid-cols-4 gap-3">
                {gradientBackgrounds.map((swatch) => (
                  <button
                    key={swatch.value}
                    onClick={() => handleColorSelect(swatch.value)}
                    className={`relative aspect-square rounded-lg ${swatch.value} transition-all hover:scale-105 hover:ring-2 hover:ring-primary ${
                      isSelected(swatch.value) ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    title={swatch.name}
                  >
                    {isSelected(swatch.value) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Solid Colors</Label>
              <div className="grid grid-cols-4 gap-3">
                {solidBackgrounds.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value)}
                    className={`relative aspect-square rounded-lg ${color.value} transition-all hover:scale-105 hover:ring-2 hover:ring-primary ${
                      isSelected(color.value) ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    title={color.name}
                  >
                    {isSelected(color.value) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url" className="text-sm font-medium">
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
                  className="flex-1"
                />
                <Button onClick={handleImageUrlSubmit} size="icon">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-upload" className="text-sm font-medium">
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
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>

            {selectedBackground.startsWith("url(") && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Preview</Label>
                <div
                  className="w-full h-32 rounded-lg bg-cover bg-center bg-no-repeat border"
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

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-css" className="text-sm font-medium">
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
              />
              <p className="text-xs text-muted-foreground">
                Enter a Tailwind CSS class or custom CSS value
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

