"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, Sparkles, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockAiMenuUpload } from "@/lib/actions/ai-menu-actions"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  reusable_menu_item_id?: number
  is_available: boolean
  order_index: number
}

interface AiOnboardingSectionProps {
  selectedMenu: { id: number; name: string }
  aiOnboardingStep: "idle" | "upload" | "processing" | "review" | "complete"
  setAiOnboardingStep: (step: "idle" | "upload" | "processing" | "review" | "complete") => void
  aiMenuFile: File | null
  setAiMenuFile: (file: File | null) => void
  aiProcessingProgress: number
  startAiProcessing: () => void
  aiExtractedItems: MenuItem[]
  handleAcceptAiItem: (item: MenuItem) => void
  handleAcceptAllAiItems: () => void
  handleOpenMenuItemDialog: (item?: MenuItem) => void
}

export function AiOnboardingSection({
  selectedMenu,
  aiOnboardingStep,
  setAiOnboardingStep,
  aiMenuFile,
  setAiMenuFile,
  aiProcessingProgress,
  startAiProcessing,
  aiExtractedItems,
  handleAcceptAiItem,
  handleAcceptAllAiItems,
  handleOpenMenuItemDialog,
}: AiOnboardingSectionProps) {
  const { toast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setAiMenuFile(file)
      setAiOnboardingStep("upload")
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (PNG, JPG) or PDF file.",
        variant: "destructive",
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const processWithAI = async () => {
    if (!aiMenuFile) return

    setIsProcessing(true)
    setAiOnboardingStep("processing")

    try {
      const formData = new FormData()
      formData.append("menu", aiMenuFile)

      const result = await mockAiMenuUpload(formData)

      if (result.success && result.data) {
        // Convert the AI result to MenuItem format
        const extractedItems: MenuItem[] = []
        let itemId = 1000 // Temporary ID for preview

        result.data.categories?.forEach((category: any) => {
          category.items?.forEach((item: any) => {
            extractedItems.push({
              id: itemId++,
              name: item.name || "Unnamed Item",
              description: item.description || "",
              price: item.price || 0,
              menu_category_id: 1, // Default category
              category_name: category.name || "Uncategorized",
              is_available: true,
              order_index: 0,
            })
          })
        })

        // Simulate the extracted items being set
        setTimeout(() => {
          setAiOnboardingStep("review")
          setIsProcessing(false)
          // You would set the extracted items here in the parent component
          toast({
            title: "AI Processing Complete!",
            description: `Extracted ${extractedItems.length} menu items.`,
          })
        }, 2000)
      } else {
        throw new Error(result.error || "Failed to process menu")
      }
    } catch (error: any) {
      console.error("AI processing error:", error)
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process menu with AI",
        variant: "destructive",
      })
      setAiOnboardingStep("upload")
      setIsProcessing(false)
    }
  }

  const resetAiFlow = () => {
    setAiOnboardingStep("idle")
    setAiMenuFile(null)
    setIsProcessing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Menu Upload
          </CardTitle>
          <CardDescription>Upload your existing menu and let AI extract all items automatically</CardDescription>
        </CardHeader>
        <CardContent>
          {aiOnboardingStep === "idle" && (
            <div className="text-center py-8">
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isDragOver ? "border-purple-400 bg-purple-50" : "border-gray-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Your Menu</h3>
                <p className="text-gray-500 mb-4">Drag and drop your menu image or PDF, or click to browse</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="menu-upload"
                />
                <label htmlFor="menu-upload">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {aiOnboardingStep === "upload" && aiMenuFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileImage className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">{aiMenuFile.name}</p>
                  <p className="text-sm text-gray-500">{(aiMenuFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetAiFlow}>
                  Remove
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={processWithAI} disabled={isProcessing} className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isProcessing ? "Processing..." : "Extract with AI"}
                </Button>
                <Button variant="outline" onClick={resetAiFlow}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {aiOnboardingStep === "processing" && (
            <div className="space-y-4 text-center py-8">
              <Sparkles className="h-12 w-12 text-purple-500 mx-auto animate-spin" />
              <h3 className="text-lg font-medium">AI is analyzing your menu...</h3>
              <Progress value={aiProcessingProgress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-gray-500">This may take a few moments while we extract all menu items</p>
            </div>
          )}

          {aiOnboardingStep === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Review Extracted Items</h3>
                <div className="flex gap-2">
                  <Button onClick={handleAcceptAllAiItems} size="sm">
                    Accept All ({aiExtractedItems.length})
                  </Button>
                  <Button variant="outline" onClick={resetAiFlow} size="sm">
                    Start Over
                  </Button>
                </div>
              </div>

              {aiExtractedItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items were extracted. Try a different image or add items manually.</p>
                  <Button onClick={() => handleOpenMenuItemDialog()} className="mt-4">
                    Add Item Manually
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {aiExtractedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        <p className="text-sm font-medium text-green-600">${item.price}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleOpenMenuItemDialog(item)}>
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => handleAcceptAiItem(item)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
