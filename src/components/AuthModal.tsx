import { useState, FormEvent } from "react";
import { X, Mail, Lock, LogIn, UserPlus, MapPin, Users, Car, Leaf } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration specific fields
  const [countryCode, setCountryCode] = useState("IN");
  const [householdSize, setHouseholdSize] = useState(1);
  const [commuteType, setCommuteType] = useState("car_petrol_km");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const countries = [
    { code: "IN", name: "India" },
    { code: "UK", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "US", name: "United States" },
  ];

  const commutes = [
    { key: "car_petrol_km", name: "Standard Petrol Car", icon: "🚗" },
    { key: "car_petrol_large_km", name: "Heavy SUV / Truck", icon: "🛻" },
    { key: "car_ev_std_km", name: "Electric Vehicle (EV)", icon: "⚡" },
    { key: "train_metro_km", name: "Subway or Train", icon: "🚇" },
    { key: "walking_km", name: "Walking / Cycling", icon: "🚲" },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all standard credentials.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { email, password }
        : { email, password, countryCode, householdSize, commuteType, dailyBudgetKg: 5.50 };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication procedure failed.");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div id="auth_modal_box" className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 id="auth_modal_title" className="text-xl font-bold font-sans text-slate-800">
              {isLogin ? "Welcome back" : "Create standard profile"}
            </h2>
          </div>
          <button 
            id="auth_modal_close"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Tabs switch */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              id="switch_login_tab"
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isLogin ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              id="switch_signup_tab"
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                !isLogin ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div id="auth_error_alert" className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 text-left">
              ⚠️ {error}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Email Address
            </label>
            <input
              id="auth_email_input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Password input */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Secret Password
            </label>
            <input
              id="auth_password_input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Registration specific fields */}
          {!isLogin && (
            <div className="space-y-4 pt-2 border-t border-slate-100 text-left">
              {/* Country Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  National Baseline CO₂ Grid
                </label>
                <select
                  id="reg_country_select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Household occupying count */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Household Size (Occupants)
                </label>
                <select
                  id="reg_household_select"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num === 5 ? "5+ occupants" : `${num} occupant${num > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transit style selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  Primary Daily Commuting style
                </label>
                <select
                  id="reg_commute_select"
                  value={commuteType}
                  onChange={(e) => setCommuteType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white outline-none cursor-pointer"
                >
                  {commutes.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action submit button */}
          <button
            id="auth_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In to Account
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account & Save
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          Secure, direct sessions hashed server-side.
        </div>
      </div>
    </div>
  );
}
