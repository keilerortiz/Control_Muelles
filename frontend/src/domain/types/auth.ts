export type RoleCode =
  | "ADMIN"
  | "CONSULTOR"
  | "PLANEADOR"
  | "SUPERVISOR"
  | "PORTERIA"
  | string;

export interface AuthUser {
  id?: number | string;
  name: string;
  email?: string;
  roles: RoleCode[];
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string | null;
}
