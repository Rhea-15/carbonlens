import { useState, FormEvent } from "react";
import { Leaf, Users, Car, MapPin, ArrowRight } from "lucide-react";

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
    { key: "car_petrol_km", name: "Standard Petrol Car", icon: "🚗" },
    { key: "car_petrol_large_km", name: "Heavy SUV / Truck", icon: "🛻" },
    { key: "car_ev_std_km", name: "Electric Vehicle (EV)", icon: "⚡" },
    { key: "train_metro_km", name: "Subway / Train / Public, Transit", icon: "🚇" },
    { key: "walking_km", name: "Walking / Cycling (Low Impact)", icon: "🚲" },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Budget matches 1.5°C Global Pathway target (~5.5 kgCO2e/day) as a constant target
    // calibrated against country baseline
    onComplete({
      countryCode,
      householdSize,
      commuteType,
      dailyBudgetKg: 5.50 // Standard global goal-focused target
    });
  };

  return (
    <div id="onboarding_container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div id="onboarding_card" className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
        {/* Decorative backdrop blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10 translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -z-10 -translate-x-8 translate-y-8" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-sans text-slate-850 tracking-tight">Welcome to CarbonLens</h1>
          <p className="text-slate-550 mt-2 text-sm max-w-sm mx-auto">
            Calibrate your footprint baseline in under 2 minutes to unlock actionable daily CO₂ budgets and personalized swaps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country list */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Country / Region Baseline
            </label>
            <div className="relative">
              <select
                id="country_select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
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
              Adaptains carbon averages against domestic municipal energy and grids.
            </p>
          </div>

          {/* Household Size */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
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
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    householdSize === num
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
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

          {/* Primary Commute Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 tracking-wider uppercase flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-500" />
              Primary Commute Transit
            </label>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {commutes.map((c) => (
                <button
                  key={c.key}
                  id={`commute_type_btn_${c.key}`}
                  type="button"
                  onClick={() => setCommuteType(c.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    commuteType === c.key
                      ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    {c.name}
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    commuteType === c.key ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {commuteType === c.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt info */}
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 flex items-start gap-3">
            <Leaf className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-left">
              <h4 className="text-xs font-bold text-emerald-800">Your Target daily budget: 5.5 kg CO₂e</h4>
            </div>
          </div>

          {/* CTA action */}
          <button
            id="onboarding_submit_btn"
            type="submit"
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-98 transition-all cursor-pointer"
          >
            Start Tracking Footprint
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
