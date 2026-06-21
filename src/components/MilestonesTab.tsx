import { useState, useMemo, useEffect } from "react";
import { 
  Award, 
  Flame, 
  Share2, 
  Zap, 
  Compass, 
  Bike, 
  Leaf, 
  Sparkles, 
  TrendingDown, 
  Check, 
  Copy,
  X 
} from "lucide-react";
import { UserMilestone } from "../types";

interface MilestonesTabProps {
  unlockedMilestones: UserMilestone[];
  currentStreak: number;
}

// Full standard milestones array
const GLOBAL_MILESTONES_CATALOG = [
  { key: "first_log", name: "Carbon Pioneer", desc: "Logged your very first carbon-impacting activity.", icon: Compass, color: "bg-blue-50 text-blue-600 border-blue-105" },
  { key: "streak_7", name: "Efficiency Master", desc: "Maintained a carbon baseline under budget for 7 consecutive days.", icon: Flame, color: "bg-orange-50 text-orange-600 border-orange-105" },
  { key: "green_commuter", name: "Transit Purist", desc: "Logged 5 eco-friendly transport segments (walking, cycling, subway).", icon: Bike, color: "bg-indigo-50 text-indigo-600 border-indigo-105" },
  { key: "vegan_champ", name: "Planet over Plate", desc: "Logged plant-based dietary entries 5 or more times.", icon: Leaf, color: "bg-emerald-50 text-emerald-600 border-emerald-105" },
  { key: "energy_saver", name: "Volt Guardian", desc: "Logged renewable energy or eco washing cycles 5 or more times.", icon: Zap, color: "bg-amber-50 text-amber-600 border-amber-105" },
  { key: "adopted_5", name: "Habit Transformer", desc: "Adopted 5 or more carbon-reducing sustainable swaps from the catalog.", icon: Sparkles, color: "bg-pink-50 text-pink-600 border-pink-105" },
  { key: "cut_co2_20", name: "Carbon Shrinker", desc: "Logged under 26 kgCO₂e of weekly emissions (saving 30%+ compared to standard).", icon: TrendingDown, color: "bg-teal-50 text-teal-600 border-teal-105" }
];

