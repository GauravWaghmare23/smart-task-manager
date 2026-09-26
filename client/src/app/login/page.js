"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { loginSchema } from "../../schemas/auth.schema";
import { loginUser } from "@/services/api/auth.api";
import { setCredentials } from "@/store/slices/authSlice";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [serverError, setServerError] = useState("");

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    try {
      setServerError("");

      const response = await loginUser(formData);

      // Store JWT for future API requests
      localStorage.setItem("token", response.token);

      // Store authenticated user in Redux
      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
        })
      );

      toast.success("Login successful");

      // Redirect according to user role
      if (response.user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/user");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to login. Please try again.";

      setServerError(message);

      toast.error(message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Smart Task Manager
          </CardTitle>

          <CardDescription>
            Sign in to manage your tasks
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="login-form"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">
                      Email
                    </FieldLabel>

                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">
                      Password
                    </FieldLabel>

                    <Input
                      {...field}
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                    />

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              {/* Backend error */}
              {serverError && (
                <p className="text-sm text-destructive">
                  {serverError}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting
                  ? "Signing in..."
                  : "Sign in"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}