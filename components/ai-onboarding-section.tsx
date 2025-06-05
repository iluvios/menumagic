"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Check, X, FileUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiOnboardingProps {
  selectedMenu: any
  aiOnboardingStep: "idle" | "upload" | "processing" | "review" | "complete"
  setAiOnboardingStep: (step: "idle" | "upload" | "processing" | "review" | "complete") => void
  aiMenuFile: File | null
  setAiMenuFile: (file: File | null) => void
  aiProcessingProgress: number
  startAiProcessing: () => Promise<void>
  aiExtractedItems: any[]
  handleAcceptAiItem: (item: any) => void
  handleAcceptAllAiItems: () => void
  handleOpenMenuItemDialog: (item?: any) => void
  isProcessingBatch?: boolean
  processingProgress?: number
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
  isProcessingBatch = false,
  processingProgress = 0,
}: AiOnboardingProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAiMenuFile(e.dataTransfer.files[0])
      setAiOnboardingStep("upload")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAiMenuFile(e.target.files[0])
      setAiOnboardingStep("upload")
    }
  }

  const handleReset = () => {
    setAiMenuFile(null)
    setAiOnboardingStep("idle")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Menu with AI
        </CardTitle>
        <CardDescription>
          Upload a photo of your menu and our AI will extract all dishes, descriptions, and prices automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {aiOnboardingStep === "idle" && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("ai-menu-upload")?.click()}
          >
            <input
              id="ai-menu-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={aiOnboardingStep === "processing"}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <FileUp className="h-10 w-10 text-gray-400" />
              <p className="text-lg font-medium">Click or drag and drop to upload a menu image</p>
              <p className="text-sm text-gray-500">Supported formats: JPG, PNG, WEBP</p>
            </div>
          </div>
        )}

        {aiOnboardingStep === "upload" && aiMenuFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={URL.createObjectURL(aiMenuFile) || "/placeholder.svg"}
                  alt="Menu preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="font-medium">{aiMenuFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(aiMenuFile.size / 1024 / 1024).toFixed(2)} MB • {aiMenuFile.type}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleReset}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={startAiProcessing}>Process with AI</Button>
            </div>
          </div>
        )}

        {aiOnboardingStep === "processing" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={aiMenuFile ? URL.createObjectURL(aiMenuFile) : "/placeholder.svg"}
                  alt="Menu preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <p className="font-medium">Processing menu...</p>
                <Progress value={aiProcessingProgress} className="h-2 mt-2" />
                <p className="text-sm text-gray-500 mt-1">
                  {aiProcessingProgress < 100
                    ? "Extracting menu items, prices, and descriptions..."
                    : "Processing complete!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {aiOnboardingStep === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{aiExtractedItems.length} items extracted from your menu</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleAcceptAllAiItems} disabled={isProcessingBatch || aiExtractedItems.length === 0}>
                  {isProcessingBatch ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing ({processingProgress}%)
                    </>
                  ) : (
                    "Add All Items"
                  )}
                </Button>
              </div>
            </div>

            <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
              {aiExtractedItems.map((item, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{item.category}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptAiItem(item)}>
                    Add
                  </Button>
                </div>
              ))}
              {aiExtractedItems.length === 0 && (
                <div className="p-4 text-center text-gray-500">All items have been added to your menu!</div>
              )}
            </div>
          </div>
        )}

        {aiOnboardingStep === "complete" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-xl font-medium">Menu Processing Complete!</p>
              <p className="text-gray-500 mt-1">All items have been added to your menu.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Process Another Menu
              </Button>
              <Button onClick={() => handleOpenMenuItemDialog()}>Add Item Manually</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
