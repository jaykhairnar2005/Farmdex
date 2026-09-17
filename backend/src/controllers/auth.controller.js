import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { registerUserService, loginUserService } from '../services/auth.service.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Farmer or Buyer account
 * @access  Public
 */
export async function registerController(req, res, next) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const result = await registerUserService(parseResult.data);
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate User and obtain JWT access token
 * @access  Public
 */
export async function loginController(req, res, next) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password format',
      });
    }

    const { email, password } = parseResult.data;
    const result = await loginUserService(email, password);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Fetch authenticated user's profile
 * @access  Private (Requires valid JWT)
 */
export async function getMeController(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}
