import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "USER" | "ADMIN";
      status?: "ACTIVE" | "SUSPENDED" | "DELETED";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
