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

    // Helper to decode JWT payload safely (handles base64url and standard base64)
    const extractJwtPayload = (jwt: string): Record<string, unknown> | null => {
      try {
        const parts = jwt.split('.');
        if (parts.length >= 2) {
          const raw = Buffer.from(parts[1], 'base64url').toString('utf-8');
          return JSON.parse(raw);
        }
      } catch {
        try {
          const parts = jwt.split('.');
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const raw = Buffer.from(base64, 'base64').toString('utf-8');
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return null;
    };

    // 1. If explicit userInfo is provided from client-side Google SDK
    if (input.userInfo) {
      email = input.userInfo.email || '';
      name = input.userInfo.name || '';
      googleId = input.userInfo.sub || '';
      avatarUrl = input.userInfo.picture;
    }

    // 2. Decode JWT id_token (fast, reliable, extracts real name, email, picture)
    if ((!email || !name || !googleId) && input.credential) {
      const payload = extractJwtPayload(input.credential);
      if (payload) {
        email = email || String(payload.email || '');
        const fullName =
          payload.name ||
          `${payload.given_name || ''} ${payload.family_name || ''}`.trim() ||
          (email ? email.split('@')[0] : '');
        name = name || String(fullName || '');
        googleId = googleId || String(payload.sub || '');
        avatarUrl = avatarUrl || (payload.picture ? String(payload.picture) : undefined);
      }
    }

    // 3. Fallback: Google tokeninfo verification endpoint
    if ((!email || !googleId) && input.credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.credential)}`
        );
        if (verifyRes.ok) {
          const googleData = await verifyRes.json();
          email = email || googleData.email || '';
          name = name || googleData.name || googleData.given_name || (email ? email.split('@')[0] : '');
          googleId = googleId || googleData.sub || '';
          avatarUrl = avatarUrl || googleData.picture;
        }
      } catch (e) {
        console.warn('Google tokeninfo verification failed:', e);
      }
    }

    if (!email || !googleId) {
      throw new Error('Missing Google profile information (email or Google user ID)');
    }

    // 4. Check if user already exists by googleId or by email
    let user = await this.userRepo.findByGoogleId(googleId);

    if (!user) {
      user = await this.userRepo.findByEmail(email);
      if (user) {
        // Link Google ID to existing email account
        user.googleId = googleId;
        if (name && (!user.name || user.name === 'Farmer' || user.name === 'Farmer User')) {
          user.name = name;
        }
        if (avatarUrl && !user.avatarUrl) {
          user.avatarUrl = avatarUrl;
        }
        await user.save();
      } else {
        // Check authentication mode: if user is attempting to login without registering first, reject
        const mode = input.mode || 'login';
        if (mode === 'login') {
          throw new Error('No registered account found with this Google email. Please register first before logging in.');
        }

        // Create new user via Google Sign-In only when explicitly in registration mode
        user = await this.userRepo.create({
          name: name || email.split('@')[0] || 'Farmer',
          email: email.toLowerCase().trim(),
          authProvider: 'google',
          googleId,
          avatarUrl,
          role: 'farmer',
          preferredLanguage: 'ta',
        });
      }
    } else {
      // User found by googleId: refresh name and avatar if needed
      let changed = false;
      if (name && (!user.name || user.name === 'Farmer' || user.name === 'Farmer User')) {
        user.name = name;
        changed = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        changed = true;
      }
      if (changed) {
        await user.save();
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
