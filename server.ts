import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { GoogleGenAI, Type } from "@google/genai";
import { db, STATIC_ACTIONS } from "./src/server/db.js";
import { CategoryType, AIInsight, DashboardData } from "./src/types.js";

// Setup __dirname equivalent representing absolute pathing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up Gemini Client lazily to prevent crashing on boot if missing API key
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// Helpers
const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  // Adjust so Monday is 1, Sunday is 7. If day is 0 (Sunday), offset by -6, else offset by -day+1
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().substring(0, 10); // YYYY-MM-DD
};

// Auth middleware helper
const getAuthenticatedUserId = (req: express.Request): string | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (!match) return null;
  return db.getSession(match[1]);
};

// --- AUTH API ENDPOINTS ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, countryCode, householdSize, commuteType, dailyBudgetKg } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required fields." });
      return;
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    const parsedHouseholdSize = parseInt(householdSize) || 1;
    const parsedDailyBudgetKg = parseFloat(dailyBudgetKg) || 5.50;

    // Hash with 12 rounds as specified by TRD
    const passwordHash = await bcrypt.hash(password, 12);
    const user = db.createUser(
      email,
      passwordHash,
      countryCode || "IN",
      parsedHouseholdSize,
      commuteType || "car_petrol_km",
      parsedDailyBudgetKg
    );

    // Automatic sign-in via cookie session token
    const token = db.createSession(user.id);
    res.setHeader(
      "Set-Cookie",
      `session_token=${token}; Path=/; HttpOnly; Max-Age=${30 * 24 * 60 * 60}; SameSite=None; Secure`
    );

    // Respond with sanitized user content
    res.status(201).json({
      id: user.id,
      email: user.email,
      countryCode: user.countryCode,
      householdSize: user.householdSize,
      commuteType: user.commuteType,
      dailyBudgetKg: user.dailyBudgetKg,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Self-contained registration error." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required fields." });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password credentials." });
      return;
    }

    const token = db.createSession(user.id);
    res.setHeader(
      "Set-Cookie",
      `session_token=${token}; Path=/; HttpOnly; Max-Age=${30 * 24 * 60 * 60}; SameSite=None; Secure`
    );

    res.json({
      id: user.id,
      email: user.email,
      countryCode: user.countryCode,
      householdSize: user.householdSize,
      commuteType: user.commuteType,
      dailyBudgetKg: user.dailyBudgetKg,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    console.error("Login verification error:", error);
    res.status(500).json({ error: error.message || "Login error." });
  }
});

app.get("/api/auth/profile", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access. No session found." });
    return;
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User record not found." });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    countryCode: user.countryCode,
    householdSize: user.householdSize,
    commuteType: user.commuteType,
    dailyBudgetKg: user.dailyBudgetKg,
    createdAt: user.createdAt
  });
});

app.post("/api/auth/profile", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized update. No session found." });
    return;
  }

  try {
    const { countryCode, householdSize, commuteType, dailyBudgetKg, email } = req.body;
    const updatePayload: any = {};
    if (countryCode !== undefined) updatePayload.countryCode = countryCode;
    if (householdSize !== undefined) updatePayload.householdSize = parseInt(householdSize) || 1;
    if (commuteType !== undefined) updatePayload.commuteType = commuteType;
    if (dailyBudgetKg !== undefined) updatePayload.dailyBudgetKg = parseFloat(dailyBudgetKg) || 5.50;
    if (email !== undefined) updatePayload.email = email;

    const updatedUser = db.updateUserProfile(userId, updatePayload);
    // Re-evaluate streaks to align with new dailyBudget
    db.recalculateStreaks(userId);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      countryCode: updatedUser.countryCode,
      householdSize: updatedUser.householdSize,
      commuteType: updatedUser.commuteType,
      dailyBudgetKg: updatedUser.dailyBudgetKg,
      createdAt: updatedUser.createdAt
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed update of profile." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) {
      db.destroySession(match[1]);
    }
  }
  res.setHeader(
    "Set-Cookie",
    `session_token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`
  );
  res.json({ message: "Successfully signed out of CarbonLens session." });
});

