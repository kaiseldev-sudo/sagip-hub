"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Users, Clock, AlertCircle } from "lucide-react"
import type { HelpRequest } from "@/app/page"

interface HelpRequestsListProps {
  requests: HelpRequest[]
}

export function HelpRequestsList({ requests }: HelpRequestsListProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "high":
        return "bg-warning text-warning-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      medical: "Medical Emergency",
      rescue: "Rescue/Evacuation",
      food: "Food & Water",
      shelter: "Shelter",
      supplies: "Emergency Supplies",
      other: "Other",
    }
    return labels[type] || type
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    return "Just now"
  }

  if (requests.length === 0) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No requests yet</h3>
          <p className="text-center text-muted-foreground">Submit a help request to see it appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Active Help Requests</h2>
        <p className="text-muted-foreground">
          {requests.length} request{requests.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {requests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-xl text-balance">{request.title}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(request.timestamp)}
                </CardDescription>
              </div>
              <Badge className={getUrgencyColor(request.urgency)}>{request.urgency.toUpperCase()}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-pretty">{request.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <AlertCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-muted-foreground">{getRequestTypeLabel(request.requestType)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">People Affected</p>
                  <p className="text-muted-foreground">{request.peopleAffected}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Contact</p>
                  <p className="text-muted-foreground">{request.contactNumber}</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" />
                View on Google Maps
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
