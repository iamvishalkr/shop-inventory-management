"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { validatePasswordStrength } from "@/lib/auth-validate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Lock,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Title from "@/components/Title";
import { WEB_APP_NAME } from "@/constant";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg(
        "Invalid or missing reset token. Please request a new password reset link.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify your passwords.");
      return;
    }

    const passwordErr = validatePasswordStrength(password);
    if (passwordErr) {
      setErrorMsg(passwordErr);
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setErrorMsg(
          error.message || "Failed to reset password. Token may be expired.",
        );
      } else {
        setSuccessMsg("Password reset successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_50%)] opacity-[0.03] dark:opacity-[0.07]" />
      <div className="absolute -left-1/4 -top-1/4 -z-10 h-[50vw] w-[50vw] rounded-full bg-[color-mix(in_oklch,var(--primary),transparent_95%)] blur-[120px]" />
      <div className="absolute -right-1/4 -bottom-1/4 -z-10 h-[50vw] w-[50vw] rounded-full bg-[color-mix(in_oklch,var(--primary),transparent_95%)] blur-[120px]" />

      <div className="flex flex-col items-center justify-center gap-2 mb-6 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-border transition-all hover:scale-105 duration-300">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {WEB_APP_NAME}
          </h1>
          <p className="text-xs text-muted-foreground">Shop POS</p>
        </div>
      </div>

      <Card className="w-full max-w-100 border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-sm font-semibold">
            Set New Password
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Please enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!token ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Invalid or missing password reset token. Please request a new
                  link.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                nativeButton={false}
                className="w-full h-8 flex justify-center items-center font-medium cursor-pointer"
                render={(props) => (
                  <Link {...props} href="/auth/forgot-password">
                    Request Reset Link
                  </Link>
                )}
              ></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {successMsg && (
                <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertDescription className="text-xs">
                    {successMsg}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="password">New Password</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Lock className="h-3.5 w-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Lock className="h-3.5 w-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </InputGroup>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-8 mt-2 flex justify-center items-center font-medium cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 text-current animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4 pb-4">
          <div className="text-center text-xs text-muted-foreground">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Spinner />
        </div>
      }
    >
      <Title>Reset Password</Title>
      <ResetPasswordForm />
    </Suspense>
  );
}
