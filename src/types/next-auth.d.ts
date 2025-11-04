/* eslint-disable */

import NextAuth from "next-auth/next";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      surname?: string;
      name?: string;
      username?: string;
      accessToken: string; 
      tokenExpiry: number;
    };
  }

  interface User {
    id: string;
    token: string; 
  }
}

