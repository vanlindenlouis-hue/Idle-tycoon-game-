import type { AdminLog, Team, Transaction } from "../types/game";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: Omit<Team, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Team>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Transaction>;
      };
      admin_logs: {
        Row: AdminLog;
        Insert: Omit<AdminLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AdminLog>;
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
    };
    Functions: {
      apply_income_for_all: {
        Args: Record<PropertyKey, never>;
        Returns: Team[];
      };
      apply_income_for_team: {
        Args: { p_team_id: number };
        Returns: Team;
      };
      add_team_money: {
        Args: { p_team_id: number; p_amount: number; p_note?: string };
        Returns: Team;
      };
      subtract_team_money: {
        Args: { p_team_id: number; p_amount: number; p_note?: string };
        Returns: Team;
      };
      increase_team_income: {
        Args: { p_team_id: number; p_delta: number; p_note?: string };
        Returns: Team;
      };
      set_team_income: {
        Args: { p_team_id: number; p_income: number };
        Returns: Team;
      };
      update_team_profile: {
        Args: { p_team_id: number; p_name: string; p_color: string };
        Returns: Team;
      };
      reset_team: {
        Args: { p_team_id: number };
        Returns: Team;
      };
      reset_activity: {
        Args: Record<PropertyKey, never>;
        Returns: Team[];
      };
      get_clock_paused: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_clock_paused: {
        Args: { p_paused: boolean };
        Returns: boolean;
      };
      purchase_game_upgrade: {
        Args: { p_team_id: number; p_upgrade_key: string };
        Returns: Team;
      };
    };
  };
};