export default function MilestonesTab({
  unlockedMilestones,
  currentStreak
}: MilestonesTabProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<typeof GLOBAL_MILESTONES_CATALOG[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareImageSrc, setShareImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMilestone) {
      setShareImageSrc(null);
      return;
    }

    // Set up high definition canvas drawing
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw rich gradient background
    const grad = ctx.createRadialGradient(400, 250, 50, 400, 250, 450);
    grad.addColorStop(0, "#064e3b"); // Emerald dark green
    grad.addColorStop(1, "#022c22"); // Ultra deep forest
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative geometric outer borders
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, 770, 470);

    ctx.strokeStyle = "#10b981"; // Mint highlights
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 440);

    // Grid details
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 50; i < 800; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 40);
      ctx.lineTo(i, 460);
      ctx.stroke();
    }
    for (let j = 50; j < 500; j += 50) {
      ctx.beginPath();
      ctx.moveTo(40, j);
      ctx.lineTo(760, j);
      ctx.stroke();
    }

    // Brand Label Header
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CARBONLENS EMISSION REGISTRY", 400, 80);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 10px monospace";
    ctx.fillText("GLOBAL ATMOSPHERIC PIONEER CERTIFICATION", 400, 110);

    // Divider line
    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    ctx.beginPath();
    ctx.moveTo(250, 135);
    ctx.lineTo(550, 135);
    ctx.stroke();

    // Certified Announcement
    ctx.fillStyle = "#fff";
    ctx.font = "italic 16px Georgia, serif";
    ctx.fillText("This is to certify that an eco-citizen has proudly unlocked:", 400, 180);

    // Certificate Title badge
    ctx.fillStyle = "#facc15"; // Shining Golden Yellow
    ctx.font = "black 38px system-ui, sans-serif";
    ctx.fillText(selectedMilestone.name, 400, 235);

    // Description text block
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "200 15px sans-serif";
    ctx.fillText(`“${selectedMilestone.desc}”`, 400, 280);

    // Streak details or stats
    ctx.fillStyle = "#fdba74"; // Soft warm orange
    ctx.font = "bold 14px monospace";
    ctx.fillText(`Current Carbon Baseline Streak: ${currentStreak} Consecutive Days`, 400, 325);

    // Signatures / Seals text row
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    const randomId = Math.floor(100000 + Math.random() * 900000);
    ctx.fillText(`VERIFIABLE PARADIGM TOKEN INDEX ID: CL-${selectedMilestone.key.toUpperCase()}-${randomId}`, 400, 385);

    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText("✔ CarbonLens Integrity Board", 250, 425);
    ctx.fillText("✔ UNFCCC Climate Tracker Audit", 550, 425);

    // Draw center check circle overlay decoration
    ctx.fillStyle = "rgba(52, 211, 153, 0.1)";
    ctx.beginPath();
    ctx.arc(400, 425, 22, 0, 2 * Math.PI);
    ctx.fill();

    setShareImageSrc(canvas.toDataURL("image/png"));
  }, [selectedMilestone, currentStreak]);

  // Map unlocked statuses
  const unlockedMap = useMemo(() => {
    const map: Record<string, string> = {};
    unlockedMilestones.forEach(m => {
      map[m.milestoneKey] = m.earnedAt;
    });
    return map;
  }, [unlockedMilestones]);

  const handleShareClick = (milestone: typeof GLOBAL_MILESTONES_CATALOG[0]) => {
    setSelectedMilestone(milestone);
    setCopied(false);
  };

  const handleCopyText = () => {
    const textToCopy = `I earned the "${selectedMilestone?.name}" Badge on CarbonLens! Check out your daily carbon footprints with me: ${window.location.origin}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="milestones_tab_subview" className="space-y-6 text-left">
      
      {/* ACHIEVED SUMMARY HEADLINE */}
      <div className="frosted-glass-card rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Milestone Progress Overview</span>
          <h2 className="text-xl font-bold text-slate-850 mt-1">Streaks & Milestones Badging</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Fulfill eco-friendly consumption objectives to earn collectable digital badges and share certificates.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl w-28">
            <span className="text-[10px] uppercase text-emerald-600 tracking-wider block font-bold">UNLOCKED</span>
            <span id="label_unlocked_badges_count" className="font-sans text-2xl font-black text-emerald-700 block mt-1">
              {unlockedMilestones.length} / 7
            </span>
          </div>

          <div className="text-center bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl w-28">
            <span className="text-[10px] uppercase text-orange-600 tracking-wider block font-bold">STREAK</span>
            <span id="label_streaks_milestone_counter" className="font-sans text-2xl font-black text-orange-700 block mt-1 flex items-center justify-center gap-1.5">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 hover:scale-110 transition-all cursor-pointer" /> {currentStreak}D
            </span>
          </div>
        </div>
      </div>

      {/* BADGES DISPLAY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GLOBAL_MILESTONES_CATALOG.map((m) => {
          const earnedAtStr = unlockedMap[m.key];
          const isUnlocked = !!earnedAtStr;
          const BadgeIcon = m.icon;

          return (
            <div
              key={m.key}
              id={`milestone_badge_${m.key}`}
              className={`frosted-glass-card rounded-[32px] p-5 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? "border-emerald-300 shadow-sm bg-white/55"
                  : "opacity-75"
              }`}
            >
              <div className="space-y-4">
                {/* Badge visual top block */}
                <div className="flex items-center justify-between">
                  {/* Grayscale indicator for locked ones */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    isUnlocked ? m.color : "bg-white/20 text-slate-300 border-white/35"
                  }`}>
                    <BadgeIcon className="w-6 h-6" />
                  </div>
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md">
                      Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-white/20 text-slate-400 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md border border-white/30">
                      Locked
                    </span>
                  )}
                </div>

                <div>
                  <h3 id={`milestone_name_${m.key}`} className={`font-extrabold text-sm ${isUnlocked ? "text-slate-800" : "text-slate-400 font-medium"}`}>
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-sans">
                    {m.desc}
                  </p>
                </div>
              </div>

              {/* Earn date or Locker footer overlay */}
              <div className="pt-4 border-t border-white/30 mt-4 flex items-center justify-between">
                {isUnlocked ? (
                  <>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      Earned: {new Date(earnedAtStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <button
                      id={`btn_share_milestone_${m.key}`}
                      onClick={() => handleShareClick(m)}
                      className="p-1.5 bg-white/40 hover:bg-white/60 border border-white/50 rounded-xl text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1 hover:scale-105 select-none"
                      title="Share Badge Award"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Export share</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-300 font-medium italic">
                    Requires action inputs targeting requirement.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SHAREABLE MILESTONE CARD OVERLAY MODAL (F7 Shareable Milestone Badge Cards) */}
      {selectedMilestone && (
        <div id="share_badge_backdrop" className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="share_badge_box" className="w-full max-w-sm bg-slate-900/90 backdrop-blur-2xl text-white rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center p-6 text-center space-y-6 relative">
            
            {/* Close button */}
            <button
              id="share_badge_close"
              onClick={() => setSelectedMilestone(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Emblem container */}
            <div className={`p-4 rounded-xl border ${selectedMilestone.color} w-16 h-16 flex items-center justify-center mt-3`}>
              {(() => {
                const SelectedIcon = selectedMilestone.icon;
                return <SelectedIcon className="w-8 h-8" />;
              })()}
            </div>

            {/* Polaroid framed content card */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-[#10b981] font-bold uppercase block">CARBONLENS CERTIFIED AWARD</span>
              <h3 className="text-lg font-extrabold tracking-tight font-sans text-white">
                {selectedMilestone.name}
              </h3>
              <p className="text-[11px] text-slate-300 max-w-xs mx-auto font-sans leading-tight">
                &ldquo;{selectedMilestone.desc}&rdquo;
              </p>
            </div>

            {/* Generated Certificate Shareable Image Preview */}
            {shareImageSrc ? (
              <div id="milestone_image_frame" className="space-y-1 w-full text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Generated Certificate PNG:</span>
                <div className="border border-white/20 rounded-xl overflow-hidden shadow-lg bg-slate-950/40">
                  <img 
                    id="generated_milestone_img" 
                    src={shareImageSrc} 
                    alt="CarbonLens Milestone Certificate" 
                    className="w-full h-auto object-contain cursor-pointer hover:scale-[1.01] transition-all" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-slate-950/20 rounded-xl flex items-center justify-center text-xs text-slate-500">
                Generating shareable achievement badge card...
              </div>
            )}

            {/* Share interactive trigger links */}
            <div className="w-full space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {shareImageSrc && (
                  <a
                    id="btn_download_milestone_img"
                    href={shareImageSrc}
                    download={`CarbonLens_${selectedMilestone.key}_Badge.png`}
                    className="py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-center select-none"
                  >
                    Download PNG
                  </a>
                )}
                
                <a
                  id="btn_tweet_milestone"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just achieved the "${selectedMilestone.name}" Badge on @CarbonLens! My daily carbon streak is ${currentStreak} days under my carbon budget limit. Track your footprint with me: ${window.location.origin}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-center select-none border border-white/10"
                >
                  Share to X
                </a>
              </div>

              <button
                id="btn_copy_share_text"
                onClick={handleCopyText}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 font-medium rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer select-none transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-450" />
                    Share link copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Copy Share Link
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
