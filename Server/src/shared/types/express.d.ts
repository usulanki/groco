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
    deliveryAgent?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string | null;
      mobile: string;
      store_id: number | null;
      outlet_id: number | null;
    };
    // Client outlet context — set by outletMiddleware
    outletIds?: number[];  // ordered nearest → farthest
  }
}
