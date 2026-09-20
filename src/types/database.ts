/**
 * Tipos generados a mano para el schema MVP (0001_init + 0002_org_invites).
 * Usados por los clientes Supabase tipados.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MembershipRole =
  | "admin"
  | "league_manager"
  | "team_manager"
  | "referee";

export type ScoreType = "goals" | "points" | "sets";

export type TournamentStatus = "registration" | "active" | "finished";

export type MatchStatus =
  | "programado"
  | "en_vivo"
  | "finalizado"
  | "suspendido";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          settings?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          settings?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          team_id: string | null;
          role: MembershipRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          team_id?: string | null;
          role: MembershipRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          team_id?: string | null;
          role?: MembershipRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          nombre: string;
          apellido: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre?: string;
          apellido?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          apellido?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sports: {
        Row: {
          id: string;
          name: string;
          points_win: number;
          points_draw: number;
          points_loss: number;
          allows_draws: boolean;
          score_type: ScoreType;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          points_win: number;
          points_draw: number;
          points_loss: number;
          allows_draws?: boolean;
          score_type: ScoreType;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          points_win?: number;
          points_draw?: number;
          points_loss?: number;
          allows_draws?: boolean;
          score_type?: ScoreType;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tournaments: {
        Row: {
          id: string;
          organization_id: string;
          sport_id: string;
          name: string;
          season: string;
          format: string;
          legs: number;
          status: TournamentStatus;
          start_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sport_id: string;
          name: string;
          season: string;
          format?: string;
          legs?: number;
          status?: TournamentStatus;
          start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          sport_id?: string;
          name?: string;
          season?: string;
          format?: string;
          legs?: number;
          status?: TournamentStatus;
          start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournaments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournaments_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_teams: {
        Row: {
          id: string;
          organization_id: string;
          tournament_id: string;
          team_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tournament_id: string;
          team_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tournament_id?: string;
          team_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          organization_id: string;
          tournament_id: string;
          home_team_id: string;
          away_team_id: string;
          round: number | null;
          stage: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          court_info: string | null;
          home_score: number;
          away_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tournament_id: string;
          home_team_id: string;
          away_team_id: string;
          round?: number | null;
          stage?: string | null;
          scheduled_at?: string | null;
          status?: MatchStatus;
          court_info?: string | null;
          home_score?: number;
          away_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tournament_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          round?: number | null;
          stage?: string | null;
          scheduled_at?: string | null;
          status?: MatchStatus;
          court_info?: string | null;
          home_score?: number;
          away_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      match_sets: {
        Row: {
          id: string;
          organization_id: string;
          match_id: string;
          set_number: number;
          home_set_score: number;
          away_set_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          match_id: string;
          set_number: number;
          home_set_score?: number;
          away_set_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          match_id?: string;
          set_number?: number;
          home_set_score?: number;
          away_set_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_sets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_sets_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          token: string;
          role: MembershipRole;
          expires_at: string;
          created_by: string;
          created_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          token?: string;
          role: MembershipRole;
          expires_at: string;
          created_by?: string;
          created_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          token?: string;
          role?: MembershipRole;
          expires_at?: string;
          created_by?: string;
          created_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      standings: {
        Row: {
          organization_id: string | null;
          tournament_id: string | null;
          team_id: string | null;
          team_name: string | null;
          pj: number | null;
          g: number | null;
          e: number | null;
          p: number | null;
          gf: number | null;
          gc: number | null;
          dg: number | null;
          pts: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_org_invite: {
        Args: { p_token: string };
        Returns: {
          organization_id: string;
          organization_slug: string;
          role: MembershipRole;
        }[];
      };
      is_org_member: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      has_org_role: {
        Args: {
          p_organization_id: string;
          p_roles: MembershipRole[];
        };
        Returns: boolean;
      };
      manages_team: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      membership_role: MembershipRole;
      score_type: ScoreType;
      tournament_status: TournamentStatus;
      match_status: MatchStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
