import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";



export default function Register() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src="/images/gatehub-logo.png"
              alt="GateHub Logo"
              className="h-8 w-auto"
            />
            <span className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              GateHub
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Disabled</h1>
          <p className="text-gray-600">User registration is not available</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration Disabled</CardTitle>
            <CardDescription>
              User registration is disabled for security reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Notice</h3>
                  <p className="text-gray-600 mb-4">
                    User registration has been disabled to maintain system security. 
                    New user accounts can only be created by existing administrators.
                  </p>
                  <p className="text-sm text-gray-500">
                    If you need access to the system, please contact your system administrator.
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <Link href="/login">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
