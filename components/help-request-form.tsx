"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Loader2, Phone, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HelpRequestFormProps {
  onSubmit: (request: {
    title: string
    description: string
    latitude: number
    longitude: number
    contactNumber: string
    requestType: string
    urgency: string
    peopleAffected: number
  }) => void
}

export function HelpRequestForm({ onSubmit }: HelpRequestFormProps) {
  const { toast } = useToast()
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    contactNumber: "",
    requestType: "",
    urgency: "",
    peopleAffected: "1",
  })

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        })
        setIsLoadingLocation(false)
        toast({
          title: "Location obtained",
          description: "Your coordinates have been filled in.",
        })
      },
      (error) => {
        setIsLoadingLocation(false)
        toast({
          title: "Location error",
          description: "Unable to get your location. Please enter manually.",
          variant: "destructive",
        })
      },
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.title ||
      !formData.description ||
      !formData.latitude ||
      !formData.longitude ||
      !formData.contactNumber ||
      !formData.requestType ||
      !formData.urgency
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      title: formData.title,
      description: formData.description,
      latitude: Number.parseFloat(formData.latitude),
      longitude: Number.parseFloat(formData.longitude),
      contactNumber: formData.contactNumber,
      requestType: formData.requestType,
      urgency: formData.urgency,
      peopleAffected: Number.parseInt(formData.peopleAffected) || 1,
    })

    // Reset form
    setFormData({
      title: "",
      description: "",
      latitude: "",
      longitude: "",
      contactNumber: "",
      requestType: "",
      urgency: "",
      peopleAffected: "1",
    })

    toast({
      title: "Request submitted",
      description: "Your help request has been recorded. Assistance is on the way.",
    })
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="text-2xl">Request Emergency Assistance</CardTitle>
        <CardDescription>Fill out this form to request help. All fields marked with * are required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Request Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief description of your situation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Detailed Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your situation and what help you need"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestType">
                Type of Assistance <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.requestType}
                onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                required
              >
                <SelectTrigger id="requestType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="rescue">Rescue/Evacuation</SelectItem>
                  <SelectItem value="food">Food & Water</SelectItem>
                  <SelectItem value="shelter">Shelter</SelectItem>
                  <SelectItem value="supplies">Emergency Supplies</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">
                Urgency Level <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                required
              >
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical - Life Threatening</SelectItem>
                  <SelectItem value="high">High - Urgent</SelectItem>
                  <SelectItem value="medium">Medium - Important</SelectItem>
                  <SelectItem value="low">Low - Can Wait</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="peopleAffected">
              <Users className="mr-2 inline h-4 w-4" />
              Number of People Affected
            </Label>
            <Input
              id="peopleAffected"
              type="number"
              min="1"
              placeholder="1"
              value={formData.peopleAffected}
              onChange={(e) => setFormData({ ...formData, peopleAffected: e.target.value })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                <MapPin className="mr-2 inline h-4 w-4" />
                Location Coordinates <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Use My Location
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="14.5995"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="120.9842"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">
              <Phone className="mr-2 inline h-4 w-4" />
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactNumber"
              type="tel"
              placeholder="+63 912 345 6789"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Submit Help Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
