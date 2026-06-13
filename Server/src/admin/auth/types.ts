export interface AdminLoginDto {
  login: string; // accepts username or email
  password: string;
}

export interface MenuInfo {
  id: number;
  name: string;
  link: string | null;
  icon: string | null;
  sort_order: number | null;
  parent_id: number | null;
}

export interface PermissionItem {
  id: number;
  menu_id: number;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  upload: boolean;
  download: boolean;
  Menu: MenuInfo;
}

export interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
  permissions: PermissionItem[];
}
