import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import CreateCampaign from "@/pages/CreateCampaign";
import EditCampaign from "@/pages/EditCampaign";
import Dashboard from "@/pages/Dashboard";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import NetworkStatus from "@/pages/NetworkStatus";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfServices from "@/pages/TermsOfServices";
import NotFound from "@/pages/not-found/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" closeButton richColors />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path={ROUTE_PATHS.HOME}            element={<Home />} />
              <Route path={ROUTE_PATHS.CAMPAIGNS}       element={<Campaigns />} />
              <Route path={ROUTE_PATHS.CAMPAIGN_DETAIL} element={<CampaignDetail />} />
              <Route
                path={ROUTE_PATHS.EDIT_CAMPAIGN}
                element={
                  <ProtectedRoute>
                    <EditCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTE_PATHS.CREATE_CAMPAIGN}
                element={
                  <ProtectedRoute>
                    <CreateCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTE_PATHS.EDIT_CAMPAIGN}
                element={
                  <ProtectedRoute>
                    <EditCampaign />
                  </ProtectedRoute>
                }
              />
              <Route path={ROUTE_PATHS.DASHBOARD}       element={<Dashboard />} />
              <Route path={ROUTE_PATHS.ABOUT}           element={<About />} />
              <Route path={ROUTE_PATHS.FAQ}             element={<FAQ />} />
              <Route path={ROUTE_PATHS.NETWORK_STATUS}  element={<NetworkStatus />} />
              <Route path={ROUTE_PATHS.COOKIE_POLICY}   element={<CookiePolicy />} />
              <Route path={ROUTE_PATHS.PRIVACY_POLICY}  element={<PrivacyPolicy />} />
              <Route path={ROUTE_PATHS.TERMS_OF_SERVICE} element={<TermsOfServices />} />
              <Route path="*"                           element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