// --- CORE DASHBOARD AGGREGATED FEED ---

app.get("/api/dashboard", async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized dashboard access." });
    return;
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User detail unavailable." });
    return;
  }

  try {
    const logs = db.getLogs(userId);
    const streaks = db.getStreaks(userId);
    const milestones = db.getMilestones(userId);
    const userActions = db.getUserActions(userId);

    // Compute Today's Total
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLogs = logs.filter(l => l.loggedAt.substring(0, 10) === todayStr);
    const todayLoggedKg = todayLogs.reduce((acc, l) => acc + l.emissionKg, 0);

    // Compute Weekly breakdown stats (last 7 calendar days inclusive)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyLogs = logs.filter(l => new Date(l.loggedAt).getTime() >= oneWeekAgo);
    const totalWeeklyEmissionKg = weeklyLogs.reduce((acc, l) => acc + l.emissionKg, 0);

    // Aggregate category allocations
    const byCategory: Record<CategoryType, number> = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      flight: 0
    };

    weeklyLogs.forEach(l => {
      const cat = l.activityCategory || "transport";
      if (byCategory[cat] !== undefined) {
        byCategory[cat] += l.emissionKg;
      }
    });

    // Group weekly logs by daily limit checks to get days under budget
    const weeklyDailyAgg: Record<string, number> = {};
    weeklyLogs.forEach(l => {
      const dateStr = l.loggedAt.substring(0, 10);
      weeklyDailyAgg[dateStr] = (weeklyDailyAgg[dateStr] || 0) + l.emissionKg;
    });

    let daysUnderBudget = 0;
    // We inspect the last 7 distinct calendar dates starting from today
    for (let i = 0; i < 7; i++) {
      const inspectDate = new Date();
      inspectDate.setDate(inspectDate.getDate() - i);
      const inspectStr = inspectDate.toISOString().substring(0, 10);
      const dailySum = weeklyDailyAgg[inspectStr] ?? 0;
      // If user had logged elements and stayed under, or simply didn't exceed budget
      if (weeklyDailyAgg[inspectStr] !== undefined && dailySum <= user.dailyBudgetKg) {
        daysUnderBudget++;
      } else if (weeklyDailyAgg[inspectStr] === undefined) {
        // Technically days without logs can count as zero footprint, but F7 streak evaluates logged activity
        // Let's count days logged and remained under budget as success days
      }
    }

    // Determine Top Categories
    let topCat: CategoryType = "transport";
    let maxCatVal = -1;
    (Object.keys(byCategory) as CategoryType[]).forEach(k => {
      if (byCategory[k] > maxCatVal) {
        maxCatVal = byCategory[k];
        topCat = k;
      }
    });

    // Determine top single activity
    let topActivityName = "None";
    let topActivityEmissionKg = 0;
    if (weeklyLogs.length > 0) {
      const actAgg: Record<string, number> = {};
      weeklyLogs.forEach(l => {
        const label = l.activityLabel || "Unknown";
        actAgg[label] = (actAgg[label] || 0) + l.emissionKg;
      });
      let maxActVal = -1;
      Object.keys(actAgg).forEach(k => {
        if (actAgg[k] > maxActVal) {
          maxActVal = actAgg[k];
          topActivityName = k;
          topActivityEmissionKg = actAgg[k];
        }
      });
    }

    // Comparison against national average baseline (kgCO2e per week)
    // CoStandard benchmark is user household per capita scale
    // IN (India) average is ~5.2kg/day (36.4kg/wk). US average is 39.7kg/day (277kg/wk). UK average is 14.2kg/day (99.4kg/wk).
    let countryMultiplier = 13.0; // Global Average Default
    if (user.countryCode === "IN") countryMultiplier = 5.2;
    else if (user.countryCode === "US") countryMultiplier = 39.7;
    else if (user.countryCode === "UK") countryMultiplier = 14.2;
    else if (user.countryCode === "DE") countryMultiplier = 21.9;
    else if (user.countryCode === "FR") countryMultiplier = 12.3;

    const baseNationalWeeklyKg = countryMultiplier * 7;
    const versusAveragePercent = baseNationalWeeklyKg > 0 
      ? Math.round(((totalWeeklyEmissionKg - baseNationalWeeklyKg) / baseNationalWeeklyKg) * 100)
      : 0;

    // Load AI Insight
    const currentWeekStart = getWeekStart();
    const cachedInsight = db.getCachedInsight(userId, currentWeekStart);

    const mappedAdopted = userActions.map(a => {
      const staticRef = STATIC_ACTIONS.find(sa => sa.key === a.actionKey);
      return {
        actionKey: a.actionKey,
        status: a.status,
        weeklySavingKg: staticRef ? staticRef.weeklySavingKg : 0
      };
    });

    const isUnderBudgetToday = todayLoggedKg <= user.dailyBudgetKg;

    const dashboardResponse: DashboardData = {
      user: {
        id: user.id,
        email: user.email,
        countryCode: user.countryCode,
        householdSize: user.householdSize,
        commuteType: user.commuteType,
        dailyBudgetKg: user.dailyBudgetKg,
        createdAt: user.createdAt
      },
      todayLoggedKg,
      dailyBudgetKg: user.dailyBudgetKg,
      streaks: {
        current: streaks.currentStreak,
        longest: streaks.longestStreak,
        isUnderBudgetToday
      },
      weeklySummary: {
        totalEmissionKg: Number(totalWeeklyEmissionKg.toFixed(2)),
        daysUnderBudget,
        byCategory,
        versusAveragePercent,
        topCategory: topCat,
        topActivityName,
        topActivityEmissionKg: Number(topActivityEmissionKg.toFixed(2))
      },
      recentLogs: logs.slice(0, 20), // Return last 20
      milestones,
      adoptedActions: mappedAdopted,
      insight: cachedInsight
    };

    res.json(dashboardResponse);
  } catch (err: any) {
    console.error("Dashboard calculation error:", err);
    res.status(500).json({ error: "Failed to construct aggregated dashboard data stream." });
  }
});

