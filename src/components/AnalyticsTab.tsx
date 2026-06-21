import { useState } from "react";
import { 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  TrendingDown, 
  Zap,
  Flame,
  LayoutGrid, 
  AlertCircle,
  PieChart as PieIcon,
  BarChart2,
  Car,
  ShoppingCart,
  Plane,
  Leaf,
  Apple,
  Lightbulb
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { CategoryType, AIInsight, DashboardData } from "../types";

interface AnalyticsTabProps {
  dashboardData: DashboardData;
  onRefreshInsight: () => Promise<void>;
  isGuest: boolean;
}

export default function AnalyticsTab({
  dashboardData,
  onRefreshInsight,
  isGuest
}: AnalyticsTabProps) {
  const [generating, setGenerating] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");

  const summary = dashboardData.weeklySummary;
  const categories = summary.byCategory;

  // Convert categories object to chart data
  const pieChartData = [
    { name: "Transport", value: categories.transport || 0, color: "#3b82f6", key: "transport" },
    { name: "Food", value: categories.food || 0, color: "#10b981", key: "food" },
    { name: "Energy", value: categories.energy || 0, color: "#f59e0b", key: "energy" },
    { name: "Shopping", value: categories.shopping || 0, color: "#6366f1", key: "shopping" },
    { name: "Flights", value: categories.flight || 0, color: "#a855f7", key: "flight" },
  ].filter(item => item.value > 0);

  // Fallback for empty pie chart
  const hasEmissions = pieChartData.length > 0;
  const fallbackPieData = [
    { name: "No Logs Recorded Yet", value: 1, color: "#e2e8f0", key: "empty" }
  ];

  // Past 7 Days daily aggregate bar data
  const past7DaysData = () => {
    const arr = [];
    const logs = dashboardData.recentLogs || [];
    
    // Group logs by YYYY-MM-DD
    const dailyExpenses: Record<string, number> = {};
    logs.forEach(l => {
      const dateStr = l.loggedAt.substring(0, 10);
      dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + l.emissionKg;
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
      const val = dailyExpenses[dateStr] ?? 0;
      arr.push({
        day: dayLabel,
        "Emission (kg)": Number(val.toFixed(2)),
        "Budget Limit": dashboardData.dailyBudgetKg
      });
    }
    return arr;
  };

  const barChartData = past7DaysData();

  const handleTriggerInsight = async () => {
    if (isGuest) {
      setErrorLocal("Gemini AI analytical engines require persistent saved structures. Please register to generate insights.");
      return;
    }
    setGenerating(true);
    setErrorLocal("");
    try {
      await onRefreshInsight();
    } catch (err: any) {
      setErrorLocal(err.message || "Failed to trigger AI insight card synthesis.");
    } finally {
      setGenerating(false);
    }
  };

  // Category Focus display matching details
  const insightDesign = (category?: CategoryType) => {
    switch (category) {
      case "food":
        return { border: "border-emerald-200", bg: "bg-emerald-50/40", badgeBg: "bg-emerald-100 text-emerald-800", icon: Apple };
      case "transport":
        return { border: "border-blue-200", bg: "bg-blue-50/40", badgeBg: "bg-blue-100 text-blue-800", icon: Car };
      case "energy":
        return { border: "border-amber-200", bg: "bg-amber-50/40", badgeBg: "bg-amber-100 text-amber-800", icon: Zap };
      case "shopping":
        return { border: "border-indigo-200", bg: "bg-indigo-50/40", badgeBg: "bg-indigo-100 text-indigo-800", icon: ShoppingCart };
      case "flight":
        return { border: "border-purple-200", bg: "bg-purple-50/40", badgeBg: "bg-purple-100 text-purple-800", icon: Plane };
      default:
        return { border: "border-slate-200", bg: "bg-slate-50/40", badgeBg: "bg-slate-100 text-slate-800", icon: Leaf };
    }
  };

  const styleObj = insightDesign(dashboardData.insight?.categoryFocus);

  return (
    <div id="analytics_tab_subview" className="space-y-6">
      
      {/* CO₂ STATISTICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Weekly Total Carbon Card */}
        <div className="frosted-glass-card rounded-[32px] p-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 font-black text-6xl text-slate-200/20 select-none -z-10 font-sans">CO₂</div>
          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Weekly Impact Total</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold font-sans text-slate-800">
              {summary.totalEmissionKg.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Accumulated for all logged inputs over prior 7 days.
          </p>
        </div>

        {/* Days Under Budget Count Card */}
        <div className="frosted-glass-card rounded-[32px] p-5 text-left">
          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Days Under Target</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-600">
              {summary.daysUnderBudget}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ 7 active days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Concluded days maintaining logs below target threshold.
          </p>
        </div>

        {/* Versus National Average Meter */}
        <div className="frosted-glass-card rounded-[32px] p-5 text-left">
          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Vs National Average</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            {summary.versusAveragePercent <= 0 ? (
              <>
                <span className="text-3xl font-extrabold font-sans text-emerald-600">
                  {Math.abs(summary.versusAveragePercent)}%
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase">Lower</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold font-sans text-red-500">
                  +{summary.versusAveragePercent}%
                </span>
                <span className="text-xs font-bold text-red-600 bg-red-100/50 px-2 py-0.5 rounded-full uppercase">Higher</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Calibrated baseline against country grid averages.
          </p>
        </div>

        {/* Biggest Single Emission Source */}
        <div className="frosted-glass-card rounded-[32px] p-5 text-left">
          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Biggest Single Source</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-sm font-bold text-slate-850 italic block truncate max-w-[140px]" title={summary.topActivityName}>
              {summary.topActivityName}
            </span>
          </div>
          <div className="text-right mt-1.5">
            <span className="font-mono font-extrabold text-red-500 text-xs">
              {summary.topActivityEmissionKg.toFixed(1)} kg CO₂e
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Highest logged item emission load this week.
          </p>
        </div>
      </div>

      {/* CORE CHARTS ROW (F4: weekly and monthly charts showing total emissions by category) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Bar Chart past 7 days */}
        <div className="lg:col-span-3 frosted-glass-card rounded-[32px] p-6 text-left">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            7-Day Daily CO₂ Loading
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <RechartsTooltip />
                <Bar dataKey="Emission (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Allocation Pie Chart */}
        <div className="lg:col-span-2 frosted-glass-card rounded-[32px] p-6 text-left">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-4">
            <PieIcon className="w-4 h-4 text-slate-500" />
            Emissions By Segment
          </h3>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasEmissions ? pieChartData : fallbackPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(hasEmissions ? pieChartData : fallbackPieData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie legends list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 mt-2 border-t border-white/40 text-[10px]">
            {(hasEmissions ? pieChartData : []).map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-500 capitalize">{item.name}</span>
                <span className="font-bold font-mono text-slate-700">({Math.round(((item.value) / (summary.totalEmissionKg || 1)) * 100)}%)</span>
              </div>
            ))}
            {!hasEmissions && (
              <p className="col-span-full italic text-center text-slate-400">
                Log activities to see segment breakdowns.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* F5 AI INSIGHT CARD GENERATED VIA GEMINI FLASH */}
      <div id="gemini_insight_card" className="frosted-glass-card rounded-[32px] p-6 text-left">
        <div className="flex items-center justify-between pb-4 border-b border-white/40 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-slate-800">Candid Weekly AI Analysis</h3>
              <p className="text-[10px] text-slate-400">Recommends customized switches on past 7 days inputs.</p>
            </div>
          </div>
          
          <button
            id="re_analyze_ai_btn"
            onClick={handleTriggerInsight}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-800 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-300/35 rounded-xl transition-all cursor-pointer select-none disabled:opacity-50 animate-pulse-slow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            Re-analyze with AI
          </button>
        </div>

        {errorLocal && (
          <div className="bg-red-100/40 text-red-600 p-3.5 rounded-xl text-xs font-medium border border-red-200/20 mb-4 animate-shake">
            ⚠️ {errorLocal}
          </div>
        )}

        {/* SKELETON LOADING MODE */}
        {generating && (
          <div id="ai_loading_skeleton" className="animate-pulse space-y-4">
            <div className="h-6 w-2/3 bg-white/40 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-white/40 rounded-lg" />
              <div className="h-4 bg-white/40 rounded-lg" />
              <div className="h-3 bg-white/30 rounded-md w-4/5" />
            </div>
            <div className="h-10 bg-purple-100/30 rounded-xl w-full" />
          </div>
        )}

        {/* AI Insight Renders */}
        {!generating && dashboardData.insight && (
          <div id="rendered_insight_content" className={`border rounded-2xl p-5 ${styleObj.border} bg-white/45 backdrop-blur-md transition-all space-y-4 relative overflow-hidden`}>
                        {/* Category Focus Indicator Tag badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider ${styleObj.badgeBg}`}>
                Focus: <styleObj.icon className="w-3.5 h-3.5 inline-block" /> {dashboardData.insight.categoryFocus}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Refreshed Monday baseline</span>
            </div>

            {/* Headline */}
            <h4 className="text-md font-extrabold text-slate-800 leading-snug">
              &ldquo;{dashboardData.insight.headline}&rdquo;
            </h4>

            {/* Body of feedback */}
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {dashboardData.insight.body}
            </p>

            {/* AI Proposed Swap imperative action alert */}
            <div className="bg-white/50 border border-white/60 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-left">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-purple-600 font-bold">Proposed Achievement Swap</span>
                  <p className="text-xs font-bold text-slate-850 mt-0.5">{dashboardData.insight.swapAction}</p>
                </div>
              </div>
              <div className="text-center sm:text-right flex-shrink-0 bg-purple-600/10 px-3.5 py-2 rounded-xl border border-purple-200/20">
                <span className="text-[9px] uppercase text-purple-500 font-bold block">Estimated weekly saving</span>
                <span className="font-mono font-bold text-purple-700 text-sm">-{dashboardData.insight.estimatedSavingKg} kg CO₂e</span>
              </div>
            </div>
          </div>
        )}

        {/* Default instruction when there are no insights cached yet */}
        {!generating && !dashboardData.insight && (
          <div className="py-8 bg-white/30 border border-white/45 rounded-2xl text-center max-w-sm mx-auto">
            <span className="text-2xl block mb-2">💫</span>
            <h4 className="text-slate-700 font-bold text-xs">Ready for AI Habitation recommendations</h4>
            <p className="text-[11px] text-slate-400 px-6 mt-1 leading-relaxed">
              Unlock a complete Gemini summary by adding standard logs and choosing "Re-analyze with AI".
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
