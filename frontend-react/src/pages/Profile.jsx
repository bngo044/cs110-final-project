import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, LoaderCircle, Package, Clock, CheckCircle2, XCircle, Repeat2, Camera, Mail, ShieldCheck } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"

export default function ProfilePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [myItems, setMyItems] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Retrieve user info from local storage
  const userString = localStorage.getItem("user")
  const user = userString ? JSON.parse(userString) : null
  const userName = user?.name || user?.username || localStorage.getItem("userName") || "Campus Student"
  const userEmail = user?.email || "student@campus.edu"

  // Profile picture state (supports base64, external URL, or local storage fallback)
  const [profilePic, setProfilePic] = useState(
    localStorage.getItem("userAvatar") || user?.avatarUrl || ""
  )

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
          fetch("/api/requests/owner", { headers }),
        ])

        const itemsData = await itemsRes.json()
        if (!itemsRes.ok) throw new Error(itemsData.message || "Could not load your listings.")

        setMyItems(itemsData)
        if (reqsRes.ok) setIncomingRequests(await reqsRes.json())
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

    // Preview image locally immediately via Base64 reader
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Image = reader.result
      setProfilePic(base64Image)

      // Save to localStorage so Main dashboard navbar updates instantly
      localStorage.setItem("userAvatar", base64Image)
      if (user) {
        const updatedUser = { ...user, avatarUrl: base64Image }
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleStatusUpdate(requestId, status) {
    try {
      const token = localStorage.getItem("campusShareToken")
      await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      setIncomingRequests((prev) =>
        prev.map((req) => (req._id === requestId ? { ...req, status } : req))
      )
    } catch (err) {
      console.error(err)
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

        <h1 className="text-3xl font-bold mb-8">My CampusShare Hub</h1>

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
                          <p className="text-xs text-muted-foreground">
                            Dates: {req.startDate} to {req.endDate} • Status: <strong className="capitalize">{req.status}</strong>
                          </p>
                        </div>

                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleStatusUpdate(req._id, "approved")}>
                              <CheckCircle2 className="size-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(req._id, "rejected")}>
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
