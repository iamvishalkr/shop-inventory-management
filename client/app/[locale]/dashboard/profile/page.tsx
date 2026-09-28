"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  LogOut,
  User,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import Title from "@/components/Title";
import { WEB_APP_NAME } from "@/constant";

export default function ProfilePage() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const router = useRouter();

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  // Change Password Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [revokeSessions, setRevokeSessions] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isSessionPending, router]);

  useEffect(() => {
    const checkIsGoogle = async () => {
      const { data: accounts, error } = await authClient.listAccounts();
      if (error) {
        // something went wrong
        return false;
      }
      // Detect if user registered/logged in via Google OAuth only
      const isGoogleOnly =
        accounts &&
        accounts.length > 0 &&
        !accounts.some((acc) => acc.providerId === "credential");
      setIsGoogleAccount(isGoogleOnly);
    };
    checkIsGoogle();
  }, []);

  if (isSessionPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading profile details...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = (session.user as any)?.role === "admin";

  // Detect if user registered/logged in via Google OAuth only
  // const isGoogleOnly = accounts && accounts.length > 0 && !accounts.some((acc: any) => acc.provider === "credential" || acc.providerId === "credential");

  const handleChangePassword = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New passwords do not match. Please verify.");
      return;
    }

    const passwordErr = validatePasswordStrength(newPassword);
    if (passwordErr) {
      setErrorMsg(passwordErr);
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeSessions,
      });

      if (error) {
        setErrorMsg(
          error.message ||
            "Failed to update password. Please check your current password.",
        );
      } else {
        setSuccessMsg("Your password has been changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Title>Profile</Title>
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg tracking-tight">
              {WEB_APP_NAME}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/auth/signin");
                    },
                  },
                });
              }}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-10 space-y-6">
        {/* Back to Dashboard Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account Profile
          </h1>
          <p className="text-xs text-muted-foreground">
            View your account credentials and security settings.
          </p>
        </div>

        {/* Account Profile Card */}
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> User Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Personal details associated with your appointment account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-medium text-foreground">
                {session.user.name || "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Email Address:</span>
              <span className="font-medium text-foreground">
                {session.user.email}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize text-foreground font-mono">
                {(session.user as any)?.role || "customer"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Login Provider:</span>
              <span className="font-medium text-foreground capitalize">
                {isGoogleAccount ? "Google OAuth" : "Email & Password"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Email Verification:</span>
              {session.user.emailVerified ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]"
                >
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px]"
                >
                  <AlertCircle className="h-3 w-3" /> Unverified
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/50 pt-4 flex flex-col items-stretch gap-2">
            {isGoogleAccount ? (
              <p className="text-xs text-muted-foreground text-center">
                Password management is disabled because you signed in via Google
                OAuth.
              </p>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                  nativeButton={true}
                  render={(props) => (
                    <Button
                      {...props}
                      variant="outline"
                      className="w-full gap-2 font-medium cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-primary" /> Change
                      Password
                    </Button>
                  )}
                />

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" /> Change
                      Password
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Enter your current password and set a new password.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-4 py-2"
                  >
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
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <InputGroup>
                          <InputGroupAddon align="inline-start">
                            <Lock className="h-3.5 w-3.5" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={loading}
                            required
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              size="icon-xs"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              aria-label={
                                showCurrentPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              disabled={loading}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="newPassword">New Password</Label>
                        <InputGroup>
                          <InputGroupAddon align="inline-start">
                            <Lock className="h-3.5 w-3.5" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                            required
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              size="icon-xs"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              aria-label={
                                showNewPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              disabled={loading}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="confirmNewPassword">
                          Confirm New Password
                        </Label>
                        <InputGroup>
                          <InputGroupAddon align="inline-start">
                            <Lock className="h-3.5 w-3.5" />
                          </InputGroupAddon>
                          <InputGroupInput
                            id="confirmNewPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmNewPassword}
                            onChange={(e) =>
                              setConfirmNewPassword(e.target.value)
                            }
                            disabled={loading}
                            required
                          />
                        </InputGroup>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        id="revokeSessions"
                        type="checkbox"
                        checked={revokeSessions}
                        onChange={(e) => setRevokeSessions(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor="revokeSessions"
                        className="text-xs font-normal text-muted-foreground cursor-pointer"
                      >
                        Log out of all other devices
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-8 mt-2 flex justify-center items-center font-medium cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner className="mr-2 h-3.5 w-3.5 text-current animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
