import { useState } from "react"
import { Eye, EyeOff, LoaderCircle, Repeat2 } from "lucide-react"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Link } from "react-router-dom"

function LoginPage() {
  // Controlled inputs keep the current form values in React state.
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Send the entered credentials to the existing Express login endpoint.
  async function handleSubmit(event) {
    // Prevent the browser from refreshing when the form is submitted.
    event.preventDefault()
    setMessage("")
    setIsError(false)
    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed.")
      }

      // Protected API requests will use this token after the user logs in.
      localStorage.setItem("campusShareToken", data.token)
      setMessage(data.message)

      // The dashboard is still in the original frontend folder for now.
      window.setTimeout(() => {
        window.location.href = "/legacy/dashboard.html"
      }, 600)
    } catch (error) {
      setIsError(true)
      setMessage(error.message === "Failed to fetch" ? "Cannot reach the server. Make sure npm start is running." : error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <a className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold" href="/" aria-label="CampusShare home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Repeat2 className="size-5" aria-hidden="true" />
          </span>
          CampusShare
        </a>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Log in to borrow and share items with UCR students.</CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                {/* Update state every time the user types. */}
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pr-11"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {/* Switch the password input between hidden and visible text. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              {message && (
                <p className={isError ? "text-sm text-destructive" : "text-sm text-success"} role="status">
                  {message}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
  to="/register"
>
  Create an account
</Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">Share more. Spend less. Support your campus.</p>
      </div>
    </main>
  )
}

export default LoginPage
