"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { HelpRequestForm } from "@/components/help-request-form"
import { HelpRequestsList } from "@/components/help-requests-list"
import { HelpRequestsHeatmap } from "@/components/help-requests-heatmap"
import { AlertTriangle } from "lucide-react"
import logoTransparent from "@/lib/logo-transparent.png"
import { apiCreateRequest, apiListRequests, type ApiRequest, type ApiRequestCreate } from "@/lib/api"

export interface HelpRequest {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  contactNumber: string
  requestType: string
  urgency: string
  peopleAffected: number
  timestamp: Date
}

export default function Home() {
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [activeTab, setActiveTab] = useState<"heatmap" | "submit" | "view">("heatmap")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Map backend API request to UI HelpRequest
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

  // Initial load of requests
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiListRequests({ page: 1, per_page: 50 })
        const list = Array.isArray(res) ? res : res?.data ?? []
        if (!cancelled) setRequests(list.map(mapApiToHelpRequest))
      } catch (_) {
        // swallow for now; UI will show empty state
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Realtime polling for View Requests page
  useEffect(() => {
    const mergeById = (current: HelpRequest[], incoming: HelpRequest[]) => {
      const byId = new Map<string, HelpRequest>()
      current.forEach((r) => byId.set(r.id, r))
      incoming.forEach((r) => byId.set(r.id, r))
      const merged = Array.from(byId.values())
      merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      return merged
    }

    const tick = async () => {
      try {
        const res = await apiListRequests({ page: 1, per_page: 50 })
        const list = Array.isArray(res) ? res : res?.data ?? []
        const mapped = list.map(mapApiToHelpRequest)
        setRequests((prev) => mergeById(prev, mapped))
      } catch {}
    }

    // start interval
    if (pollingRef.current) window.clearInterval(pollingRef.current)
    pollingRef.current = window.setInterval(tick, 15000)
    // run immediately once
    tick()
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  const handleSubmitRequest = async (
    request: Omit<HelpRequest, "id" | "timestamp">
  ) => {
    try {
      const payload: ApiRequestCreate = {
        title: request.title,
        description: request.description,
        latitude: request.latitude,
        longitude: request.longitude,
        contactNumber: request.contactNumber,
        requestType: request.requestType,
        urgency: request.urgency,
        peopleAffected: request.peopleAffected,
      }
      const created = await apiCreateRequest(payload)
      const createdRequest = mapApiToHelpRequest(created.request)
      setRequests((prev) => [createdRequest, ...prev])
      setActiveTab("view")
    } catch (_) {
      // Let the form toast success/failure; keep silent here
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all ${
          isScrolled
            ? "bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-border shadow-sm"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container mx-auto flex items-end justify-between px-4 py-2 sm:px-6 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg">
              <Image src={logoTransparent} alt="SagipHub logo" width={48} height={48} priority />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance">SagipHub</h1>
              <p className="text-sm text-muted-foreground">Philippines Emergency Lifeline</p>
            </div>
          </div>
          <nav className="hidden md:block">
            <ul className="flex flex-row items-center gap-6">
              <li>
                <a
                  href="#heatmap"
                  aria-current={activeTab === "heatmap" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("heatmap")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block px-1 pb-3 pt-2 font-medium transition-colors ${
                    activeTab === "heatmap"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Heatmap
                </a>
              </li>
              <li>
                <a
                  href="#submit"
                  aria-current={activeTab === "submit" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("submit")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block px-1 pb-3 pt-2 font-medium transition-colors ${
                    activeTab === "submit"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Submit Request
                </a>
              </li>
              <li>
                <a
                  href="#view"
                  aria-current={activeTab === "view" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("view")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`relative block px-1 pb-3 pt-2 font-medium transition-colors ${
                    activeTab === "view"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  View Requests
                  {requests.length > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                      {requests.length}
                    </span>
                  )}
                </a>
              </li>
            </ul>
          </nav>
          <button
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-border bg-card">
            <ul className="container mx-auto flex flex-col gap-1 px-4 py-2">
              <li>
                <a
                  href="#heatmap"
                  aria-current={activeTab === "heatmap" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("heatmap")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                    activeTab === "heatmap"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  Heatmap
                </a>
              </li>
              <li>
                <a
                  href="#submit"
                  aria-current={activeTab === "submit" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("submit")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                    activeTab === "submit"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  Submit Request
                </a>
              </li>
              <li>
                <a
                  href="#view"
                  aria-current={activeTab === "view" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab("view")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                    activeTab === "view"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  View Requests
                  {requests.length > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                      {requests.length}
                    </span>
                  )}
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
        {activeTab === "heatmap" ? (
          <HelpRequestsHeatmap requests={requests} />
        ) : activeTab === "submit" ? (
          <HelpRequestForm onSubmit={handleSubmitRequest} />
        ) : (
          <HelpRequestsList requests={requests} />
        )}
      </main>

      <footer className="mt-16 border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Emergency Hotline: 911 | Disaster Response: 1-800-HELP-NOW</p>
          <p className="mt-2">Stay safe. Help is on the way.</p>
        </div>
      </footer>
    </div>
  )
}
