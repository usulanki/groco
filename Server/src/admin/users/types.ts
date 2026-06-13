export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_ts: Date;
}

export interface CreateUserDto {
  fname: string;
  lname: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateAddressDto {
  address1: string;
  address2?: string;
  city_id: number;
  state_id: number;
  pincode: string;
}
