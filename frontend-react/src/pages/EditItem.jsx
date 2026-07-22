import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
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

function EditItemPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get("id")

  const [form, setForm] = useState({
    title: "",
    category: "Textbooks",
    listingType: "Borrow",
    quantity: 1,
    condition: "",
    pickupLocation: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadItem() {
      try {
        if (!itemId) throw new Error("Item ID is missing.")

        const response = await fetch(`/api/items/${itemId}`)
        const item = await response.json()

        if (!response.ok) throw new Error(item.message || "Could not load item.")

        setForm({
          title: item.title || "",
          category: item.category || "Textbooks",
          listingType: item.listingType || "Borrow",
          quantity: item.quantity || 1,
          condition: item.condition || "",
          pickupLocation: item.pickupLocation || "",
          description: item.description || "",
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadItem()
  }, [itemId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previousForm) => ({ ...previousForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("campusShareToken")
      if (!token) throw new Error("You must be logged in to edit a listing.")

      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Could not update item.")

      navigate("/profile")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !form.title) {
    return <p className="p-6">Loading item...</p>
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/profile" className="mb-4 inline-block text-sm underline">
        Back to Profile
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Listing</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Item Title</Label>
              <Input id="title" name="title" required value={form.title} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" value={form.category} onChange={handleChange} className="w-full rounded border p-2">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="listingType">Listing Type</Label>
              <select id="listingType" name="listingType" value={form.listingType} onChange={handleChange} className="w-full rounded border p-2">
                <option value="Borrow">Borrow</option>
                <option value="Exchange">Exchange</option>
              </select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="1" required value={form.quantity} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input id="condition" name="condition" value={form.condition} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <Input id="pickupLocation" name="pickupLocation" required value={form.pickupLocation} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea id="description" name="description" rows="4" value={form.description} onChange={handleChange} className="w-full rounded border p-2" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default EditItemPage
