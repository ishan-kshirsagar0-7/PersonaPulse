import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Header from "@/components/Layout/Header";
import FooterTech from "@/components/FooterTech";
import Hero from "@/components/Hero";
import ScreenshotCarousel from "@/components/ScreenshotCarousel";
import HowItWorks from "@/components/HowItWorks";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Wizard from "@/onboarding/Wizard";
import ChatView from "@/pages/ChatView";
import LoadingPage from "./pages/LoadingPage";
import { useAuth } from "@/context/AuthContext";

export default function App() {
  const { session, loading, hasProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    if (loading) return;

    if (
      pathname === "/loading" ||
      pathname === "/login" ||
      (!session && pathname === "/")
    ) {
      return;
    }

    if (!session) {
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/chat")
      ) {
        navigate("/", { replace: true });
      }
    } else {
      const isTransitioningFromOnboarding =
        sessionStorage.getItem("isPostOnboardingTransition") === "true";

      if (hasProfile === false && pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      } else if (hasProfile === true) {
        if (
          (pathname === "/" || pathname === "/onboarding") &&
          !isTransitioningFromOnboarding
        ) {
          navigate("/dashboard", { replace: true });
        }
      } else if (hasProfile === false && pathname === "/chat") {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [session, loading, hasProfile, pathname, navigate]);

  if (loading || (session && hasProfile === null)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            session && hasProfile ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <main>
                <Hero />
                <ScreenshotCarousel />
                <HowItWorks />
              </main>
            )
          }
        />
        <Route
          path="/login"
          element={
            session ? (
              <Navigate
                to={hasProfile ? "/dashboard" : "/onboarding"}
                replace
              />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : hasProfile ? (
              sessionStorage.getItem("isPostOnboardingTransition") === "true" ? (
                <Wizard />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Wizard />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : hasProfile ? (
              <Dashboard />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
        <Route path="/loading" element={<LoadingPage />} />
        <Route
          path="/chat"
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : hasProfile === false ? (
              <Navigate to="/onboarding" replace />
            ) : hasProfile === true ? (
              <ChatView key={location.key + JSON.stringify(location.state || {})} />
            ) : (
              <Navigate to="/loading" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <FooterTech />
    </div>
  );
}