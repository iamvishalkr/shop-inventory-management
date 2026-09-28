"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  validateEmail,
  validatePasswordStrength,
  validateName,
} from "@/lib/auth-validate";
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
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import Title from "@/components/Title";
import { WEB_APP_NAME } from "@/constant";

const GoogleIcon = () => (
  <svg
    className="mr-2 h-3.5 w-3.5 shrink-0"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
    />
  </svg>
);

function SigninForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email verification states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer effect
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleResendVerification = async () => {
    if (resendTimer > 0 || resendLoading || !email) return;

    setResendLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const targetCallback = callbackUrl.startsWith(`/${locale}`)
      ? callbackUrl
      : `/${locale}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin + targetCallback,
      });

      if (error) {
        setErrorMsg(error.message || "Failed to resend verification email.");
      } else {
        setSuccessMsg("Verification email sent! Please check your inbox.");
        setResendTimer(120); // 2-minute timer
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validations
    if (mode === "signin") {
      const emailErr = validateEmail(email);
      if (emailErr) {
        setErrorMsg(emailErr);
        return;
      }
      if (!password) {
        setErrorMsg("Password is required.");
        return;
      }
    } else {
      const nameErr = validateName(name);
      if (nameErr) {
        setErrorMsg(nameErr);
        return;
      }
      const emailErr = validateEmail(email);
      if (emailErr) {
        setErrorMsg(emailErr);
        return;
      }
      const passwordErr = validatePasswordStrength(password);
      if (passwordErr) {
        setErrorMsg(passwordErr);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });

        if (error) {
          const isUnverified =
            error.code === "EMAIL_NOT_VERIFIED" ||
            error.message?.toLowerCase().includes("verify") ||
            error.message?.toLowerCase().includes("verified");

          if (isUnverified) {
            setNeedsVerification(true);
            setErrorMsg(null);
          } else {
            setErrorMsg(
              error.message || "Sign in failed. Please check your credentials.",
            );
          }
        } else {
          setSuccessMsg("Signed in successfully! Redirecting...");
          setTimeout(() => {
            // window.location.href = callbackUrl;
            router.push(callbackUrl);
          }, 800);
        }
      } else {
        const targetCallback = callbackUrl.startsWith(`/${locale}`)
          ? callbackUrl
          : `/${locale}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
          callbackURL: window.location.origin + targetCallback,
        });

        if (error) {
          setErrorMsg(error.message || "Sign up failed. Please try again.");
        } else {
          setNeedsVerification(true);
          setResendTimer(120); // Start 2-min timer since sign up auto-sends initial verification email
          setSuccessMsg(
            "Account created! A verification link has been sent to your email.",
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const targetCallback = callbackUrl.startsWith(`/${locale}`)
        ? callbackUrl
        : `/${locale}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + targetCallback,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign in failed.");
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
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
          <CardHeader className="space-y-1 pb-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-base font-semibold">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Please check your inbox and click the link to activate your
              account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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

            <Button
              type="button"
              onClick={handleResendVerification}
              className="w-full h-9 flex justify-center items-center font-medium cursor-pointer"
              disabled={resendTimer > 0 || resendLoading}
            >
              {resendLoading ? (
                <>
                  <Spinner className="mr-2 h-3.5 w-3.5 text-current animate-spin" />
                  Sending Email...
                </>
              ) : resendTimer > 0 ? (
                `Resend Email in ${formatTimer(resendTimer)}`
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4 pb-4">
            <div className="text-center text-xs text-muted-foreground">
              Back to{" "}
              <button
                type="button"
                onClick={() => {
                  setNeedsVerification(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="underline underline-offset-4 hover:text-primary transition-colors font-medium cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
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
            {mode === "signin" ? "Sign In" : "Create an Account"}
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            {mode === "signin"
              ? "Enter your email below to log into your account"
              : "Enter your details below to create your account"}
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

            <div className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <User className="h-3.5 w-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </InputGroup>
                </div>
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
                    disabled={loading}
                    required
                  />
                </InputGroup>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <Link
                      href="/auth/forgot-password"
                      className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
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
            </div>

            <Button
              type="submit"
              className="w-full h-8 mt-2 flex justify-center items-center font-medium cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-3.5 w-3.5 text-current animate-spin" />
                  {mode === "signin" ? "Signing In..." : "Creating Account..."}
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-2 text-[10px] uppercase text-muted-foreground font-medium">
              Or continue with
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full h-8 flex justify-center items-center font-medium cursor-pointer"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            Google
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t border-border/40 pt-4 pb-4">
          <div className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="underline underline-offset-4 hover:text-primary transition-colors font-medium cursor-pointer"
                  disabled={loading}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="underline underline-offset-4 hover:text-primary transition-colors font-medium cursor-pointer"
                  disabled={loading}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
          <div className="text-center text-xs text-muted-foreground flex items-center gap-2">
            {/* HELLO */}
            <ArrowLeft className="w-3 h-3" />{" "}
            <Link href={"/"} replace={true}>
              <span className="underline">Back to Homepage</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Spinner />
        </div>
      }
    >
      <Title>Sign In</Title>
      <SigninForm />
    </Suspense>
  );
}
