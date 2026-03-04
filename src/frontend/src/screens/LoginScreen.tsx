import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, HardHat, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  onNavigateRegister: () => void;
}

export default function LoginScreen({ onNavigateRegister }: Props) {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    try {
      login();
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const isLoading = isLoggingIn || isInitializing;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header decoration */}
      <div className="bg-primary px-6 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-tr-full" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center mb-4">
            <HardHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-black text-primary-foreground tracking-tight">
            SD Corp
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1 font-body">
            Construction Business Manager
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Welcome back
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium text-sm">
              Email or User ID
            </Label>
            <Input
              id="email"
              data-ocid="login.input"
              type="text"
              placeholder="Enter your email or user ID"
              className="h-12 bg-card border-border"
              disabled
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium text-sm">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                data-ocid="login.password_input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 bg-card border-border pr-12"
                disabled
                readOnly
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary/8 border border-primary/20 mb-6">
          <p className="text-sm text-foreground/80 font-medium mb-1">
            🔐 Secure Login via Internet Identity
          </p>
          <p className="text-xs text-muted-foreground">
            This app uses Internet Identity for secure, passwordless
            authentication. Tap below to connect.
          </p>
        </div>

        <Button
          data-ocid="login.submit_button"
          onClick={handleLogin}
          disabled={isLoading}
          className="h-12 text-base font-semibold w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Sign In with Internet Identity"
          )}
        </Button>

        <div className="mt-4 text-center">
          <span className="text-muted-foreground text-sm">
            Don't have an account?{" "}
          </span>
          <button
            type="button"
            data-ocid="login.register_link"
            onClick={onNavigateRegister}
            className="text-primary font-semibold text-sm hover:underline"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