// --- EMISSION ENGINES ---

app.get("/api/factors", (req, res) => {
  res.json(db.getEmissionFactors());
});

app.post("/api/logs", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized log addition." });
    return;
  }

  try {
    const { factorId, quantity, note, loggedAt } = req.body;
    if (!factorId || quantity === undefined || parseFloat(quantity) <= 0) {
      res.status(400).json({ error: "Both active factorId and positive non-zero quantity are required." });
      return;
    }

    const log = db.addLog(userId, parseInt(factorId), parseFloat(quantity), note || "", loggedAt);
    res.status(201).json(log);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed logs registration process." });
  }
});

app.delete("/api/logs/:id", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized log deletion." });
    return;
  }

  try {
    db.deleteLog(userId, req.params.id);
    res.json({ message: "Successfully deleted carbon log entry." });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Failed search details." });
  }
});

// --- ACTION LIBRARY & ADOPTIONS ---

app.get("/api/actions", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const userActions = userId ? db.getUserActions(userId) : [];
  
  res.json({
    library: STATIC_ACTIONS,
    userAdoptions: userActions
  });
});

app.post("/api/actions/toggle", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized action configuration." });
    return;
  }

  try {
    const { actionKey, status } = req.body; // status: 'bookmarked' | 'adopted' | 'removed'
    if (!actionKey || !status) {
      res.status(400).json({ error: "Action key and targeted status required." });
      return;
    }

    const swapObj = STATIC_ACTIONS.find(sa => sa.key === actionKey);
    if (!swapObj) {
      res.status(404).json({ error: "Target action key does not exist under standard catalog definitions." });
      return;
    }

    const result = db.toggleAction(userId, actionKey, status);
    res.json({
      success: true,
      actionKey,
      status,
      result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Toggle action failed." });
  }
});

