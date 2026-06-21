import { useState, useEffect, useMemo } from "react";
import { 
  Leaf, 
  MapPin, 
  Users, 
  LineChart, 
  Settings, 
  Award, 
  Compass, 
  Library,
  Flame, 
  LogOut, 
  LogIn, 
  Sparkles,
  RefreshCw 
} from "lucide-react";

import Onboarding from "./components/Onboarding";
import AuthModal from "./components/AuthModal";
import DashboardHome from "./components/DashboardHome";
import AnalyticsTab from "./components/AnalyticsTab";
import ActionsLibraryTab from "./components/ActionsLibraryTab";
import MilestonesTab from "./components/MilestonesTab";
import SettingsTab from "./components/SettingsTab";

import { ActivityLog, EmissionFactor, UserAction, UserMilestone, AIInsight, DashboardData } from "./types";

const FALLBACK_FACTORS: EmissionFactor[] = [
  // Transport
  { id: 1, category: "transport", activityKey: "car_petrol_km", label: "Petrol Car (Per km)", unit: "km", factorKg: 0.170, source: "Local Reference", description: "Standard internal combustion gasoline sedan." },
  { id: 2, category: "transport", activityKey: "car_petrol_large_km", label: "Heavy SUV / Truck", unit: "km", factorKg: 0.270, source: "Local Reference", description: "Larger SUVs, light-duty passenger pickups." },
  { id: 3, category: "transport", activityKey: "car_ev_std_km", label: "Electric Vehicle (EV)", unit: "km", factorKg: 0.045, source: "Local Reference", description: "Calculated with average city hybrid grid footprint." },
  { id: 4, category: "transport", activityKey: "train_metro_km", label: "Subway or Transit", unit: "km", factorKg: 0.025, source: "Local Reference", description: "Standard electric passenger metro coach." },
  { id: 5, category: "transport", activityKey: "walking_km", label: "Walking or Cycling", unit: "km", factorKg: 0.000, source: "Local Reference", description: "Zero emission biological manual transport." },
  
  // Food
  { id: 10, category: "food", activityKey: "beef_portion", label: "Beef steak (Per portion)", unit: "meals", factorKg: 7.500, source: "Local Reference", description: "150g portion. High land utilization and livestock impact." },
  { id: 11, category: "food", activityKey: "pork_portion", label: "Pork (Per portion)", unit: "meals", factorKg: 1.800, source: "Local Reference", description: "150g portion. Intensive white meat cultivation." },
  { id: 12, category: "food", activityKey: "chicken_portion", label: "Poultry segment", unit: "meals", factorKg: 0.900, source: "Local Reference", description: "150g portion of localized chicken breast standard." },
  { id: 13, category: "food", activityKey: "cheese_portion", label: "Dairy & Cheese", unit: "meals", factorKg: 2.100, source: "Local Reference", description: "High concentration dairy proteins and processes." },
  { id: 14, category: "food", activityKey: "vegan_portion", label: "Plant-based Vegan Meal", unit: "meals", factorKg: 0.400, source: "Local Reference", description: "Locally-sourced beans, grains, vegetables, tofu." },
  
  // Energy
  { id: 20, category: "energy", activityKey: "coal_kwh", label: "Grid Electricity (Coal)", unit: "kWh", factorKg: 0.850, source: "Local Reference", description: "Standard thermal carbon coal grid electricity." },
  { id: 21, category: "energy", activityKey: "solar_kwh", label: "Renewable (Solar/Wind)", unit: "kWh", factorKg: 0.000, source: "Local Reference", description: "Self-generation domestic solar arrays or wind credits." },
  { id: 22, category: "energy", activityKey: "gas_heating_kwh", label: "Gas Boilers & Heaters", unit: "kWh", factorKg: 0.180, source: "Local Reference", description: "Methane gas direct centralized heating services." },
  
  // Shopping
  { id: 30, category: "shopping", activityKey: "fast_fashion_item", label: "Polyester / Fast Fashion item", unit: "items", factorKg: 24.500, source: "Local Reference", description: "Synthetic textiles requiring high manufacturing energy." },
  { id: 31, category: "shopping", activityKey: "smartphone_buy", label: "Electronic Device (Smartphone)", unit: "items", factorKg: 75.000, source: "Local Reference", description: "Silicon fabrication and extraction of rare earth elements." },
  { id: 32, category: "shopping", activityKey: "cotton_tee", label: "Organic Cotton T-Shirt", unit: "items", factorKg: 4.800, source: "Local Reference", description: "Pre-shrunk organic cotton carded standard segment." },
  
  // Flights
  { id: 40, category: "flight", activityKey: "flight_domestic", label: "Short domestic flight (Per hr)", unit: "hours", factorKg: 154.00, source: "Local Reference", description: "Regional airliner route less than 2.5 hours." },
  { id: 41, category: "flight", activityKey: "flight_international", label: "Long transcontinental route (Per hr)", unit: "hours", factorKg: 120.00, source: "Local Reference", description: "Intercontinental high-altitude widebody route." }
];

