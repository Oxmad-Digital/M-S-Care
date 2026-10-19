const CONNECTION_CODES = new Set([
  "P1001", "P1002", "P1017", "P2024",
  "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_SOCKET",
]);

function isConnectionError(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 4) return false;
  const details = error as Record<string, unknown>;
  if (typeof details.code === "string" && CONNECTION_CODES.has(details.code)) return true;
  if (error.constructor?.name === "ErrorEvent" && details.type === "error") return true;
  // Le pilote peut traverser plusieurs contextes JS ou perdre sourceError
  // lors de son passage dans Prisma ; ne pas dépendre d'instanceof ici.
  if (details.name === "TypeError" && details.message === "fetch failed") return true;
  if (details.name === "NeonDbError" && typeof details.message === "string"
    && details.message.startsWith("Error connecting to database:")) return true;
  return [details.cause, details.error, details.sourceError].some((cause) => isConnectionError(cause, depth + 1))
    || (Array.isArray(details.errors) && details.errors.some((cause) => isConnectionError(cause, depth + 1)));
}

// Réservé aux lectures : une écriture ne doit jamais être rejouée après une
// coupure, car elle peut avoir été enregistrée avant la perte de connexion.
export async function readDatabase<T>(read: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await read();
    } catch (error) {
      if (attempt >= 2 || !isConnectionError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
}
