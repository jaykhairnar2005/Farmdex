import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateAccessToken } from '../utils/token.util.js';
import { formatUserDto, userPublicSelect } from '../utils/userDto.util.js';

/**
 * Register a new User (FARMER or BUYER) with corresponding Profile inside a Prisma transaction
 */
export async function registerUserService(registerData) {
  const {
    name,
    email,
    password,
    phone,
    role,
    farmName,
    farmSize,
    businessName,
    businessType,
    address,
    district,
    state,
    pincode,
  } = registerData;

  // 1. Check for duplicate email
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error('Email address is already registered');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check for duplicate phone if phone is provided
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      const error = new Error('Phone number is already registered');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Hash password using bcryptjs (salt rounds = 10)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 4. Create User + FarmerProfile/BuyerProfile atomically in transaction
  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        role,
        isVerified: false,
        isActive: true,
      },
    });

    if (role === 'FARMER') {
      await tx.farmerProfile.create({
        data: {
          userId: user.id,
          farmName: farmName || null,
          farmSize: farmSize || null,
          address: address || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
        },
      });
    } else if (role === 'BUYER') {
      await tx.buyerProfile.create({
        data: {
          userId: user.id,
          businessName: businessName || null,
          businessType: businessType || null,
          address: address || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
        },
      });
    }

    return user;
  });

  // 5. Query complete user object with profiles
  const fullUser = await prisma.user.findUnique({
    where: { id: createdUser.id },
    select: userPublicSelect,
  });

  // 6. Generate access token
  const token = generateAccessToken(fullUser);

  return {
    user: formatUserDto(fullUser),
    token,
  };
}

/**
 * Login User using email and password
 * Returns consistent non-revealing error message on failure
 */
export async function loginUserService(email, password) {
  // Generic error to prevent account enumeration
  const invalidCredentialsError = new Error('Invalid email or password');
  invalidCredentialsError.statusCode = 401;

  // 1. Find user by email (including passwordHash for verification)
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      farmerProfile: true,
      buyerProfile: true,
    },
  });

  if (!user) {
    throw invalidCredentialsError;
  }

  if (!user.isActive) {
    const inactiveError = new Error('Account has been deactivated');
    inactiveError.statusCode = 401;
    throw inactiveError;
  }

  // 2. Verify password with bcrypt
  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    throw invalidCredentialsError;
  }

  // 3. Generate access token
  const token = generateAccessToken(user);

  return {
    user: formatUserDto(user),
    token,
  };
}
