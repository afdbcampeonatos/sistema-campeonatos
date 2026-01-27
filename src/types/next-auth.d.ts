import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    mustChangePassword: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    mustChangePassword: boolean;
  }
}

