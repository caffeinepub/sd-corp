import { Building2, LayoutDashboard, User, Users } from "lucide-react";
import { useState } from "react";
import type { Site } from "../backend.d";
import DashboardScreen from "./DashboardScreen";
import LabourScreen from "./LabourScreen";
import ProfileScreen from "./ProfileScreen";
import SitesScreen from "./SitesScreen";

type Tab = "dashboard" | "sites" | "labour" | "profile";

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export default function MainApp({
  darkMode,
  onToggleDarkMode,
  onLogout,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const tabs: {
    id: Tab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "sites", label: "Sites", Icon: Building2 },
    { id: "labour", label: "Labour", Icon: Users },
    { id: "profile", label: "Profile", Icon: User },
  ];

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    setActiveTab("sites");
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Main content area */}
      <main className="flex-1 overflow-hidden pb-20">
        {activeTab === "dashboard" && (
          <DashboardScreen
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            onSelectSite={handleSelectSite}
          />
        )}
        {activeTab === "sites" && (
          <SitesScreen
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
          />
        )}
        {activeTab === "labour" && <LabourScreen />}
        {activeTab === "profile" && <ProfileScreen onLogout={onLogout} />}
      </main>

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border safe-bottom z-50">
        <div className="flex items-stretch h-16">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                type="button"
                key={id}
                data-ocid={`nav.${id === "dashboard" ? "dashboard" : id === "sites" ? "sites" : id === "labour" ? "labour" : "profile"}_tab`}
                onClick={() => {
                  setActiveTab(id);
                  if (id !== "sites") setSelectedSite(null);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
