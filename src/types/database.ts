// Database types matching Supabase schema
// These types can be auto-generated using `supabase gen types typescript`

export interface Database {
  public: {
    Tables: {
      apartments: {
        Row: {
          id: string;
          number: string;
          pin_hash: string;
          owner_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          pin_hash: string;
          owner_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          pin_hash?: string;
          owner_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      voting_issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          active: boolean;
          created_at: string;
          closed_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          active?: boolean;
          created_at?: string;
          closed_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          active?: boolean;
          created_at?: string;
          closed_at?: string | null;
          created_by?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          issue_id: string;
          apartment_id: string;
          vote: 'yes' | 'no';
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          apartment_id: string;
          vote: 'yes' | 'no';
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          apartment_id?: string;
          vote?: 'yes' | 'no';
          created_at?: string;
        };
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: 'admin' | 'super_admin';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'super_admin';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'admin' | 'super_admin';
          created_at?: string;
        };
      };
    };
    Functions: {
      validate_apartment_credentials: {
        Args: { p_apartment_number: string; p_pin: string };
        Returns: { apartment_id: string; apartment_number: string; owner_name: string }[];
      };
      cast_vote: {
        Args: { p_apartment_id: string; p_issue_id: string; p_vote: string };
        Returns: boolean;
      };
      check_apartment_voted: {
        Args: { p_apartment_id: string; p_issue_id: string };
        Returns: boolean;
      };
      get_vote_results: {
        Args: { p_issue_id: string };
        Returns: { yes_count: number; no_count: number; total_count: number }[];
      };
      get_active_issue: {
        Args: Record<string, never>;
        Returns: { id: string; title: string; description: string; created_at: string }[];
      };
      get_all_issues_with_counts: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          title: string;
          description: string;
          active: boolean;
          created_at: string;
          closed_at: string | null;
          yes_count: number;
          no_count: number;
          total_count: number;
        }[];
      };
      get_votes_by_issue: {
        Args: { p_issue_id: string };
        Returns: {
          vote_id: string;
          apartment_number: string;
          owner_name: string;
          vote: string;
          voted_at: string;
        }[];
      };
      create_issue: {
        Args: { p_title: string; p_description: string; p_active?: boolean };
        Returns: string;
      };
      toggle_issue_active: {
        Args: { p_issue_id: string; p_active: boolean };
        Returns: boolean;
      };
    };
  };
}
