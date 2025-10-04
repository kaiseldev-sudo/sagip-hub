"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiGetRequest, apiWithdrawRequest } from "@/lib/api"
import logoTransparent from "@/lib/logo-transparent.png"

export default function ManageRequestPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [publicId, setPublicId] = useState("")
  const [editToken, setEditToken] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [requestTitle, setRequestTitle] = useState<string | null>(null)
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  const [isLoadingRequest, setIsLoadingRequest] = useState(false)
  const [backgroundCheckInterval, setBackgroundCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Check if request is active (not withdrawn/cancelled)
  const isRequestActive = useMemo(() => {
    if (!requestStatus) return true // Default to true if status is unknown
    const withdrawnStatuses = ["withdrawn", "cancelled", "completed", "resolved"]
    return !withdrawnStatuses.includes(requestStatus.toLowerCase())
  }, [requestStatus])

  // Handle scroll effect for header
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Load from query or localStorage
  useEffect(() => {
    const qPublic = params.get("public_id") || ""
    const qToken = params.get("edit_token") || ""
    if (qPublic) setPublicId(qPublic)
    if (qToken) setEditToken(qToken)

    if (!qPublic || !qToken) {
      try {
        const raw = localStorage.getItem("my_requests")
        const arr = raw ? (JSON.parse(raw) as { public_id: string; edit_token: string }[]) : []
        if (!qPublic && arr.length > 0) setPublicId(arr[0].public_id)
        if (!qToken && arr.length > 0) setEditToken(arr[0].edit_token)
      } catch {}
    }
  }, [params])

  // Fetch request data for context and status
  useEffect(() => {
    let cancelled = false
    if (!publicId) return
    ;(async () => {
      try {
        setIsLoadingRequest(true)
        const r = await apiGetRequest(publicId)
        if (!cancelled) {
          setRequestTitle(r.title)
          setRequestStatus(r.status || "pending")
        }
      } catch {
        if (!cancelled) {
          setRequestTitle(null)
          setRequestStatus(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRequest(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publicId])

  const manageLink = useMemo(() => {
    if (!publicId || !editToken) return ""
    const url = new URL(window.location.origin + "/manage")
    url.searchParams.set("public_id", publicId)
    url.searchParams.set("edit_token", editToken)
    return url.toString()
  }, [publicId, editToken])

  // Function to clean up inactive requests from localStorage
  const cleanupInactiveRequests = useCallback(async () => {
    try {
      const raw = localStorage.getItem("my_requests")
      if (!raw) return

      const requests = JSON.parse(raw) as { public_id: string; edit_token?: string }[]
      const activeRequests = []

      for (const request of requests) {
        try {
          const requestData = await apiGetRequest(request.public_id)
          const status = requestData.status || "pending"
          const withdrawnStatuses = ["withdrawn", "cancelled", "completed", "resolved"]
          
          if (!withdrawnStatuses.includes(status.toLowerCase())) {
            activeRequests.push(request)
          }
        } catch (error) {
          // If we can't fetch the request, assume it's still active
          // (could be network error, not necessarily inactive)
          activeRequests.push(request)
        }
      }

      // Update localStorage with only active requests
      localStorage.setItem("my_requests", JSON.stringify(activeRequests))
      
      // If current request is no longer active, redirect to home
      if (publicId && !activeRequests.some(r => r.public_id === publicId)) {
        toast.info("Request no longer active", { 
          description: "This request has been removed from your saved requests." 
        })
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (error) {
      console.error("Error cleaning up inactive requests:", error)
    }
  }, [publicId, router, toast])

  // Background cleanup of inactive requests every minute
  useEffect(() => {
    // Run cleanup immediately
    cleanupInactiveRequests()

    // Set up interval to run every minute
    const interval = setInterval(cleanupInactiveRequests, 60000) // 60 seconds
    setBackgroundCheckInterval(interval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [cleanupInactiveRequests]) // Re-run when cleanup function changes

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (backgroundCheckInterval) {
        clearInterval(backgroundCheckInterval)
      }
    }
  }, [backgroundCheckInterval])

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied", { description: `${label} copied to clipboard.` })
    } catch {
      toast.error("Copy failed", { description: "Unable to copy to clipboard." })
    }
  }

  const handleWithdrawClick = () => {
    if (!publicId || !editToken) {
      toast.error("Missing details", { description: "public_id and edit_token are required." })
      return
    }
    setShowWithdrawConfirm(true)
  }

  const handleWithdrawConfirm = async () => {
    if (!publicId || !editToken) {
      toast.error("Missing details", { description: "public_id and edit_token are required." })
      return
    }
    setIsWithdrawing(true)
    setShowWithdrawConfirm(false)
    try {
      await apiWithdrawRequest(publicId, editToken)
      
      // Remove the withdrawn request from localStorage immediately
      try {
        const raw = localStorage.getItem("my_requests")
        if (raw) {
          const requests = JSON.parse(raw) as { public_id: string; edit_token?: string }[]
          const filteredRequests = requests.filter(r => r.public_id !== publicId)
          localStorage.setItem("my_requests", JSON.stringify(filteredRequests))
        }
      } catch (error) {
        console.error("Error removing request from localStorage:", error)
      }
      
      toast.success("Request withdrawn", { description: "Your request has been withdrawn." })
      
      // Redirect to main page after successful withdrawal
      setTimeout(() => {
        router.push("/")
      }, 1500) // Small delay to let user see the success message
    } catch (err: any) {
      const message = err?.message || "Withdraw failed"
      toast.error("Withdraw failed", { description: message })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleWithdrawCancel = () => {
    setShowWithdrawConfirm(false)
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
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg">
              <Image src={logoTransparent} alt="SagipHub logo" width={48} height={48} priority />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance">SagipHub</h1>
              <p className="text-sm text-muted-foreground">Philippines Emergency Lifeline</p>
            </div>
          </Link>
          <nav className="hidden md:block">
            <ul className="flex flex-row items-center gap-6">
              <li>
                <Link
                  href="/"
                  className="block px-1 pb-3 pt-2 font-medium transition-colors text-muted-foreground hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/manage"
                  className="block px-1 pb-3 pt-2 font-medium transition-colors border-b-2 border-primary text-primary"
                >
                  My Requests
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Manage your request</CardTitle>
          <CardDescription>
            Use your private edit token to manage the request. Do not share this link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="publicId">Public ID</Label>
            <Input id="publicId" value={publicId} onChange={(e) => setPublicId(e.target.value)} placeholder="public_id" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editToken">Edit Token</Label>
            <Input id="editToken" value={editToken} onChange={(e) => setEditToken(e.target.value)} placeholder="edit_token" />
          </div>

          {/* Only show copy links if request is active */}
          {isRequestActive && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => publicId && copy(`${window.location.origin}/requests/${publicId}`, "Public link")}>
                Copy public link
              </Button>
              <Button type="button" variant="outline" onClick={() => manageLink && copy(manageLink, "Manage link") }>
                Copy manage link
              </Button>
            </div>
          )}

          {requestTitle !== null && (
            <div className="text-sm text-muted-foreground">Current title: {requestTitle || "(not available)"}</div>
          )}

          {/* Show request status */}
          {requestStatus && (
            <div className="text-sm">
              <span className="text-muted-foreground">Status: </span>
              <span className={`font-medium ${
                requestStatus.toLowerCase() === "withdrawn" || requestStatus.toLowerCase() === "cancelled" 
                  ? "text-red-600" 
                  : requestStatus.toLowerCase() === "completed" || requestStatus.toLowerCase() === "resolved"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}>
                {requestStatus.toUpperCase()}
              </span>
            </div>
          )}

          {/* Only show withdraw button if request is active */}
          {isRequestActive && (
            <div className="pt-2">
              <Button type="button" variant="destructive" onClick={handleWithdrawClick} disabled={isWithdrawing} className="w-full text-white">
                {isWithdrawing ? "Withdrawing..." : "Withdraw request"}
              </Button>
            </div>
          )}

          {/* Show message if request is withdrawn */}
          {!isRequestActive && requestStatus && (
            <div className="pt-2 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                This request has been {requestStatus.toLowerCase()}. The copy links are no longer available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Confirm Withdrawal</CardTitle>
              <CardDescription>
                Are you sure you want to withdraw this help request? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestTitle && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Request: {requestTitle}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleWithdrawCancel} 
                  className="flex-1"
                  disabled={isWithdrawing}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleWithdrawConfirm} 
                  className="flex-1 text-white"
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? "Withdrawing..." : "Yes, Withdraw"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>

      <footer className="mt-16 border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Emergency Hotline: 911 | Disaster Response: 1-800-HELP-NOW</p>
          <p className="mt-2">Stay safe. Help is on the way.</p>
        </div>
      </footer>
    </div>
  )
}


