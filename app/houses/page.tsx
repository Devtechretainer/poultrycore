"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Home, Plus, Pencil, Trash2 } from "lucide-react"
import { getHouses, createHouse, updateHouse, deleteHouse } from "@/lib/api/house"
import { getUserContext } from "@/lib/utils/user-context"

export default function HousesPage() {
  const router = useRouter()
  const [houses, setHouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("refresh_token")
    router.push("/login")
  }

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const { userId, farmId } = getUserContext()
      if (!userId) throw new Error("User not found")
      if (!farmId) throw new Error("Farm not selected")
      const res = await getHouses(userId, farmId)
      if (res.success && res.data) setHouses(res.data as any[])
      else setError(res.message || "Failed to load houses")
    } catch (e: any) {
      setError(e?.message || "Failed to load houses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setName("")
    setCapacity("")
    setLocation("")
    setDialogOpen(true)
  }

  const openEdit = (h: any) => {
    setEditing(h)
    setName(h.name || h.houseName || "")
    setCapacity(h.capacity != null ? String(h.capacity) : "")
    setLocation(h.location || "")
    setDialogOpen(true)
  }

  const submit = async () => {
    try {
      setSaving(true)
      const { userId, farmId } = getUserContext()
      if (!userId) throw new Error("User not found")
      if (!farmId) throw new Error("Farm not selected")
      const payload = { userId, farmId, name, capacity: capacity ? parseInt(capacity) : null, location: location || null }
      const res = editing ? await updateHouse(editing.houseId, payload) : await createHouse(payload)
      if (!res.success) throw new Error(res.message || "Request failed")
      setDialogOpen(false)
      await load()
    } catch (e: any) {
      setError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (h: any) => {
    const { userId, farmId } = getUserContext()
    if (!userId || !farmId) { alert("Missing user/farm"); return }
    if (!confirm(`Delete house "${h.houseName ?? h.name}"?`)) return
    const res = await deleteHouse(h.houseId, userId, farmId)
    if (!res.success) {
      alert(res.message || "Delete failed")
      return
    }
    await load()
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Houses</h1>
                  <p className="text-slate-600">Manage poultry houses</p>
                </div>
              </div>
              <Button onClick={openCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add House
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
            )}

            {loading ? (
              <div className="text-center py-12 text-slate-600">Loading houses...</div>
            ) : houses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Home className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No houses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {houses.map((h) => (
                  <Card key={h.houseId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">{h.name || h.houseName}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(h)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(h)} className="h-8 w-8 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Capacity:</span>
                        <span className="font-medium">{h.capacity ?? "Not set"}</span>
                      </div>
                      {h.location ? (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Location:</span>
                          <span className="font-medium">{h.location}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editing ? "Edit House" : "Add New House"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-600">
              {editing ? "Update house details below" : "Enter the house information below"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                House Name *
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="House A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-semibold text-slate-700">
                Capacity (birds)
              </Label>
              <Input 
                id="capacity" 
                type="number" 
                min="0" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)}
                className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
                Location
              </Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="North Wing"
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button 
                onClick={() => setDialogOpen(false)} 
                variant="outline"
                className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                Cancel
              </Button>
              <Button 
                onClick={submit} 
                disabled={saving} 
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 transition-all"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </span>
                ) : editing ? (
                  "Update House"
                ) : (
                  "Add House"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
