"use client"
import { Activity, Users, CheckCircle2, Pill } from "lucide-react"
import { Card } from "@/components/ui/card"
import StatCard from "./stat-card"
import RecentPatients from "./recent-patients"
import IntegrationStatus from "./integration-status"
import { Button } from "../ui/button"
import NewPatientModal from "./NewPatientModal"
import { useState } from "react"

export default function EMRDashboard() {
  const [open, setOpen] = useState(false)
  return (
    <>
    <div className="p-6 space-y-6"> {/* max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 */}
      
      <div>
        <h1 className="text-3xl font-bold text-foreground">EMR Dashboard</h1>
        <p className="text-muted-foreground mt-1">Electronic Medical Records with Traditional Medicine Integration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value="2,847" change="+12.5%" icon={Users} trend="up" />
        <StatCard label="ICD-11 TM2 Records" value="1,234" change="+8.2%" icon={Pill} trend="up" />
        <StatCard label="NAMASTE Codes" value="856" change="+5.1%" icon={CheckCircle2} trend="up" />
        <StatCard label="EHR Compliance" value="99.8%" change="Compliant" icon={Activity} trend="stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentPatients />
          <IntegrationStatus />
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Server</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ICD-11 Service</span>
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
          <Button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors" onClick={() => setOpen(true)}>
            New Patient Record
          </Button>
          <NewPatientModal open={open} onClose={() => setOpen(false)} />
              <Button className="w-full px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                Add Diagnosis
              </Button>
              <button className="w-full px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-card transition-colors">
                View Reports
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}
