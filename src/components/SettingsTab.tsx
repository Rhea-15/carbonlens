import { useState, FormEvent } from "react";
import { jsPDF } from "jspdf";
import { 
  Download, 
  Trash2, 
  Mail, 
  MapPin, 
  Users, 
  Car, 
  Scale, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react";
import { DashboardData } from "../types";

interface SettingsTabProps {
  dashboardData: DashboardData;
  onUpdateProfile: (payload: {
    countryCode?: string;
    householdSize?: number;
    commuteType?: string;
    dailyBudgetKg?: number;
    email?: string;
  }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isGuest: boolean;
  onOpenAuth: () => void;
}

export default function SettingsTab({
  dashboardData,
  onUpdateProfile,
  onDeleteAccount,
  isGuest,
  onOpenAuth
}: SettingsTabProps) {
  const user = dashboardData.user;

  const [email, setEmail] = useState(user?.email || "");
  const [countryCode, setCountryCode] = useState(user?.countryCode || "IN");
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || 1);
  const [commuteType, setCommuteType] = useState(user?.commuteType || "car_petrol_km");
  const [dailyBudgetKg, setDailyBudgetKg] = useState(String(user?.dailyBudgetKg || "5.50"));

  // Secondary options
  const [optInSundayEmail, setOptInSundayEmail] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      setErrorMsg("Guest variables are locked in active memory. Create an account to adjust profile parameters.");
      return;
    }

    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await onUpdateProfile({
        email,
        countryCode,
        householdSize: parseInt(String(householdSize)) || 1,
        commuteType,
        dailyBudgetKg: parseFloat(dailyBudgetKg) || 5.50
      });
      setSuccessMsg("CarbonLens baseline settings updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    if (isGuest) {
      alert("No activities to export in guest sessions. Please register and log activities first.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Decorative top border bar (Emerald)
      doc.setFillColor(16, 185, 129); // #10b981
      doc.rect(0, 0, 210, 8, "F");

      // Title & Header branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 118, 110); // Tealy emerald #0f766e
      doc.text("CarbonLens", 15, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("EMISSION REGISTRY & DESIGN PROFILE REPORT", 15, 27);

      // Date of export (on the right)
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Generated: ${new Date().toLocaleString()}`, 210 - 15, 22, { align: "right" });
      doc.text("Paris Target Compliance Record", 210 - 15, 27, { align: "right" });

      // Horizontal separator line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 32, 210 - 15, 32);

      // SECTION 1: PROFILE SUMMARY
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("I. Registered Carbon Profile Details", 15, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600

      // Draw two columns for metadata
      // Column 1
      doc.setFont("helvetica", "bold");
      doc.text("Owner Email:", 18, 50);
      doc.text("Country Code:", 18, 56);
      doc.text("Household Size:", 18, 62);

      doc.setFont("helvetica", "normal");
      doc.text(user?.email || "N/A", 50, 50);
      doc.text(user?.countryCode || "IN", 50, 56);
      doc.text(`${user?.householdSize || 1} members`, 50, 62);

      // Column 2
      doc.setFont("helvetica", "bold");
      doc.text("Commute Option:", 110, 50);
      doc.text("Daily Emissions Budget:", 110, 56);
      doc.text("Weekly Budget Total:", 110, 62);

      const displayCommute = commutes.find(c => c.key === (user?.commuteType || commuteType))?.name || user?.commuteType || "Standard Petrol Car";
      doc.setFont("helvetica", "normal");
      doc.text(displayCommute, 155, 50);
      doc.text(`${(user?.dailyBudgetKg || 5.5).toFixed(2)} kg CO2e`, 155, 56);
      doc.text(`${((user?.dailyBudgetKg || 5.5) * 7).toFixed(2)} kg CO2e`, 155, 62);

      // Horizontal separator line
      doc.line(15, 69, 210 - 15, 69);

      // SECTION 2: METRICS & INSIGHT STATS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("II. Active Progress Summary", 15, 78);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      doc.setFont("helvetica", "bold");
      doc.text("Current Streak:", 18, 86);
      doc.text("Weekly Emissions:", 18, 92);
      doc.text("Days Under Budget:", 18, 98);

      doc.setFont("helvetica", "normal");
      doc.text(`${dashboardData.streaks?.current || 0} consecutive days under budget`, 55, 86);
      doc.text(`${(dashboardData.weeklySummary?.totalEmissionKg || 0).toFixed(2)} kg CO2e`, 55, 92);
      doc.text(`${dashboardData.weeklySummary?.daysUnderBudget || 0} / 7 days`, 55, 98);

      doc.setFont("helvetica", "bold");
      doc.text("Top Activity Category:", 110, 86);
      doc.text("Top Emitting Activity:", 110, 92);
      doc.text("AI Proposed Swap Idea:", 110, 98);

      doc.setFont("helvetica", "normal");
      doc.text(dashboardData.weeklySummary?.topCategory || "N/A", 155, 86);
      const topDetail = dashboardData.weeklySummary?.topActivityName 
        ? `${dashboardData.weeklySummary.topActivityName} (${(dashboardData.weeklySummary.topActivityEmissionKg || 0).toFixed(2)} kg)`
        : "No emissions logged";
      doc.text(topDetail, 155, 92);
      doc.text(dashboardData.insight?.swapAction || "None proposed yet", 155, 98, { maxWidth: 45 });

      // Horizontal separator line
      doc.line(15, 107, 210 - 15, 107);

      // SECTION 3: RECENT ACTIVITIES LOGS
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("III. Detailed Footprint Log Listing", 15, 116);

      // Table Headers
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, 122, 210 - 30, 7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Logged At", 17, 126.5);
      doc.text("Category", 42, 126.5);
      doc.text("Activity Details / Label", 70, 126.5);
      doc.text("Quantity", 135, 126.5, { align: "right" });
      doc.text("Emission (kgCO2e)", 175, 126.5, { align: "right" });
      doc.text("Notes", 180, 126.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      let currentY = 133;
      const logsToPrint = dashboardData.recentLogs || [];

      if (logsToPrint.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text("No carbon footprint activities logged in this user account session.", 18, currentY);
      } else {
        logsToPrint.forEach((log) => {
          if (currentY > 275) {
            // Add a new page if the data overflows
            doc.addPage();
            
            // Re-draw small header on consecutive page
            doc.setFillColor(16, 185, 129);
            doc.rect(0, 0, 210, 5, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 118, 110);
            doc.text("CarbonLens - Detailed Footprint Log Listing (Cont.)", 15, 15);
            doc.line(15, 18, 210 - 15, 18);

            // Re-draw Table Headers
            doc.setFillColor(241, 245, 249);
            doc.rect(15, 22, 210 - 30, 7, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.text("Logged At", 17, 26.5);
            doc.text("Category", 42, 26.5);
            doc.text("Activity Details / Label", 70, 26.5);
            doc.text("Quantity", 135, 26.5, { align: "right" });
            doc.text("Emission (kgCO2e)", 175, 26.5, { align: "right" });
            doc.text("Notes", 180, 26.5);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);

            currentY = 32;
          }

          // Date format
          const formattedDate = new Date(log.loggedAt).toLocaleDateString([], { month: "short", day: "numeric" }) + 
            " " + new Date(log.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

          doc.text(formattedDate, 17, currentY);
          
          const categoryStr = log.activityCategory ? log.activityCategory.toUpperCase() : "GENERAL";
          doc.text(categoryStr, 42, currentY);

          // Truncate activity label to fit nicely
          const rawLabel = log.activityLabel || "Unspecified Route";
          const fitLabel = rawLabel.length > 32 ? rawLabel.substring(0, 29) + "..." : rawLabel;
          doc.text(fitLabel, 70, currentY);

          // Quantity
          doc.text(String(log.quantity), 135, currentY, { align: "right" });

          // Emission
          doc.setFont("helvetica", "bold");
          doc.setTextColor(239, 68, 68); // Red-500 red text
          doc.text(`+${log.emissionKg.toFixed(2)}`, 175, currentY, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);

          // Notes
          const noteText = log.note || "-";
          const fitNote = noteText.length > 15 ? noteText.substring(0, 13) + "..." : noteText;
          doc.text(fitNote, 180, currentY);

          // Horizontal grid line
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.3);
          doc.line(15, currentY + 2.5, 210 - 15, currentY + 2.5);

          currentY += 6.5;
        });
      }

      // Footer branding
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, 15, 297 - 10);
        doc.text("Official emissions certificate generated by CarbonLens. All emissions factors are validated against climate policies.", 210 - 15, 297 - 10, { align: "right" });
      }

      // Initiate local trigger downloaded PDF
      doc.save("carbonlens_climate_report.pdf");
    } catch (err: any) {
      alert("Error compiling PDF: " + err.message);
    }
  };

  const handleTriggerDeletion = async () => {
    if (isGuest) {
      alert("Wiping transient guest session caches.");
      window.location.reload();
      return;
    }

    const conf = window.confirm(
      "CRITICAL: Are you absolutely sure you want to permanently delete your CarbonLens account, logs, and badging credentials? This is irreversible."
    );
    if (!conf) return;

    try {
      await onDeleteAccount();
    } catch (e) {
      alert("Purge operation could not complete.");
    }
  };

  return (
    <div id="settings_tab_subview" className="space-y-6 max-w-2xl mx-auto text-left">
      
      {/* UPDATE BASELINE VARIABLES PANEL */}
      <div className="frosted-glass-card rounded-[32px] p-6">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-5 border-b border-white/30 pb-3">
          <Scale className="w-4 h-4 text-emerald-500" />
          Update Physical Parameters & Budget
        </h3>

        {isGuest ? (
          <div className="bg-white/25 border border-white/40 p-6 rounded-[24px] text-center space-y-4">
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are currently using CarbonLens in quick guest mode. Creating a secure member profile allows you to calibrate domestic energy grids, and persist tracking.
            </p>
            <button
              id="settings_guest_auth_trigger"
              onClick={onOpenAuth}
              className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Configure Member profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {successMsg && (
              <div id="settings_success_alert" className="p-3 bg-emerald-100/40 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-100/40 text-red-600 rounded-xl text-xs font-medium border border-red-200/20">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Account Email
                </label>
                <input
                  id="settings_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full frosted-glass-input rounded-xl px-3 py-2.5 text-xs outline-none"
                />
              </div>

              {/* National region */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Country Grid
                </label>
                <select
                  id="settings_country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full frosted-glass-input rounded-xl px-3 py-2.5 text-xs outline-none cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-100 text-slate-850">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupants */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Household Size
                </label>
                <select
                  id="settings_household"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(parseInt(e.target.value) || 1)}
                  className="w-full frosted-glass-input rounded-xl px-3 py-2.5 text-xs outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num} className="bg-slate-100 text-slate-850">
                      {num === 5 ? "5+ occupants" : `${num} occupant${num > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transit style */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  Primary Daily Commute
                </label>
                <select
                  id="settings_commute"
                  value={commuteType}
                  onChange={(e) => setCommuteType(e.target.value)}
                  className="w-full frosted-glass-input rounded-xl px-3 py-2.5 text-xs outline-none cursor-pointer"
                >
                  {commutes.map((c) => (
                    <option key={c.key} value={c.key} className="bg-slate-100 text-slate-850">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Budget */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Interactive Daily Carbon Target Budget (kg CO₂e)
                </label>
                <input
                  id="settings_daily_budget"
                  type="number"
                  step="0.1"
                  required
                  value={dailyBudgetKg}
                  onChange={(e) => setDailyBudgetKg(e.target.value)}
                  className="w-full frosted-glass-input rounded-xl px-3 py-2.5 text-xs outline-none"
                />
                <p className="text-[10px] text-slate-450 mt-1">
                  The standard global recommendation targets staying under <strong className="text-slate-705">5.50 kg CO₂e per day</strong> (38.5kg/weekly) to mitigate emissions in line with planetary climate agreements.
                </p>
              </div>
            </div>

            {/* F8 Opt-in Sunday weekly emails */}
            <div className="p-4 bg-white/20 rounded-xl border border-white/40 flex items-center justify-between mt-3">
              <div className="space-y-0.5 max-w-xs text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-emerald-500" /> Toggle Sunday Email Digests
                </label>
                <p className="text-[10px] text-slate-450 leading-normal">
                  Receive beautiful weekly summaries comparing performance metrics directly to your email inbox.
                </p>
              </div>
              <input
                id="checkbox_sunday_optin"
                type="checkbox"
                checked={optInSundayEmail}
                onChange={(e) => setOptInSundayEmail(e.target.checked)}
                className="w-4 h-4 text-emerald-500 border-slate-200 rounded cursor-pointer accent-emerald-500 focus:ring-emerald-400"
              />
            </div>

            <button
              id="settings_save_btn"
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-slate-100 select-none"
            >
              {saving ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Save Profile Variables"
              )}
            </button>
          </form>
        )}
      </div>

      {/* DATA CONTROLS: EXPORT AND PURGE */}
      <div className="frosted-glass-card rounded-[32px] p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 border-b border-white/30 pb-3">
          Data Export & Secure Account Deletion
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PDF Report Export */}
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex flex-col justify-between text-left space-y-3">
            <div>
              <h4 className="font-bold text-xs text-emerald-800 flex items-center gap-1">
                <Download className="w-4 h-4 text-emerald-500" /> Export Carbon PDF Report
              </h4>
              <p className="text-[10px] text-emerald-600/90 leading-relaxed mt-1">
                Download a clean, official PDF emissions certificate documenting your profile variables, cumulative streaks, weekly thresholds, and individual log entries.
              </p>
            </div>
            <button
              id="settings_export_btn"
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Download Carbon PDF
            </button>
          </div>

          {/* Wipe account danger section F8 */}
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex flex-col justify-between text-left space-y-3">
            <div>
              <h4 className="font-bold text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> Purge Account & Logs
              </h4>
              <p className="text-[10px] text-red-600/90 leading-relaxed mt-1">
                Instantly clean out all recorded session cookies, purge active database tables, and erase badging histories. This process is immediate and irreversible.
              </p>
            </div>
            <button
              id="settings_purge_account"
              onClick={handleTriggerDeletion}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wipe Account History
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
