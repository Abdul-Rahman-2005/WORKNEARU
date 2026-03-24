import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "./pages/HomePage";
import WorkerSignup from "./pages/WorkerSignup";
import WorkerLogin from "./pages/WorkerLogin";
import WorkerDashboard from "./pages/WorkerDashboard";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import ChatPage from "./pages/ChatPage";
import ReviewPage from "./pages/ReviewPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWorkers from "./pages/admin/AdminWorkers";
import AdminWorkerDetail from "./pages/admin/AdminWorkerDetail";
import AdminReports from "./pages/admin/AdminReports";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBookings from "./pages/admin/AdminBookings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/worker/signup" element={<WorkerSignup />} />
            <Route path="/worker/login" element={<WorkerLogin />} />
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            <Route path="/customer/signup" element={<CustomerSignup />} />
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/chat/:bookingId" element={<ChatPage />} />
            <Route path="/review/:bookingId" element={<ReviewPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="workers" element={<AdminWorkers />} />
              <Route path="workers/:id" element={<AdminWorkerDetail />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="bookings" element={<AdminBookings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
