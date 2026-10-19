import 'dotenv/config';
import path from 'path';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const dbPath = path.resolve(process.cwd(), 'dev.db').replace(/\\/g, '/');
const url = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')
  ? process.env.DATABASE_URL
  : `file:${dbPath}`;

const adapter = new PrismaLibSql({ url });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
