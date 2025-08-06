import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      firstName?: string;
      lastName: string;
      role: string;
      organizationId: string;
      organizationSlug: string;
      organizationName: string;
    };
  }

  interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName: string;
    role: string;
    organizationId: string;
    organizationSlug: string;
    organizationName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    firstName?: string;
    lastName: string;
    role: string;
    organizationId: string;
    organizationSlug: string;
    organizationName: string;
  }
}