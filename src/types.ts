/**
 * Shared Type Definitions for CarbonLens
 */

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Hidden in API responses
  countryCode: string;
  householdSize: number;
  commuteType: string;
  dailyBudgetKg: number;
  createdAt: string;
}

export type CategoryType = 'transport' | 'food' | 'energy' | 'shopping' | 'flight';

export interface EmissionFactor {
  id: number;
  category: CategoryType;
  activityKey: string;
  label: string;
  unit: string;
  factorKg: number;
  source: string;
  description: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  factorId: number;
  quantity: number;
  emissionKg: number;
  loggedAt: string;
  note?: string;
  activityLabel?: string; // Populated join-like info
  activityCategory?: CategoryType; // Populated join-like info
}

export interface Streaks {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastUnderBudgetDatetime: string | null; // Stores last ISO Date under budget
}

export interface UserMilestone {
  id: string;
  userId: string;
  milestoneKey: string;
  badgeName: string;
  description: string;
  iconName: string;
  earnedAt: string;
}

export interface ActionSwap {
  key: string;
  title: string;
  category: CategoryType;
  effort: 'easy' | 'medium' | 'high';
  weeklySavingKg: number;
  annualSavingKg: number;
  description: string;
  impactText: string;
}

export interface UserAction {
  id: string;
  userId: string;
  actionKey: string;
  status: 'bookmarked' | 'adopted';
  adoptedAt?: string;
}

export interface AIInsight {
  userId: string;
  weekStart: string; // ISO date string e.g. '2026-06-15'
  headline: string;
  body: string;
  swapAction: string;
  estimatedSavingKg: number;
  categoryFocus: CategoryType;
  generatedAt: string;
}

// Full Dashboard State Interface response
export interface DashboardData {
  user: User;
  todayLoggedKg: number;
  dailyBudgetKg: number;
  streaks: {
    current: number;
    longest: number;
    isUnderBudgetToday: boolean;
  };
  weeklySummary: {
    totalEmissionKg: number;
    daysUnderBudget: number;
    byCategory: Record<CategoryType, number>;
    versusAveragePercent: number; // e.g. -20% or +15%
    topCategory: CategoryType;
    topActivityName: string;
    topActivityEmissionKg: number;
  };
  recentLogs: ActivityLog[];
  milestones: UserMilestone[];
  adoptedActions: {
    actionKey: string;
    status: 'bookmarked' | 'adopted';
    weeklySavingKg: number;
  }[];
  insight: AIInsight | null;
}
