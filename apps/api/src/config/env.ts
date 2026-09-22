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
};
