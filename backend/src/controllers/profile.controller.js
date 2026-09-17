import { updateFarmerProfileSchema, updateBuyerProfileSchema } from '../validators/profile.validator.js';
import { getMeProfileService, updateFarmerProfileService, updateBuyerProfileService } from '../services/profile.service.js';

/**
 * @route   GET /api/profiles/me
 * @desc    Get authenticated user's full profile details
 * @access  Private (All authenticated roles)
 */
export async function getMeProfileController(req, res, next) {
  try {
    const profile = await getMeProfileService(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/profiles/farmer
 * @desc    Update farmer-specific profile fields (Partial update)
 * @access  Private (FARMER role)
 */
export async function updateFarmerProfileController(req, res, next) {
  try {
    const parseResult = updateFarmerProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const updatedProfile = await updateFarmerProfileService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/profiles/buyer
 * @desc    Update buyer-specific profile fields (Partial update)
 * @access  Private (BUYER role)
 */
export async function updateBuyerProfileController(req, res, next) {
  try {
    const parseResult = updateBuyerProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const updatedProfile = await updateBuyerProfileService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      message: 'Buyer profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
}
