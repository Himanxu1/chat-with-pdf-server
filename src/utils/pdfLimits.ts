// subscription.enum.ts
export enum SubscriptionTier {
  FREE = 'Free',
  BASIC = 'Basic',
  PRO = 'Pro',
}

export interface PlanLimits {
  dailyPdfLimit: number
  monthlyPdfLimit: number
  maxFileSizeMb: number
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    dailyPdfLimit: 10,
    monthlyPdfLimit: 10,
    maxFileSizeMb: 10,
  },
  [SubscriptionTier.BASIC]: {
    dailyPdfLimit: 30,
    monthlyPdfLimit: 200,
    maxFileSizeMb: 40,
  },
  [SubscriptionTier.PRO]: {
    dailyPdfLimit: 200,
    monthlyPdfLimit: -1, // -1 means unlimited
    maxFileSizeMb: 1024, // 1GB
  },
}

// Legacy support
export const PDF_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 10,
  [SubscriptionTier.BASIC]: 20,
  [SubscriptionTier.PRO]: 40,
}
