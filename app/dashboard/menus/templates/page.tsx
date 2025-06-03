import { getMenuTemplates } from "@/lib/actions/template-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default async function MenuTemplatesPage() {
  const templates = await getMenuTemplates()

  // Default templates if none are found in the database
  const defaultTemplates = [
    {
      id: 1,
      name: "Classic Elegance",
      description: "A timeless design with a sophisticated feel, perfect for fine dining.",
      preview_image_url: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      name: "Modern Bistro",
      description: "Clean lines and a vibrant layout, ideal for casual and contemporary eateries.",
      preview_image_url: "/placeholder.svg?height=200&width=300",
    },
  ]

  const templatesToDisplay = templates.length > 0 ? templates : defaultTemplates

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Select a Menu Template</h1>
      <p className="text-lg text-gray-600 mb-8">
        Choose from our collection of beautiful and customizable templates to create your digital menu.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templatesToDisplay.map((template) => (
          <Card key={template.id} className="flex flex-col overflow-hidden">
            <div className="relative w-full h-48 bg-gray-100">
              <Image
                src={
                  template.preview_image_url ||
                  `/placeholder.svg?height=200&width=300&query=menu template ${template.name}`
                }
                alt={`Preview of ${template.name} template`}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
              />
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">{/* Additional template details can go here */}</CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/dashboard/menus/editor?templateId=${template.id}`}>Use Template</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
