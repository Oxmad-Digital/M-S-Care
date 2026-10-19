import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import net from "node:net";
import ws from "ws";

// Neon publie des adresses IPv6 et IPv4 : sur un réseau sans IPv6, Node abandonne
// chaque adresse après 250 ms par défaut, trop court quand la connexion IPv4 en
// prend déjà ~200, et toutes les tentatives finissent en ETIMEDOUT.
net.setDefaultAutoSelectFamilyAttemptTimeout(1000);

neonConfig.webSocketConstructor = ws;
// Les requêtes simples passent par HTTPS ; les transactions conservent
// une connexion WebSocket dédiée via le même adaptateur.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