// --- GOOGLE GEMINI POWERED INSIGHT GEN ---

app.post("/api/insights/generate", async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized. Session required to compile insights." });
    return;
  }

  try {
    const user = db.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User detail unavailable." });
      return;
    }

    const weekStart = getWeekStart();
    const cached = db.getCachedInsight(userId, weekStart);
    if (cached) {
      res.json(cached);
      return;
    }

    // Capture logs and build weekly logs payload
    const logs = db.getLogs(userId);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyLogs = logs.filter(l => new Date(l.loggedAt).getTime() >= oneWeekAgo);

    // Categories
    const byCategory: Record<CategoryType, number> = {
      transport: 0,
      food: 0,
      energy: 0,
      shopping: 0,
      flight: 0
    };
    weeklyLogs.forEach(l => {
      const cat = l.activityCategory || "transport";
      if (byCategory[cat] !== undefined) {
        byCategory[cat] += l.emissionKg;
      }
    });

    const totalWeeklyEmissionKg = weeklyLogs.reduce((acc, l) => acc + l.emissionKg, 0);

    // Group logs by individual products
    const rawActivityAgg: Record<string, { label: string; qty: number; sum: number }> = {};
    weeklyLogs.forEach(l => {
      const label = l.activityLabel || "Other";
      if (!rawActivityAgg[label]) {
        rawActivityAgg[label] = { label, qty: 0, sum: 0 };
      }
      rawActivityAgg[label].qty += l.quantity;
      rawActivityAgg[label].sum += l.emissionKg;
    });

    const topActivities = Object.values(rawActivityAgg)
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 3)
      .map(item => ({
        label: item.label,
        quantity: item.qty,
        emission_kg: Number(item.sum.toFixed(2))
      }));

    // Group weekly logs by daily budget limit
    const weeklyDailyAgg: Record<string, number> = {};
    weeklyLogs.forEach(l => {
      const dateStr = l.loggedAt.substring(0, 10);
      weeklyDailyAgg[dateStr] = (weeklyDailyAgg[dateStr] || 0) + l.emissionKg;
    });

    let daysUnderBudget = 0;
    for (let i = 0; i < 7; i++) {
      const inspectDate = new Date();
      inspectDate.setDate(inspectDate.getDate() - i);
      const inspectStr = inspectDate.toISOString().substring(0, 10);
      const dailySum = weeklyDailyAgg[inspectStr] ?? 0;
      if (weeklyDailyAgg[inspectStr] !== undefined && dailySum <= user.dailyBudgetKg) {
        daysUnderBudget++;
      }
    }

    const payload = {
      user: {
        country: user.countryCode,
        household_size: user.householdSize,
        daily_budget_kg: user.dailyBudgetKg,
        weekly_budget_kg: Number((user.dailyBudgetKg * 7).toFixed(1))
      },
      week_summary: {
        total_emission_kg: Number(totalWeeklyEmissionKg.toFixed(1)),
        days_under_budget: daysUnderBudget,
        by_category: byCategory,
        top_activities: topActivities
      }
    };

    let parsedInsight: any = null;
    let fallbackCategory: CategoryType = "transport";
    
    // Pick top category for fallback options
    let maxVal = -1;
    for (const cat in byCategory) {
      const val = byCategory[cat as CategoryType] || 0;
      if (val > maxVal) {
        maxVal = val;
        fallbackCategory = cat as CategoryType;
      }
    }

    const mainActivityText = topActivities.length > 0 ? topActivities[0].label : "";

    try {
      // Invoke Gemini Flash via GoogleGenAI SDK with a retry mechanism
      const ai = getGeminiClient();
      const systemPrompt = `You are the backend AI engine for CarbonLens, a personal carbon footprint tracker. Your job is to analyze a user's weekly activity log and return a personalized, actionable insight.
Rules:
- Never say "carbon footprint" — say "emissions" or "impact"
- Never moralize or use guilt language
- Be specific: name the actual activity, not just the category
- The swap must be genuinely achievable in one week
- estimated_saving_kg should be a realistic number, not optimistic.
- Respond ONLY with a JSON object in this exact format, no markdown, no preamble:
{
  "headline": "One short punchy sentence naming the biggest issue (max 12 words)",
  "body": "2-3 sentences. Name the top emission source with its percentage of the week total. Give one specific, concrete swap the user can make next week. Be encouraging, not guilt-inducing. Use plain language.",
  "swap_action": "One specific action the user can take, phrased as an imperative starting with a verb. Max 15 words.",
  "estimated_saving_kg": <number: estimated weekly kgCO2e saving if swap is adopted>,
  "category_focus": "<one of: transport | food | energy | shopping | flight>"
}`;

      const promptText = `Analyze the typical carbon dataset of the user below and generate standard reduction feedback options:
${JSON.stringify(payload)}`;

      let response;
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING, description: "Max 12 words caption" },
                  body: { type: Type.STRING, description: "2-3 sentences of clear helpful feedback" },
                  swap_action: { type: Type.STRING, description: "Imperative verb suggestion, max 15 words" },
                  estimated_saving_kg: { type: Type.NUMBER, description: "Estimated weekly kg saving" },
                  category_focus: { type: Type.STRING, description: "One of the 5 main categories" }
                },
                required: ["headline", "body", "swap_action", "estimated_saving_kg", "category_focus"]
              }
            }
          });
          break; // Success!
        } catch (err: any) {
          attempts++;
          console.warn(`Gemini generation attempt ${attempts} failed:`, err?.message || err);
          if (attempts >= maxAttempts) {
            throw err; // Re-throw to go to custom dynamic fallback
          }
          // Delay before next retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (response) {
        const resultText = response.text?.trim() || "";
        try {
          parsedInsight = JSON.parse(resultText);
        } catch (parseErr) {
          console.warn("JSON parse on Gemini response failed, reverting to category fallback:", resultText);
        }
      }
    } catch (error: any) {
      console.warn("Gemini Service is currently unavailable or high demand. Initiating premium dynamic climate fallback computation:", error?.message || error);
    }

    // Assign fallback or format double-checked results
    if (!parsedInsight) {
      let headline = "Track Daily Habits regularly";
      let body = "CarbonLens works best when you record at least three activities a week. Continue logging your commutes and meals to compile detailed emission summaries.";
      let swapAction = "Log your next meal or travel segment";
      let estimatedSavingKg = 3.0;

      if (totalWeeklyEmissionKg > 0) {
        if (fallbackCategory === "food") {
          headline = "Food Choices and Dietary Footprint Impact";
          body = `Food-based logs contributed ${totalWeeklyEmissionKg.toFixed(1)} kg CO₂e to your emissions this week${mainActivityText ? ` (led by ${mainActivityText})` : ""}. Replacing one high-impact dairy or beef portion with organic plant-based options will shrink your carbon legacy dramatically.`;
          swapAction = "Replace high-impact meals with organic plant-based options";
          estimatedSavingKg = Math.max(1.2, Number((totalWeeklyEmissionKg * 0.2).toFixed(1)));
        } else if (fallbackCategory === "transport") {
          headline = "Commuting Choices and Transit Focus";
          body = `Your weekly transport logging totals ${totalWeeklyEmissionKg.toFixed(1)} kg CO₂e${mainActivityText ? ` (primarily via ${mainActivityText})` : ""}. Swapping solo vehicle commutes for cycling or eco rail lines lowers urban nitrogen oxide levels and heat trapping.`;
          swapAction = "Take walking, cycling, or trains for short trips";
          estimatedSavingKg = Math.max(1.5, Number((totalWeeklyEmissionKg * 0.25).toFixed(1)));
        } else if (fallbackCategory === "energy") {
          headline = "Optimize Power Consumption and Home Efficiency";
          body = `Active heating, lighting, or appliance logs accounted for ${totalWeeklyEmissionKg.toFixed(1)} kg CO₂e this week. Activating energy-saving power cycles or washing garments on lower cold-water cycles saves utility resources.`;
          swapAction = "Wash laundry at eco standard cold water settings";
          estimatedSavingKg = Math.max(0.8, Number((totalWeeklyEmissionKg * 0.15).toFixed(1)));
        } else if (fallbackCategory === "shopping") {
          headline = "Mindful Purchasing habits and Consumption Core";
          body = `Consumer choices and shopping activities totaled ${totalWeeklyEmissionKg.toFixed(1)} kg CO₂e. Prioritizing secondhand, refurbished items or local sustainable packaging limits transport weight and manufacturing strain.`;
          swapAction = "Seek custom refurbished options or lightweight packaging";
          estimatedSavingKg = Math.max(1.0, Number((totalWeeklyEmissionKg * 0.18).toFixed(1)));
        } else if (fallbackCategory === "flight") {
          headline = "Aviation emissions and High Altitude Offset";
          body = `Aviation paths remain your highest emission category at ${totalWeeklyEmissionKg.toFixed(1)} kg CO₂e. Supporting verified premium carbon offset credits helps capture equivalent emissions through massive reforestation schemes.`;
          swapAction = "Select local trains or invest in flight carbon offsets";
          estimatedSavingKg = Math.max(10.0, Number((totalWeeklyEmissionKg * 0.1).toFixed(1)));
        }
      }

      parsedInsight = {
        headline,
        body,
        swap_action: swapAction,
        estimated_saving_kg: estimatedSavingKg,
        category_focus: fallbackCategory
      };
    }

    // Double check category_focus validity
    const focus = String(parsedInsight.category_focus).toLowerCase();
    const validCats = ["transport", "food", "energy", "shopping", "flight"];
    const finalFocus = validCats.includes(focus) ? (focus as CategoryType) : fallbackCategory;

    const saved = db.saveInsight(userId, weekStart, {
      headline: parsedInsight.headline,
      body: parsedInsight.body,
      swapAction: parsedInsight.swap_action,
      estimatedSavingKg: Number(parsedInsight.estimated_saving_kg || 5.0),
      categoryFocus: finalFocus
    });

    res.json(saved);
  } catch (error: any) {
    console.error("Critical error in insight endpoint execution:", error);
    res.status(500).json({ error: "Could not compile weekly carbon insights." });
  }
});

// --- SETTINGS, EXPORT, AND DELETION ---

app.get("/api/settings/export", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized export. Session required." });
    return;
  }

  try {
    const logs = db.getLogs(userId);
    let csv = "ID,Logged At,Category,Activity,Quantity,Emission (kgCO2e),Note\n";
    logs.forEach(l => {
      csv += `"${l.id}","${l.loggedAt}","${l.activityCategory}","${l.activityLabel}",${l.quantity},${l.emissionKg},"${(l.note || "").replace(/"/g, '""')}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=carbonlens_emissions_export.csv");
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to construct CSV data export." });
  }
});

app.post("/api/settings/delete-account", (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized account deletion." });
    return;
  }

  try {
    db.deleteUser(userId);
    res.setHeader(
      "Set-Cookie",
      `session_token=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`
    );
    res.json({ success: true, message: "Successfully deleted your CarbonLens account." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed account purge." });
  }
});

// --- VITE MIDDLEWARE HANDLING & PRODUCTION STATIC BIND ---

const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  // Dynamic import in development
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log("Serving static compiled build assets from /dist.");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CarbonLens backend server online on http://localhost:${PORT}`);
});
