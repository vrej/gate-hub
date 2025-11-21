import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSendInvitations } from "@/hooks/use-excel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Plus, X } from "lucide-react";

// Schema for email validation
const emailSchema = z.object({
  emails: z.string().min(1, "Please enter at least one email address"),
});

// Schema for a single email
const singleEmailSchema = z.string().email("Invalid email address");

export default function SendInvitations() {
  const [emailList, setEmailList] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const sendInvitations = useSendInvitations();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      emails: "",
    },
  });

  const handleAddEmail = () => {
    try {
      // Validate the email
      singleEmailSchema.parse(currentEmail);
      
      // Check if email already exists in the list
      if (emailList.includes(currentEmail)) {
        setEmailError("This email is already in the list");
        return;
      }
      
      // Add email to the list
      setEmailList([...emailList, currentEmail]);
      setCurrentEmail("");
      setEmailError("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmailList(emailList.filter((e) => e !== email));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const onSubmit = () => {
    if (emailList.length === 0) {
      setEmailError("Please add at least one email address");
      return;
    }
    
    sendInvitations.mutate(emailList, {
      onSuccess: () => {
        // Clear the form after successful submission
        setEmailList([]);
      }
    });
  };

  return (
    <AppShell 
      title="Send Invitations" 
      subtitle="Invite users to join the WHY Brands Application Portal"
    >
      <div className="mt-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send Email Invitations</CardTitle>
            <CardDescription>
              Enter email addresses of users you want to invite to the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={currentEmail}
                    onChange={(e) => {
                      setCurrentEmail(e.target.value);
                      setEmailError("");
                    }}
                    onKeyDown={handleInputKeyDown}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddEmail}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                {emailError && (
                  <p className="text-sm text-destructive mt-1">{emailError}</p>
                )}
                
                {/* Email chips display */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {emailList.map((email) => (
                    <div
                      key={email}
                      className="flex items-center bg-neutral-lightest text-neutral-dark rounded-full px-3 py-1 text-sm"
                    >
                      <span className="mr-1">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-neutral-medium hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Or paste multiple emails</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter email addresses, one per line"
                            rows={5}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Parse emails and add them to the list
                              if (e.target.value) {
                                const newEmails = e.target.value
                                  .split(/[\n,]/)
                                  .map((email) => email.trim())
                                  .filter((email) => email && !emailList.includes(email));
                                
                                // Validate and add emails
                                const validEmails = newEmails.filter((email) => {
                                  try {
                                    singleEmailSchema.parse(email);
                                    return true;
                                  } catch {
                                    return false;
                                  }
                                });
                                
                                setEmailList([...emailList, ...validEmails]);
                                e.target.value = ""; // Clear the textarea
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Separate each email with a new line or comma
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {emailList.length > 0 && (
                <p className="text-sm text-neutral-medium">
                  {emailList.length} email{emailList.length !== 1 ? "s" : ""} ready to send
                </p>
              )}
            </div>
            <Button 
              onClick={onSubmit}
              disabled={emailList.length === 0 || sendInvitations.isPending}
            >
              {sendInvitations.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitations
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                This is how your invitation email will look to recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-white">
                <div className="bg-primary p-4 rounded-t-md">
                  <h3 className="text-white text-lg font-semibold">WHY Brands Application Portal</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p>You have been invited to join the WHY Brands Application Portal.</p>
                  <p>Use the button below to set up your account and get started.</p>
                  
                  <div className="flex justify-center my-6">
                    <button className="bg-primary text-white py-2 px-6 rounded-md font-medium">
                      Accept Invitation
                    </button>
                  </div>
                  
                  <p className="text-sm text-neutral-medium mt-6">
                    If the button doesn't work, copy and paste this link into your browser:
                    <br />
                    <span className="text-primary">https://whybrands.com/auth?invite=true&email=example@example.com</span>
                  </p>
                </div>
                <div className="bg-neutral-lightest p-3 text-center text-xs text-neutral-medium rounded-b-md">
                  &copy; {new Date().getFullYear()} WHY Brands. All rights reserved.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
