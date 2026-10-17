import { Router } from 'express';
import {
  createOfferController,
  getBuyerOffersController,
  getFarmerOffersController,
  getListingOffersController,
  getOfferByIdController,
  acceptOfferController,
  rejectOfferController,
  counterOfferController,
  cancelOfferController,
} from '../controllers/offer.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/offers
 * @desc    Submit an offer on an active produce listing
 * @access  Private (BUYER role)
 */
router.post('/', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), createOfferController);

/**
 * @route   GET /api/offers/my
 * @desc    Get offers placed by authenticated buyer
 * @access  Private (BUYER role)
 */
router.get('/my', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), getBuyerOffersController);

/**
 * @route   GET /api/offers/farmer
 * @desc    Get incoming offers on farmer's listings
 * @access  Private (FARMER role)
 */
router.get('/farmer', authenticateToken, authorizeRoles('FARMER', 'ADMIN'), getFarmerOffersController);

/**
 * @route   GET /api/offers/listing/:listingId
 * @desc    Get offers for a specific listing (Farmer sees all, Buyer sees own)
 * @access  Private
 */
router.get('/listing/:listingId', authenticateToken, getListingOffersController);

/**
 * @route   GET /api/offers/:id
 * @desc    Get single offer details (Enforces tenant isolation)
 * @access  Private
 */
router.get('/:id', authenticateToken, getOfferByIdController);

/**
 * @route   PATCH /api/offers/:id/accept
 * @desc    Accept an offer (Farmer accepts PENDING; Buyer accepts COUNTERED)
 * @access  Private
 */
router.patch('/:id/accept', authenticateToken, acceptOfferController);

/**
 * @route   PATCH /api/offers/:id/reject
 * @desc    Reject an offer (Farmer or Buyer)
 * @access  Private
 */
router.patch('/:id/reject', authenticateToken, rejectOfferController);

/**
 * @route   PATCH /api/offers/:id/counter
 * @desc    Submit counteroffer (Farmer counters PENDING; Buyer re-counters COUNTERED)
 * @access  Private
 */
router.patch('/:id/counter', authenticateToken, counterOfferController);

/**
 * @route   PATCH /api/offers/:id/cancel
 * @desc    Cancel offer (Buyer only, while PENDING or COUNTERED)
 * @access  Private (BUYER role)
 */
router.patch('/:id/cancel', authenticateToken, cancelOfferController);

export default router;
