export interface DeliveryLoginDto {
  login: string; // email or mobile
  password: string;
}

export interface DeliveryForgotPasswordDto {
  email: string;
}

export interface DeliveryResetPasswordDto {
  token: string;
  password: string;
}

export interface DeliveryAgentPayload {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string;
  store_id: number | null;
  outlet_id: number | null;
  type: 'delivery';
}

export interface DeliveryAuthTokens {
  agent: DeliveryAgentPayload;
  accessToken: string;
  refreshToken: string;
}
