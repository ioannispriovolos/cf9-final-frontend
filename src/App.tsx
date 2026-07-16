import {Route, Routes} from "react-router";
import RouterLayout from "@/components/RouterLayout.tsx";
import HomePage from "@/pages/HomePage.tsx";
import LoginPage from "@/pages/LoginPage.tsx";


function App() {

  return (
    <>
      <Routes>
        <Route element={<RouterLayout />}>
          <Route index element={<HomePage />} />

          <Route path="login" element={<LoginPage />} />/

        </Route>

        {/*<Route path="*" element={<NotFoundPage />} />*/}


      </Routes>
    </>
  )
}

export default App
