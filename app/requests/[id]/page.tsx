"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Users, Calendar, AlertTriangle, ArrowLeft } from "lucide-react"
import { apiGetRequest, type ApiRequest } from "@/lib/api"
import Link from "next/link"

export default function RequestPage() {
  const params = useParams()
  const requestId = params.id as string
  const [request, setRequest] = useState<ApiRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) return

    const fetchRequest = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiGetRequest(requestId)
        console.log("Fetched request data:", data)
        console.log("Status field:", data.status)
        setRequest(data)
      } catch (err: any) {
        console.error("Error fetching request:", err)
        setError(err?.message || "Failed to load request")
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [requestId])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getRequestTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "medical":
        return "bg-red-100 text-red-800 border-red-200"
      case "rescue":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "food":
        return "bg-green-100 text-green-800 border-green-200"
      case "shelter":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "supplies":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "in_progress":
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
      case "withdrawn":
        return "bg-red-100 text-red-800 border-red-200"
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown date"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading request...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Error
              </CardTitle>
              <CardDescription>
                {error || "Request not found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Help Request</h1>
            <p className="text-muted-foreground">Request ID: {request.public_id}</p>
          </div>
        </div>

        {/* Main Request Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{request.title}</CardTitle>
                <CardDescription className="text-base">
                  {request.description}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getUrgencyColor(request.urgency)}>
                  {request.urgency.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={getRequestTypeColor(request.request_type)}>
                  {request.request_type.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Section */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Current Status</div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(request.status || "pending")}>
                  {(request.status || "pending").replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {request.status === "pending" && "Awaiting response"}
                  {request.status === "in_progress" && "Help is on the way"}
                  {request.status === "completed" && "Request has been resolved"}
                  {request.status === "cancelled" && "Request has been cancelled"}
                  {request.status === "urgent" && "Requires immediate attention"}
                  {!request.status && "Awaiting response"}
                </span>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted</span>
                </div>
                <p className="font-medium">{formatDate(request.created_at)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>People Affected</span>
                </div>
                <p className="font-medium">{request.people_affected}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Contact Number</span>
              </div>
              <p className="font-medium">{request.contact_number}</p>
            </div>

            {/* Location Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location Coordinates</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="font-mono text-sm">{request.latitude}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="font-mono text-sm">{request.longitude}</p>
                </div>
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${request.latitude},${request.longitude}`
                    window.open(url, "_blank")
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Google Maps
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>This is a public help request. If you can provide assistance, please contact the person directly.</p>
          <p className="mt-1">Emergency Hotline: 911 | Disaster Response: 1-800-HELP-NOW</p>
        </div>
      </div>
    </div>
  )
}
