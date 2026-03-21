import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { JwtPayload } from '../types';

const JWT_SECRET             = process.env.JWT_SECRET             || 'dev-secret';
const JWT_REFRESH_SECRET     = process.env.JWT_REFRESH_SECRET     || 'dev-refresh-secret';
const JWT_EXPIRES_IN         = process.env.JWT_EXPIRES_IN         || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const RP_NAME = 'FinanceControl';
const RP_ID   = process.env.WEBAUTHN_RP_ID  || 'localhost';
const ORIGIN  = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

function generateTokens(payload: JwtPayload) {
  const accessToken  = jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRES_IN } as any);
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);
  return { accessToken, refreshToken };
}

function sanitizeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, active: u.active };
}

export class AuthService {

  async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Este email j\u00E1 est\u00E1 cadastrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword },
    });

    const tokens = generateTokens({ userId: user.id, email: user.email });
    return { user: sanitizeUser(user), ...tokens };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) throw new AppError(401, 'Email ou senha inv\u00E1lidos');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError(401, 'Email ou senha inv\u00E1lidos');

    const tokens = generateTokens({ userId: user.id, email: user.email });
    return { user: sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.active) throw new AppError(401, 'Usu\u00E1rio n\u00E3o encontrado');
      return generateTokens({ userId: user.id, email: user.email });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(401, 'Refresh token inv\u00E1lido ou expirado');
    }
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { transactions: true, cards: true, notifications: true } } },
    });
    if (!user) throw new AppError(404, 'Usu\u00E1rio n\u00E3o encontrado');
    const { password, ...rest } = user;
    return rest;
  }

  // ── WebAuthn ──────────────────────────────────────────

  private async saveChallenge(key: string, challenge: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.webAuthnChallenge.upsert({
      where: { key },
      update: { challenge, expiresAt },
      create: { key, challenge, expiresAt },
    });
    await prisma.webAuthnChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  private async consumeChallenge(key: string): Promise<string> {
    const record = await prisma.webAuthnChallenge.findUnique({ where: { key } });
    if (!record || record.expiresAt < new Date()) {
      throw new AppError(400, 'Challenge expirado ou inv\u00E1lido. Tente novamente.');
    }
    await prisma.webAuthnChallenge.delete({ where: { key } });
    return record.challenge;
  }

  async getPasskeyRegisterOptions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });
    if (!user) throw new AppError(404, 'Usu\u00E1rio n\u00E3o encontrado');

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(userId),
      userName: user.email,
      userDisplayName: user.name,
      excludeCredentials: user.passkeys.map(pk => ({
        id: Buffer.from(pk.credentialId, 'base64url'),
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        residentKey: 'required',
        userVerification: 'required',
      },
    });

    await this.saveChallenge(userId, options.challenge);
    return options;
  }

  async verifyPasskeyRegistration(userId: string, credential: any, deviceName?: string) {
    const expectedChallenge = await this.consumeChallenge(userId);

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new AppError(400, 'Verifica\u00E7\u00E3o biom\u00E9trica falhou');
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        userId,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        deviceName: deviceName || 'Dispositivo',
      },
    });

    return { registered: true };
  }

  async getPasskeyAuthOptions(email?: string) {
    let allowCredentials: any[] = [];
    const challengeKey = email ? `auth_${email}` : `anon_${Date.now()}`;

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { passkeys: true },
      });
      if (user?.passkeys.length) {
        allowCredentials = user.passkeys.map(pk => ({
          id: Buffer.from(pk.credentialId, 'base64url'),
          type: 'public-key' as const,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'required',
    });

    await this.saveChallenge(challengeKey, options.challenge);
    return { ...options, challengeKey };
  }

  async verifyPasskeyAuth(assertion: any, challengeKey: string) {
    const expectedChallenge = await this.consumeChallenge(challengeKey);

    const credentialId = assertion.id as string;
    const passkey = await prisma.passkey.findUnique({ where: { credentialId } });
    if (!passkey) throw new AppError(401, 'Passkey n\u00E3o cadastrada');

    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(passkey.credentialId, 'base64url'),
        credentialPublicKey: passkey.publicKey,
        counter: Number(passkey.counter),
      },
      requireUserVerification: true,
    });

    if (!verification.verified) throw new AppError(401, 'Autentica\u00E7\u00E3o biom\u00E9trica falhou');

    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({ where: { id: passkey.userId } });
    if (!user || !user.active) throw new AppError(401, 'Usu\u00E1rio n\u00E3o encontrado ou inativo');

    const tokens = generateTokens({ userId: user.id, email: user.email });
    return { user: sanitizeUser(user), ...tokens };
  }

  async listPasskeys(userId: string) {
    return prisma.passkey.findMany({
      where: { userId },
      select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePasskey(userId: string, passkeyId: string) {
    const passkey = await prisma.passkey.findFirst({ where: { id: passkeyId, userId } });
    if (!passkey) throw new AppError(404, 'Passkey n\u00E3o encontrada');
    await prisma.passkey.delete({ where: { id: passkeyId } });
    return { deleted: true };
  }
}

export const authService = new AuthService();
