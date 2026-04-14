import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import CreateCampaign from "@/pages/CreateCampaign";
import Dashboard from "@/pages/Dashboard";
import About from "@/pages/About";
import Register from "@/pages/Register";

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
              <Route 
                path={ROUTE_PATHS.HOME} 
                element={<Home />} 
              />
              <Route 
                path={ROUTE_PATHS.CAMPAIGNS} 
                element={<Campaigns />} 
              />
              <Route 
                path={ROUTE_PATHS.CAMPAIGN_DETAIL} 
                element={<CampaignDetail />} 
              />
              <Route 
                path={ROUTE_PATHS.CREATE_CAMPAIGN} 
                element={<CreateCampaign />} 
              />
              <Route 
                path={ROUTE_PATHS.DASHBOARD} 
                element={<Dashboard />} 
              />
              <Route 
                path={ROUTE_PATHS.ABOUT} 
                element={<About />} 
              />
              <Route 
                path={ROUTE_PATHS.REGISTER} 
                element={<Register />} 
              />
              <Route 
                path="*" 
                element={<Navigate to={ROUTE_PATHS.HOME} replace />} 
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Version: 1.0.0