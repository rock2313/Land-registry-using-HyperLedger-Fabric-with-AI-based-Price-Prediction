import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Properties } from "@/pages/Properties";
import { Transactions } from "@/pages/Transactions";
import { AddProperty } from "@/pages/AddProperty";
import { Offers } from "@/pages/Offers";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { PricePrediction } from "@/pages/PricePrediction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userId: '',
    userName: '',
  });

  // Check if user is already logged in on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        setUserInfo({ userId: user.userId, userName: user.name });
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLoginSuccess = (userId: string, userName: string) => {
    setUserInfo({ userId, userName });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo({ userId: '', userName: '' });
    localStorage.removeItem('currentUser');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isLoggedIn && (
            <Navbar
              isLoggedIn={isLoggedIn}
              userName={userInfo.userName}
              userId={userInfo.userId}
              onLogout={handleLogout}
            />
          )}
          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              }
            />
            <Route
              path="/price-prediction"
              element={isLoggedIn ? <PricePrediction /> : <Navigate to="/" replace />}
            />
            <Route
              path="/dashboard"
              element={isLoggedIn ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/properties"
              element={isLoggedIn ? <Properties /> : <Navigate to="/" replace />}
            />
            <Route
              path="/offers"
              element={isLoggedIn ? <Offers /> : <Navigate to="/" replace />}
            />
            <Route
              path="/transactions"
              element={isLoggedIn ? <Transactions /> : <Navigate to="/" replace />}
            />
            <Route
              path="/add-property"
              element={isLoggedIn ? <AddProperty /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin"
              element={isLoggedIn ? <AdminDashboard /> : <Navigate to="/" replace />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;