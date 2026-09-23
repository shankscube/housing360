function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    cookieName: string;
    webOrigin: string;
  };
  security: {
    ssnEncryptionKey: string;
    ssnHashSecret: string;
  };
}

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: required('DB_HOST'),
    port: Number(required('DB_PORT')),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
  },
  auth: {
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    cookieName: process.env.COOKIE_NAME ?? 'h360_auth',
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  },
  security: {
    ssnEncryptionKey: required('SSN_ENCRYPTION_KEY'),
    ssnHashSecret: required('SSN_HASH_SECRET'),
  },
};
