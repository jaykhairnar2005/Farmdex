import { Router } from 'express';
import {
  createCropListingController,
  getPublicListingsController,
  getFarmerListingsController,
  getListingByIdController,
  updateCropListingController,
  updateListingStatusController,
  uploadListingImageController,
  deleteListingImageController,
  deleteCropListingController,
} from '../controllers/cropListing.controller.js';
import { getListingOffersController } from '../controllers/offer.controller.js';
import {
  authenticateToken,
  authorizeRoles,
  optionalAuthenticateToken,
} from '../middleware/auth.middleware.js';
import { singleImageUpload } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * @route   GET /api/crop-listings
 * @desc    Public browse & search marketplace crop listings
 * @access  Public
 */
router.get('/', getPublicListingsController);

/**
 * @route   POST /api/crop-listings
 * @desc    Create a new Crop Listing
 * @access  Private (FARMER role)
 */
router.post('/', authenticateToken, authorizeRoles('FARMER'), createCropListingController);

/**
 * CRITICAL: /mine MUST be mounted BEFORE /:id to prevent route shadowing
 * @route   GET /api/crop-listings/mine
 * @desc    Retrieve all listings owned by authenticated farmer
 * @access  Private (FARMER role)
 */
router.get('/mine', authenticateToken, authorizeRoles('FARMER'), getFarmerListingsController);

/**
 * @route   GET /api/crop-listings/:id
 * @desc    Public detail view of single crop listing
 * @access  Public (Optional auth for owner visibility of draft/inactive)
 */
router.get('/:id', optionalAuthenticateToken, getListingByIdController);

/**
 * @route   GET /api/crop-listings/:listingId/offers
 * @desc    Get offers on a crop listing (Farmer sees all, Buyer sees own)
 * @access  Private
 */
router.get('/:listingId/offers', authenticateToken, getListingOffersController);

/**
 * @route   PUT /api/crop-listings/:id
 * @desc    Update crop listing details
 * @access  Private (FARMER role, ownership isolation enforced in service)
 */
router.put('/:id', authenticateToken, authorizeRoles('FARMER'), updateCropListingController);

/**
 * @route   PATCH /api/crop-listings/:id/status
 * @desc    Update listing status (ACTIVE, INACTIVE, SOLD_OUT, ARCHIVED)
 * @access  Private (FARMER role, ownership isolation enforced in service)
 */
router.patch('/:id/status', authenticateToken, authorizeRoles('FARMER'), updateListingStatusController);

/**
 * @route   POST /api/crop-listings/:id/images
 * @desc    Upload an image for a crop listing
 * @access  Private (FARMER role, ownership isolation enforced in service)
 */
router.post(
  '/:id/images',
  authenticateToken,
  authorizeRoles('FARMER'),
  singleImageUpload('image'),
  uploadListingImageController
);

/**
 * @route   DELETE /api/crop-listings/:id/images/:imageId
 * @desc    Delete an image from a crop listing
 * @access  Private (FARMER role, ownership isolation enforced in service)
 */
router.delete(
  '/:id/images/:imageId',
  authenticateToken,
  authorizeRoles('FARMER'),
  deleteListingImageController
);

/**
 * @route   DELETE /api/crop-listings/:id
 * @desc    Delete a crop listing
 * @access  Private (FARMER role, ownership isolation enforced in service)
 */
router.delete('/:id', authenticateToken, authorizeRoles('FARMER'), deleteCropListingController);

export default router;
