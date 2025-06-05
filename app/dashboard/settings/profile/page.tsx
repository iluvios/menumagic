"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getRestaurantDetails, updateRestaurantDetails } from "@/lib/actions/menu-studio-actions" // Corrected imports
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

interface OperatingHours {
  [key: string]: {
    open: string
    close: string
    is_closed: boolean
  }
}

interface RestaurantDetails {
  id: number
  name: string
  address_json: Address
  phone: string
  email: string
  cuisine_type: string
  operating_hours_json: OperatingHours
  currency_code: string
  timezone: string
  default_tax_rate_percentage: number
}

const initialAddress: Address = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
}

const initialOperatingHours: OperatingHours = {
  monday: { open: "09:00", close: "17:00", is_closed: false },
  tuesday: { open: "09:00", close: "17:00", is_closed: false },
  wednesday: { open: "09:00", close: "17:00", is_closed: false },
  thursday: { open: "09:00", close: "17:00", is_closed: false },
  friday: { open: "09:00", close: "17:00", is_closed: false },
  saturday: { open: "09:00", close: "17:00", is_closed: true },
  sunday: { open: "09:00", close: "17:00", is_closed: true },
}

export default function RestaurantProfilePage() {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchRestaurantData() {
      setLoading(true)
      try {
        const data = await getRestaurantDetails() // Corrected function call
        if (data) {
          setRestaurant({
            ...data,
            address_json: data.address_json || initialAddress,
            operating_hours_json: data.operating_hours_json || initialOperatingHours,
          })
        } else {
          toast({
            title: "Error",
            description: "No restaurant data found. Please ensure you are logged in.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to fetch restaurant details:", error)
        toast({
          title: "Error",
          description: "Failed to load restaurant details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurantData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setRestaurant((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setRestaurant((prev) =>
      prev
        ? {
            ...prev,
            address_json: {
              ...prev.address_json,
              [id]: value,
            },
          }
        : null,
    )
  }

  const handleOperatingHoursChange = (day: string, field: "open" | "close" | "is_closed", value: string | boolean) => {
    setRestaurant((prev) =>
      prev
        ? {
            ...prev,
            operating_hours_json: {
              ...prev.operating_hours_json,
              [day]: {
                ...prev.operating_hours_json[day],
                [field]: value,
              },
            },
          }
        : null,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant) return

    setIsSaving(true)
    try {
      const result = await updateRestaurantDetails(restaurant.id, restaurant) // Corrected function call
      if (result.success) {
        toast({
          title: "Success",
          description: "Restaurant details updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update restaurant details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating restaurant details:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-gray-600">
        No restaurant data available.
      </div>
    )
  }

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Restaurant Profile</CardTitle>
          <CardDescription className="text-center">Manage your restaurant's basic information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" value={restaurant.name} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cuisine_type">Cuisine Type</Label>
              <Input id="cuisine_type" value={restaurant.cuisine_type} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={restaurant.email} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={restaurant.phone} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                id="street"
                placeholder="Street"
                value={restaurant.address_json.street}
                onChange={handleAddressChange}
                className="mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  id="city"
                  placeholder="City"
                  value={restaurant.address_json.city}
                  onChange={handleAddressChange}
                />
                <Input
                  id="state"
                  placeholder="State"
                  value={restaurant.address_json.state}
                  onChange={handleAddressChange}
                />
                <Input
                  id="zip"
                  placeholder="Zip Code"
                  value={restaurant.address_json.zip}
                  onChange={handleAddressChange}
                />
              </div>
              <Input
                id="country"
                placeholder="Country"
                value={restaurant.address_json.country}
                onChange={handleAddressChange}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency_code">Currency Code</Label>
                <Input id="currency_code" value={restaurant.currency_code} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={restaurant.timezone} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default_tax_rate_percentage">Default Tax Rate (%)</Label>
              <Input
                id="default_tax_rate_percentage"
                type="number"
                step="0.01"
                value={restaurant.default_tax_rate_percentage}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4">
              <Label>Operating Hours</Label>
              {daysOfWeek.map((day) => (
                <div key={day} className="grid grid-cols-4 items-center gap-2">
                  <Label className="capitalize">{day}</Label>
                  <Input
                    type="time"
                    value={restaurant.operating_hours_json[day]?.open || ""}
                    onChange={(e) => handleOperatingHoursChange(day, "open", e.target.value)}
                    disabled={restaurant.operating_hours_json[day]?.is_closed}
                  />
                  <Input
                    type="time"
                    value={restaurant.operating_hours_json[day]?.close || ""}
                    onChange={(e) => handleOperatingHoursChange(day, "close", e.target.value)}
                    disabled={restaurant.operating_hours_json[day]?.is_closed}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`closed-${day}`}
                      checked={restaurant.operating_hours_json[day]?.is_closed || false}
                      onChange={(e) => handleOperatingHoursChange(day, "is_closed", e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <Label htmlFor={`closed-${day}`}>Closed</Label>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
