import { createBrowserRouter } from "react-router";
import { LandingPage } from "@/app/marketing/LandingPage";
import { FeaturesPage } from "@/app/marketing/FeaturesPage";
import { PricingPage } from "@/app/marketing/PricingPage";
import App from "@/app/App";

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
    path: "/app/*",
    Component: App,
  },
]);