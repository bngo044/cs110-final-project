import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, LoaderCircle, PackagePlus, Repeat2 } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

const CATEGORIES = [
  "Textbooks",
  "Calculators & Tech",
  "Lab Gear",
  "Art Supplies",
  "Sports Equipment",
  "Event Supplies",
]

export default function AddItemPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: "",
    category: "Textbooks",
    listingType: "Borrow",
    quantity: 1,
    condition: "Good",
    pickupLocation: "Library",
    description: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("campusShareToken")
      if (!token) throw new Error("You must be logged in to create a listing.")

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Failed to create listing.")

      navigate("/main")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
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

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-1.5 text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PackagePlus className="size-6 text-primary" /> List a Campus Item
            </CardTitle>
            <CardDescription>
              Share textbooks, lab coats, chargers, or gear with other UCR students.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. TI-84 Plus CE Calculator"
                  required
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listingType">Listing Type</Label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={form.listingType}
                    onChange={handleChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Borrow">Borrow (Lend)</option>
                    <option value="Exchange">Exchange</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    name="condition"
                    placeholder="e.g. Like New, Used"
                    value={form.condition}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">Pickup Location *</Label>
                  <Input
                    id="pickupLocation"
                    name="pickupLocation"
                    placeholder="e.g. Orbach Library"
                    required
                    value={form.pickupLocation}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Describe the item, notes on usage, or specific return expectations..."
                  className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <LoaderCircle className="size-4 animate-spin mr-2" />}
                {isLoading ? "Publishing Listing..." : "Create Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}