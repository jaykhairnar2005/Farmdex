import {
  createOfferSchema,
  counterOfferSchema,
  rejectOfferSchema,
  queryOffersSchema,
} from '../validators/offer.validator.js';
import {
  createOfferService,
  getBuyerOffersService,
  getFarmerOffersService,
  getListingOffersService,
  getOfferByIdService,
  acceptOfferService,
  rejectOfferService,
  counterOfferService,
  cancelOfferService,
} from '../services/offer.service.js';

export async function createOfferController(req, res, next) {
  try {
    const parseResult = createOfferSchema.safeParse(req.body);
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

    const offer = await createOfferService(req.user.id, req.user.role, parseResult.data);
    return res.status(201).json({
      success: true,
      message: 'Offer submitted successfully',
      data: offer,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBuyerOffersController(req, res, next) {
  try {
    const parseResult = queryOffersSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
      });
    }

    const result = await getBuyerOffersService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFarmerOffersController(req, res, next) {
  try {
    const parseResult = queryOffersSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
      });
    }

    const result = await getFarmerOffersService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getListingOffersController(req, res, next) {
  try {
    const offers = await getListingOffersService(req.params.listingId, req.user.id, req.user.role);
    if (!offers) {
      return res.status(404).json({
        success: false,
        message: 'Produce listing not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOfferByIdController(req, res, next) {
  try {
    const offer = await getOfferByIdService(req.params.id, req.user.id);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized access',
      });
    }

    return res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptOfferController(req, res, next) {
  try {
    const updated = await acceptOfferService(req.params.id, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized access',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offer accepted successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectOfferController(req, res, next) {
  try {
    const parseResult = rejectOfferSchema.safeParse(req.body);
    const reason = parseResult.success ? parseResult.data.reason : req.body.reason;

    const updated = await rejectOfferService(req.params.id, req.user.id, reason);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized access',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offer rejected',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function counterOfferController(req, res, next) {
  try {
    const parseResult = counterOfferSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid counteroffer parameters',
      });
    }

    const updated = await counterOfferService(req.params.id, req.user.id, parseResult.data);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized access',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Counteroffer submitted successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelOfferController(req, res, next) {
  try {
    const updated = await cancelOfferService(req.params.id, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or unauthorized access',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offer cancelled successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
