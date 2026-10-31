import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@truckbuck/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@truckbuck/ui/card";
import { Input } from "@truckbuck/ui/input";
import { Label } from "@truckbuck/ui/label";
import { useToast } from "@truckbuck/ui/toaster";

import { useAuth } from "@/auth/auth-context";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

function redirectTarget(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const { from } = state;
    if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) return from;
  }
  return "/";
}

/** Placeholder login backed by MockAuthProvider: any valid email + 8-char password works. */
export function LoginPage() {
  const { session, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const target = redirectTarget(location.state);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (session) return <Navigate to={target} replace />;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      await navigate(target, { replace: true });
    } catch {
      toast({ title: "Sign-in failed", description: "Please try again.", variant: "destructive" });
    }
  });

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl leading-none font-semibold tracking-tight">
            Sign in to TruckBuck Admin
          </h1>
          <CardDescription>Development build: any valid email and password works.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" noValidate onSubmit={(event) => void onSubmit(event)}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password ? (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
