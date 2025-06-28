/**
 * User Management Page - Admin only
 * 
 * Provides CRUD operations for managing users with role-based access control
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usersApi, type UserDto } from "@/lib/api-services";
import { isAdmin, getRoleName, getStatusName, getUserDisplayName } from "@/lib/role-utils";
import { UserCreateDialog } from "@/components/admin/user-create-dialog";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { format } from "date-fns";

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && !isAdmin(currentUser)) {
      router.push("/dashboard");
      return;
    }
  }, [currentUser, router]);

  // Load users
  useEffect(() => {
    if (currentUser && isAdmin(currentUser)) {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error: unknown) {
      console.error("❌ Failed to load users:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string };
        console.error("❌ Error details:", {
          message: apiError?.message,
          status: apiError?.response?.status,
          statusText: apiError?.response?.statusText,
          data: apiError?.response?.data
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
    try {
      // Transform flat role value to proper object structure
      const createData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: {
          id: userData.role,
          _id: userData.role
        }
      };
      
      await usersApi.create(createData);
      await loadUsers();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  };

  const handleEditUser = async (userData: { firstName: string; lastName: string; role: string; status: string }) => {
    if (!selectedUser?._id) return;
    
    try {
      // Transform flat role/status values to proper object structure
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: {
          id: userData.role,
          _id: userData.role
        },
        status: {
          id: userData.status,
          _id: userData.status
        }
      };
      
      await usersApi.update(selectedUser._id, updateData);
      await loadUsers();
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?._id) return;
    
    try {
      await usersApi.delete(selectedUser._id);
      await loadUsers();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const displayName = (getUserDisplayName(user) || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const role = (getRoleName(user) || '').toLowerCase();
    
    return displayName.includes(searchLower) || 
           email.includes(searchLower) || 
           role.includes(searchLower);
  });

  const getStatusBadgeVariant = (user: UserDto) => {
    return user?.status?._id === "1" ? "default" : "secondary";
  };

  const getRoleBadgeVariant = (user: UserDto) => {
    return user?.role?._id === "1" ? "destructive" : "outline";
  };

  // Show loading or redirect for non-admin users
  if (!currentUser || !isAdmin(currentUser)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Users className="mr-3 h-8 w-8" />
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-sm text-slate-400">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-2xl font-bold">
                    {users.filter(u => (u?.role?._id || u?.role?.id) === "1").length}
                  </div>
                  <div className="text-sm text-slate-400">Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold">
                    {users.filter(u => (u?.role?._id || u?.role?.id) !== "1").length}
                  </div>
                  <div className="text-sm text-slate-400">Regular Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold">
                    {users.filter(u => (u?.status?._id || u?.status?.id) === "1").length}
                  </div>
                  <div className="text-sm text-slate-400">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </div>
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user?._id || index}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-slate-300" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-100">
                              {getUserDisplayName(user)}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {user?._id?.slice(-8) || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {user?.email || 'No email'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user)}>
                          {user?.role?._id === "1" && <Shield className="w-3 h-3 mr-1" />}
                          {getRoleName(user)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user)}>
                          {user?.status?._id === "1" ? (
                            <UserCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <UserX className="w-3 h-3 mr-1" />
                          )}
                          {getStatusName(user)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user?.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-400 focus:text-red-300"
                              disabled={user?._id === currentUser?._id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-slate-400">
                          {searchTerm ? "No users found matching your search." : "No users found."}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <UserCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateUser}
        />

        {selectedUser && (
          <UserEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            user={selectedUser}
            onSubmit={handleEditUser}
          />
        )}

        {selectedUser && (
          <DeleteConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete User"
            description={`Are you sure you want to delete ${getUserDisplayName(selectedUser)}? This action cannot be undone.`}
            onConfirm={handleDeleteUser}
          />
        )}
      </div>
    </div>
  );
}