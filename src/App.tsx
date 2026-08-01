import {Route, Routes} from "react-router";
import RouterLayout from "@/components/RouterLayout.tsx";
import HomePage from "@/pages/HomePage.tsx";
import LoginPage from "@/pages/LoginPage.tsx";
import RoleGuard from "@/components/RoleGuard.tsx";
import AdminDashboardPage from "@/pages/AdminDashboardPage.tsx";
import EngineerDashboardPage from "@/pages/EngineerDashboardPage.tsx";
import ViewerDashboardPage from "@/pages/ViewerDashboardPage.tsx";


function App() {

  return (
    <>
      <Routes>
        <Route element={<RouterLayout />}>
          <Route index element={<HomePage />} />

          <Route path="login" element={<LoginPage />} />/

            {/* 1. Protected Admin Spaces */}
            <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
                <Route path="admin" element={<AdminDashboardPage />} />
            </Route>
            {/* 2. Protected Network Engineer Spaces */}
            <Route element={<RoleGuard allowedRoles={["NETWORK_ENGINEER"]} />}>
                <Route path="engineer" element={<EngineerDashboardPage />} />
            </Route>

            {/*3. Protected Viewer Spaces */}
            <Route element={<RoleGuard allowedRoles={["VIEWER"]} />}>
                <Route path="viewer" element={<ViewerDashboardPage />} />
            </Route>

        </Route>

        {/*<Route path="*" element={<NotFoundPage />} />*/}


      </Routes>
    </>
  )
}

export default App