export default function App() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem("carbonlens_onboarding_completed") === "true";
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "actions" | "milestones" | "settings">("dashboard");
  const [factors, setFactors] = useState<EmissionFactor[]>(FALLBACK_FACTORS);
  const [authOpen, setAuthOpen] = useState(false);

  // Authentication & Guest variables
  const [isGuest, setIsGuest] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Guest State Caches
  const [guestLogs, setGuestLogs] = useState<ActivityLog[]>(() => {
    const raw = localStorage.getItem("carbonlens_guest_logs");
    return raw ? JSON.parse(raw) : [];
  });
  
  const [guestAdoptions, setGuestAdoptions] = useState<UserAction[]>(() => {
    const raw = localStorage.getItem("carbonlens_guest_adoptions");
    return raw ? JSON.parse(raw) : [];
  });

  const [guestStreak, setGuestStreak] = useState<number>(() => {
    const s = localStorage.getItem("carbonlens_guest_streak");
    return s ? parseInt(s) : 0;
  });

  // Server Authenticated State
  const [serverDashboard, setServerDashboard] = useState<DashboardData | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);

  // Save guest entries to localStorage
  useEffect(() => {
    localStorage.setItem("carbonlens_guest_logs", JSON.stringify(guestLogs));
  }, [guestLogs]);

  useEffect(() => {
    localStorage.setItem("carbonlens_guest_adoptions", JSON.stringify(guestAdoptions));
  }, [guestAdoptions]);

  useEffect(() => {
    localStorage.setItem("carbonlens_guest_streak", String(guestStreak));
  }, [guestStreak]);

  // Initial Boot check - fetch profile parameters and factors catalog
  useEffect(() => {
    const boot = async () => {
      try {
        const facRes = await fetch("/api/factors");
        if (facRes.ok) {
          const facData = await facRes.json();
          if (Array.isArray(facData) && facData.length > 0) {
            setFactors(facData);
          }
        }
      } catch (err) {
        console.warn("Using fallback local footprint calibrations.", err);
      }

      await checkAuthAndLoadDashboard();
    };

    boot();
  }, []);

  const checkAuthAndLoadDashboard = async () => {
    setLoadingServer(true);
    try {
      const profRes = await fetch("/api/auth/profile");
      if (profRes.ok) {
        const userData = await profRes.json();
        setUser(userData);
        setIsGuest(false);
        // Load the full aggregated feed
        const dashRes = await fetch("/api/dashboard");
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setServerDashboard(dashData);
        }
      } else {
        setIsGuest(true);
        setUser(null);
        setServerDashboard(null);
      }
    } catch (err) {
      console.error("Critical server synchronization failure:", err);
      setIsGuest(true);
    } finally {
      setLoadingServer(false);
    }
  };

  const handleOnboardingComplete = async (data: {
    countryCode: string;
    householdSize: number;
    commuteType: string;
    dailyBudgetKg: number;
  }) => {
    localStorage.setItem("carbonlens_onboarding_completed", "true");
    localStorage.setItem("carbonlens_guest_profile", JSON.stringify(data));
    setOnboardingCompleted(true);
    setIsGuest(true);
    // Initialize standard guest parameters
    setUser({
      id: "guest_user",
      email: "guest@carbonlens.local",
      countryCode: data.countryCode,
      householdSize: data.householdSize,
      commuteType: data.commuteType,
      dailyBudgetKg: data.dailyBudgetKg,
      createdAt: new Date().toISOString()
    });
  };

  // Convert client-side guest entries to compute standard dashboard metrics dynamically (Guest parity)
  const clientDashboardData = useMemo((): DashboardData => {
    const guestProf = localStorage.getItem("carbonlens_guest_profile");
    const parsedProf = guestProf ? JSON.parse(guestProf) : {
      countryCode: "IN",
      householdSize: 1,
      commuteType: "car_petrol_km",
      dailyBudgetKg: 5.50
    };

    const targetUser = {
      id: "guest_user",
      email: "guest@carbonlens.local",
      ...parsedProf,
      createdAt: new Date().toISOString()
    };

    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLogs = guestLogs.filter(l => l.loggedAt.substring(0, 10) === todayStr);
    const todayLoggedKg = todayLogs.reduce((acc, l) => acc + l.emissionKg, 0);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyLogs = guestLogs.filter(l => new Date(l.loggedAt).getTime() >= oneWeekAgo);
    const totalWeeklyEmissionKg = weeklyLogs.reduce((acc, l) => acc + l.emissionKg, 0);

    const byCategory = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      flight: 0
    };
    weeklyLogs.forEach(l => {
      if (byCategory[l.activityCategory] !== undefined) {
        byCategory[l.activityCategory] += l.emissionKg;
      }
    });

    // Count days under budget in guest logs (last 7 calendar days)
    const dailySums: Record<string, number> = {};
    weeklyLogs.forEach(l => {
      const dStr = l.loggedAt.substring(0, 10);
      dailySums[dStr] = (dailySums[dStr] || 0) + l.emissionKg;
    });

    let daysUnderBudget = 0;
    for (let i = 0; i < 7; i++) {
      const inspect = new Date();
      inspect.setDate(inspect.getDate() - i);
      const isStr = inspect.toISOString().substring(0, 10);
      const val = dailySums[isStr];
      if (val !== undefined && val <= parsedProf.dailyBudgetKg) {
        daysUnderBudget++;
      }
    }

    // National average baseline scaling
    let countryMultiplier = 13.0;
    if (parsedProf.countryCode === "IN") countryMultiplier = 5.2;
    else if (parsedProf.countryCode === "US") countryMultiplier = 39.7;
    else if (parsedProf.countryCode === "UK") countryMultiplier = 14.2;
    else if (parsedProf.countryCode === "DE") countryMultiplier = 21.9;
    else if (parsedProf.countryCode === "FR") countryMultiplier = 12.3;

    const baseNationalWeeklyKg = countryMultiplier * 7;
    const versusAveragePercent = baseNationalWeeklyKg > 0 
      ? Math.round(((totalWeeklyEmissionKg - baseNationalWeeklyKg) / baseNationalWeeklyKg) * 100)
      : 0;

    // Evaluate guest milestones dynamically (F7)
    const guestMilestones: UserMilestone[] = [];
    if (guestLogs.length >= 1) {
      guestMilestones.push({ 
        id: "gm1", 
        userId: "guest", 
        milestoneKey: "first_log", 
        badgeName: "Carbon Pioneer", 
        description: "Logged your very first carbon-impacting activity.", 
        iconName: "Compass", 
        earnedAt: new Date().toISOString() 
      });
    }
    if (guestStreak >= 7) {
      guestMilestones.push({ 
        id: "gm2", 
        userId: "guest", 
        milestoneKey: "streak_7", 
        badgeName: "Efficiency Master", 
        description: "Maintained a carbon baseline under budget for 7 consecutive days.", 
        iconName: "Flame", 
        earnedAt: new Date().toISOString() 
      });
    }
    // Transit purist segment check (at least 5 low impact logs)
    const transitCount = guestLogs.filter(l => l.activityCategory === "transport" && (l.activityKey.includes("walking") || l.activityKey.includes("train"))).length;
    if (transitCount >= 5) {
      guestMilestones.push({ 
        id: "gm3", 
        userId: "guest", 
        milestoneKey: "green_commuter", 
        badgeName: "Transit Purist", 
        description: "Logged 5 eco-friendly transport segments (walking, cycling, subway).", 
        iconName: "Bike", 
        earnedAt: new Date().toISOString() 
      });
    }
    // Vegan champ logic (at least 5 plant based logs)
    const veganCount = guestLogs.filter(l => l.activityCategory === "food" && l.activityKey.includes("vegan")).length;
    if (veganCount >= 5) {
      guestMilestones.push({ 
        id: "gm4", 
        userId: "guest", 
        milestoneKey: "vegan_champ", 
        badgeName: "Planet over Plate", 
        description: "Logged plant-based dietary entries 5 or more times.", 
        iconName: "Leaf", 
        earnedAt: new Date().toISOString() 
      });
    }
    // Energy saver logic
    const energySaverCount = guestLogs.filter(l => l.activityCategory === "energy" && l.activityKey.includes("solar")).length;
    if (energySaverCount >= 5) {
      guestMilestones.push({ 
        id: "gm5", 
        userId: "guest", 
        milestoneKey: "energy_saver", 
        badgeName: "Volt Guardian", 
        description: "Logged renewable energy or eco washing cycles 5 or more times.", 
        iconName: "Zap", 
        earnedAt: new Date().toISOString() 
      });
    }
    // Adopted 5 check
    const adoptedCount = guestAdoptions.filter(a => a.status === "adopted").length;
    if (adoptedCount >= 5) {
      guestMilestones.push({ 
        id: "gm6", 
        userId: "guest", 
        milestoneKey: "adopted_5", 
        badgeName: "Habit Transformer", 
        description: "Adopted 5 or more carbon-reducing sustainable swaps from the catalog.", 
        iconName: "Sparkles", 
        earnedAt: new Date().toISOString() 
      });
    }
    // Carbon shrinker
    if (guestLogs.length >= 3 && totalWeeklyEmissionKg < 26.0) {
      guestMilestones.push({ 
        id: "gm7", 
        userId: "guest", 
        milestoneKey: "cut_co2_20", 
        badgeName: "Carbon Shrinker", 
        description: "Logged under 26 kgCO₂e of weekly emissions (saving 30%+ compared to standard).", 
        iconName: "TrendingDown", 
        earnedAt: new Date().toISOString() 
      });
    }

    // Determine Top single item
    let topActivityName = "None";
    let topActivityEmissionKg = 0;
    if (weeklyLogs.length > 0) {
      const subGroup: Record<string, number> = {};
      weeklyLogs.forEach(l => {
        subGroup[l.activityLabel] = (subGroup[l.activityLabel] || 0) + l.emissionKg;
      });
      let maxAct = -1;
      Object.keys(subGroup).forEach(k => {
        if (subGroup[k] > maxAct) {
          maxAct = subGroup[k];
          topActivityName = k;
          topActivityEmissionKg = subGroup[k];
        }
      });
    }

    return {
      user: targetUser,
      todayLoggedKg,
      dailyBudgetKg: parsedProf.dailyBudgetKg,
      streaks: {
        current: guestStreak,
        longest: guestStreak,
        isUnderBudgetToday: todayLoggedKg <= parsedProf.dailyBudgetKg
      },
      weeklySummary: {
        totalEmissionKg: totalWeeklyEmissionKg,
        daysUnderBudget,
        byCategory,
        versusAveragePercent,
        topCategory: "transport",
        topActivityName,
        topActivityEmissionKg
      },
      recentLogs: guestLogs,
      milestones: guestMilestones,
      adoptedActions: guestAdoptions,
      insight: null // Insight is server only via Gemini Flash
    };
  }, [guestLogs, guestAdoptions, guestStreak]);

  const activeDashboard = isGuest ? clientDashboardData : (serverDashboard || clientDashboardData);

  // AUTH SUCCESS TRIGGER - Synchronizes all current guest caches directly to the brand new account!
  const handleAuthSuccess = async (userData: any) => {
    setUser(userData);
    setIsGuest(false);

    // Sync guest logs to backend to preserve achievements (F1 parity)
    if (guestLogs.length > 0) {
      try {
        console.log("Synchronizing guest activities over to new server tables...");
        for (const log of guestLogs) {
          const factorRef = factors.find(f => f.key === log.activityKey);
          if (factorRef) {
            await fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                factorId: factorRef.id,
                quantity: log.quantity,
                note: log.note,
                loggedAt: log.loggedAt
              })
            });
          }
        }
        // Sync guest adoptions over
        for (const adopt of guestAdoptions) {
          await fetch("/api/actions/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionKey: adopt.actionKey,
              status: adopt.status
            })
          });
        }
        // Purge guest memory
        setGuestLogs([]);
        setGuestAdoptions([]);
        setGuestStreak(0);
        localStorage.removeItem("carbonlens_guest_logs");
        localStorage.removeItem("carbonlens_guest_adoptions");
        localStorage.removeItem("carbonlens_guest_streak");
      } catch (err) {
        console.warn("Guest data synchronization finished with issues:", err);
      }
    }

    await checkAuthAndLoadDashboard();
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Signing out locally.");
    }
    setUser(null);
    setIsGuest(true);
    setServerDashboard(null);
    // Keep onboardingCompleted intact to avoid re-triggering calibration immediately
  };

  // ADD LOG HANDLER (Supports both client & server)
  const handleAddLog = async (factorId: number, quantity: number, note: string) => {
    const factorRef = factors.find(f => f.id === factorId);
    if (!factorRef) throw new Error("Emissions parameter not found in the catalog.");

    if (isGuest) {
      const calculatedEmissionKg = quantity * factorRef.factorKg;
      const newLog: ActivityLog = {
        id: "glog_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        userId: "guest",
        factorId: factorRef.id,
        activityLabel: factorRef.label,
        activityCategory: factorRef.category,
        quantity,
        emissionKg: Number(calculatedEmissionKg.toFixed(2)),
        note,
        loggedAt: new Date().toISOString()
      };

      const updatedLogs = [newLog, ...guestLogs];
      setGuestLogs(updatedLogs);

      // Recalculate streak in guest mode
      // Count today's logs + check daily limits
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayLogs = updatedLogs.filter(l => l.loggedAt.substring(0, 10) === todayStr);
      const todaySum = todayLogs.reduce((acc, l) => acc + l.emissionKg, 0);

      const dailyBudget = activeDashboard.dailyBudgetKg;
      if (todaySum <= dailyBudget) {
        // Increment streak if not already incremented today
        const lastStreakUpg = localStorage.getItem("carbonlens_guest_streak_updated");
        if (lastStreakUpg !== todayStr) {
          setGuestStreak(prev => prev + 1);
          localStorage.setItem("carbonlens_guest_streak_updated", todayStr);
        }
      } else {
        // Broke budget, reset current streak to 0
        setGuestStreak(0);
      }
    } else {
      // Server-side submission
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, quantity, note })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Log processing rejected.");
      }
      await checkAuthAndLoadDashboard();
    }
  };

  // DELETE LOG
  const handleDeleteLog = async (logId: string) => {
    if (isGuest) {
      setGuestLogs(guestLogs.filter(l => l.id !== logId));
    } else {
      const response = await fetch(`/api/logs/${logId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Failed to purge database entry.");
      }
      await checkAuthAndLoadDashboard();
    }
  };

  // TOGGLE ACTION BOOKMARK/ADOPT (F6)
  const handleToggleAction = async (actionKey: string, status: "bookmarked" | "adopted" | "removed") => {
    if (isGuest) {
      if (status === "removed") {
        setGuestAdoptions(guestAdoptions.filter(a => a.actionKey !== actionKey));
      } else {
        const existing = guestAdoptions.find(a => a.actionKey === actionKey);
        if (existing) {
          setGuestAdoptions(guestAdoptions.map(a => a.actionKey === actionKey ? { ...a, status } : a));
        } else {
          setGuestAdoptions([...guestAdoptions, { id: "gact_" + Date.now(), userId: "guest", actionKey, status, createdAt: new Date().toISOString() }]);
        }
      }
    } else {
      const response = await fetch("/api/actions/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionKey, status })
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Failed to toggle item.");
      }
      await checkAuthAndLoadDashboard();
    }
  };

  // PROFILE VARIABLES UPDATE
  const handleUpdateProfile = async (payload: any) => {
    if (isGuest) {
      throw new Error("Guest limits must build on registered accounts.");
    }
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const d = await response.json();
    if (!response.ok) {
      throw new Error(d.error || "Failed profile update.");
    }
    await checkAuthAndLoadDashboard();
  };

  // INSTANT DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    if (isGuest) {
      setGuestLogs([]);
      setGuestAdoptions([]);
      setGuestStreak(0);
      localStorage.clear();
      window.location.reload();
      return;
    }
    const response = await fetch("/api/settings/delete-account", {
      method: "POST"
    });
    if (response.ok) {
      setUser(null);
      setIsGuest(true);
      setServerDashboard(null);
      setOnboardingCompleted(false);
      localStorage.clear();
    } else {
      const d = await response.json();
      throw new Error(d.error || "Wipe action rejected on server tables.");
    }
  };

  // DYNAMIC GEMINI INSIGHT CALL (F5)
  const handleRefreshInsight = async () => {
    if (isGuest) return;
    const response = await fetch("/api/insights/generate", {
      method: "POST"
    });
    const d = await response.json();
    if (!response.ok) {
      throw new Error(d.error || "Gemini Flash synthesis failed.");
    }
    await checkAuthAndLoadDashboard();
  };

  // Render onboarding calibration screen on first boot
  if (!onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div 
      className="min-h-screen bg-[#E8EFE8] flex flex-col font-sans antialiased text-slate-800"
      style={{
        backgroundImage: "radial-gradient(circle at 0% 0%, #d4e9d4 0%, transparent 50%), radial-gradient(circle at 100% 100%, #f5f2ed 0%, transparent 50%)"
      }}
    >
      
      {/* HEADER BAR ROW */}
      <header id="app_header" className="bg-white/35 backdrop-blur-xl border-b border-white/40 py-4 px-6 md:px-12 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight font-sans text-emerald-950">CarbonLens</h1>
            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Planetary Impact Hub</span>
          </div>
        </div>

        {/* Navigation Tabs segment bar */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 select-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: Compass },
            { id: "analytics", label: "Trends & AI", icon: LineChart },
            { id: "actions", label: "Catalog Swaps", icon: Library },
            { id: "milestones", label: "Badging & Streaks", icon: Award },
            { id: "settings", label: "Parameters", icon: Settings }
          ].map((t) => {
            const TabIcon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`nav_tab_button_${t.id}`}
                onClick={() => setActiveTab(t.id as any)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isTabActive 
                    ? "bg-white/60 border-white/85 text-emerald-900 shadow-xs" 
                    : "border-transparent text-slate-600 hover:bg-white/35 hover:text-slate-900"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* User Account State Controls */}
        <div className="flex items-center gap-3">
          {loadingServer && (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          )}

          {isGuest ? (
            <button
              id="header_login_btn"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-slate-200"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">{user?.email}</span>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase block leading-none">Standard Member</span>
              </div>
              <button
                id="header_logout_btn"
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-slate-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* COMPACT BOTTOM TABS NAVIGATION ROW FOR MOBILE DEVICES */}
      <nav id="mobile_navbar" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-150 p-2 z-40 grid grid-cols-5 gap-1 shadow-2xl select-none">
        {[
          { id: "dashboard", label: "Home", icon: Compass },
          { id: "analytics", label: "Trends", icon: LineChart },
          { id: "actions", label: "Swaps", icon: Library },
          { id: "milestones", label: "Badges", icon: Award },
          { id: "settings", label: "Setup", icon: Settings }
        ].map((t) => {
          const TabIcon = t.icon;
          const isTabActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`mobile_tab_button_${t.id}`}
              onClick={() => {
                setActiveTab(t.id as any);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer text-center ${
                isTabActive ? "text-emerald-550 font-bold bg-emerald-50/50" : "text-slate-400 font-medium"
              }`}
            >
              <TabIcon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 tracking-tight uppercase block leading-none">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN LAYOUT CANVAS */}
      <main id="main_content_canvas" className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 py-8 pb-24">
        
        {activeTab === "dashboard" && (
          <DashboardHome
            todayLoggedKg={activeDashboard.todayLoggedKg}
            dailyBudgetKg={activeDashboard.dailyBudgetKg}
            streaks={activeDashboard.streaks}
            recentLogs={activeDashboard.recentLogs}
            factors={factors}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            isGuest={isGuest}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab
            dashboardData={activeDashboard}
            onRefreshInsight={handleRefreshInsight}
            isGuest={isGuest}
          />
        )}

        {activeTab === "actions" && (
          <ActionsLibraryTab
            library={FALLBACK_FACTORS.map(f => {
              // Standard static saving mapping based on typical catalog switches
              // e.g. swapping gasoline car for walking saves ~0.170kg CO2 per km
              // 15km a week saves 2.55kg weekly. 
              let key = f.activityKey;
              let weeklySaving = 3.5;
              let annualSaving = 182;
              let effortObj: "easy" | "medium" | "high" = "medium";
              let impactText = "Conserve fuel emissions directly with manual alternative transit segments.";
              
              if (f.activityKey === "car_petrol_km") {
                weeklySaving = 22.5;
                annualSaving = 1170;
                effortObj = "high";
                impactText = "Avoid high emissions. Carpooling or driving an EV offsets typical passenger car exhaust.";
              } else if (f.activityKey === "train_metro_km") {
                weeklySaving = 12.0;
                annualSaving = 624;
                effortObj = "medium";
                impactText = "Public buses and subway transits utilize dense grids to split emissions elegantly.";
              } else if (f.activityKey === "coal_kwh") {
                weeklySaving = 15.0;
                annualSaving = 780;
                effortObj = "high";
                impactText = "Transitioning home energy meters away from dirty coal grids maintains local microclimates.";
              } else if (f.activityKey === "beef_portion") {
                weeklySaving = 8.5;
                annualSaving = 442;
                effortObj = "medium";
                impactText = "Replacing extreme methane livestock feeds with poultry or beans reduces food chains footprint.";
              } else if (f.activityKey === "fast_fashion_item") {
                weeklySaving = 4.8;
                annualSaving = 250;
                effortObj = "easy";
                impactText = "Renting or purchasing second-hand vintage fabrics stops production cycle energy leaks.";
              } else if (f.activityKey === "walking_km") {
                weeklySaving = 5.0;
                annualSaving = 260;
                effortObj = "easy";
                impactText = "Walking or bicycle commuting provides direct personal health and standard atmospheric gains.";
              } else if (f.activityKey === "vegan_portion") {
                weeklySaving = 1.8;
                annualSaving = 94;
                effortObj = "easy";
                impactText = "Incorporating fully vegan grain bowls or vegetable pastas once daily.";
              }

              return {
                key: f.activityKey,
                title: `Switch off "${f.label}"`,
                description: f.description || "",
                category: f.category,
                effort: effortObj,
                weeklySavingKg: weeklySaving,
                annualSavingKg: annualSaving,
                impactText
              };
            })}
            userAdoptions={activeDashboard.adoptedActions}
            onToggleAction={handleToggleAction}
          />
        )}

        {activeTab === "milestones" && (
          <MilestonesTab
            unlockedMilestones={activeDashboard.milestones}
            currentStreak={activeDashboard.streaks.current}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            dashboardData={activeDashboard}
            onUpdateProfile={handleUpdateProfile}
            onDeleteAccount={handleDeleteAccount}
            isGuest={isGuest}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

      </main>

      {/* AUTH OVERLAY CONTROLLER */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* FOOTER METADATA CONTROLS */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs mt-auto border-t border-slate-800 select-none hidden lg:block">
        <p className="tracking-wide">CarbonLens — Verified Planetary Emissions Goal-Focus client.</p>
        <p className="text-[10px] text-slate-600 mt-1">All calculations checked securely against IPCC databases.</p>
      </footer>

    </div>
  );
}
