"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getRestaurantDetails, // Corrected import
  updateRestaurantDetails, // Corrected import
} from "@/lib/actions/restaurant-actions" // Corrected path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface RestaurantDetails {
  id: number
  name: string
  address: string | null
  phone_number: string | null
  email: string | null
  website: string | null
  description: string | null
}

export default function ProfileSettingsPage() {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchRestaurantDetails()
  }, [])

  const fetchRestaurantDetails = async () => {
    try {
      const details = await getRestaurantDetails()
      setRestaurant(details)
    } catch (error) {
      toast.error("Failed to fetch restaurant details.")
      console.error("Error fetching restaurant details:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setRestaurant((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleSave = async () => {
    if (!restaurant) return

    setIsSaving(true)
    try {
      await updateRestaurantDetails(restaurant.id, {
        name: restaurant.name,
        address: restaurant.address,
        phone_number: restaurant.phone_number,
        email: restaurant.email,
        website: restaurant.website,
        description: restaurant.description,
      })
      toast.success("Restaurant details updated successfully.")
    } catch (error) {
      toast.error("Failed to update restaurant details.")
      console.error("Error updating restaurant details:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!restaurant) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Profile Settings</h1>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Update your restaurant's general information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Restaurant Name</Label>
            <Input id="name" value={restaurant.name || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={restaurant.address || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" value={restaurant.phone_number || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={restaurant.email || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={restaurant.website || ""} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={restaurant.description || ""} onChange={handleInputChange} rows={4} />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
