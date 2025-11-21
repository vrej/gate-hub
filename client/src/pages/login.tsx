import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Shield, Info, Mail, Check } from "lucide-react";
import { oktaAuth, oktaConfig } from "@/lib/okta-config";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isOktaLoading, setIsOktaLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();
  const { loginWithOkta, login } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOktaLogin = async () => {
    setIsOktaLoading(true);
    try {
      await loginWithOkta();
      // Note: This will redirect to Okta, so we won't reach this point
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Okta login failed",
        variant: "destructive",
      });
      setIsOktaLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordForm) => {
    setIsResetLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { email: data.email });
      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetModalClose = () => {
    setShowResetPassword(false);
    setResetEmailSent(false);
    resetForm.reset();
  };

  // Validate Okta configuration on mount (silent check)
  useEffect(() => {
    // Silent validation - only log if there's an actual configuration problem
    const hasClientId = !!import.meta.env.VITE_OKTA_CLIENT_ID;
    const hasIssuer = !!import.meta.env.VITE_OKTA_ISSUER;
    const hasOktaAuth = !!oktaAuth;
    
    // Only log if configuration is incomplete (actual error condition)
    if (!hasClientId || !hasIssuer || !hasOktaAuth) {
      console.error("Okta configuration incomplete. Missing:");
      if (!hasClientId) console.error("  - VITE_OKTA_CLIENT_ID");
      if (!hasIssuer) console.error("  - VITE_OKTA_ISSUER");
      if (!hasOktaAuth) console.error("  - oktaAuth instance");
    }
  }, []);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src="https://whybrands.com/images/logo.svg"
              alt="WhyBrands Logo"
              className="h-8 w-auto"
            />
            <span className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              Portal
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your admin account to continue</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Sign in with Okta SSO or your admin credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Browser Extension Warning */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                <strong>Note:</strong> If Okta login fails, try disabling browser extensions (especially password managers) or use incognito mode.
              </AlertDescription>
            </Alert>

            {/* Okta SSO Login */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={handleOktaLogin}
                disabled={isOktaLoading}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                  <span>
                    {isOktaLoading ? "Redirecting to Okta..." : "Login with Okta SSO"}
                  </span>
                </div>
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Use your Okta account for secure SSO login
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or login with email
                </span>
              </div>
            </div>

            {/* Manual Email/Password Login */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-brand hover:text-brand-dark hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand-dark"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="text-brand hover:text-brand-dark font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reset Password Modal */}
        <Dialog open={showResetPassword} onOpenChange={handleResetModalClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Reset Password</span>
              </DialogTitle>
            </DialogHeader>
            
            {!resetEmailSent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email address"
                      {...resetForm.register("email")}
                      required
                    />
                    {resetForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {resetForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetModalClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isResetLoading}
                      className="flex-1"
                    >
                      {isResetLoading ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Reset Email Sent!</h3>
                  <p className="text-sm text-gray-600">
                    We've sent password reset instructions to your email address. 
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                  <p className="font-medium">Didn't receive the email?</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Check your spam/junk folder</li>
                    <li>• Wait a few minutes for delivery</li>
                    <li>• Make sure you entered the correct email</li>
                  </ul>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setResetEmailSent(false)}
                    className="flex-1"
                  >
                    Send to Different Email
                  </Button>
                  <Button
                    onClick={handleResetModalClose}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
