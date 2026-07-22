import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

function PublicProfilePage() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile/${userId}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || "Could not load profile.")
        setProfile(data)
      } catch (err) {
        setError(err.message)
      }
    }

    loadProfile()
  }, [userId])

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/userListings" className="mb-6 inline-block text-sm underline">
        Back to My Listings
      </Link>

      {error && <p className="text-destructive">{error}</p>}
      {!error && !profile && <p>Loading profile...</p>}

      {profile && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name || profile.username}
                    className="size-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {(profile.name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <CardTitle>{profile.name || profile.username}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Username: {profile.username}</p>
              <p>Campus location: {profile.campusLocation || "Not provided"}</p>
              <p>Bio: {profile.bio || "No bio yet"}</p>
              <p>Average rating: {profile.averageRating ?? "No ratings yet"}</p>
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-3 text-xl font-semibold">Active Listings</h2>
            {profile.listings?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.listings.map((item) => (
                  <Card key={item._id}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>{item.category}</p>
                      <p>{item.pickupLocation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This user has no active listings.</p>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default PublicProfilePage
