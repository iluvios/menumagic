"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDigitalMenu, updateDigitalMenu } from "@/lib/actions/menu-studio-actions"
import { useToast } from "@/hooks/use-toast"
import type { DigitalMenu as DigitalMenuType } from "@/lib/types" // Ensure this import is correct
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Menu name must be at least 2 characters.",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Status is required.",
  }),
})

interface DigitalMenuFormDialogProps {
  isOpen: boolean // Always required
  onOpenChange: (open: boolean) => void // Always required
  digitalMenu?: DigitalMenuType | null // Optional: for editing existing menu
  onSave: (savedMenu?: DigitalMenuType) => void // Modified to pass the menu object
}

export function DigitalMenuFormDialog({ isOpen, onOpenChange, digitalMenu, onSave }: DigitalMenuFormDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: digitalMenu?.name || "",
      status: digitalMenu?.status || "inactive",
    },
  })

  // Sync form with digitalMenu prop for editing or reset for new creation
  useEffect(() => {
    if (isOpen) {
      console.log("DigitalMenuFormDialog: Dialog opened. Resetting form with:", digitalMenu)
      form.reset({
        name: digitalMenu?.name || "",
        status: digitalMenu?.status || "inactive",
      })
    }
  }, [digitalMenu, form, isOpen])

  const handleOpenChangeInternal = (open: boolean) => {
    console.log("DigitalMenuFormDialog: handleOpenChangeInternal called with open:", open)
    onOpenChange(open)
    if (!open) {
      form.reset() // Reset form when dialog closes
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("DigitalMenuFormDialog: onSubmit called with values:", values)
    setIsSaving(true)
    try {
      let savedMenu: DigitalMenuType | undefined
      if (digitalMenu) {
        console.log("DigitalMenuFormDialog: Attempting to update menu with ID:", digitalMenu.id)
        const result = await updateDigitalMenu(digitalMenu.id, values)
        console.log("DigitalMenuFormDialog: Update result:", result)
        if (!result.success) {
          throw new Error(result.error || "Failed to update digital menu.")
        }
        savedMenu = result.menu as DigitalMenuType // Cast to DigitalMenuType
      } else {
        console.log("DigitalMenuFormDialog: Attempting to create new menu.")
        const result = await createDigitalMenu(values)
        console.log("DigitalMenuFormDialog: Create result:", result)
        if (!result.success) {
          throw new Error(result.error || "Failed to create digital menu.")
        }
        savedMenu = result.menu as DigitalMenuType // Cast to DigitalMenuType
      }
      console.log("DigitalMenuFormDialog: Calling onSave with savedMenu:", savedMenu)
      onSave(savedMenu) // Pass the saved menu object. Parent will handle closing.
    } catch (error: any) {
      console.error("DigitalMenuFormDialog: Submission error:", error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      console.log("DigitalMenuFormDialog: Submission finished. Setting isSaving to false.")
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{digitalMenu ? "Edit Digital Menu" : "Create New Digital Menu"}</DialogTitle>
          <DialogDescription>
            {digitalMenu ? "Make changes to your digital menu here." : "Create a new digital menu to get started."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Menu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChangeInternal(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
