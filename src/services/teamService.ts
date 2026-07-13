import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../supabase/client";
import type { Database } from "../supabase/database.types";
import type { AdminLog, Team, Transaction } from "../types/game";

type Client = SupabaseClient<Database>;
type RpcClient = {
  rpc: <T>(
    functionName: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: T | null; error: Error | null }>;
};

function requireClient(): Client {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is nog niet geconfigureerd.");
  }

  return supabase;
}

function normalizeTeam(team: Team): Team {
  return {
    ...team,
    income_per_minute: Number(team.income_per_minute),
    total_money: Number(team.total_money),
    upgrade_count: Number(team.upgrade_count),
  };
}

function normalizeTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    balance_after: Number(transaction.balance_after),
  };
}

async function callRpc<T>(
  functionName: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const client = requireClient() as unknown as RpcClient;
  const { data, error } = await client.rpc<T>(functionName, args);

  if (error) throw error;

  return data as T;
}

export async function fetchTeams(options?: {
  applyIncome?: boolean;
}): Promise<Team[]> {
  const client = requireClient();

  if (options?.applyIncome) {
    await callRpc<Team[]>("apply_income_for_all");
  }

  const { data, error } = await client
    .from("teams")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(normalizeTeam);
}

export async function refreshAllIncome(): Promise<Team[]> {
  const data = await callRpc<Team[]>("apply_income_for_all");
  return (data ?? []).map(normalizeTeam);
}

export async function fetchTransactions(limit = 240): Promise<Transaction[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).reverse().map(normalizeTransaction);
}

export async function fetchAdminLogs(limit = 120): Promise<AdminLog[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

export async function addMoney(
  teamId: number,
  amount: number,
  note = "Geld toegevoegd",
): Promise<Team> {
  const data = await callRpc<Team>("add_team_money", {
    p_team_id: teamId,
    p_amount: amount,
    p_note: note,
  });

  return normalizeTeam(data);
}

export async function subtractMoney(
  teamId: number,
  amount: number,
  note = "Geld afgetrokken",
): Promise<Team> {
  const data = await callRpc<Team>("subtract_team_money", {
    p_team_id: teamId,
    p_amount: amount,
    p_note: note,
  });

  return normalizeTeam(data);
}

export async function increaseIncome(
  teamId: number,
  delta: number,
  note = "Inkomen verhoogd",
): Promise<Team> {
  const data = await callRpc<Team>("increase_team_income", {
    p_team_id: teamId,
    p_delta: delta,
    p_note: note,
  });

  return normalizeTeam(data);
}

export async function setIncome(teamId: number, income: number): Promise<Team> {
  const data = await callRpc<Team>("set_team_income", {
    p_team_id: teamId,
    p_income: income,
  });

  return normalizeTeam(data);
}

export async function updateTeamProfile(
  teamId: number,
  name: string,
  color: string,
): Promise<Team> {
  const data = await callRpc<Team>("update_team_profile", {
    p_team_id: teamId,
    p_name: name,
    p_color: color,
  });

  return normalizeTeam(data);
}

export async function resetTeam(teamId: number): Promise<Team> {
  const data = await callRpc<Team>("reset_team", {
    p_team_id: teamId,
  });

  return normalizeTeam(data);
}

export async function resetActivity(): Promise<Team[]> {
  const data = await callRpc<Team[]>("reset_activity");
  return (data ?? []).map(normalizeTeam);
}

export async function purchaseGameUpgrade(
  teamId: number,
  upgradeKey: string,
): Promise<Team> {
  const data = await callRpc<Team>("purchase_game_upgrade", {
    p_team_id: teamId,
    p_upgrade_key: upgradeKey,
  });

  return normalizeTeam(data);
}

export async function applyFilledUpgrade(
  teamId: number,
  name: string,
  cost: number,
  incomeBoost: number,
): Promise<Team> {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("Upgrade heeft een naam nodig.");
  }

  if (cost < 0) {
    throw new Error("Kostprijs mag niet negatief zijn.");
  }

  if (incomeBoost <= 0) {
    throw new Error("Inkomensboost moet groter zijn dan 0.");
  }

  const latestTeam = (await fetchTeams({ applyIncome: true })).find(
    (team) => team.id === teamId,
  );

  if (!latestTeam) {
    throw new Error("Team bestaat niet.");
  }

  if (latestTeam.total_money < cost) {
    throw new Error(
      `${latestTeam.name} heeft niet genoeg geld voor ${cleanName}.`,
    );
  }

  if (cost > 0) {
    await subtractMoney(teamId, cost, `Upgrade gekocht: ${cleanName}`);
  }

  return increaseIncome(teamId, incomeBoost, `Upgrade gekocht: ${cleanName}`);
}
