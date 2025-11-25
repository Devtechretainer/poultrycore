"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Boxes, Feather, ListChecks } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAlertsStore } from "@/lib/store/alerts-store"

export function DashboardCharts() {
  const router = useRouter()
  const alertsOpen = useAlertsStore(s => s.isOpen)
  const openAlerts = useAlertsStore(s => s.open)
  const closeAlerts = useAlertsStore(s => s.close)
  const alerts = useAlertsStore(s => s.alerts)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-slate-600">
            No recent activity to display
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Log Production */}
            <Button
              className="h-16 justify-between bg-green-800 hover:bg-green-900 text-white"
              onClick={() => router.push("/production-records/new")}
            >
              <span className="text-xl font-semibold">0</span>
              <span className="mx-auto">Log Production</span>
              <ListChecks className="h-5 w-5 opacity-70" />
            </Button>

            {/* Record Sale */}
            <Button
              className="h-16 justify-between bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => router.push("/sales")}
            >
              <DollarSign className="h-5 w-5 opacity-90" />
              <span className="mx-auto">Record Sale</span>
              <span className="w-5" />
            </Button>

            {/* Update Inventory */}
            <Button
              className="h-16 justify-between bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => router.push("/expenses")}
            >
              <Boxes className="h-5 w-5 opacity-90" />
              <span className="mx-auto">Update Expenses</span>
              <span className="w-5" />
            </Button>

            {/* Add Flock */}
            <Button
              className="h-16 justify-between bg-slate-100 hover:bg-slate-200 text-slate-800"
              onClick={() => router.push("/flocks/new")}
              variant="outline"
            >
              <Feather className="h-5 w-5 opacity-90" />
              <span className="mx-auto">Add Flock</span>
              <span className="w-5" />
            </Button>
          </div>
          {/* Alerts / Notifications */}
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full h-12 justify-center"
              onClick={openAlerts}
            >
              View system alerts and notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Dialog */}
      <Dialog open={alertsOpen} onOpenChange={(v) => v ? openAlerts() : closeAlerts()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>System Alerts and Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-slate-600">No alerts</div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className="rounded border p-3">
                  <div className="font-medium text-slate-900">{a.title}</div>
                  {a.description && <div className="text-sm text-slate-600">{a.description}</div>}
                  {a.time && <div className="text-xs text-slate-500 mt-1">{a.time}</div>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}