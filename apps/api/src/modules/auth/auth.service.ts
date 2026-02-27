import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import type { JwtPayload, AuthTokens } from '@edwix/shared';
import type { RegisterInput, LoginInput } from '@edwix/shared';
import { UserRole } from '@edwix/shared';

const SALT_ROUNDS = 12;

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 86400000);
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await authRepository.createUser({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role || UserRole.TECHNICIAN,
    });

    const tokens = await this.createTokenPair(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(input.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.createTokenPair(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await authRepository.findRefreshToken(refreshToken);
    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new UnauthorizedError('User not found or deactivated');
    }

    // Rotate: delete old, create new
    await authRepository.deleteRefreshToken(refreshToken);
    return this.createTokenPair(user.id, user.email, user.role);
  },

  async logout(refreshToken: string): Promise<void> {
    await authRepository.deleteRefreshToken(refreshToken);
  },

  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  },

  async createTokenPair(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshTokenString();

    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));
    await authRepository.createRefreshToken({
      token: refreshTokenStr,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenStr };
  },
};
