export interface UserProfile {
  id: string;
  fname: string;
  lname: string;
  email: string;
  phone: string | null;
}

export interface UpdateProfileDto {
  fname?: string;
  lname?: string;
  phone?: string;
}
