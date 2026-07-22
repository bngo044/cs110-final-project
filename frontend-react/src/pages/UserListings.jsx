import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, LoaderCircle, Package, Clock, CheckCircle2, XCircle, Repeat2 } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"

export default function UserListingsPage() {
  const navigate = useNavigate()

  const [myItems, setMyItems] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("campusShareToken")
        if (!token) return navigate("/")

        const headers = { Authorization: `Bearer ${token}` }

        // Fetch personal items and incoming requests
        const [itemsRes, reqsRes] = await Promise.all([
          fetch("/api/items/my", { headers }),
          fetch("/api/requests/received", { headers }),
        ])

        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData.message || "Could not load your listings.")

        const requestsData = await reqsRes.json()
        if (!reqsRes.ok) throw new Error(requestsData.message || "Could not load requests.")

        setMyItems(itemsData)
        setIncomingRequests(requestsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadUserData()
  }, [navigate])

  async function handleStatusUpdate(requestId, status) {
    try {
      const token = localStorage.getItem("campusShareToken")
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Could not update request.")

      setIncomingRequests((prev) =>
        prev.map((req) => (req._id === requestId ? { ...req, status } : req))
      )
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link to="/main" className="flex items-center gap-2 font-semibold text-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Repeat2 className="size-5" />
            </span>
            CampusShare
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/main")} className="mb-6 gap-1.5 text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Listings and Requests</h1>

        {error && <p className="mb-6 text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="flex py-20 justify-center"><LoaderCircle className="size-8 animate-spin" /></div>
        ) : (
          <div className="space-y-10">
            {/* Incoming Borrow Requests */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="size-5 text-amber-500" /> Borrow Requests for My Items
              </h2>

              {incomingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests for your listings.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <Card key={req._id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold text-sm">{req.itemTitle || "Requested Item"}</p>
                          <p className="text-sm">
                            Requested by{" "}
                            <Link
                              to={`/profiles/${req.borrowerId}`}
                              className="font-medium text-primary underline underline-offset-2"
                            >
                              {req.borrowerName || "CampusShare user"}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dates: {req.startDate} to {req.endDate} • Status: <strong className="capitalize">{req.status}</strong>
                          </p>
                        </div>

                        {req.status === "Pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleStatusUpdate(req._id, "Accepted")}>
                              <CheckCircle2 className="size-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(req._id, "Rejected")}>
                              <XCircle className="size-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Personal Listings */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="size-5 text-primary" /> My Active Listings
              </h2>

              {myItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't listed any items yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myItems.map((item) => (
                    <Card key={item._id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        <p>📍 {item.pickupLocation}</p>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/editItem?id=${item._id}`)}
                        >
                          Edit
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
