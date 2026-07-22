import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  // React compiles JSX, while Tailwind generates the utility classes used by shadcn/ui.
  plugins: [react(), tailwindcss()],
  resolve: {
    // The shadcn CLI uses @/components and @/lib aliases when it creates files.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      // During `npm run dev`, send API requests to the Express server.
      "/api": "http://localhost:3000",
    },
  },
})
