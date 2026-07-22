import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, LoaderCircle, Star, Calendar, MapPin, PackageCheck, Repeat2 } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

export default function ItemDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [owner, setOwner] = useState(null)
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [requestDates, setRequestDates] = useState({ startDate: "", endDate: "" })
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")

  useEffect(() => {
    async function fetchItemDetails() {
      setIsLoading(true)
      try {
        const itemRes = await fetch(`/api/items/${id}`)
        if (!itemRes.ok) throw new Error("Item not found.")
        const itemData = await itemRes.json()
        setItem(itemData)

        // Load the lender's public profile for their current name and picture.
        if (itemData.ownerId) {
          const ownerRes = await fetch(`/api/profile/${itemData.ownerId}`)
          if (ownerRes.ok) setOwner(await ownerRes.json())
        }

        // Fetch item reviews
        const revRes = await fetch(`/api/items/${id}/reviews`)
        if (revRes.ok) {
          const revData = await revRes.json()
          setReviews(revData)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchItemDetails()
  }, [id])

  async function handleRequest(e) {
    e.preventDefault()
    setIsRequesting(true)
    setRequestMessage("")

    try {
      const token = localStorage.getItem("campusShareToken")
      if (!token) throw new Error("Please log in to send a borrow request.")

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: id,
          ownerId: item.ownerId,
          ...requestDates,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to submit request.")

      setRequestMessage("Request submitted! The owner will review it.")
    } catch (err) {
      setRequestMessage(err.message)
    } finally {
      setIsRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-destructive mb-4">{error || "Item not found."}</p>
        <Button onClick={() => navigate("/main")}>Return to Listings</Button>
      </div>
    )
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

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-1.5 text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to Listings
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{item.category}</span>
                <span className="text-xs font-semibold text-primary">{item.listingType}</span>
              </div>
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="size-4" /> {item.pickupLocation}</span>
                <span className="flex items-center gap-1"><PackageCheck className="size-4" /> Condition: {item.condition || "N/A"}</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lender</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/profiles/${item.ownerId}`}
                  className="flex w-fit items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                >
                  {owner?.profilePicture ? (
                    <img
                      src={owner.profilePicture}
                      alt={owner.name || owner.username || "Lender"}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                      {(owner?.name || owner?.username || item.ownerName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-foreground">
                      {owner?.name || owner?.username || item.ownerName || "CampusShare user"}
                    </p>
                    <p className="text-xs text-muted-foreground">View public profile</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{item.description || "No description provided."}</p></CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-semibold mb-4">Past Borrower Feedback</h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet for this item.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-1 text-amber-500 mb-1">
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className={`size-3.5 ${idx < rev.rating ? "fill-amber-500" : "text-muted"}`} />
                          ))}
                        </div>
                        <p className="text-sm">{rev.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Request to {item.listingType}</CardTitle>
                <CardDescription>Select dates to reserve this resource.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      required
                      value={requestDates.startDate}
                      onChange={(e) => setRequestDates((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Return Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      required
                      value={requestDates.endDate}
                      onChange={(e) => setRequestDates((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  {requestMessage && (
                    <p className="text-sm font-medium text-emerald-600">{requestMessage}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isRequesting}>
                    {isRequesting && <LoaderCircle className="size-4 animate-spin mr-2" />}
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
