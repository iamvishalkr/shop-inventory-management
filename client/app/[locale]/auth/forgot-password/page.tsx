"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { authClient } from "@/lib/auth-client";
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
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Title from "@/components/Title";
import { WEB_APP_NAME } from "@/constant";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || loading) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to send password reset link.");
      } else {
        setSuccessMsg(
          "If an account exists with this email, a password reset link has been sent.",
        );
        setCooldown(120); // 2-minute cooldown
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      <Title>Forgot Password</Title>
      {/* Ambient background glows using CSS variables (Shadcn colors) */}
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
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>

        <CardContent>
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

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Mail className="h-3.5 w-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || cooldown > 0}
                  required
                />
              </InputGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-8 mt-2 flex justify-center items-center font-medium cursor-pointer"
              disabled={loading || cooldown > 0}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-3.5 w-3.5 text-current animate-spin" />
                  Sending Link...
                </>
              ) : cooldown > 0 ? (
                `Resend in ${formatTimer(cooldown)}`
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
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
