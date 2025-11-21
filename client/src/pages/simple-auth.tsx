import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SimpleAuthPageProps {
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  isLoading: boolean;
}

const SimpleAuthPage: React.FC<SimpleAuthPageProps> = ({ login, register, isLoading }) => {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.username, loginForm.password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    await register(registerForm);
  };

  const updateLoginForm = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const updateRegisterForm = (field: string, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-48 bg-primary rounded flex items-center justify-center text-white font-bold mb-8">
              WHY Brands
            </div>
            <h2 className="text-2xl font-bold text-neutral-dark">
              Welcome to Application Portal
            </h2>
            <p className="mt-2 text-sm text-neutral-medium">
              Sign in to your account or create a new one
            </p>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username or Email</label>
                      <Input 
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => updateLoginForm('username', e.target.value)}
                        placeholder="Enter your username or email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input 
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => updateLoginForm('password', e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("register")}
                    className="text-sm text-neutral-medium"
                  >
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Create a new account to access applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input 
                          type="text"
                          value={registerForm.firstName}
                          onChange={(e) => updateRegisterForm('firstName', e.target.value)}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input 
                          type="text"
                          value={registerForm.lastName}
                          onChange={(e) => updateRegisterForm('lastName', e.target.value)}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => updateRegisterForm('email', e.target.value)}
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input 
                        type="text"
                        value={registerForm.username}
                        onChange={(e) => updateRegisterForm('username', e.target.value)}
                        placeholder="johndoe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input 
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => updateRegisterForm('password', e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm Password</label>
                      <Input 
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => updateRegisterForm('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")}
                    className="text-sm text-neutral-medium"
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="flex-1 bg-primary p-12 hidden lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md mx-auto text-white space-y-8">
          <h1 className="text-4xl font-bold">WHY Brands Application Portal</h1>
          <p className="text-xl">
            Your central hub for organizing approved services and applications
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Secure Access</h3>
                <p className="mt-1">Password-protected accounts for each user.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Application Access</h3>
                <p className="mt-1">One place to access all your approved applications.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Request Management</h3>
                <p className="mt-1">Request access to new applications with ease.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuthPage;