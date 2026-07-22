import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Search, LoaderCircle, Package, Star, Plus, LogOut, Repeat2, Sparkles, UserCheck } from "lucide-react"

import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"

const CATEGORIES = [
  "All Items",
  "Textbooks & Notes",
  "Calculators & Tech",
  "Lab Coats & Goggles",
  "Art & Design",
  "Sports & Gym",
  "Tailgates & Events",
]

function Main() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Items")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    document.title = "CampusShare | Grab or Lend Campus Gear"
    fetchListings()
  }, [])

  async function fetchListings() {
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("campusShareToken")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch("/api/items?available=true", { headers })
      if (!response.ok) throw new Error("Couldn't pull the latest campus listings.")

      const data = await response.json()
      setItems(Array.isArray(data) ? data : data.items || [])
    } catch (err) {
      setError(err.message || "Failed to reach the campus server.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem("campusShareToken")
    navigate("/")
  }

  // Filter items by search query and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === "All Items" ||
      (item.category || "").toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Navbar */}
      <header className="border-b bg-card sticky top-0 z-10 backdrop-blur-md bg-card/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/main" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Repeat2 className="size-5" />
            </span>
            CampusShare
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button onClick={() => navigate("/userListings")} variant="outline" size="sm" className="gap-1.5">
              <UserCheck className="size-4" />
              My Listings
            </Button>

            <Button onClick={() => navigate("/AddItem")} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              List Gear
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Banner / Title */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-1">
              <Sparkles className="size-3.5" /> By students, for students
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Don't buy it for one semester.
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              Borrow TI-84s, lab coats, clickers, or textbooks from classmates—or lend your own unused stuff to make a quick swap or help someone out.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search iClickers, organic chemistry texts, chargers..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "secondary"}
              size="sm"
              className="rounded-full text-xs font-medium whitespace-nowrap"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <LoaderCircle className="size-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Checking what's available on campus...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 text-center border border-destructive/30 rounded-xl bg-destructive/5 max-w-lg mx-auto">
            <p className="text-sm text-destructive font-medium mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchListings}>
              Give it another shot
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card/50 max-w-md mx-auto my-12">
            <Package className="size-10 text-muted-foreground mb-3 opacity-60" />
            <h3 className="text-base font-semibold">Nothing found right now</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {searchTerm || selectedCategory !== "All Items"
                ? "Try searching for something else or switch categories."
                : "No items listed yet! Be the first classmate to drop something here."}
            </p>
            <Button size="sm" onClick={() => navigate("/add-item")}>
              Post the first item
            </Button>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <Card key={item._id} className="flex flex-col justify-between overflow-hidden transition-all hover:border-primary/50 hover:shadow-md bg-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.category || "General"}
                    </span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {item.listingType === "Exchange" ? "Trade / Swap" : "Free Borrow"}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold line-clamp-1">{item.title}</CardTitle>
                  
                  {/* Rating & Review Stats */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center text-amber-500">
                      <Star className="size-3.5 fill-amber-500" />
                      <span className="ml-1 font-semibold text-foreground">
                        {item.avgRating ? item.avgRating.toFixed(1) : "Fresh Post"}
                      </span>
                    </div>
                    {item.reviewCount ? (
                      <span>({item.reviewCount} student vouch{item.reviewCount > 1 ? "es" : ""})</span>
                    ) : (
                      <span>• No reviews yet</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-4 py-2 text-xs text-muted-foreground flex-1">
                  <p className="line-clamp-2 mb-3 leading-relaxed">
                    {item.description || "No extra notes provided by owner."}
                  </p>
                  
                  <div className="space-y-1 text-foreground/80 font-medium bg-muted/40 p-2.5 rounded-lg text-[12px]">
                    <p className="truncate">📍 <strong>Meetup:</strong> {item.pickupLocation || "On campus"}</p>
                    <p>📦 <strong>Condition:</strong> {item.condition || "Gently used"}</p>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2">
                  <Button
                    className="w-full text-xs font-semibold"
                    size="sm"
                    onClick={() => navigate(`/itemDetails/${item._id}`)}
                  >
                    {item.listingType === "Exchange" ? "Offer an Exchange" : "Hit Up Owner to Borrow"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Main
