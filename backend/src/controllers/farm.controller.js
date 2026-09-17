import { createFarmSchema, updateFarmSchema } from '../validators/farm.validator.js';
import {
  createFarmService,
  getFarmerFarmsService,
  getFarmByIdAndOwnerService,
  updateFarmService,
  deleteFarmService,
} from '../services/farm.service.js';

/**
 * @route   POST /api/farms
 * @desc    Create a new Farm record
 * @access  Private (FARMER role)
 */
export async function createFarmController(req, res, next) {
  try {
    const parseResult = createFarmSchema.safeParse(req.body);
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

    const farm = await createFarmService(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: farm,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/farms
 * @desc    List all farms owned by authenticated farmer
 * @access  Private (FARMER role)
 */
export async function getFarmerFarmsController(req, res, next) {
  try {
    const farms = await getFarmerFarmsService(req.user.id);
    return res.status(200).json({
      success: true,
      data: farms,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/farms/:id
 * @desc    Get single farm details (Enforces authenticated farmer ownership)
 * @access  Private (FARMER role)
 */
export async function getFarmByIdController(req, res, next) {
  try {
    const farm = await getFarmByIdAndOwnerService(req.params.id, req.user.id);
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: farm,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/farms/:id
 * @desc    Update farm details (Enforces authenticated farmer ownership)
 * @access  Private (FARMER role)
 */
export async function updateFarmController(req, res, next) {
  try {
    const parseResult = updateFarmSchema.safeParse(req.body);
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

    const updatedFarm = await updateFarmService(req.params.id, req.user.id, parseResult.data);
    if (!updatedFarm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Farm updated successfully',
      data: updatedFarm,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/farms/:id
 * @desc    Delete farm record (Enforces farmer ownership and active crop listing safeguards)
 * @access  Private (FARMER role)
 */
export async function deleteFarmController(req, res, next) {
  try {
    const deletedFarm = await deleteFarmService(req.params.id, req.user.id);
    if (!deletedFarm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Farm deleted successfully',
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}
