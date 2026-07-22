import { useState } from "react"
import { Star, LoaderCircle, X } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function ReviewModal({ itemId, isOpen, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("campusShareToken")
      const res = await fetch(`/api/items/${itemId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      })

      if (!res.ok) throw new Error("Failed to submit review.")

      onReviewSubmitted()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Leave a Student Vouch</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">Rating</label>
            <div className="flex gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star className={`size-6 ${star <= rating ? "fill-amber-500" : "text-muted"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Your Feedback</label>
            <Input
              placeholder="Was the item in good condition? Easy meetup?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <LoaderCircle className="size-4 animate-spin mr-2" />}
            Submit Vouch
          </Button>
        </form>
      </div>
    </div>
  )
}