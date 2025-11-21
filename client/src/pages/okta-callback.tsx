import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function OktaCallback() {
  const [, setLocation] = useLocation();
  const { handleOktaCallback } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processingRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple executions using ref (survives React StrictMode double-render)
      if (processingRef.current) {
        return;
      }
      
      processingRef.current = true;
      
      try {
        const user = await handleOktaCallback();
        if (user) {
          setStatus('success');
          toast({
            title: "Success",
            description: "Successfully authenticated with Okta",
          });
          
          // Redirect to admin page after successful authentication
          // Add a small delay to ensure tokens are properly stored
          setTimeout(() => {
            setLocation('/admin');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Failed to authenticate user');
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Authentication failed');
        toast({
          title: "Error",
          description: error.message || "Authentication failed",
          variant: "destructive",
        });
      }
    };

    processCallback();
  }, [handleOktaCallback, setLocation, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === 'processing' && (
                <div className="bg-blue-100">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl">
              {status === 'processing' && 'Authenticating...'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'processing' && (
              <p className="text-gray-600">
                Please wait while we process your authentication...
              </p>
            )}
            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-gray-600">
                  You have been successfully authenticated with Okta SSO.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to admin dashboard...
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {errorMessage || 'An error occurred during authentication.'}
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setLocation('/login')}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/')}
                    className="w-full"
                  >
                    Return to Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 