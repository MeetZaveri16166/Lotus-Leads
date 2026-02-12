import { createBrowserRouter, Navigate, useParams } from "react-router";
import { LandingPage } from "@/app/marketing/LandingPage";
import { FeaturesPage } from "@/app/marketing/FeaturesPage";
import { PricingPage } from "@/app/marketing/PricingPage";
import { AuthPage } from "@/app/pages/AuthPage";
import { AuthGuard } from "@/app/components/AuthGuard";
import App from "@/app/App";

function ProtectedApp() {
  return (
    <AuthGuard>
      <App />
    </AuthGuard>
  );
}

function InviteRedirect() {
  const { token } = useParams();
  return <Navigate to={`/auth?token=${token}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/features",
    Component: FeaturesPage,
  },
  {
    path: "/pricing",
    Component: PricingPage,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/invite/:token",
    Component: InviteRedirect,
  },
  {
    path: "/app/*",
    Component: ProtectedApp,
  },
]);
