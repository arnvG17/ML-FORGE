export interface AgentToken {
  type: "token" | "done" | "error";
  content: string;
  session_id: string;
}

export interface AgentGenerateRequest {
  session_id: string;
  intent: string;
}

export interface AgentGenerateResponse {
  session_id: string;
  script: string;
  domain: string;
  fingerprint: string;
}
