import { useState, useMemo, FormEvent } from "react";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  HelpCircle, 
  Compass, 
  MapPin, 
  ExternalLink,
  Flame, 
  TrendingDown, 
  Scale, 
  Search,
  CheckCircle,
  X,
  PlusCircle, 
  Bike, 
  Leaf, 
  Zap, 
  ShoppingCart, 
  Plane,
  ClipboardList,
  Activity,
  BarChart3
} from "lucide-react";
import { ActivityLog, EmissionFactor, CategoryType } from "../types";

interface DashboardHomeProps {
  todayLoggedKg: number;
  dailyBudgetKg: number;
  streaks: {
    current: number;
    longest: number;
    isUnderBudgetToday: boolean;
  };
  recentLogs: ActivityLog[];
  factors: EmissionFactor[];
  onAddLog: (factorId: number, quantity: number, note: string) => Promise<void>;
  onDeleteLog: (logId: string) => Promise<void>;
  isGuest: boolean;
  onOpenAuth: () => void;
}

export default function DashboardHome({
  todayLoggedKg,
  dailyBudgetKg,
  streaks,
  recentLogs,
  factors,
  onAddLog,
  onDeleteLog,
  isGuest,
  onOpenAuth
}: DashboardHomeProps) {
  const [isOpenLogModal, setIsOpenLogModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("transport");
  const [selectedFactorId, setSelectedFactorId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Controls tooltips
  const [showTooltip, setShowTooltip] = useState(false);

  // Frequent Quick Adds state variables
  const [shortcuts, setShortcuts] = useState<any[]>(() => {
    const stored = localStorage.getItem(`carbonlens_shortcuts_${isGuest ? "guest" : "member"}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn("Could not load saved shortcuts.");
      }
    }
    // Return gorgeous pre-seeded shortcuts by default
    return [
      { id: "s1", label: "Daily Commute", activityKey: "car_petrol_km", category: "transport", quantity: 15, note: "Routine commute", factorId: 1 },
      { id: "s2", label: "Vegetarian Lunch", activityKey: "vegan_portion", category: "food", quantity: 1, note: "Eco-friendly lunch", factorId: 14 },
      { id: "s3", label: "Quick Cycle", activityKey: "walking_km", category: "transport", quantity: 5, note: "Zero emissions travel", factorId: 5 },
      { id: "s4", label: "Eco Wash", activityKey: "solar_kwh", category: "energy", quantity: 2, note: "Renewable energy wash", factorId: 21 }
    ];
  });

  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [isManagingShortcuts, setIsManagingShortcuts] = useState(false);

  // Form state for custom shortcut
  const [newShortcutLabel, setNewShortcutLabel] = useState("");
  const [newShortcutCategory, setNewShortcutCategory] = useState<CategoryType>("transport");
  const [newShortcutFactorId, setNewShortcutFactorId] = useState<number | "">("");
  const [newShortcutQuantity, setNewShortcutQuantity] = useState("");
  const [newShortcutNote, setNewShortcutNote] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hotloggingId, setHotloggingId] = useState<string | null>(null);

  // Filter factors for custom shortcut
  const customShortcutFactorsList = useMemo(() => {
    return factors.filter(f => f.category === newShortcutCategory);
  }, [factors, newShortcutCategory]);

  const handleShortcutClick = async (shortcut: any) => {
    if (isManagingShortcuts) {
      // In delete mode, clicking deletes the shortcut
      const updated = shortcuts.filter(s => s.id !== shortcut.id);
      setShortcuts(updated);
      localStorage.setItem(`carbonlens_shortcuts_${isGuest ? "guest" : "member"}`, JSON.stringify(updated));
      setToastMessage(`Preset "${shortcut.label}" deleted.`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    // Otherwise, fast-log it with one-tap
    setHotloggingId(shortcut.id);
    setToastMessage(null);

    // Dynamic resolution of factor in case lists shifted, matching exact custom factor select ID first, fallback search on key
    let factor = factors.find(f => f.id === shortcut.factorId);
    if (!factor && shortcut.activityKey) {
      factor = factors.find(f => f.activityKey === shortcut.activityKey);
    }
    if (!factor) {
      factor = factors.find(f => f.category === shortcut.category) || factors[0];
    }

    if (!factor) {
      setToastMessage("Error: Could not find matching emission factor in catalog.");
      setHotloggingId(null);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    try {
      await onAddLog(factor.id, shortcut.quantity, shortcut.note || `Preset: ${shortcut.label}`);
      setToastMessage(`Logged successfully: ${shortcut.label} (+${(shortcut.quantity * factor.factorKg).toFixed(1)} kg CO₂e)`);
    } catch (err: any) {
      setToastMessage(`Failed to log preset: ${err.message || "Unknown error"}`);
    } finally {
      setHotloggingId(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Categories helper list
  const categoriesList = [
    { key: "transport" as CategoryType, name: "Transport", icon: Bike, color: "text-blue-500", bg: "bg-blue-50" },
    { key: "food" as CategoryType, name: "Food", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50" },
    { key: "energy" as CategoryType, name: "Energy", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { key: "shopping" as CategoryType, name: "Shopping", icon: ShoppingCart, color: "text-indigo-500", bg: "bg-indigo-50" },
    { key: "flight" as CategoryType, name: "Flights", icon: Plane, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  // Filter factors list based on category and search
  const filteredFactors = useMemo(() => {
    return factors.filter(f => {
      const matchCat = f.category === selectedCategory;
      const matchSearch = f.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [factors, selectedCategory, searchTerm]);

  const selectedFactorDetail = useMemo(() => {
    return factors.find(f => f.id === Number(selectedFactorId));
  }, [factors, selectedFactorId]);

  // Instant emission calculation preview
  const previewEmissionKg = useMemo(() => {
    const qtyVal = parseFloat(quantity);
    if (!selectedFactorDetail || isNaN(qtyVal) || qtyVal <= 0) return 0;
    // Basic calculation (household share math handles on backend, but let's provide client side proportional preview)
    return parseFloat((qtyVal * selectedFactorDetail.factorKg).toFixed(2));
  }, [selectedFactorDetail, quantity]);

  const handleOpenLogModal = () => {
    // Reset inputs
    setSearchTerm("");
    setSelectedCategory("transport");
    setSelectedFactorId("");
    setQuantity("");
    setNote("");
    setError("");
    setIsOpenLogModal(true);
  };

  const handleCreateLog = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFactorId || !quantity || parseFloat(quantity) <= 0) {
      setError("Please select an activity and enter a valid positive quantity.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onAddLog(Number(selectedFactorId), parseFloat(quantity), note);
      setIsOpenLogModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to commit log.");
    } finally {
      setSubmitting(false);
    }
  };

  // SVG Circular Budget Math
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, (todayLoggedKg / dailyBudgetKg) * 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isOverBudget = todayLoggedKg > dailyBudgetKg;
  const overageKg = todayLoggedKg - dailyBudgetKg;

  // Personalized Offset / Mitigate dynamic calculations
  const offsetAdvice = useMemo(() => {
    if (!isOverBudget) return null;
    const petrolKmEquivalent = Math.round(overageKg / 0.170); // 0.17 kg per km
    const beefBurgerEquivalent = Math.round(overageKg / 7.500); // beef burger portion
    const solarPowerEquivalent = Math.round(overageKg / 0.450); // mixed grid electricity saving per kWh
    return {
      petrolKmEquivalent,
      beefBurgerEquivalent,
      solarPowerEquivalent,
      weeksOfTreeGrowth: Math.ceil(overageKg / 0.4) // A seedling grows ~0.4kg CO2 uptake per week
    };
  }, [isOverBudget, overageKg]);

  return (
    <div id="dashboard_home_subview" className="space-y-6">
      
      {/* Guest Mode alert banner */}
      {isGuest && (
        <div id="guest_banner" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md shadow-emerald-100 text-left">
          <div className="flex items-center gap-3">
            <Leaf className="w-5 h-5 text-emerald-105 animate-pulse shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Running in Guest Mode</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Your footprints are cached locally in live memory. Register an account to trigger AI analysis and preserve histories.
              </p>
            </div>
          </div>
          <button
            id="guest_auth_trigger"
            onClick={onOpenAuth}
            className="bg-white text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Create Permanent Account
          </button>
        </div>
      )}

      {/* Top Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BUDGET RING CARD */}
        <div id="budget_ring_card" className="md:col-span-2 frosted-glass-card rounded-[32px] p-6 relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-left space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Today's Footprint</span>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">Daily Carbon Budget</h2>
              <p className="text-sm text-slate-500 mt-0.5 font-sans">
                Stay climate-positive by keeping your emissions restricted below <strong className="text-slate-700 font-bold">{dailyBudgetKg} kg</strong> per day.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-3xl font-extrabold font-mono text-slate-800">{todayLoggedKg.toFixed(2)}</span>
                <span className="text-sm font-medium text-slate-400 ml-1">kg CO₂e logged</span>
              </div>
              <div className="w-px h-8 bg-white/40" />
              <div>
                <span className="text-sm text-slate-400 block font-medium">State status</span>
                {isOverBudget ? (
                  <span id="budget_alert_badge" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100/50 text-red-600 rounded-full text-xs font-bold mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Over Budget
                  </span>
                ) : (
                  <span id="budget_ok_badge" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/40 text-emerald-600 rounded-full text-xs font-bold mt-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Under Budget
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SVG Ring structure */}
          <div className="relative flex items-center justify-center w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Underlay tracking circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
                stroke="rgba(255, 255, 255, 0.3)"
                fill="none"
              />
              {/* Highlight active progress track */}
              <circle
                id="svg_progress_circle"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={strokeWidth}
                stroke={isOverBudget ? "#ef4444" : "#059669"}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black font-sans text-slate-800">{Math.round(percentage)}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">of daily limit</span>
            </div>
          </div>

          {/* Offset Warning Block (F3 Overage shown in red with a "what could offset this" tooltip) */}
          {isOverBudget && offsetAdvice && (
            <div className="absolute bottom-3 right-3">
              <button
                id="offset_tooltip_btn"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-red-100/40 text-red-600 hover:bg-red-100/60 transition-all cursor-pointer border border-red-200/30"
              >
                <HelpCircle className="w-4 h-4 mr-1 animate-pulse" />
                <span className="text-xs font-bold">Offset Advice</span>
              </button>

              {showTooltip && (
                <div id="offset_tooltip_box" className="absolute bottom-10 right-0 w-72 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl z-20 text-xs text-left border border-white/10 space-y-2">
                  <h4 className="font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> What offsets this {overageKg.toFixed(1)}kg overage?
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Your logs currently exceed the daily environmental threshold. To mitigate today's overage, you can:
                  </p>
                  <ul className="space-y-1 text-slate-200 text-[11px] list-disc list-inside">
                    <li>Avoid driving a car for <strong className="text-white">{offsetAdvice.petrolKmEquivalent} km</strong>.</li>
                    <li>Avoid eating <strong className="text-white">{offsetAdvice.beefBurgerEquivalent} beef dishes</strong> next week.</li>
                    <li>Save <strong className="text-white">{offsetAdvice.solarPowerEquivalent} kWh</strong> of grid electricity.</li>
                    <li>Grow a domestic plant/tree seedling for <strong className="text-white">{offsetAdvice.weeksOfTreeGrowth} weeks</strong>.</li>
                  </ul>
                  <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                    Calculations sourced from IPCC impact metrics.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STREAKS & SUMMARY CARD */}
        <div id="streaks_card" className="frosted-glass-card rounded-[32px] p-6 text-left flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-orange-200/30 rounded-full blur-2xl -z-10" />
          
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Habit Consistency</span>
            <h3 className="text-lg font-bold text-slate-800 mt-1">Streaks & Budget Consistency</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conclude days under limit to build badging milestones.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-200/20">
              <span className="text-xs text-slate-500 block">Current Streak</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                <span id="label_current_streak" className="text-2xl font-extrabold font-mono text-slate-800">
                  {streaks.current}
                </span>
                <span className="text-xs text-slate-400">days</span>
              </div>
            </div>

            <div className="p-3 bg-white/20 rounded-xl border border-white/40">
              <span className="text-xs text-slate-500 block">Longest Milestone</span>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
                <span id="label_longest_streak" className="text-2xl font-extrabold font-mono text-slate-800">
                  {streaks.longest}
                </span>
                <span className="text-xs text-slate-400">days</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-1 bg-white/20 p-2.5 rounded-xl border border-white/30">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Target 1.5°C Global pathways require ~38.5kg/week limits.</span>
          </div>
        </div>
      </div>

      {/* SAVED QUICK ADDS SHORTCUTS PANEL */}
      <div id="quick_shortcuts_panel" className="frosted-glass-card rounded-[32px] p-6 text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">⚡ Instant Action Shortcuts</span>
            <h3 className="text-base font-extrabold text-slate-800">Quick Add Presets</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Log repeating routine habits with a single tap. Typical quantities preset below.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn_toggle_add_shortcut"
              onClick={() => {
                setIsAddingShortcut(!isAddingShortcut);
                setIsManagingShortcuts(false);
                // Reset form
                setNewShortcutLabel("");
                setNewShortcutCategory("transport");
                setNewShortcutFactorId("");
                setNewShortcutQuantity("");
                setNewShortcutNote("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/40 ${
                isAddingShortcut ? "bg-slate-800 text-white" : "bg-white/40 hover:bg-white/60 text-slate-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingShortcut ? "Close Form" : "Create Preset"}
            </button>
            <button
              id="btn_toggle_manage_shortcuts"
              onClick={() => {
                setIsManagingShortcuts(!isManagingShortcuts);
                setIsAddingShortcut(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/40 ${
                isManagingShortcuts ? "bg-red-600 text-white font-bold" : "bg-white/40 hover:bg-white/60 text-slate-700"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isManagingShortcuts ? "Finish Deleting" : "Delete Shortcuts"}
            </button>
          </div>
        </div>

        {/* Success / Error notification */}
        {toastMessage && (
          <div id="shortcuts_toast_alert" className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </div>
        )}

        {/* Custom Preset Form */}
        {isAddingShortcut && (
          <div id="new_shortcut_form_container" className="bg-white/45 p-4 rounded-2xl border border-white/60 space-y-4 text-left">
            <h4 className="text-xs font-black uppercase text-slate-700 font-mono">Setup repeating routine activity shortcut</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Shortcut Label */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Shortcut Name</label>
                <input
                  id="shortcut_label_input"
                  type="text"
                  required
                  placeholder="e.g. Daily Commute, Vegan Bowl"
                  value={newShortcutLabel}
                  onChange={(e) => setNewShortcutLabel(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-2.5 py-2 text-xs outline-none focus:bg-white transition-all text-slate-850"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                <select
                  id="shortcut_category_select"
                  value={newShortcutCategory}
                  onChange={(e) => {
                    setNewShortcutCategory(e.target.value as CategoryType);
                    setNewShortcutFactorId("");
                  }}
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-2.5 py-2 text-xs outline-none focus:bg-white text-slate-800"
                >
                  <option value="transport">Transport</option>
                  <option value="food">Food</option>
                  <option value="energy">Energy</option>
                  <option value="shopping">Shopping</option>
                  <option value="flight">Flights</option>
                </select>
              </div>

              {/* Factor Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Carbon Activity</label>
                <select
                  id="shortcut_factor_select"
                  required
                  value={newShortcutFactorId}
                  onChange={(e) => setNewShortcutFactorId(Number(e.target.value))}
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-2.5 py-2 text-xs outline-none focus:bg-white text-slate-800"
                >
                  <option value="">-- Choose activity --</option>
                  {customShortcutFactorsList.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Typical Quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Typical Qty {newShortcutFactorId ? `(${factors.find(f => f.id === newShortcutFactorId)?.unit})` : ""}
                </label>
                <input
                  id="shortcut_quantity_input"
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  placeholder="e.g. 15, 1"
                  value={newShortcutQuantity}
                  onChange={(e) => setNewShortcutQuantity(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-2.5 py-2 text-xs outline-none focus:bg-white transition-all text-slate-800"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end pt-1">
              <div className="space-y-1 sm:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preset Custom Note (Optional)</label>
                <input
                  id="shortcut_note_input"
                  type="text"
                  placeholder="e.g. Standard commuting route, eco-friendly diet swap..."
                  value={newShortcutNote}
                  onChange={(e) => setNewShortcutNote(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-xl px-2.5 py-2 text-xs outline-none focus:bg-white transition-all text-slate-800"
                />
              </div>
              <button
                id="btn_save_new_shortcut"
                type="button"
                onClick={() => {
                  if (!newShortcutLabel.trim()) {
                    alert("Please enter a shortcut name.");
                    return;
                  }
                  if (!newShortcutFactorId) {
                    alert("Please select a carbon activity.");
                    return;
                  }
                  const qtyVal = parseFloat(newShortcutQuantity);
                  if (isNaN(qtyVal) || qtyVal <= 0) {
                    alert("Please enter a valid positive quantity.");
                    return;
                  }

                  const selectedFactorObj = factors.find(f => f.id === Number(newShortcutFactorId));
                  const newShortcut = {
                    id: "sc_" + Date.now() + "_" + Math.floor(Math.random() * 100),
                    label: newShortcutLabel.trim(),
                    factorId: Number(newShortcutFactorId),
                    activityKey: selectedFactorObj ? selectedFactorObj.activityKey : "",
                    category: newShortcutCategory,
                    quantity: qtyVal,
                    note: newShortcutNote.trim() || undefined
                  };

                  const updatedShortcuts = [...shortcuts, newShortcut];
                  setShortcuts(updatedShortcuts);
                  localStorage.setItem(`carbonlens_shortcuts_${isGuest ? "guest" : "member"}`, JSON.stringify(updatedShortcuts));
                  
                  setIsAddingShortcut(false);
                  setToastMessage(`Preset "${newShortcut.label}" saved.`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
              >
                Save Preset
              </button>
            </div>
          </div>
        )}

        {/* Shortcuts Buttons row listing */}
        {shortcuts.length === 0 ? (
          <div id="no_shortcuts_notification" className="text-center p-6 text-xs text-slate-400 bg-white/10 rounded-2xl border border-dashed border-white/25">
            No active presets. Click "+ Create Preset" to custom configure frequent habits for fast tracking.
          </div>
        ) : (
          <div id="shortcuts_grid_flow" className="flex flex-wrap items-center gap-3">
            {shortcuts.map((s) => {
              const matchedCategoryItem = categoriesList.find(c => c.key === s.category);
              const ShortcutIcon = matchedCategoryItem ? matchedCategoryItem.icon : Compass;
              const isHotLogging = hotloggingId === s.id;
              
              return (
                <button
                  key={s.id}
                  id={`shortcut_interactive_btn_${s.id}`}
                  onClick={() => handleShortcutClick(s)}
                  disabled={!!hotloggingId}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition-all hover:scale-[1.03] select-none cursor-pointer relative ${
                    isManagingShortcuts 
                      ? "border-red-350 bg-red-50/50 hover:bg-red-100/50 text-red-600 animate-pulse cursor-pointer" 
                      : isHotLogging 
                        ? "bg-slate-800 border-transparent text-white"
                        : "bg-white/45 border-white/60 text-slate-700 hover:bg-white/70 active:scale-95 hover:shadow-xs"
                  }`}
                  title={isManagingShortcuts ? `Remove preset: ${s.label}` : `Log instantly: ${s.label} (${s.quantity})`}
                >
                  {isHotLogging ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                  ) : isManagingShortcuts ? (
                    <span className="text-[12px] font-bold text-red-650 mr-0.5">✖</span>
                  ) : (
                    <ShortcutIcon className={`w-4 h-4 ${matchedCategoryItem?.color || "text-emerald-600"}`} />
                  )}
                  <div className="text-left leading-tight">
                    <span className="block font-extrabold">{s.label}</span>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">
                      {s.quantity} {factors.find(f => f.id === s.factorId)?.unit || ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK LOG CTA TRIGGER */}
      <div className="flex items-center justify-between pt-4 border-b border-slate-100">
        <h3 className="text-lg font-bold font-sans text-slate-800">Activity Logs</h3>
        <button
          id="trigger_quick_log_btn"
          onClick={handleOpenLogModal}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer shadow-md shadow-slate-200 active:scale-95"
        >
          <Plus className="w-4 h-4 animate-spin-reverse" />
          Log Carbon Activity
        </button>
      </div>

      {/* RECENT LOGS GRID LISTING */}
      {recentLogs.length === 0 ? (
        <div id="no_logs_fallback" className="frosted-glass-card rounded-[32px] p-12 text-center max-w-md mx-auto">
          <ClipboardList className="w-12 h-12 text-slate-305 mx-auto" />
          <h4 className="text-slate-700 font-bold mt-3">No emissions logged today</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Choose "Log Carbon Activity" to record a journey or diet meal and see physical impact measurements.
          </p>
        </div>
      ) : (
        <div className="frosted-glass-card rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/35 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/40">
                  <th className="px-4 md:px-6 py-3">Activity</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Logged At</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Category</th>
                  <th className="px-6 py-3 hidden md:table-cell" align="right">Quantity</th>
                  <th className="px-4 md:px-6 py-3 text-right" align="right">CO₂ Equivalent</th>
                  <th className="px-6 py-3 hidden lg:table-cell">Notes</th>
                  <th className="px-4 md:px-6 py-3 text-center" align="center">Purge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((l) => {
                  const labelItem = categoriesList.find(c => c.key === l.activityCategory);
                  const IconComp = labelItem ? labelItem.icon : Bike;
                  return (
                    <tr key={l.id} id={`log_row_${l.id}`} className="hover:bg-slate-50/50 transition-all text-xs text-slate-600">
                      <td className="px-4 md:px-6 py-4 font-bold text-slate-700">
                        <span className="block leading-tight">{l.activityLabel}</span>
                        <span className="block sm:hidden text-[10px] text-slate-400 font-normal font-sans mt-1 whitespace-nowrap">
                          {new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className="capitalize">{l.activityCategory}</span> • {l.quantity} units
                        </span>
                        {l.note && (
                          <span className="block lg:hidden text-[10px] text-slate-400 font-normal italic mt-0.5 max-w-[200px] truncate">
                            &ldquo;{l.note}&rdquo;
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[11px] font-mono text-slate-400 hidden sm:table-cell">
                        {new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[9px] text-slate-300">
                          {new Date(l.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${labelItem?.bg || "bg-slate-100"} ${labelItem?.color || "text-slate-500"}`}>
                          <IconComp className="w-3 h-3" />
                          {l.activityCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-500 whitespace-nowrap hidden md:table-cell" align="right">
                        {l.quantity}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right" align="right">
                        <span className="font-mono font-bold text-red-500">+{l.emissionKg.toFixed(2)} kg</span>
                      </td>
                      <td className="px-6 py-4 italic text-slate-400 max-w-xs truncate hidden lg:table-cell">
                        {l.note || "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3 whitespace-nowrap text-center" align="center">
                        <button
                           id={`btn_delete_log_${l.id}`}
                           onClick={() => onDeleteLog(l.id)}
                           className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer inline-flex items-center justify-center"
                           title="Purge activity log"
                         >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK LOG LAYOVER DRAWER / DIALOG */}
      {isOpenLogModal && (
        <div id="quick_log_backdrop" className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="quick_log_box" className="w-full max-w-lg bg-white/75 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">Add Carbon Log Activity</h3>
              </div>
              <button 
                id="quick_log_close"
                onClick={() => setIsOpenLogModal(false)}
                className="p-1 text-slate-500 hover:bg-white/40 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form Scrollable */}
            <form onSubmit={handleCreateLog} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
              {error && (
                <div className="p-3 bg-red-100/40 border border-red-200/20 text-red-600 rounded-xl text-xs font-semibold">
                  ⚠️ {error}
                </div>
              )}

              {/* F2: User picks a category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {categoriesList.map((c) => {
                    const CatIcon = c.icon;
                    const isActive = selectedCategory === c.key;
                    return (
                      <button
                        key={c.key}
                        id={`category_tab_btn_${c.key}`}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(c.key);
                          setSelectedFactorId(""); // Clear active item
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                          isActive 
                            ? "bg-emerald-600 border-transparent text-white shadow-md shadow-emerald-200/50" 
                            : "bg-white/35 border-white/50 text-slate-600 hover:bg-white/55"
                        }`}
                      >
                        <CatIcon className="w-5 h-5" />
                        <span className="text-[10px] font-bold tracking-tight uppercase">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search activity items under active category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search & Select Activity</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="activity_search_bar"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type to filter e.g. SUV, Egg, Solar..."
                    className="w-full bg-white/40 border border-white/50 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-slate-400 focus:bg-white/80 outline-none"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-white/40 rounded-xl divide-y divide-white/20 bg-white/25 pr-1 select_list">
                  {filteredFactors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No matching activities found in this catalog segment.
                    </div>
                  ) : (
                    filteredFactors.map((f) => (
                      <button
                        key={f.id}
                        id={`factor_select_row_${f.id}`}
                        type="button"
                        onClick={() => setSelectedFactorId(f.id)}
                        className={`w-full text-left p-2.5 transition-all text-xs flex justify-between items-start cursor-pointer ${
                          selectedFactorId === f.id ? "bg-slate-900 text-white" : "hover:bg-white/30 text-slate-700"
                        }`}
                      >
                        <div>
                          <strong className="block font-semibold">{f.label}</strong>
                          <span className={`${selectedFactorId === f.id ? "text-slate-350" : "text-slate-500"} text-[10px] block mt-0.5`}>
                            {f.description}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4 font-mono font-bold text-[10px]">
                          {f.factorKg.toFixed(3)} kgCO₂e per {f.unit}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* F2: Enters quantity, outputs instant Co2 preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quantity {selectedFactorDetail ? `(${selectedFactorDetail.unit})` : ""}
                  </label>
                  <input
                    id="log_quantity_input"
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 15, 2.5, 90"
                    className="w-full bg-white/40 border border-white/50 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Carbon Estimate</label>
                  <div className="bg-red-150/20 p-2.5 rounded-xl border border-red-150/10 flex flex-col justify-center h-[42px]">
                    <span id="label_instant_preview" className="font-mono font-extrabold text-red-500 text-sm">
                      +{previewEmissionKg.toFixed(2)} kg CO₂e
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">Notes / Journal log</label>
                <input
                  id="log_note_input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Morning commute to sector office, vegetarian cheese pasta lunch..."
                  className="w-full bg-white/40 border border-white/50 rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-slate-400 focus:bg-white outline-none transition-all"
                />
              </div>

              {/* F3 Budget bar preview update feedback */}
              {selectedFactorDetail && previewEmissionKg > 0 && (
                <div className="p-3.5 bg-white/20 rounded-xl border border-white/30 flex items-start gap-3">
                  <Activity className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed text-slate-600">
                    This log will fill <strong className="text-slate-800 font-bold">{Math.round((previewEmissionKg / dailyBudgetKg) * 100)}%</strong> of your daily standard carbon limits budget.
                  </div>
                </div>
              )}

              {/* Action Submit */}
              <button
                id="log_confirm_btn"
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer shadow-lg shadow-slate-100 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm & Publish Log
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
