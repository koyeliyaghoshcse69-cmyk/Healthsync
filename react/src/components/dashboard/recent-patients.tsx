"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, MoreVertical } from "lucide-react"
import { useAuth } from "@/lib/auth"

type Patient = {
  id: string
  name: string
  age?: number
  icd11?: string
  createdAt?: string
  createdBy?: string
}

type AuthUser = { id?: string; email?: string } | null

export default function RecentPatients() {
  const { user, authFetch } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch("/api/patients")
        if (!res.ok) {
          console.error('failed to fetch patients', await res.text())
          if (mounted) setPatients([])
          return
        }
        const data = await res.json()
        if (mounted) setPatients(data.patients || [])
      } catch (err) {
        console.error('patients fetch error', err)
        if (mounted) setPatients([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [authFetch])

  const myPatients = useMemo(() => {
    if (!user) return []
    const u = user as AuthUser
    const userEmail = u?.email
    const userId = u?.id
    return patients.filter(p => p.createdBy === userId || p.createdBy === userEmail)
  }, [patients, user])

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Recent Patients</h2>
        <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading patients…</p>}
        {!loading && myPatients.length === 0 && (
          <p className="text-sm text-muted-foreground">No patients yet.</p>
        )}

        {myPatients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/20 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {patient.name ? patient.name.split(" ")[0][0] : "P"}
                    {patient.name && patient.name.split(" ")[1] ? patient.name.split(" ")[1][0] : ""}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.icd11 || "—"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Age: {patient.age ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{patient.createdAt ? new Date(patient.createdAt).toLocaleString() : "—"}</p>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
