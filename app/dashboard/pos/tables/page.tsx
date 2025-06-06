"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Users, Edit, Trash2 } from "lucide-react"

// This is a placeholder component for now
// In a real implementation, we would connect this to a tables database table
export default function TablesPage() {
  const [tables, setTables] = useState([
    { id: 1, name: "Table 1", capacity: 4, status: "available" },
    { id: 2, name: "Table 2", capacity: 2, status: "occupied" },
    { id: 3, name: "Table 3", capacity: 6, status: "available" },
    { id: 4, name: "Table 4", capacity: 4, status: "reserved" },
    { id: 5, name: "Bar 1", capacity: 2, status: "available" },
    { id: 6, name: "Bar 2", capacity: 2, status: "occupied" },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<any>(null)
  const [tableName, setTableName] = useState("")
  const [tableCapacity, setTableCapacity] = useState("4")

  const { toast } = useToast()

  const handleAddTable = () => {
    setEditingTable(null)
    setTableName("")
    setTableCapacity("4")
    setDialogOpen(true)
  }

  const handleEditTable = (table: any) => {
    setEditingTable(table)
    setTableName(table.name)
    setTableCapacity(table.capacity.toString())
    setDialogOpen(true)
  }

  const handleDeleteTable = (tableId: number) => {
    setTables(tables.filter((table) => table.id !== tableId))
    toast({
      title: "Table deleted",
      description: "The table has been removed successfully",
    })
  }

  const handleSaveTable = () => {
    if (!tableName.trim()) {
      toast({
        title: "Error",
        description: "Table name is required",
        variant: "destructive",
      })
      return
    }

    if (editingTable) {
      // Update existing table
      setTables(
        tables.map((table) =>
          table.id === editingTable.id
            ? { ...table, name: tableName, capacity: Number.parseInt(tableCapacity) }
            : table,
        ),
      )
      toast({
        title: "Table updated",
        description: `${tableName} has been updated successfully`,
      })
    } else {
      // Add new table
      const newTable = {
        id: Math.max(...tables.map((t) => t.id), 0) + 1,
        name: tableName,
        capacity: Number.parseInt(tableCapacity),
        status: "available",
      }
      setTables([...tables, newTable])
      toast({
        title: "Table added",
        description: `${tableName} has been added successfully`,
      })
    }

    setDialogOpen(false)
  }

  const handleChangeStatus = (tableId: number, newStatus: string) => {
    setTables(tables.map((table) => (table.id === tableId ? { ...table, status: newStatus } : table)))

    const table = tables.find((t) => t.id === tableId)
    toast({
      title: "Status updated",
      description: `${table?.name} is now ${newStatus}`,
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <Button onClick={handleAddTable}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`
            ${
              table.status === "available"
                ? "border-green-200"
                : table.status === "occupied"
                  ? "border-red-200"
                  : "border-yellow-200"
            }
          `}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>{table.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTable(table)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTable(table.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>Capacity: {table.capacity}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    table.status === "available"
                      ? "bg-green-100 text-green-800"
                      : table.status === "occupied"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={table.status === "available"}
                  onClick={() => handleChangeStatus(table.id, "available")}
                >
                  Available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={table.status === "occupied"}
                  onClick={() => handleChangeStatus(table.id, "occupied")}
                >
                  Occupied
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={table.status === "reserved"}
                  onClick={() => handleChangeStatus(table.id, "reserved")}
                >
                  Reserved
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
