import { Route, Routes } from "react-router-dom"

import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"

// Match the URL after # to the React page that should be displayed.
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}

export default App
