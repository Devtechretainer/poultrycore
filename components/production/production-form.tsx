"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFlocks } from "@/lib/api/flock"
import { getUserContext } from "@/lib/utils/user-context"
import { createProductionRecord, updateProductionRecord, getProductionRecords, type ProductionRecordInput, type ProductionRecord } from "@/lib/api/production-record"
import { createFeedUsage, updateFeedUsage, getFeedUsages, type FeedUsageInput } from "@/lib/api/feed-usage"

interface ProductionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: ProductionRecord | null
  onSaved?: () => void
}

export function ProductionForm({ open, onOpenChange, record, onSaved }: ProductionFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [flocks, setFlocks] = useState<any[]>([])
  const [flocksError, setFlocksError] = useState("")

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [form, setForm] = useState({
    flockId: "",
    date: today,
    morning: "",
    noon: "",
    evening: "",
    feedKg: "",
    feedType: "",
    mortality: "",
    numBirds: "",
    notes: "",
    medication: "",
  })

  const feedTypes = [
    "Starter Feed",
    "Grower Feed", 
    "Layer Feed",
    "Broiler Feed",
    "Organic Feed",
    "Custom Mix"
  ]
  const [manualAge, setManualAge] = useState(false)
  const [manualWeeks, setManualWeeks] = useState("")
  const [manualDays, setManualDays] = useState("")
  const [manualYears, setManualYears] = useState("")

  const [previousBirdsLeft, setPreviousBirdsLeft] = useState<number | null>(null)
  const [previousRecords, setPreviousRecords] = useState<ProductionRecord[]>([])

  const total = (parseInt(form.morning) || 0) + (parseInt(form.noon) || 0) + (parseInt(form.evening) || 0)
  const calculatedBirdsLeft = previousBirdsLeft !== null 
    ? previousBirdsLeft - (parseInt(form.mortality) || 0)
    : (parseInt(form.numBirds) || 0) - (parseInt(form.mortality) || 0)
  const birdsLeft = calculatedBirdsLeft
  const selectedFlock = useMemo(() => flocks.find((f) => String(f.flockId) === form.flockId), [flocks, form.flockId])
  const { ageWeeks, ageDays, ageYears } = useMemo(() => {
    try {
      if (!selectedFlock?.startDate || !form.date) return { ageWeeks: 0, ageDays: 0, ageYears: 0 }
      const start = new Date(selectedFlock.startDate)
      const curr = new Date(form.date)
      const ms = Math.max(0, curr.getTime() - start.getTime())
      const days = Math.floor(ms / (1000 * 60 * 60 * 24))
      const weeks = Math.floor(days / 7)
      const years = Math.floor(days / 365)
      return { ageWeeks: weeks, ageDays: days, ageYears: years }
    } catch { return { ageWeeks: 0, ageDays: 0, ageYears: 0 } }
  }, [selectedFlock, form.date])

  useEffect(() => {
    const load = async () => {
      try {
        setFlocksError("")
        const { userId, farmId } = getUserContext()
        if (!userId || !farmId) return
        const res = await getFlocks(userId, farmId)
        if (res.success && Array.isArray(res.data)) setFlocks(res.data)
        else {
          setFlocks([])
          setFlocksError(res.message || "Failed to load flocks.")
        }
      } catch (e) {
        setFlocks([])
        setFlocksError("Unable to fetch flocks. Check API URL and CORS.")
      }
    }
    load()
  }, [])

  // Load previous records to calculate birds left
  useEffect(() => {
    const loadPreviousRecords = async () => {
      if (!form.flockId || !form.date) {
        setPreviousBirdsLeft(null)
        setPreviousRecords([])
        return
      }

      try {
        const { userId, farmId } = getUserContext()
        if (!userId || !farmId) return

        const res = await getProductionRecords(userId, farmId)
        if (res.success && res.data) {
          const flockIdNum = parseInt(form.flockId)
          const currentDate = new Date(form.date)
          
          // Get all records for this flock before the current date
          const previous = res.data
            .filter((r: any) => {
              if (r.flockId !== flockIdNum) return false
              const recordDate = new Date(r.date)
              return recordDate < currentDate
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

          setPreviousRecords(previous)

          if (previous.length > 0) {
            // Use the most recent record's birds left
            const mostRecent = previous[0]
            const lastBirdsLeft = mostRecent.noOfBirdsLeft || mostRecent.noOfBirds || 0
            setPreviousBirdsLeft(lastBirdsLeft)
            
            // Auto-populate numBirds if not set
            if (!form.numBirds && lastBirdsLeft > 0) {
              setForm(prev => ({ ...prev, numBirds: String(lastBirdsLeft) }))
            }
          } else {
            // No previous records, use flock's initial quantity
            const flock = flocks.find(f => f.flockId === flockIdNum)
            if (flock) {
              setPreviousBirdsLeft(flock.quantity || 0)
              if (!form.numBirds) {
                setForm(prev => ({ ...prev, numBirds: String(flock.quantity || 0) }))
              }
            } else {
              setPreviousBirdsLeft(null)
            }
          }
        }
      } catch (e) {
        console.error("Error loading previous records:", e)
        setPreviousBirdsLeft(null)
      }
    }

    loadPreviousRecords()
  }, [form.flockId, form.date, flocks])

  useEffect(() => {
    if (!record) {
      setForm({ flockId: "", date: today, morning: "", noon: "", evening: "", feedKg: "", feedType: "", mortality: "", numBirds: "", notes: "", medication: "" })
      return
    }
    
    // Load feed type from feed usage if available
    const loadFeedType = async () => {
      const { userId, farmId } = getUserContext()
      if (!userId || !farmId || !record.id) return
      
      try {
        const feedUsagesRes = await getFeedUsages(userId, farmId)
        if (feedUsagesRes.success && feedUsagesRes.data) {
          const matchingFeedUsage = feedUsagesRes.data.find(
            (fu: any) => fu.flockId === (record as any).flockId && 
            new Date(fu.usageDate).toISOString().split('T')[0] === (record.date || "").split("T")[0]
          )
          if (matchingFeedUsage) {
            setForm(prev => ({ ...prev, feedType: matchingFeedUsage.feedType || "" }))
            return
          }
        }
      } catch (e) {
        console.error("Error loading feed type:", e)
      }
      
      setForm({
        flockId: String((record as any).flockId || ""),
        date: (record.date || "").split("T")[0],
        morning: String(record.production9AM ?? ""),
        noon: String(record.production12PM ?? ""),
        evening: String(record.production4PM ?? ""),
        feedKg: String(record.feedKg ?? ""),
        feedType: "",
        mortality: String(record.mortality ?? ""),
        numBirds: String(record.noOfBirds ?? ""),
        notes: "",
        medication: record.medication || "",
      })
    }
    
    loadFeedType()
  }, [record, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError("")
      const { userId, farmId } = getUserContext()
      if (!userId || !farmId) throw new Error("Missing user/farm context")

      // Validation
      const numBirds = parseInt(form.numBirds) || 0
      const mortality = parseInt(form.mortality) || 0
      const calculatedLeft = previousBirdsLeft !== null 
        ? previousBirdsLeft - mortality
        : numBirds - mortality

      if (mortality > numBirds) {
        setError(`Mortality (${mortality}) cannot be greater than number of birds (${numBirds})`)
        setSaving(false)
        return
      }

      if (previousBirdsLeft !== null && mortality > previousBirdsLeft) {
        setError(`Mortality (${mortality}) cannot be greater than birds left from previous record (${previousBirdsLeft})`)
        setSaving(false)
        return
      }

      if (calculatedLeft < 0) {
        setError(`Birds left cannot be negative. Check your mortality and number of birds.`)
        setSaving(false)
        return
      }

      if (!form.flockId) {
        setError("Please select a flock")
        setSaving(false)
        return
      }

      const resolvedDays = manualAge
        ? (parseInt(manualDays) || ((parseInt(manualYears) || 0) * 365) || ((parseInt(manualWeeks) || 0) * 7))
        : ageDays
      const resolvedWeeks = manualAge
        ? (parseInt(manualWeeks) || Math.floor(((parseInt(manualDays) || 0) / 7)) || ((parseInt(manualYears) || 0) * 52))
        : ageWeeks

      const input: ProductionRecordInput = {
        farmId,
        userId,
        createdBy: userId,
        updatedBy: userId,
        ageInWeeks: resolvedWeeks,
        ageInDays: resolvedDays,
        date: form.date,
        noOfBirds: numBirds,
        mortality: mortality,
        noOfBirdsLeft: calculatedLeft,
        feedKg: parseFloat(form.feedKg) || 0,
        medication: form.medication || "None",
        production9AM: parseInt(form.morning) || 0,
        production12PM: parseInt(form.noon) || 0,
        production4PM: parseInt(form.evening) || 0,
        totalProduction: total,
        flockId: form.flockId ? parseInt(form.flockId) : null,
      }

      let productionRecordId: number | null = null
      if (record) {
        await updateProductionRecord(record.id, input)
        productionRecordId = record.id
      } else {
        const createRes = await createProductionRecord(input)
        if (createRes.success && (createRes as any).data) {
          productionRecordId = ((createRes as any).data as any).id || null
        }
      }

      // Sync feed usage if feedKg > 0 and feedType is provided
      if (parseFloat(form.feedKg) > 0 && form.flockId && form.feedType) {
        try {
          const { userId, farmId } = getUserContext()
          if (userId && farmId) {
            // Check if feed usage already exists for this date and flock
            const feedUsagesRes = await getFeedUsages(userId, farmId)
            let existingFeedUsage: any = null
            
            if (feedUsagesRes.success && feedUsagesRes.data) {
              existingFeedUsage = feedUsagesRes.data.find(
                (fu: any) => fu.flockId === parseInt(form.flockId) && 
                new Date(fu.usageDate).toISOString().split('T')[0] === form.date
              )
            }

            const feedUsageData: FeedUsageInput = {
              farmId,
              userId,
              flockId: parseInt(form.flockId),
              usageDate: form.date + 'T00:00:00Z',
              feedType: form.feedType,
              quantityKg: parseFloat(form.feedKg) || 0,
            }

            if (existingFeedUsage) {
              await updateFeedUsage(existingFeedUsage.feedUsageId, feedUsageData)
            } else {
              await createFeedUsage(feedUsageData)
            }
          }
        } catch (feedError) {
          console.error("Error syncing feed usage:", feedError)
          // Don't fail the whole operation if feed sync fails
        }
      }

      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      setError(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[900px]">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Production Record" : "Log Production"}</DialogTitle>
          <DialogDescription>{record ? "Update production data" : "Record daily production data"}</DialogDescription>
        </DialogHeader>

        {error ? <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 mb-2">{error}</div> : null}

        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
          <div className="col-span-6 space-y-2">
            <Label>Flock</Label>
            <Select value={form.flockId} onValueChange={(v) => setForm({ ...form, flockId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select flock" />
              </SelectTrigger>
              <SelectContent>
                {flocks.map((f) => (
                  <SelectItem key={f.flockId} value={String(f.flockId)}>
                    {f.name || `Flock ${f.flockId}`} (ID: {f.flockId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {flocksError ? <div className="text-xs text-amber-600">{flocksError}</div> : null}
            {form.flockId ? <div className="text-xs text-slate-500">Selected Flock ID: <span className="font-semibold">{form.flockId}</span></div> : null}
          </div>

          <div className="col-span-6 space-y-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <div className="text-xs text-slate-500">Defaults to today. Change only if you are logging for a different date.</div>
          </div>

          {/* Time slots + total eggs on the same row */}
          <div className="col-span-3 space-y-2">
            <Label>Morning (9am)</Label>
            <Input type="number" min="0" value={form.morning} onChange={(e) => setForm({ ...form, morning: e.target.value })} />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Noon (12pm)</Label>
            <Input type="number" min="0" value={form.noon} onChange={(e) => setForm({ ...form, noon: e.target.value })} />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Evening (4pm)</Label>
            <Input type="number" min="0" value={form.evening} onChange={(e) => setForm({ ...form, evening: e.target.value })} />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Total Eggs</Label>
            <div className="pt-2 font-semibold">{total}</div>
          </div>

          <div className="col-span-4 space-y-2">
            <Label>Feed Type</Label>
            <Select value={form.feedType} onValueChange={(v) => setForm({ ...form, feedType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent>
                {feedTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4 space-y-2">
            <Label>Feed (kg)</Label>
            <Input type="number" step="0.01" min="0" value={form.feedKg} onChange={(e) => setForm({ ...form, feedKg: e.target.value })} />
          </div>
          <div className="col-span-4 space-y-2">
            <Label>Mortality</Label>
            <Input type="number" min="0" value={form.mortality} onChange={(e) => setForm({ ...form, mortality: e.target.value })} />
          </div>
          <div className="col-span-6 space-y-2">
            <Label>Num of Birds</Label>
            <Input type="number" min="0" value={form.numBirds} onChange={(e) => setForm({ ...form, numBirds: e.target.value })} />
          </div>
          <div className="col-span-6">
            <Label>Birds Left</Label>
            <div className="pt-2 font-semibold">
              {previousBirdsLeft !== null && (
                <span className="text-xs text-slate-500 block">From previous: {previousBirdsLeft}</span>
              )}
              <span className={birdsLeft < 0 ? "text-red-600" : ""}>{birdsLeft}</span>
            </div>
          </div>
          <div className="col-span-12 flex items-center gap-2">
            <input id="manualAge" type="checkbox" checked={manualAge} onChange={(e) => setManualAge(e.target.checked)} />
            <Label htmlFor="manualAge">Enter age manually</Label>
          </div>
          {manualAge ? (
            <>
              <div className="col-span-4 space-y-2">
                <Label>Age (weeks)</Label>
                <Input type="number" min="0" value={manualWeeks} onChange={(e) => setManualWeeks(e.target.value)} placeholder="e.g. 20" />
              </div>
              <div className="col-span-4 space-y-2">
                <Label>Age (years)</Label>
                <Input type="number" min="0" value={manualYears} onChange={(e) => setManualYears(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div className="col-span-4 space-y-2">
                <Label>Age (days)</Label>
                <Input type="number" min="0" value={manualDays} onChange={(e) => setManualDays(e.target.value)} placeholder="e.g. 140" />
              </div>
            </>
          ) : (
            <>
              <div className="col-span-3">
                <Label>Age (weeks)</Label>
                <div className="pt-2 font-semibold">{ageWeeks}</div>
              </div>
              <div className="col-span-3">
                <Label>Age (years)</Label>
                <div className="pt-2 font-semibold">{ageYears}</div>
              </div>
              <div className="col-span-3">
                <Label>Age (days)</Label>
                <div className="pt-2 font-semibold">{ageDays}</div>
              </div>
            </>
          )}

          <div className="col-span-6 space-y-2">
            <Label>Medication</Label>
            <Input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} placeholder="e.g., Free water" />
          </div>

          <div className="col-span-12 space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="col-span-12 flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : record ? "Update" : "Log Production"}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
