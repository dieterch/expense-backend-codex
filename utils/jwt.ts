// utils/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// Function to create a signed JWT
export const createToken = async (
  payload: JWTPayload,
  secret: Uint8Array,
  expiresIn = '24h'
): Promise<string> => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret)
}

// Function to verify and decode a JWT
export const verifyToken = async (
  token: string | null,
  secret: Uint8Array
): Promise<JWTPayload | null> => {
  try {
    if (token) {
      // console.log('token:', token)
      // console.log('secret:', secret)
      const { payload } = await jwtVerify(token, secret)
      return payload
    }
    return null
  } catch (error) {
    console.error('Invalid token:', error)
    return null
  }
}
