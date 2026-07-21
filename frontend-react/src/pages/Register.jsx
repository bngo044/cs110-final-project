import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LoaderCircle, Repeat2 } from "lucide-react"

import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

function RegisterPage() {
  // navigate() changes React pages without reloading the browser.
  const navigate = useNavigate()

  // Store all registration inputs together because they are submitted together.
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  })

  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Use the input's name to update the matching property in the form object.
  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  // Submit the registration form to the existing Express API.
  async function handleSubmit(event) {
    // Keep React in control instead of performing a normal browser form submission.
    event.preventDefault()

    setMessage("")
    setIsError(false)
    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.")
      }

      setMessage(data.message)

      // After a successful registration, return to the login page.
      window.setTimeout(() => {
        navigate("/")
      }, 800)
    } catch (error) {
      setIsError(true)

      if (error.message === "Failed to fetch") {
        setMessage("Cannot reach the server.")
      } else {
        setMessage(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <Link
          className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold"
          to="/"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Repeat2 className="size-5" />
          </span>

          CampusShare
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>

            <CardDescription>
              Join CampusShare to borrow and share items with UCR students.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>

                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>

                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="Choose a username"
                  required
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@ucr.edu"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              {message && (
                <p
                  className={
                    isError
                      ? "text-sm text-destructive"
                      : "text-sm text-success"
                  }
                  role="status"
                >
                  {message}
                </p>
              )}

              <Button
                className="w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}

                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="font-medium text-foreground underline underline-offset-4"
                to="/"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default RegisterPage
