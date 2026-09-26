"use client";

import { useEffect, useState } from "react";

import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import {
  createUser,
  deleteUser,
  getUsers,
} from "@/services/api/auth.api";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { UserSchema } from "@/schemas/user.schema";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [deleteUserId, setDeleteUserId] =
    useState(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const form = useForm({
    resolver: zodResolver(UserSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getUsers();

      setUsers(response.data || response);
    } catch (error) {
      console.error("Users error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load users."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const searchValue = search.toLowerCase();

    return (
      user.name
        ?.toLowerCase()
        .includes(searchValue) ||
      user.email
        ?.toLowerCase()
        .includes(searchValue)
    );
  });

  const handleCreateUser = async (formData) => {
    try {
      await createUser(formData);

      toast.success("User created successfully");

      form.reset();

      setCreateDialogOpen(false);

      await loadUsers();
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to create user."
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteUser(deleteUserId);

      toast.success("User deleted successfully");

      setDeleteUserId(null);

      await loadUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to delete user."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* =========================================
          HEADER
      ========================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Users
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage users and their access roles.
          </p>
        </div>

        <Button
          onClick={() =>
            setCreateDialogOpen(true)
          }
        >
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {/* =========================================
          ERROR
      ========================================== */}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-destructive">
              {error}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={isLoading}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* =========================================
          USERS
      ========================================== */}

      {!error && (
        <Card>
          <CardHeader className="space-y-4 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">
                All Users
              </CardTitle>

              <span className="text-sm text-muted-foreground">
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1
                  ? "user"
                  : "users"}
              </span>
            </div>

            <Input
              placeholder="Search users..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="max-w-md"
            />
          </CardHeader>

          <CardContent className="px-0 pb-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 border-t py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-t py-12 text-center">
                <Users className="mb-3 size-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  No users found
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Try changing your search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">
                        Name
                      </TableHead>

                      <TableHead>
                        Email
                      </TableHead>

                      <TableHead>
                        Role
                      </TableHead>

                      <TableHead className="pr-5 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {user.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <span className="font-medium">
                              {user.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {user.email}
                        </TableCell>

                        <TableCell>
                          <span className="rounded-md border px-2 py-1 text-xs font-medium">
                            {user.role}
                          </span>
                        </TableCell>

                        <TableCell className="pr-5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() =>
                              setDeleteUserId(
                                user.id
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================
          CREATE USER DIALOG
      ========================================== */}

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);

          if (!open) {
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add User
            </DialogTitle>

            <DialogDescription>
              Create a new user account.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(
              handleCreateUser
            )}
            className="space-y-5"
          >
            <FieldGroup>
              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({
                  field,
                  fieldState,
                }) => (
                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >
                    <FieldLabel htmlFor="user-name">
                      Name
                    </FieldLabel>

                    <Input
                      {...field}
                      id="user-name"
                      placeholder="John Doe"
                      aria-invalid={
                        fieldState.invalid
                      }
                    />

                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({
                  field,
                  fieldState,
                }) => (
                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >
                    <FieldLabel htmlFor="user-email">
                      Email
                    </FieldLabel>

                    <Input
                      {...field}
                      id="user-email"
                      type="email"
                      placeholder="john@example.com"
                      aria-invalid={
                        fieldState.invalid
                      }
                    />

                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={form.control}
                render={({
                  field,
                  fieldState,
                }) => (
                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >
                    <FieldLabel htmlFor="user-password">
                      Password
                    </FieldLabel>

                    <Input
                      {...field}
                      id="user-password"
                      type="password"
                      placeholder="Enter password"
                      aria-invalid={
                        fieldState.invalid
                      }
                    />

                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Role */}
              <Controller
                name="role"
                control={form.control}
                render={({
                  field,
                  fieldState,
                }) => (
                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >
                    <FieldLabel htmlFor="user-role">
                      Role
                    </FieldLabel>

                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="user-role"
                        aria-invalid={
                          fieldState.invalid
                        }
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="USER">
                          User
                        </SelectItem>

                        <SelectItem value="ADMIN">
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {fieldState.invalid && (
                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCreateDialogOpen(false)
                }
                disabled={
                  form.formState.isSubmitting
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting
                  ? "Creating..."
                  : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================
          DELETE CONFIRMATION
      ========================================== */}

      <Dialog
        open={Boolean(deleteUserId)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteUserId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete User
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to delete this
              user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteUserId(null)
              }
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting
                ? "Deleting..."
                : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}