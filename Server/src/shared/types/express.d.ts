export {};

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: "admin" | "customer";
    };
    admin?: {
      id: number;
      username: string;
      email: string;
      fname: string;
      lname: string;
      role_id: number;
      store_id: number | null;
      role_code: string;
      outlet_id: number | null;
    };
  }
}
