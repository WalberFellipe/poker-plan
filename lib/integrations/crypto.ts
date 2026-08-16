import crypto from "crypto";

/**
 * Cifragem dos tokens de integração em repouso.
 *
 * Um access token de Jira ou GitHub dá acesso de escrita ao board do time, então
 * ele não fica em texto puro na tabela. A chave deriva de `NEXTAUTH_SECRET`, que
 * o app já exige para rodar — não há segredo novo para gerenciar.
 *
 * Nota: rotacionar `NEXTAUTH_SECRET` invalida os tokens guardados e obriga a
 * reconectar as integrações. É o comportamento correto, mas vale saber.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET é obrigatório para cifrar tokens");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptToken(stored: string): string {
  const [ivPart, tagPart, dataPart] = stored.split(".");
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Token armazenado em formato inválido");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key(),
    Buffer.from(ivPart, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Assina o parâmetro `state` do OAuth, para detectar CSRF na volta. */
export function signState(payload: string): string {
  const mac = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "")
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${mac}`;
}

export function verifyState(state: string): string | null {
  const [payloadPart, mac] = state.split(".");
  if (!payloadPart || !mac) return null;

  const payload = Buffer.from(payloadPart, "base64url").toString("utf8");
  const expected = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "")
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(mac);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return payload;
}
