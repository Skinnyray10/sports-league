/**
 * Tipos del schema reescrito (0001_init + 0002_org_invites).
 * Generados a mano para el cliente Supabase tipado.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MembershipRole = "admin" | "team_manager" | "referee";
export type ScoreType = "goals" | "points" | "sets";
export type TournamentStatus = "registration" | "active" | "finished";
export type MatchStatus =
  | "programado"
  | "en_vivo"
  | "finalizado"
  | "aplazado"
  | "cancelado";
export type Branch = "varonil" | "femenil" | "mixto";
export type ApprovalStatus = "pendiente" | "aprobado" | "rechazado";
export type EligibilityStatus = "pendiente" | "elegible" | "no_elegible";
export type MatchEventType =
  | "gol"
  | "pts"
  | "carrera"
  | "amonestacion"
  | "expulsion";
export type ProtestStatus =
  | "pendiente"
  | "en_revision"
  | "resuelta"
  | "rechazada";
export type NoticeAudience = "general" | "sport" | "club";
export type ScheduleChangeType = "reprogramar" | "aplazar" | "cancelar";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string,
          name: string,
          slug: string,
          settings: Json,
          is_public: boolean,
          logo_url: string | null,
          tagline: string | null,
          created_by: string,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          name?: string,
          slug?: string,
          settings?: Json,
          is_public?: boolean,
          logo_url?: string | null,
          tagline?: string | null,
          created_by?: string,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          name?: string,
          slug?: string,
          settings?: Json,
          is_public?: boolean,
          logo_url?: string | null,
          tagline?: string | null,
          created_by?: string,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      }
      sports: {
        Row: {
          id: string,
          key: string,
          name: string,
          points_win: number,
          points_draw: number,
          points_loss: number,
          points_shootout_win: number,
          points_shootout_loss: number,
          allows_draws: boolean,
          draw_requires_shootout: boolean,
          score_type: ScoreType,
          created_at: string
        };
        Insert: {
          id?: string,
          key?: string,
          name?: string,
          points_win?: number,
          points_draw?: number,
          points_loss?: number,
          points_shootout_win?: number,
          points_shootout_loss?: number,
          allows_draws?: boolean,
          draw_requires_shootout?: boolean,
          score_type?: ScoreType,
          created_at?: string
        };
        Update: {
          id?: string,
          key?: string,
          name?: string,
          points_win?: number,
          points_draw?: number,
          points_loss?: number,
          points_shootout_win?: number,
          points_shootout_loss?: number,
          allows_draws?: boolean,
          draw_requires_shootout?: boolean,
          score_type?: ScoreType,
          created_at?: string
        };
        Relationships: [];
      }
      org_sports: {
        Row: {
          id: string,
          organization_id: string,
          sport_id: string,
          active: boolean,
          points_win: number | null,
          points_draw: number | null,
          points_loss: number | null,
          points_shootout_win: number | null,
          points_shootout_loss: number | null,
          draw_requires_shootout: boolean | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          sport_id?: string,
          active?: boolean,
          points_win?: number | null,
          points_draw?: number | null,
          points_loss?: number | null,
          points_shootout_win?: number | null,
          points_shootout_loss?: number | null,
          draw_requires_shootout?: boolean | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          sport_id?: string,
          active?: boolean,
          points_win?: number | null,
          points_draw?: number | null,
          points_loss?: number | null,
          points_shootout_win?: number | null,
          points_shootout_loss?: number | null,
          draw_requires_shootout?: boolean | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "org_sports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_sports_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          }
        ];
      }
      org_sport_branches: {
        Row: {
          id: string,
          organization_id: string,
          sport_id: string,
          branch: Branch,
          active: boolean,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          sport_id?: string,
          branch?: Branch,
          active?: boolean,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          sport_id?: string,
          branch?: Branch,
          active?: boolean,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "org_sport_branches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_sport_branches_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          }
        ];
      }
      categories: {
        Row: {
          id: string,
          organization_id: string,
          name: string,
          sort_order: number,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          name?: string,
          sort_order?: number,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          name?: string,
          sort_order?: number,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      profiles: {
        Row: {
          id: string,
          nombre: string,
          apellido: string,
          avatar_url: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          nombre?: string,
          apellido?: string,
          avatar_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          nombre?: string,
          apellido?: string,
          avatar_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [];
      }
      clubs: {
        Row: {
          id: string,
          organization_id: string,
          name: string,
          logo_url: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          name?: string,
          logo_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          name?: string,
          logo_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "clubs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      tournaments: {
        Row: {
          id: string,
          organization_id: string,
          name: string,
          season: string,
          format: string,
          legs: number,
          status: TournamentStatus,
          start_date: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          name?: string,
          season?: string,
          format?: string,
          legs?: number,
          status?: TournamentStatus,
          start_date?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          name?: string,
          season?: string,
          format?: string,
          legs?: number,
          status?: TournamentStatus,
          start_date?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "tournaments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      divisions: {
        Row: {
          id: string,
          organization_id: string,
          tournament_id: string,
          sport_id: string,
          branch: Branch,
          category_id: string,
          name: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          tournament_id?: string,
          sport_id?: string,
          branch?: Branch,
          category_id?: string,
          name?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          tournament_id?: string,
          sport_id?: string,
          branch?: Branch,
          category_id?: string,
          name?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "divisions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "divisions_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "divisions_sport_id_fkey";
            columns: ["sport_id"];
            isOneToOne: false;
            referencedRelation: "sports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "divisions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      }
      groups: {
        Row: {
          id: string,
          organization_id: string,
          division_id: string,
          name: string,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          division_id?: string,
          name?: string,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          division_id?: string,
          name?: string,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "groups_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          }
        ];
      }
      teams: {
        Row: {
          id: string,
          organization_id: string,
          club_id: string,
          division_id: string,
          group_id: string | null,
          name: string,
          logo_url: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          club_id?: string,
          division_id?: string,
          group_id?: string | null,
          name?: string,
          logo_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          club_id?: string,
          division_id?: string,
          group_id?: string | null,
          name?: string,
          logo_url?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          }
        ];
      }
      memberships: {
        Row: {
          id: string,
          user_id: string,
          organization_id: string,
          team_id: string | null,
          role: MembershipRole,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          user_id?: string,
          organization_id?: string,
          team_id?: string | null,
          role?: MembershipRole,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          user_id?: string,
          organization_id?: string,
          team_id?: string | null,
          role?: MembershipRole,
          created_at?: string,
          updated_at?: string
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
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      }
      membership_requests: {
        Row: {
          id: string;
          organization_id: string;
          club_id: string | null;
          user_id: string;
          email: string;
          full_name: string;
          username: string | null;
          phone: string | null;
          requested_role: MembershipRole;
          status: ApprovalStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          club_id?: string | null;
          user_id: string;
          email: string;
          full_name: string;
          username?: string | null;
          phone?: string | null;
          requested_role: MembershipRole;
          status?: ApprovalStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          club_id?: string | null;
          user_id?: string;
          email?: string;
          full_name?: string;
          username?: string | null;
          phone?: string | null;
          requested_role?: MembershipRole;
          status?: ApprovalStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "membership_requests_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      }
      players: {
        Row: {
          id: string,
          organization_id: string,
          club_id: string,
          first_names: string,
          last_names: string,
          id_number: string | null,
          photo_url: string | null,
          classification: string | null,
          profile_id: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          club_id?: string,
          first_names?: string,
          last_names?: string,
          id_number?: string | null,
          photo_url?: string | null,
          classification?: string | null,
          profile_id?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          club_id?: string,
          first_names?: string,
          last_names?: string,
          id_number?: string | null,
          photo_url?: string | null,
          classification?: string | null,
          profile_id?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "players_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "players_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "players_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      }
      player_registrations: {
        Row: {
          id: string,
          organization_id: string,
          player_id: string,
          team_id: string,
          jersey_number: number | null,
          status: ApprovalStatus,
          eligibility: EligibilityStatus,
          folio: string,
          reviewed_by: string | null,
          reviewed_at: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          player_id?: string,
          team_id?: string,
          jersey_number?: number | null,
          status?: ApprovalStatus,
          eligibility?: EligibilityStatus,
          folio?: string,
          reviewed_by?: string | null,
          reviewed_at?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          player_id?: string,
          team_id?: string,
          jersey_number?: number | null,
          status?: ApprovalStatus,
          eligibility?: EligibilityStatus,
          folio?: string,
          reviewed_by?: string | null,
          reviewed_at?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "player_registrations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_registrations_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_registrations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
      matches: {
        Row: {
          id: string,
          organization_id: string,
          tournament_id: string,
          division_id: string,
          group_id: string | null,
          home_team_id: string,
          away_team_id: string,
          jornada: number | null,
          stage: string,
          scheduled_at: string | null,
          venue: string | null,
          referee_id: string | null,
          status: MatchStatus,
          status_reason: string | null,
          home_score: number,
          away_score: number,
          shootout_winner_team_id: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          tournament_id?: string,
          division_id?: string,
          group_id?: string | null,
          home_team_id?: string,
          away_team_id?: string,
          jornada?: number | null,
          stage?: string,
          scheduled_at?: string | null,
          venue?: string | null,
          referee_id?: string | null,
          status?: MatchStatus,
          status_reason?: string | null,
          home_score?: number,
          away_score?: number,
          shootout_winner_team_id?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          tournament_id?: string,
          division_id?: string,
          group_id?: string | null,
          home_team_id?: string,
          away_team_id?: string,
          jornada?: number | null,
          stage?: string,
          scheduled_at?: string | null,
          venue?: string | null,
          referee_id?: string | null,
          status?: MatchStatus,
          status_reason?: string | null,
          home_score?: number,
          away_score?: number,
          shootout_winner_team_id?: string | null,
          created_at?: string,
          updated_at?: string
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
            foreignKeyName: "matches_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
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
          {
            foreignKeyName: "matches_shootout_winner_team_id_fkey";
            columns: ["shootout_winner_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
      match_schedule_changes: {
        Row: {
          id: string,
          organization_id: string,
          match_id: string,
          change_type: ScheduleChangeType,
          reason: string | null,
          previous_scheduled_at: string | null,
          new_scheduled_at: string | null,
          previous_venue: string | null,
          new_venue: string | null,
          previous_status: MatchStatus | null,
          new_status: MatchStatus | null,
          changed_by: string,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          change_type?: ScheduleChangeType,
          reason?: string | null,
          previous_scheduled_at?: string | null,
          new_scheduled_at?: string | null,
          previous_venue?: string | null,
          new_venue?: string | null,
          previous_status?: MatchStatus | null,
          new_status?: MatchStatus | null,
          changed_by?: string,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          change_type?: ScheduleChangeType,
          reason?: string | null,
          previous_scheduled_at?: string | null,
          new_scheduled_at?: string | null,
          previous_venue?: string | null,
          new_venue?: string | null,
          previous_status?: MatchStatus | null,
          new_status?: MatchStatus | null,
          changed_by?: string,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "match_schedule_changes_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_schedule_changes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      match_sheets: {
        Row: {
          id: string,
          organization_id: string,
          match_id: string,
          observations: string | null,
          referee_name: string | null,
          closed_at: string | null,
          closed_by: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          observations?: string | null,
          referee_name?: string | null,
          closed_at?: string | null,
          closed_by?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          observations?: string | null,
          referee_name?: string | null,
          closed_at?: string | null,
          closed_by?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "match_sheets_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_sheets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      match_participants: {
        Row: {
          id: string,
          organization_id: string,
          match_sheet_id: string,
          player_registration_id: string,
          team_id: string,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_sheet_id?: string,
          player_registration_id?: string,
          team_id?: string,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_sheet_id?: string,
          player_registration_id?: string,
          team_id?: string,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "match_participants_match_sheet_id_fkey";
            columns: ["match_sheet_id"];
            isOneToOne: false;
            referencedRelation: "match_sheets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_participants_player_registration_id_fkey";
            columns: ["player_registration_id"];
            isOneToOne: false;
            referencedRelation: "player_registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_participants_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
      match_events: {
        Row: {
          id: string,
          organization_id: string,
          match_sheet_id: string,
          player_registration_id: string,
          team_id: string,
          event_type: MatchEventType,
          quantity: number,
          minute: number | null,
          note: string | null,
          created_at: string,
          created_by: string | null
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_sheet_id?: string,
          player_registration_id?: string,
          team_id?: string,
          event_type?: MatchEventType,
          quantity?: number,
          minute?: number | null,
          note?: string | null,
          created_at?: string,
          created_by?: string | null
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_sheet_id?: string,
          player_registration_id?: string,
          team_id?: string,
          event_type?: MatchEventType,
          quantity?: number,
          minute?: number | null,
          note?: string | null,
          created_at?: string,
          created_by?: string | null
        };
        Relationships: [
          {
            foreignKeyName: "match_events_match_sheet_id_fkey";
            columns: ["match_sheet_id"];
            isOneToOne: false;
            referencedRelation: "match_sheets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_player_registration_id_fkey";
            columns: ["player_registration_id"];
            isOneToOne: false;
            referencedRelation: "player_registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
      match_sets: {
        Row: {
          id: string,
          organization_id: string,
          match_id: string,
          set_number: number,
          home_set_score: number,
          away_set_score: number,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          set_number?: number,
          home_set_score?: number,
          away_set_score?: number,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_id?: string,
          set_number?: number,
          home_set_score?: number,
          away_set_score?: number,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "match_sets_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      }
      sanctions: {
        Row: {
          id: string,
          organization_id: string,
          player_registration_id: string,
          team_id: string,
          match_event_id: string | null,
          reason: string,
          jornada: number | null,
          sanction: string,
          created_by: string | null,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          player_registration_id?: string,
          team_id?: string,
          match_event_id?: string | null,
          reason?: string,
          jornada?: number | null,
          sanction?: string,
          created_by?: string | null,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          player_registration_id?: string,
          team_id?: string,
          match_event_id?: string | null,
          reason?: string,
          jornada?: number | null,
          sanction?: string,
          created_by?: string | null,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "sanctions_player_registration_id_fkey";
            columns: ["player_registration_id"];
            isOneToOne: false;
            referencedRelation: "player_registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
      bracket_slots: {
        Row: {
          id: string,
          organization_id: string,
          division_id: string,
          stage: string,
          slot: number,
          seed_position: number | null,
          match_id: string | null,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          division_id?: string,
          stage?: string,
          slot?: number,
          seed_position?: number | null,
          match_id?: string | null,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          division_id?: string,
          stage?: string,
          slot?: number,
          seed_position?: number | null,
          match_id?: string | null,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "bracket_slots_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bracket_slots_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      }
      protests: {
        Row: {
          id: string,
          organization_id: string,
          match_id: string | null,
          team_id: string,
          reason: string,
          description: string | null,
          status: ProtestStatus,
          response: string | null,
          filed_by: string,
          reviewed_by: string | null,
          reviewed_at: string | null,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          match_id?: string | null,
          team_id?: string,
          reason?: string,
          description?: string | null,
          status?: ProtestStatus,
          response?: string | null,
          filed_by?: string,
          reviewed_by?: string | null,
          reviewed_at?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          match_id?: string | null,
          team_id?: string,
          reason?: string,
          description?: string | null,
          status?: ProtestStatus,
          response?: string | null,
          filed_by?: string,
          reviewed_by?: string | null,
          reviewed_at?: string | null,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "protests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "protests_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      }
      protest_evidence: {
        Row: {
          id: string,
          organization_id: string,
          protest_id: string,
          storage_path: string,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          protest_id?: string,
          storage_path?: string,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          protest_id?: string,
          storage_path?: string,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "protest_evidence_protest_id_fkey";
            columns: ["protest_id"];
            isOneToOne: false;
            referencedRelation: "protests";
            referencedColumns: ["id"];
          }
        ];
      }
      notices: {
        Row: {
          id: string,
          organization_id: string,
          title: string,
          body: string,
          audience: NoticeAudience,
          target_sport_id: string | null,
          target_club_id: string | null,
          featured: boolean,
          is_public: boolean,
          published_at: string | null,
          created_by: string,
          created_at: string,
          updated_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          title?: string,
          body?: string,
          audience?: NoticeAudience,
          target_sport_id?: string | null,
          target_club_id?: string | null,
          featured?: boolean,
          is_public?: boolean,
          published_at?: string | null,
          created_by?: string,
          created_at?: string,
          updated_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          title?: string,
          body?: string,
          audience?: NoticeAudience,
          target_sport_id?: string | null,
          target_club_id?: string | null,
          featured?: boolean,
          is_public?: boolean,
          published_at?: string | null,
          created_by?: string,
          created_at?: string,
          updated_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "notices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      notifications: {
        Row: {
          id: string,
          organization_id: string,
          user_id: string,
          title: string,
          body: string | null,
          link: string | null,
          read_at: string | null,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          user_id?: string,
          title?: string,
          body?: string | null,
          link?: string | null,
          read_at?: string | null,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          user_id?: string,
          title?: string,
          body?: string | null,
          link?: string | null,
          read_at?: string | null,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      audit_log: {
        Row: {
          id: string,
          organization_id: string,
          actor_id: string | null,
          action: string,
          entity_type: string,
          entity_id: string | null,
          diff: Json | null,
          created_at: string
        };
        Insert: {
          id?: string,
          organization_id?: string,
          actor_id?: string | null,
          action?: string,
          entity_type?: string,
          entity_id?: string | null,
          diff?: Json | null,
          created_at?: string
        };
        Update: {
          id?: string,
          organization_id?: string,
          actor_id?: string | null,
          action?: string,
          entity_type?: string,
          entity_id?: string | null,
          diff?: Json | null,
          created_at?: string
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      organization_invites: {
        Row: {
          id: string,
          organization_id: string,
          token: string,
          role: MembershipRole,
          team_id: string | null,
          expires_at: string,
          created_by: string,
          created_at: string,
          accepted_at: string | null,
          accepted_by: string | null
        };
        Insert: {
          id?: string,
          organization_id?: string,
          token?: string,
          role?: MembershipRole,
          team_id?: string | null,
          expires_at?: string,
          created_by?: string,
          created_at?: string,
          accepted_at?: string | null,
          accepted_by?: string | null
        };
        Update: {
          id?: string,
          organization_id?: string,
          token?: string,
          role?: MembershipRole,
          team_id?: string | null,
          expires_at?: string,
          created_by?: string,
          created_at?: string,
          accepted_at?: string | null,
          accepted_by?: string | null
        };
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_invites_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      }
    };
    Views: {
      standings: {
        Row: {
          organization_id: string,
          division_id: string,
          group_id: string | null,
          tournament_id: string,
          sport_id: string,
          branch: Branch,
          category_id: string,
          team_id: string,
          team_name: string,
          jugados: number,
          ganados: number,
          perdidos: number,
          empatados: number,
          empates_ganados: number,
          empates_perdidos: number,
          a_favor: number,
          en_contra: number,
          diferencia: number,
          puntos: number
        };
        Relationships: [];
      }
      scorers: {
        Row: {
          organization_id: string,
          division_id: string,
          group_id: string | null,
          player_registration_id: string,
          first_names: string,
          last_names: string,
          team_id: string,
          team_name: string,
          anotaciones: number | null
        };
        Relationships: [];
      }
      cross_results: {
        Row: {
          organization_id: string,
          division_id: string,
          group_id: string | null,
          home_team_id: string,
          away_team_id: string,
          home_score: number,
          away_score: number,
          shootout_winner_team_id: string | null,
          jornada: number | null,
          match_id: string
        };
        Relationships: [];
      }
      public_matches: {
        Row: {
          org_slug: string,
          id: string,
          scheduled_at: string | null,
          venue: string | null,
          jornada: number | null,
          stage: string,
          status: MatchStatus,
          home_score: number,
          away_score: number,
          home_team_name: string,
          away_team_name: string,
          sport_key: string,
          sport_name: string,
          branch: Branch,
          category_name: string,
          group_name: string | null
        };
        Relationships: [];
      }
      public_standings: {
        Row: {
          org_slug: string,
          organization_id: string,
          division_id: string,
          group_id: string | null,
          tournament_id: string,
          sport_id: string,
          sport_key: string,
          branch: Branch,
          category_id: string,
          category_name: string,
          group_name: string | null,
          team_id: string,
          team_name: string,
          jugados: number,
          ganados: number,
          perdidos: number,
          empatados: number,
          empates_ganados: number,
          empates_perdidos: number,
          a_favor: number,
          en_contra: number,
          diferencia: number,
          puntos: number
        };
        Relationships: [];
      }
      public_scorers: {
        Row: {
          org_slug: string,
          organization_id: string,
          division_id: string,
          group_id: string | null,
          sport_key: string,
          branch: Branch,
          category_name: string,
          player_registration_id: string,
          first_names: string,
          last_names: string,
          team_id: string,
          team_name: string,
          anotaciones: number | null
        };
        Relationships: [];
      }
      public_notices: {
        Row: {
          org_slug: string,
          id: string,
          title: string,
          body: string,
          audience: NoticeAudience,
          featured: boolean,
          published_at: string | null
        };
        Relationships: [];
      }
      public_organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tagline: string | null;
          logo_url: string | null;
        };
        Relationships: [];
      }
      public_clubs: {
        Row: {
          org_slug: string;
          organization_id: string;
          organization_name: string;
          club_id: string;
          club_name: string;
        };
        Relationships: [];
      }
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
      approve_membership_request: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      reject_membership_request: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      validate_credential: {
        Args: { p_folio: string };
        Returns: {
          folio: string;
          first_names: string;
          last_names: string;
          photo_url: string | null;
          team_name: string;
          club_name: string;
          sport_name: string;
          branch: Branch;
          category_name: string;
          classification: string | null;
          status: ApprovalStatus;
          eligibility: EligibilityStatus;
          is_valid: boolean;
        }[];
      };
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean };
      has_org_role: {
        Args: { p_organization_id: string; p_roles: MembershipRole[] };
        Returns: boolean;
      };
      manages_team: { Args: { p_team_id: string }; Returns: boolean };
      is_assigned_referee: { Args: { p_match_id: string }; Returns: boolean };
    };
    Enums: {
      membership_role: MembershipRole;
      score_type: ScoreType;
      tournament_status: TournamentStatus;
      match_status: MatchStatus;
      branch: Branch;
      approval_status: ApprovalStatus;
      eligibility_status: EligibilityStatus;
      match_event_type: MatchEventType;
      protest_status: ProtestStatus;
      notice_audience: NoticeAudience;
      schedule_change_type: ScheduleChangeType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
