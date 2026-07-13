export type Team = {
  id: number;
  name: string;
  color: string;
  income_per_minute: number;
  total_money: number;
  upgrade_count: number;
  last_income_update: string;
  created_at?: string;
  updated_at?: string;
};

export type TransactionType =
  | "income"
  | "money_added"
  | "money_removed"
  | "upgrade_purchase"
  | "income_adjusted"
  | "profile_updated"
  | "team_reset"
  | "activity_reset";

export type Transaction = {
  id: string;
  team_id: number;
  amount: number;
  balance_after: number;
  type: TransactionType;
  note: string;
  created_at: string;
};

export type AdminLog = {
  id: string;
  team_id: number | null;
  team_name: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
};

export type GameUpgrade = {
  key: string;
  name: string;
  cost: number;
  incomeBoost: number;
  description: string;
};

export type AdminActionResult = {
  ok: boolean;
  message?: string;
};
