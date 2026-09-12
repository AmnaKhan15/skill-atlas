import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import Layout from "./components/Layout";
import { KnownSkillsProvider } from "./state/KnownSkillsContext";
import HomePage from "./pages/HomePage";
import RolesPage from "./pages/RolesPage";
import RoleDetailPage from "./pages/RoleDetailPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import SkillsPage from "./pages/SkillsPage";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-display text-2xl font-semibold text-slate-900">Page not found</p>
      <p className="text-sm text-slate-500">That page doesn't exist in the graph.</p>
      <Link to="/" className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Back home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <KnownSkillsProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/roles/:roleId" element={<RoleDetailPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </KnownSkillsProvider>
  );
}
