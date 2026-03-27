import { SignJWT } from 'jose';
import "dotenv/config.js";

console.log('Token Creation:')

const SECRET = new TextEncoder().encode(process.env.NITRO_JWT_SECRET);
const token = await new SignJWT({ role: 'user', username: 'Susi' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('99y')
      .sign(SECRET);

console.log(token)