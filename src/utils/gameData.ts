import type { GameUpgrade, Team } from "../types/game";

const now = new Date().toISOString();

export const initialTeams: Team[] = [
  {
    id: 1,
    name: "Team 1",
    color: "#22c55e",
    income_per_minute: 100,
    total_money: 0,
    upgrade_count: 0,
    last_income_update: now,
  },
  {
    id: 2,
    name: "Team 2",
    color: "#38bdf8",
    income_per_minute: 100,
    total_money: 0,
    upgrade_count: 0,
    last_income_update: now,
  },
  {
    id: 3,
    name: "Team 3",
    color: "#facc15",
    income_per_minute: 100,
    total_money: 0,
    upgrade_count: 0,
    last_income_update: now,
  },
  {
    id: 4,
    name: "Team 4",
    color: "#fb7185",
    income_per_minute: 100,
    total_money: 0,
    upgrade_count: 0,
    last_income_update: now,
  },
];

export const gameUpgrades: GameUpgrade[] = [
  {
    key: "extra_cashier",
    name: "Extra kassier",
    cost: 500,
    incomeBoost: 25,
    description: "Snellere kassa's voor korte wachtrijen.",
  },
  {
    key: "new_shelves",
    name: "Nieuwe rekken",
    cost: 1000,
    incomeBoost: 50,
    description: "Meer producten op de winkelvloer.",
  },
  {
    key: "marketing_campaign",
    name: "Marketingcampagne",
    cost: 2500,
    incomeBoost: 150,
    description: "Meer klanten richting de winkel.",
  },
  {
    key: "self_scan",
    name: "Zelfscan",
    cost: 5000,
    incomeBoost: 300,
    description: "Automatische doorstroom bij piekmomenten.",
  },
  {
    key: "warehouse_expansion",
    name: "Magazijnuitbreiding",
    cost: 10000,
    incomeBoost: 600,
    description: "Grote voorraad en hogere verkoopcapaciteit.",
  },
];

export const teamColors = [
  "#22c55e",
  "#38bdf8",
  "#facc15",
  "#fb7185",
  "#a78bfa",
  "#f97316",
  "#14b8a6",
  "#e879f9",
];
