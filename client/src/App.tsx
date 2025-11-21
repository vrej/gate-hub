import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Applications from "@/pages/applications";
import Admin from "@/pages/admin";
import OktaCallback from "@/pages/okta-callback";
import ResetPassword from "@/pages/reset-password";
import ProtectedRoute from "@/components/protected-route";
import ErrorBoundary from "@/components/error-boundary";
import { setupGlobalErrorHandlers } from "@/lib/error-logger";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/okta-callback" component={OktaCallback} />
      <Route path="/login/callback" component={OktaCallback} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/" component={Applications} />
      <Route path="/admin" component={() => (
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set up global error handlers on app initialization
  React.useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
