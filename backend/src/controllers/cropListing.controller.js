import {
  createCropListingSchema,
  updateCropListingSchema,
  updateListingStatusSchema,
  marketplaceQuerySchema,
  farmerListingsQuerySchema,
} from '../validators/cropListing.validator.js';
import {
  createCropListingService,
  getPublicListingsService,
  getListingByIdService,
  getFarmerListingsService,
  updateCropListingService,
  updateListingStatusService,
  addListingImageService,
  deleteListingImageService,
  deleteCropListingService,
} from '../services/cropListing.service.js';

/**
 * @route   POST /api/crop-listings
 * @desc    Create a new Crop Listing
 * @access  Private (FARMER role)
 */
export async function createCropListingController(req, res, next) {
  try {
    const parseResult = createCropListingSchema.safeParse(req.body);
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

    const listing = await createCropListingService(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      message: 'Crop listing created successfully',
      data: listing,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/crop-listings
 * @desc    Browse public marketplace listings with search, filters and pagination
 * @access  Public
 */
export async function getPublicListingsController(req, res, next) {
  try {
    const parseResult = marketplaceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query filter parameters',
        errors: parseResult.error.issues,
      });
    }

    const result = await getPublicListingsService(parseResult.data);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/crop-listings/mine
 * @desc    Fetch all listings belonging to current authenticated farmer
 * @access  Private (FARMER role)
 */
export async function getFarmerListingsController(req, res, next) {
  try {
    const parseResult = farmerListingsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: parseResult.error.issues,
      });
    }

    const result = await getFarmerListingsService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/crop-listings/:id
 * @desc    Get detailed crop listing by ID
 * @access  Public
 */
export async function getListingByIdController(req, res, next) {
  try {
    const listing = await getListingByIdService(req.params.id, req.user?.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found or is currently unavailable',
      });
    }

    return res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/crop-listings/:id
 * @desc    Update crop listing details (Enforces farmer ownership)
 * @access  Private (FARMER role)
 */
export async function updateCropListingController(req, res, next) {
  try {
    const parseResult = updateCropListingSchema.safeParse(req.body);
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

    const updated = await updateCropListingService(req.params.id, req.user.id, parseResult.data);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Crop listing updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/crop-listings/:id/status
 * @desc    Transition crop listing status (Enforces farmer ownership)
 * @access  Private (FARMER role)
 */
export async function updateListingStatusController(req, res, next) {
  try {
    const parseResult = updateListingStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid status transition',
      });
    }

    const updated = await updateListingStatusService(req.params.id, req.user.id, parseResult.data.status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Crop listing status changed to ${parseResult.data.status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/crop-listings/:id/images
 * @desc    Upload an image for a farmer's crop listing
 * @access  Private (FARMER role)
 */
export async function uploadListingImageController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please attach an image file.',
      });
    }

    const image = await addListingImageService(req.params.id, req.user.id, req.file.buffer);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: image,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/crop-listings/:id/images/:imageId
 * @desc    Remove an image from a farmer's crop listing
 * @access  Private (FARMER role)
 */
export async function deleteListingImageController(req, res, next) {
  try {
    const deleted = await deleteListingImageService(req.params.id, req.params.imageId, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Image or listing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/crop-listings/:id
 * @desc    Delete a crop listing
 * @access  Private (FARMER role)
 */
export async function deleteCropListingController(req, res, next) {
  try {
    const deleted = await deleteCropListingService(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Crop listing deleted successfully',
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
}

