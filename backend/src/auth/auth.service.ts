import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Provider } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Generate both access and refresh tokens for a user
   */
  generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, type: 'access' },
      { expiresIn: '1h' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Store hashed refresh token in database
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  /**
   * Remove refresh token from database
   */
  async removeRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Validate user from OAuth and return tokens + user data
   */
  async validateUser(
    email: string, 
    provider: Provider, 
    providerId: string, 
    name?: string
  ) {
    // Find user by providerId first, then by email
    let user = await this.prisma.user.findUnique({
      where: { providerId }
    });

    if (!user) {
      // Check for existing user with same email
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        // Link new provider to existing account
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { provider, providerId, name: name || existingUser.name }
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: { email, name, provider, providerId }
        });
      }
    } else if (name && name !== user.name) {
      // Update name if provided and different
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name }
      });
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user };
  }

  /**
   * Validate refresh token and return user if valid
   */
  async validateRefreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user?.refreshToken) {
        return null;
      }

      const isValidToken = await bcrypt.compare(refreshToken, user.refreshToken);
      return isValidToken ? user : null;

    } catch {
      return null;
    }
  }

  /**
   * Validate access token and return user if valid
   */
  async validateAccessToken(accessToken: string) {
    try {
      const payload = this.jwtService.verify(accessToken);
      
      if (payload.type !== 'access') {
        return null;
      }

      return await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

    } catch {
      return null;
    }
  }

  /**
   * Refresh tokens - validate old refresh token and generate new ones
   */
  async refreshTokens(refreshToken: string) {
    const user = await this.validateRefreshToken(refreshToken);
    
    if (!user) {
      return null;
    }

    const tokens = this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        createdAt: user.createdAt,
      }
    };
  }

  /**
   * Revoke refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      await this.removeRefreshToken(payload.sub);
    } catch {
      // Token invalid or expired - ignore
    }
  }
}