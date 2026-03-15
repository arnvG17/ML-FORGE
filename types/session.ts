export type SessionStatus =
  | "idle"
  | "thinking"
  | "writing"
  | "running"
  | "fixing"
  | "done"
  | "error";

export interface Session {
  id: string;
  name: string;
  user_id: string;
  status: SessionStatus;
  last_algorithm: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionCreate {
  name: string;
}

export interface SessionUpdate {
  name?: string;
  status?: SessionStatus;
  last_algorithm?: string;
}
