export type PrivateRoutePath =
  | "/consultor"
  | "/admin"
  | "/planeador"
  | "/supervisor"
  | "/portero"
  | "/vista-operativa-muelles";

export interface RouteConfigItem {
  path: string;
  element: JSX.Element;
}

export interface RouteConfig {
  public: RouteConfigItem[];
  private: Array<RouteConfigItem & { path: PrivateRoutePath }>;
  root: JSX.Element;
}
