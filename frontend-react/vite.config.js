import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  // React compiles JSX, while Tailwind generates the utility classes used by shadcn/ui.
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // During `npm run dev`, send API requests to the Express server.
      "/api": "http://localhost:3000",
    },
  },
})
