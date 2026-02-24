import "next-auth";

/**
 * Extend Auth.js session types.
 * Adds user.id to the session object.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
