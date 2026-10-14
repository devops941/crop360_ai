import { userRepository, UserRepository } from '@/repositories/user.repository';
import { RegisterInput, LoginInput, GoogleAuthInput } from '@/validators/auth.validator';
import { hashPassword, verifyPassword, signAuthToken, toSafeUser } from '@/lib/auth';
import { SafeUser } from '@/types';

export class AuthService {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository = userRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Register a new user with email & password
   */
  async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const newUser = await this.userRepo.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      authProvider: 'credentials',
      phone: input.phone || undefined,
      role: input.role || 'farmer',
      location: {
        state: input.state || undefined,
        district: input.district || undefined,
      },
      landSizeAcres: input.landSizeAcres,
      preferredLanguage: input.preferredLanguage || 'ta',
    });

    const safeUser = toSafeUser(newUser);
    const token = await signAuthToken({
      userId: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
      authProvider: 'credentials',
    });

    return { user: safeUser, token };
  }

  /**
   * Authenticate user with email & password
   */
  async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const user = await this.userRepo.findByEmail(input.email, true);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
      if (user.authProvider === 'google') {
        throw new Error('This account was registered with Google. Please use Google Sign-In.');
      }
      throw new Error('Invalid email or password');
    }

    const isMatch = await verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const safeUser = toSafeUser(user);
    const token = await signAuthToken({
      userId: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
      authProvider: user.authProvider,
    });

    return { user: safeUser, token };
  }

  /**
   * Handle Google OAuth Sign-in or Account Creation
   */
  async handleGoogleAuth(input: GoogleAuthInput): Promise<{ user: SafeUser; token: string }> {
    let email = '';
    let name = '';
    let googleId = '';
    let avatarUrl: string | undefined = undefined;

    // 1. If explicit userInfo is provided from client-side Google SDK
    if (input.userInfo) {
      email = input.userInfo.email;
      name = input.userInfo.name;
      googleId = input.userInfo.sub;
      avatarUrl = input.userInfo.picture;
    } else if (input.credential) {
      // 1. Verify token with Google's tokeninfo endpoint
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.credential)}`
        );
        if (verifyRes.ok) {
          const googleData = await verifyRes.json();
          email = googleData.email;
          name = googleData.name || googleData.given_name || email.split('@')[0];
          googleId = googleData.sub;
          avatarUrl = googleData.picture;
        } else {
          // Fallback to base64 decoding
          const parts = input.credential.split('.');
          if (parts.length === 3) {
            const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
            const payload = JSON.parse(payloadJson);
            email = payload.email;
            name = payload.name;
            googleId = payload.sub;
            avatarUrl = payload.picture;
          }
        }
      } catch {
        // Fallback to base64 decoding
        const parts = input.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
          avatarUrl = payload.picture;
        }
      }
    }

    if (!email || !googleId) {
      throw new Error('Missing Google profile information (email or Google user ID)');
    }

    // 2. Check if user already exists by googleId or by email
    let user = await this.userRepo.findByGoogleId(googleId);

    if (!user) {
      user = await this.userRepo.findByEmail(email);
      if (user) {
        // Link Google ID to existing email account
        user.googleId = googleId;
        if (avatarUrl && !user.avatarUrl) {
          user.avatarUrl = avatarUrl;
        }
        await user.save();
      } else {
        // Create new user via Google Sign-In
        user = await this.userRepo.create({
          name: name || 'Farmer',
          email: email.toLowerCase().trim(),
          authProvider: 'google',
          googleId,
          avatarUrl,
          role: 'farmer',
          preferredLanguage: 'ta',
        });
      }
    }

    const safeUser = toSafeUser(user);
    const token = await signAuthToken({
      userId: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
      authProvider: 'google',
    });

    return { user: safeUser, token };
  }

  /**
   * Fetch current user profile by ID
   */
  async getCurrentUser(userId: string): Promise<SafeUser | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) return null;
    return toSafeUser(user);
  }
}

export const authService = new AuthService();
