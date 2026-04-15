import { jwtVerify, SignJWT } from "jose";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type EmailTokenPurpose = "unsubscribe" | "resubscribe";

export type EmailTokenClaims = {
  purpose: EmailTokenPurpose;
  userId: string;
};

const getSecret = (): Uint8Array => {
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error("AUTH_SECRET is not set; cannot sign email tokens");
  }
  return new TextEncoder().encode(raw);
};

export const signEmailToken = async (
  userId: string,
  purpose: EmailTokenPurpose,
): Promise<string> => {
  return await new SignJWT({ purpose, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_YEAR_SECONDS}s`)
    .sign(getSecret());
};

// Returns null on any verification failure (expired, malformed, wrong sig,
// missing claims). Never throws — callers can just check for null.
export const verifyEmailToken = async (
  token: string,
): Promise<EmailTokenClaims | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId !== "string" ||
      (payload.purpose !== "unsubscribe" && payload.purpose !== "resubscribe")
    ) {
      return null;
    }
    return { userId: payload.userId, purpose: payload.purpose };
  } catch {
    return null;
  }
};
