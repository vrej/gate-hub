import { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserPlus } from "lucide-react";

export default function ManageUsers() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);
  
  return (
    <AppShell 
      title="Manage Users" 
      subtitle="View and manage user accounts"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-medium" />
          </div>
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <UserPlus className="mr-2 h-5 w-5" />
          Add User
        </Button>
      </div>
      
      <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-medium">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center">
                            <span className="font-medium text-xs">{user.firstName[0]}{user.lastName[0]}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-dark">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-dark">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-dark">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={user.isAdmin ? "bg-primary text-white" : "bg-neutral-lightest text-neutral-medium"}>
                          {user.isAdmin ? "Admin" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" className="text-primary h-8 w-8 p-0">
                          <span className="sr-only">Edit</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
