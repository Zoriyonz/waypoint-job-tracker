export const STAGES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Closed",
};

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  stage: Stage;
  description: string;
  letter?: string;
  createdAt: number;
}
