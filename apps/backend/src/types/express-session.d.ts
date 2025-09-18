import 'express-session';

declare module 'express-session' {
  interface SessionData {
    x_code_verifier?: string;
    // tambahkan field session lain yang kamu pakai
  }
}

declare global {
  namespace Express {
    interface Request {
      session?: import('express-session').Session & Partial<Record<string, any>>;
    }
  }
}
