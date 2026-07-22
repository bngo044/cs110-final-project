import { Route, Routes } from "react-router-dom"

import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import MainPage from "./pages/Main"
import ItemDetailsPage from "./pages/ItemDetails"
import ProfilePage from "./pages/Profile"
import ReviewPage from "./pages/review"
import AddItemPage from "./pages/AddItem"
import EditItemPage from "./pages/EditItem"

// Match the URL after # to the React page that should be displayed.
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/itemDetails/:id" element={<ItemDetailsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/addItem" element={<AddItemPage />} />
      <Route path="/editItem" element={<EditItemPage />} />
    </Routes>
  )
}

export default App
