"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase } from "@/lib/seed-data"

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const result = await seedDatabase()
      setResult(result)
    } catch (error) {
      setResult({ success: false, error: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            This will populate your database with sample data including categories, suppliers, ingredients, and recipes.
          </p>

          <Button onClick={handleSeed} disabled={isLoading} className="w-full">
            {isLoading ? "Seeding..." : "Seed Database"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result.success ? result.message : result.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
