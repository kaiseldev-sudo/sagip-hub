"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { HelpRequest } from "@/app/page"
import { apiListRequests, type ApiRequest } from "@/lib/api"

interface HelpRequestsHeatmapProps {
  requests: HelpRequest[]
}

export function HelpRequestsHeatmap({ requests }: HelpRequestsHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [liveRequests, setLiveRequests] = useState<HelpRequest[] | null>(null)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !mapRef.current) return

    const initMap = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      const L = (await import("leaflet")).default
      await import("leaflet.heat")

      // Initialize map if not already initialized
      if (!mapInstanceRef.current) {
        const philippinesCenter: [number, number] = [12.8797, 122.774]
        const defaultZoom = 6

        // mapRef.current is guaranteed by the caller guard; assert non-null for TS
        const mapElement = mapRef.current!

        mapInstanceRef.current = L.map(mapElement, {
          center: philippinesCenter,
          zoom: defaultZoom,
          maxBounds: [
            [4.0, 116.0], // Southwest coordinates
            [21.5, 127.0], // Northeast coordinates
          ],
          maxBoundsViscosity: 1.0, // Makes bounds more strict
          minZoom: 5,
          maxZoom: 18,
        })

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current)

        // Invalidate size on container resize to keep map responsive
        resizeObserverRef.current?.disconnect()
        if (typeof ResizeObserver !== "undefined") {
          resizeObserverRef.current = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize()
          })
          resizeObserverRef.current.observe(mapElement)
        } else {
          // Fallback: listen to window resize
          const handleResize = () => mapInstanceRef.current?.invalidateSize()
          window.addEventListener("resize", handleResize)
        }
      }

      const createCustomIcon = (urgency: string) => {
        let color = "#3b82f6"
        switch (urgency) {
          case "critical":
            color = "#ef4444"
            break
          case "high":
            color = "#f97316"
            break
          case "medium":
            color = "#eab308"
            break
          case "low":
            color = "#22c55e"
            break
        }

        return L.divIcon({
          className: "custom-marker",
          html: `
            <div style="position: relative;">
              <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
                      fill="${color}" 
                      stroke="white" 
                      strokeWidth="2"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -42],
        })
      }

      // Utility to compute responsive padding for fitBounds
      const getResponsivePadding = (): [number, number] => {
        const width = window.innerWidth
        if (width < 640) return [16, 16] // sm-
        if (width < 1024) return [32, 32] // md-lg
        return [48, 48] // xl+
      }

      const renderData = (data: HelpRequest[]) => {
        if (!mapInstanceRef.current) return
        // Remove existing markers
        if (markersRef.current && markersRef.current.length > 0) {
          markersRef.current.forEach((marker) => {
            try {
              mapInstanceRef.current?.removeLayer(marker)
            } catch {}
          })
        }
        markersRef.current = []

        // Remove existing heat layer if any
        if (heatLayerRef.current && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.removeLayer(heatLayerRef.current)
          } catch {}
        }

        if (data.length === 0) {
          const philippinesCenter: [number, number] = [12.8797, 122.774]
          try {
            mapInstanceRef.current.setView(philippinesCenter, 6)
          } catch {}
          return
        }

        const heatData = data.map((request) => {
          // Intensity based on urgency
          let intensity = 0.5
          switch (request.urgency) {
            case "critical":
              intensity = 1.0
              break
            case "high":
              intensity = 0.8
              break
            case "medium":
              intensity = 0.5
              break
            case "low":
              intensity = 0.3
              break
          }

          return [request.latitude, request.longitude, intensity] as [number, number, number]
        })

        // Create heat layer
        heatLayerRef.current = (L as any)
          .heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
              0.0: "#3b82f6",
              0.3: "#22c55e",
              0.5: "#eab308",
              0.7: "#f97316",
              1.0: "#ef4444",
            },
          })
          .addTo(mapInstanceRef.current)

        // Keep the map view fixed to the Philippines; do not auto-fit to points

        data.forEach((request) => {
          const customIcon = createCustomIcon(request.urgency)
          const marker = L.marker([request.latitude, request.longitude], { icon: customIcon })

          marker.bindPopup(`
            <div style="min-width: 200px;">
              <strong style="font-size: 14px;">${request.title}</strong>
              <br/>
              <span style="font-size: 12px; color: #666;">
                ${request.urgency.toUpperCase()} - ${request.requestType}
              </span>
              <br/>
              <span style="font-size: 12px;">
                ${request.peopleAffected} people affected
              </span>
              <br/>
              <span style="font-size: 12px; margin-top: 4px; display: block;">
                Contact: ${request.contactNumber}
              </span>
            </div>
          `)
          try {
            marker.addTo(mapInstanceRef.current)
          } catch {}
          markersRef.current.push(marker)
        })
      }

      const mapApiToHelpRequest = (r: ApiRequest): HelpRequest => ({
        id: r.public_id,
        title: r.title,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        contactNumber: r.contact_number,
        requestType: r.request_type,
        urgency: r.urgency,
        peopleAffected: Number(r.people_affected),
        timestamp: new Date(r.created_at),
      })

      const fetchWithinBounds = async () => {
        if (!mapInstanceRef.current) return
        const bounds = mapInstanceRef.current.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        try {
          const res = await apiListRequests({
            page: 1,
            per_page: 200,
            bbox: [sw.lng, sw.lat, ne.lng, ne.lat],
          })
          const list = Array.isArray(res) ? res : res?.data ?? []
          const mapped = list.map(mapApiToHelpRequest)
          setLiveRequests(mapped)
          renderData(mapped)
        } catch {
          // fallback to props
          renderData(requests)
        }
      }

      // Initial render via API
      await fetchWithinBounds()

      // Refresh on moveend/zoomend
      try {
        mapInstanceRef.current.on("moveend", fetchWithinBounds)
        mapInstanceRef.current.on("zoomend", fetchWithinBounds)
      } catch {}

      // Polling every 15 seconds
      if (pollingRef.current) window.clearInterval(pollingRef.current)
      pollingRef.current = window.setInterval(fetchWithinBounds, 15000)
    }

    initMap()

    // Cleanup
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off("moveend")
          mapInstanceRef.current.off("zoomend")
        } catch {}
        try {
          mapInstanceRef.current.remove()
        } catch {}
        mapInstanceRef.current = null
      }
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect()
        } catch {}
        resizeObserverRef.current = null
      }
    }
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Philippines Disaster Relief Heatmap</CardTitle>
          <CardDescription>
            {requests.length > 0
              ? `Visualizing ${requests.length} help request${requests.length !== 1 ? "s" : ""} by location and urgency`
              : "Real-time visualization of disaster relief requests across the Philippines"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full rounded-lg border border-border h-[320px] sm:h-[420px] md:h-[520px] lg:h-[600px] z-0"
          />
          {requests.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs sm:gap-4 sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[#3b82f6]" />
                <span>Low Intensity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[#22c55e]" />
                <span>Low-Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[#eab308]" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[#f97316]" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-[#ef4444]" />
                <span>Critical</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
