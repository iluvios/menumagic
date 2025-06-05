"use client"

import { useEffect, useState } from "react"

export default function TestImportsPage() {
  const [message, setMessage] = useState("Attempting to import digital-menu-actions...")

  useEffect(() => {
    async function testImport() {
      try {
        // Dynamically import to catch potential errors at runtime
        const digitalMenuActions = await import("@/lib/actions/digital-menu-actions")
        if (digitalMenuActions && digitalMenuActions.getDigitalMenus) {
          setMessage("SUCCESS: digital-menu-actions.ts found and functions are accessible!")
          console.log("digitalMenuActions:", digitalMenuActions)
        } else {
          setMessage("FAILURE: digital-menu-actions.ts found, but functions are not accessible.")
        }
      } catch (error: any) {
        setMessage(`ERROR: digital-menu-actions.ts not found or failed to import. Error: ${error.message}`)
        console.error("Import error:", error)
      }
    }
    testImport()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Import Test Page</h1>
        <p className="text-lg">{message}</p>
        <p className="mt-4 text-sm text-gray-600">Check the console for more details on the import attempt.</p>
      </div>
    </div>
  )
}
