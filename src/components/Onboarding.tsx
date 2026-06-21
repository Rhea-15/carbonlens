import { useState, FormEvent } from "react";
import { Leaf, Users, Car, MapPin, ArrowRight, CheckCircle, Flame, ShieldAlert } from "lucide-react";

interface OnboardingProps {
  onComplete: (data: {
    countryCode: string;
    householdSize: number;
    commuteType: string;
    dailyBudgetKg: number;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [countryCode, setCountryCode] = useState("IN");
  const [householdSize, setHouseholdSize] = useState(1);
  const [commuteType, setCommuteType] = useState("car_petrol_km");

  const countries = [
    { code: "IN", name: "India (Avg: 5.2 kg CO₂/day)", val: 5.2 },
    { code: "UK", name: "United Kingdom (Avg: 14.2 kg CO₂/day)", val: 14.2 },
    { code: "DE", name: "Germany (Avg: 21.9 kg CO₂/day)", val: 21.9 },
    { code: "FR", name: "France (Avg: 12.3 kg CO₂/day)", val: 12.3 },
    { code: "US", name: "United States (Avg: 39.7 kg CO₂/day)", val: 39.7 },
  ];

  const commutes = [
    { key: "car_petrol_km", name: "Standard Petrol Car", icon: "🚗", desc: "Internal combustion sedan" },
    { key: "car_petrol_large_km", name: "Heavy SUV / Truck", icon: "🛻", desc: "Large SUV or passenger pickup" },
    { key: "car_ev_std_km", name: "Electric Vehicle (EV)", icon: "⚡", desc: "Standard hybrid or full electric" },
    { key: "train_metro_km", name: "Subway & Public Transit", icon: "🚇", desc: "Dense mass transit routes" },
    { key: "walking_km", name: "Walking / Cycling", icon: "🚲", desc: "Zero emission biological transit" },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onComplete({
      countryCode,
      householdSize,
      commuteType,
      dailyBudgetKg: 5.50, // Standard global target (1.5°C pathway)
    });
  };

  return (
    <div id="onboarding_container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 lg:p-12">
      <div 
        id="onboarding_card" 
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[650px] transition-all"
      >
        {/* LEFT COLUMN: Premium Branding & Visual Highlight */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative backdrop patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-x-16 -translate-y-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-x-16 translate-y-16 pointer-events-none" />

          {/* Top Brand Info */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-emerald-250 mb-6">
              <Leaf className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              1.5°C Global Target Alignment
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Begin Your Journey to Carbon Neutrality
            </h2>
            <p className="text-emerald-100/90 mt-4 text-sm leading-relaxed">
              We help you track, analyze, and offset daily emissions with real-time calculations and tailored habit swaps.
            </p>
          </div>

          {/* Highlight Checklist */}
          <div className="my-8 space-y-4 relative z-10">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Calibrate Regional Baselines</h4>
                <p className="text-xs text-emerald-100/80">Uses local municipal energy patterns for accuracy.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Establish Household Split</h4>
                <p className="text-xs text-emerald-100/80">Distributes shared resources (heating, cooling) fairly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Unlock Personal Budgets</h4>
                <p className="text-xs text-emerald-100/80">Receive daily CO₂ emission allowances and AI recommendations.</p>
              </div>
            </div>
          </div>

          {/* Bottom Target Highlight Card */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-emerald-250 uppercase font-extrabold tracking-wider block">Target Daily Limit</span>
              <span className="text-lg font-extrabold text-white leading-none">5.5 kg CO₂e</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Interactive Calibration Form */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome to CarbonLens</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Calibrate your footprint baseline in under 2 minutes to unlock actionable daily CO₂ budgets and personalized swaps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Country / Region Baseline */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Country / Region Baseline
              </label>
              <div className="relative">
                <select
                  id="country_select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  ▼
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Adapts carbon averages against domestic municipal energy and grids.
              </p>
            </div>

            {/* Household Occupants */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                Household Occupants
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    id={`household_size_btn_${num}`}
                    type="button"
                    onClick={() => setHouseholdSize(num)}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      householdSize === num
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {num === 5 ? "5+" : num}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Equitably splits common physical grid services (heating, AC, water).
              </p>
            </div>

            {/* Primary Commute Transit */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-500" />
                Primary Commute Transit
              </label>
              
              {/* Display commute transit options in a highly structured, fully visible grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commutes.map((c, index) => {
                  const isSelected = commuteType === c.key;
                  const isLastItem = index === commutes.length - 1;
                  return (
                    <button
                      key={c.key}
                      id={`commute_type_btn_${c.key}`}
                      type="button"
                      onClick={() => setCommuteType(c.key)}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isLastItem ? "md:col-span-2" : ""
                      } ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-lg">{c.icon}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA action */}
            <button
              id="onboarding_submit_btn"
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-98 transition-all cursor-pointer mt-6"
            >
              Start Tracking Footprint
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
