import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, HardHat, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveProfile } from "../hooks/useQueries";

interface Props {
  onNavigateLogin: () => void;
  onRegistered: () => void;
}

export default function RegisterScreen({
  onNavigateLogin,
  onRegistered,
}: Props) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const saveProfile = useSaveProfile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Valid email is required";
    if (!form.userId.trim() || /\s/.test(form.userId))
      errs.userId = "User ID must have no spaces";
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!identity || identity.getPrincipal().isAnonymous()) {
      // Need to authenticate first
      login();
      toast.info("Please complete authentication first");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        userId: form.userId.trim(),
        pinHash: "",
      });
      toast.success("Account created successfully!");
      onRegistered();
    } catch {
      toast.error("Failed to create account. Please try again.");
    }
  };

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-foreground/5 rounded-bl-full" />
        <div className="relative z-10">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <HardHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-primary-foreground">
                SD Corp
              </h1>
              <p className="text-primary-foreground/70 text-xs">
                Create your account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {!isLoggedIn && (
          <div className="mb-6 p-4 rounded-xl bg-primary/8 border border-primary/20">
            <p className="text-sm font-medium text-foreground mb-2">
              Step 1: Connect your identity
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              variant="outline"
              className="w-full h-10 border-primary/30 text-primary"
              size="sm"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                "Connect with Internet Identity"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Required before setting up your profile
            </p>
          </div>
        )}

        {isLoggedIn && (
          <div className="mb-6 p-3 rounded-xl bg-chart-2/10 border border-chart-2/20">
            <p className="text-sm font-medium text-chart-2">
              ✓ Identity connected
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {identity?.getPrincipal().toString().slice(0, 20)}...
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              data-ocid="register.name_input"
              placeholder="e.g. Suresh Desai"
              className="h-11 bg-card"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={!isLoggedIn}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              data-ocid="register.email_input"
              type="email"
              placeholder="suresh@sdcorp.com"
              className="h-11 bg-card"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              disabled={!isLoggedIn}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="userId" className="text-sm font-medium">
              User ID
            </Label>
            <Input
              id="userId"
              data-ocid="register.userid_input"
              placeholder="e.g. suresh_corp (no spaces)"
              className="h-11 bg-card"
              value={form.userId}
              onChange={(e) =>
                setForm((p) => ({ ...p, userId: e.target.value }))
              }
              disabled={!isLoggedIn}
            />
            {errors.userId && (
              <p className="text-destructive text-xs">{errors.userId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                data-ocid="register.password_input"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="h-11 bg-card pr-12"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                disabled={!isLoggedIn}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirm"
                data-ocid="register.confirm_password_input"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                className="h-11 bg-card pr-12"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                disabled={!isLoggedIn}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-xs">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <Button
          data-ocid="register.submit_button"
          onClick={handleSubmit}
          disabled={!isLoggedIn || saveProfile.isPending}
          className="w-full h-12 text-base font-semibold mt-6"
        >
          {saveProfile.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating
              Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
