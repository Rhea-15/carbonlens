import { useState, useMemo } from "react";
import { 
  Bookmark, 
  CheckCircle2, 
  HelpCircle, 
  Leaf, 
  Badge, 
  Search, 
  ChevronRight, 
  Star,
  Compass,
  Check,
  Bike, 
  Zap, 
  ShoppingCart, 
  Plane,
  Coins,
  Lightbulb
} from "lucide-react";
import { ActionSwap, UserAction, CategoryType } from "../types";

interface ActionsLibraryTabProps {
  library: ActionSwap[];
  userAdoptions: UserAction[];
  onToggleAction: (actionKey: string, status: "bookmarked" | "adopted" | "removed") => Promise<void>;
}

export default function ActionsLibraryTab({
  library,
  userAdoptions,
  onToggleAction
}: ActionsLibraryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "all">("all");
  const [selectedEffort, setSelectedEffort] = useState<"all" | "easy" | "medium" | "high">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingKeys, setTogglingKeys] = useState<Record<string, boolean>>({});

  // Quick categories helper
  const categoriesList = [
    { key: "all", name: "All", icon: Compass, color: "text-slate-500", bg: "bg-slate-55" },
    { key: "transport" as CategoryType, name: "Transport", icon: Bike, color: "text-blue-550", bg: "bg-blue-50" },
    { key: "food" as CategoryType, name: "Food", icon: Leaf, color: "text-emerald-550", bg: "bg-emerald-50" },
    { key: "energy" as CategoryType, name: "Energy", icon: Zap, color: "text-amber-550", bg: "bg-amber-50" },
    { key: "shopping" as CategoryType, name: "Shopping", icon: ShoppingCart, color: "text-indigo-550", bg: "bg-indigo-50" },
    { key: "flight" as CategoryType, name: "Flights", icon: Plane, color: "text-purple-550", bg: "bg-purple-50" },
  ];

  // Adoptions map lookup
  const adoptionsMap = useMemo(() => {
    const map: Record<string, "bookmarked" | "adopted"> = {};
    userAdoptions.forEach((a) => {
      map[a.actionKey] = a.status;
    });
    return map;
  }, [userAdoptions]);

  // Compute live cumulative projected savings (F6)
  const cumulativeSavings = useMemo(() => {
    let weekly = 0;
    let annual = 0;
    userAdoptions.forEach(ua => {
      if (ua.status === "adopted") {
        const item = library.find(l => l.key === ua.actionKey);
        if (item) {
          weekly += item.weeklySavingKg;
          annual += item.annualSavingKg;
        }
      }
    });

    return {
      weekly: Number(weekly.toFixed(1)),
      annual: Number(annual.toFixed(0))
    };
  }, [library, userAdoptions]);

  // Filter actions listing
  const filteredSwaps = useMemo(() => {
    return library.filter((sa) => {
      const matchCat = selectedCategory === "all" || sa.category === selectedCategory;
      const matchEffort = selectedEffort === "all" || sa.effort === selectedEffort;
      const matchSearch = sa.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sa.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchEffort && matchSearch;
    });
  }, [library, selectedCategory, selectedEffort, searchTerm]);

  const handleActionClick = async (actionKey: string, targetStatus: "bookmarked" | "adopted" | "removed") => {
    setTogglingKeys(prev => ({ ...prev, [actionKey]: true }));
    try {
      await onToggleAction(actionKey, targetStatus);
    } catch (e) {
      console.error("Failed toggle action state:", e);
    } finally {
      setTogglingKeys(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "medium": return "bg-amber-50 text-amber-600 border-amber-100";
      case "high": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-500";
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "food": return "text-emerald-500 bg-emerald-50";
      case "transport": return "text-blue-500 bg-blue-50";
      case "energy": return "text-amber-500 bg-amber-50";
      case "shopping": return "text-indigo-500 bg-indigo-50";
      case "flight": return "text-purple-500 bg-purple-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  return (
    <div id="actions_library_subview" className="space-y-6">
      
      {/* SAVINGS CUMULATIVE BOARD (F6Adopted actions feed into projected reduction metric) */}
      <div id="projected_savings_summary_card" className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-6 shadow-xl text-left relative overflow-hidden">
        {/* Backdrop green ambient glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-55 rounded-full blur-3xl -translate-y-6 translate-x-6 opacity-30 select-none pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Habitation Progress Outlook</span>
            <h2 className="text-2xl font-bold tracking-tight mt-1">Projected Sustainable Reduction Output</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Mark actions as <strong className="text-emerald-300">"Adopted"</strong> when you integrate them into daily habits to forecast and log annual carbon offsets.
            </p>
          </div>

          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Weekly projected savings</span>
              <div className="font-mono text-2xl font-black text-emerald-400 mt-0.5">
                -{cumulativeSavings.weekly} <span className="text-xs font-medium">kgCO₂e</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-center">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider">Yearly projected savings</span>
              <div className="font-mono text-2xl font-black text-emerald-400 mt-0.5">
                -{cumulativeSavings.annual} <span className="text-xs font-medium">kgCO₂e</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERING BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center frosted-glass-card rounded-[24px] p-4 text-left">
        
        {/* Search bar input */}
        <div className="md:col-span-2 relative text-left">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            id="library_search_input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sustainable catalog swaps..."
            className="w-full frosted-glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none"
          />
        </div>

        {/* Effort level filter */}
        <div className="flex items-center gap-1.5 justify-end md:col-span-2">
          <span className="text-xs font-bold text-slate-500 font-sans">Effort Level:</span>
          <div className="grid grid-cols-4 p-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/45 text-xs w-full max-w-xs select-none">
            {["all", "easy", "medium", "high"].map((eff) => (
              <button
                key={eff}
                id={`effort_filter_btn_${eff}`}
                onClick={() => setSelectedEffort(eff as any)}
                className={`py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-all ${
                  selectedEffort === eff 
                    ? "bg-white/60 border border-white/80 text-emerald-950 shadow-xs" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/25"
                }`}
              >
                {eff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY SELECTOR SLIDER */}
      <div className="flex gap-2 p-1 overflow-x-auto select-none no-scrollbar">
        {categoriesList.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              id={`category_filter_btn_${cat.key}`}
              onClick={() => setSelectedCategory(cat.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? "bg-emerald-600 border-transparent text-white shadow-md shadow-emerald-250" 
                  : "bg-white/35 border-white/50 text-slate-600 hover:bg-white/55 hover:text-slate-800"
              }`}
            >
              <CatIcon className="w-4 h-4" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* SWAPS GRID (50+ curated items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSwaps.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Search className="w-10 h-10 text-slate-350 mx-auto" />
            <h4 className="text-slate-700 font-bold text-xs mt-3">No matching actions found</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Consider altering your search spelling or resetting active filter constraints to browse more swaps.
            </p>
          </div>
        ) : (
          filteredSwaps.map((sa) => {
            const status = adoptionsMap[sa.key]; // 'bookmarked', 'adopted', or undefined
            const isToggling = togglingKeys[sa.key];

            return (
              <div 
                key={sa.key} 
                id={`swap_item_card_${sa.key}`}
                className={`frosted-glass-card rounded-[32px] transition-all text-left flex flex-col justify-between overflow-hidden relative ${
                  status === "adopted" 
                    ? "border-emerald-500/50 ring-2 ring-emerald-450/10 bg-emerald-50/20 shadow-md shadow-emerald-500/5" 
                    : ""
                }`}
              >
                {/* Visual Category tag overhead */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md ${getCategoryTheme(sa.category)}`}>
                      {sa.category}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEffortColor(sa.effort)}`}>
                      {sa.effort}
                    </span>
                  </div>

                  <div>
                    <h3 id={`swap_title_${sa.key}`} className="font-extrabold text-sm text-slate-800 leading-snug">
                      {sa.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 font-sans">
                      {sa.description}
                    </p>
                  </div>

                  <div className="bg-white/20 p-2.5 rounded-xl border border-white/35 text-[10px] text-slate-650 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{sa.impactText}</span>
                  </div>
                </div>

                {/* Footprint Saving indicator rows */}
                <div className="px-5 py-3.5 bg-white/20 border-t border-white/35 flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <div>
                    Weekly Saving: <span className="font-bold text-emerald-600 block text-xs">-{sa.weeklySavingKg} kg</span>
                  </div>
                  <div className="text-right">
                    Annual Saving: <span className="font-bold text-slate-800 block text-xs">-{sa.annualSavingKg} kg</span>
                  </div>
                </div>

                {/* Interactions footer buttons */}
                <div className="p-4 bg-white/25 border-t border-white/35 grid grid-cols-2 gap-2 relative">
                  {status === "adopted" ? (
                    <button
                      id={`btn_abandon_action_${sa.key}`}
                      disabled={isToggling}
                      onClick={() => handleActionClick(sa.key, "removed")}
                      className="col-span-full py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100/60 cursor-pointer disabled:opacity-50 select-none animate-pulse-once"
                    >
                      <Check className="w-4 h-4" />
                      Adopted Habit (Reset)
                    </button>
                  ) : (
                    <>
                      {/* Bookmark button */}
                      <button
                        id={`btn_bookmark_action_${sa.key}`}
                        disabled={isToggling}
                        onClick={() => handleActionClick(sa.key, status === "bookmarked" ? "removed" : "bookmarked")}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 leading-none select-none ${
                          status === "bookmarked"
                            ? "bg-amber-100/60 border-amber-300 text-amber-700 font-bold"
                            : "bg-white/40 border-white/50 text-slate-600 hover:bg-white/60"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${status === "bookmarked" ? "fill-amber-500 text-amber-600" : ""}`} />
                        {status === "bookmarked" ? "Bookmarked" : "Save Choice"}
                      </button>

                      {/* Adopt button */}
                      <button
                        id={`btn_adopt_action_${sa.key}`}
                        disabled={isToggling}
                        onClick={() => handleActionClick(sa.key, "adopted")}
                        className="py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 leading-none select-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Adopt Swap
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
