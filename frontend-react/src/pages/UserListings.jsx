import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, LoaderCircle, Package, Clock, CheckCircle2, XCircle, Repeat2, Camera, Mail, ShieldCheck, RotateCcw, Star } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import ReviewModal from "../pages/review"

export default function UserListingsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [myItems, setMyItems] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myBorrowings, setMyBorrowings] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeReviewRequestId, setActiveReviewRequestId] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const userName = userProfile?.name || userProfile?.username || "Campus Student"
  const userEmail = userProfile?.email || "Email not provided"
  const profilePic = userProfile?.profilePicture || ""

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("campusShareToken")
        if (!token) return navigate("/")

        const headers = { Authorization: `Bearer ${token}` }

        // Fetch this user's MongoDB profile, listings, and incoming requests.
        const [profileRes, itemsRes, reqsRes, sentRes] = await Promise.all([
          fetch("/api/profile/me", { headers }),
          fetch("/api/items/my", { headers }),
          fetch("/api/requests/received", { headers }),
          fetch("/api/requests/sent", { headers }),
        ])

        const profileData = await profileRes.json()
        if (!profileRes.ok) throw new Error(profileData.message || "Could not load your profile.")

        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData.message || "Could not load your listings.")

        const requestsData = await reqsRes.json()
        if (!reqsRes.ok) throw new Error(requestsData.message || "Could not load requests.")

        if (sentRes.ok) {
        const sentData = await sentRes.json()
        setMyBorrowings(sentData)
        }

        setUserProfile(profileData)
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

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile picture must be smaller than 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        setError("")
        const token = localStorage.getItem("campusShareToken")
        const response = await fetch("/api/profile/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePicture: reader.result }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Could not save profile picture.")

        setUserProfile((profile) => ({
          ...profile,
          profilePicture: data.profile.profilePicture,
        }))
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsDataURL(file)
  }

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

  async function handleReturnItem(requestId) {
    try {
      setError("")
      const token = localStorage.getItem("campusShareToken")
      const response = await fetch(`/api/requests/${requestId}/return`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Could not mark as returned.")

      setMyBorrowings((prev) =>
        prev.map((req) => (req._id === requestId ? { ...req, status: "Returned" } : req))
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(itemId) {
    const confirmed = window.confirm("Delete this listing?")
    if (!confirmed) return

    try {
      setError("")
      const token = localStorage.getItem("campusShareToken")
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Could not delete listing.")

      setMyItems((items) => items.filter((item) => item._id !== itemId))
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

        <Card className="mb-8 border bg-card">
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={userName}
                  className="size-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Hover Overlay Camera Icon */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change Profile Photo"
              >
                <Camera className="size-6" />
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl font-bold">{userName}</h1>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <Mail className="size-3.5" /> {userEmail}
              </p>
              
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="size-3" /> Active Lender
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5 h-7 px-2.5"
                >
                  <Camera className="size-3" /> Change Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <RotateCcw className="size-5 text-blue-500" /> Items I'm Borrowing
              </h2>

              {myBorrowings.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't requested or borrowed any items yet.</p>
              ) : (
                <div className="space-y-3">
                  {myBorrowings.map((req) => (
                    <Card key={req._id}>
                      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div>
                          <p className="font-semibold text-sm">{req.itemTitle || "Borrowed Item"}</p>
                          <p className="text-xs text-muted-foreground">
                            Lender: <strong className="text-foreground">{req.ownerName || "Campus Lender"}</strong> • Dates: {req.startDate} to {req.endDate}
                          </p>
                          <p className="text-xs mt-1">
                            Status: <span className="font-semibold capitalize text-primary">{req.status}</span>
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {req.status === "Accepted" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReturnItem(req._id)}
                            >
                              Return Item
                            </Button>
                          )}

                          {req.status === "Returned" && (
                            <Button 
                              size="sm" 
                              disabled={req.isReviewed}
                              onClick={() => {
                                setActiveReviewRequestId(req._id)
                                setIsReviewModalOpen(true)
                              }}
                              className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                            >
                              <Star className="size-3.5 fill-white" />
                              {req.isReviewed ? "Reviewed" : "Leave Review"}
                            </Button>
                          )}
                        </div>
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
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/editItem?id=${item._id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <ReviewModal
          isOpen={isReviewModalOpen}
          requestId={activeReviewRequestId}
          onClose={() => {
            setIsReviewModalOpen(false)
            setActiveReviewRequestId(null)
          }}
          onReviewSubmitted={() => {
            setMyBorrowings((prev) =>
              prev.map((req) =>
                req._id === activeReviewRequestId ? { ...req, isReviewed: true } : req
              )
            )
          setIsReviewModalOpen(false)
          setActiveReviewRequestId(null)
          }}
        />

      </main>
    </div>
  )
}
