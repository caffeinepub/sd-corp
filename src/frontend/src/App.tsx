import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useMyProfile } from "./hooks/useQueries";

import LoginScreen from "./screens/LoginScreen";
import MainApp from "./screens/MainApp";
import PinLockScreen from "./screens/PinLockScreen";
import PinSetupScreen from "./screens/PinSetupScreen";
import RegisterScreen from "./screens/RegisterScreen";

export type AppScreen =
  | "loading"
  | "login"
  | "register"
  | "pin-setup"
  | "pin-lock"
  | "app";

function AppContent() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, refetch } = useMyProfile();
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("sd-dark-mode") === "true";
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("sd-dark-mode", String(darkMode));
  }, [darkMode]);

  // Determine screen based on auth & profile state
  useEffect(() => {
    // Still initializing auth client
    if (isInitializing || loginStatus === "initializing") {
      setScreen("loading");
      return;
    }

    // Not authenticated
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setScreen("login");
      setPinUnlocked(false);
      return;
    }

    // Authenticated but profile still loading
    if (profileLoading) {
      setScreen("loading");
      return;
    }

    // No profile → register
    if (profile === null || profile === undefined) {
      setScreen("register");
      return;
    }

    // Profile exists but no PIN set
    if (!profile.pinHash || profile.pinHash === "") {
      setScreen("pin-setup");
      return;
    }

    // PIN set but not unlocked
    if (!pinUnlocked) {
      setScreen("pin-lock");
      return;
    }

    setScreen("app");
  }, [
    identity,
    isInitializing,
    loginStatus,
    profile,
    profileLoading,
    pinUnlocked,
  ]);

  const handlePinUnlocked = () => {
    setPinUnlocked(true);
    setScreen("app");
  };

  const handlePinSet = () => {
    void refetch();
    setPinUnlocked(true);
    setScreen("app");
  };

  const handleRegistered = () => {
    void refetch();
    setScreen("pin-setup");
  };

  const handleLogout = () => {
    setPinUnlocked(false);
    setScreen("login");
  };

  if (screen === "loading") {
    return (
      <div className="mobile-frame bg-background flex flex-col items-center justify-center min-h-dvh">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card-md">
            <span className="text-2xl font-display font-black text-primary-foreground">
              SD
            </span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-frame">
      {screen === "login" && (
        <LoginScreen onNavigateRegister={() => setScreen("register")} />
      )}
      {screen === "register" && (
        <RegisterScreen
          onNavigateLogin={() => setScreen("login")}
          onRegistered={handleRegistered}
        />
      )}
      {screen === "pin-setup" && <PinSetupScreen onPinSet={handlePinSet} />}
      {screen === "pin-lock" && (
        <PinLockScreen onUnlocked={handlePinUnlocked} onLogout={handleLogout} />
      )}
      {screen === "app" && (
        <MainApp
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster position="top-center" richColors />
    </>
  );
}
