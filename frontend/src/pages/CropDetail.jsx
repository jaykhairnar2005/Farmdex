import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MapPin, Tractor, CheckCircle2, Package, AlertCircle,
  Edit, Handshake, Check, MessageSquare, Leaf, ShieldCheck, Shield,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button, ButtonLink, Badge, Card, EmptyState, PageSpinner, InlineAlert } from '../components/ui';
import MakeOfferModal from '../components/MakeOfferModal';
import { useAuth } from '../hooks/useAuth';
import { fetchCropListingByIdApi, fetchListingOffersApi, startConversationApi } from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function CropDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [myOffers, setMyOffers] = useState([]);
  const [offerSuccessMessage, setOfferSuccessMessage] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  const handleMessageFarmer = async () => {
    if (!user) { navigate('/login'); return; }
    const farmerUserId = listing?.farmerProfile?.user?.id || listing?.farmerProfile?.userId;
    if (!farmerUserId) return;
    try {
      setStartingChat(true);
      const res = await startConversationApi(farmerUserId);
      if (res.success && res.data) {
        navigate('/messages', { state: { conversationId: res.data.id } });
      } else {
        navigate('/messages');
      }
    } catch {
      navigate('/messages');
    } finally {
      setStartingChat(false);
    }
  };

  const loadOffers = async () => {
    if (!user) return;
    try {
      const res = await fetchListingOffersApi(id);
      if (res.success && Array.isArray(res.data)) setMyOffers(res.data);
    } catch (err) {
      console.warn('Could not load offers for this listing:', err.message);
    }
  };

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchCropListingByIdApi(id);
        if (res.success && res.data) {
          setListing(res.data);
        } else {
          setError(res.message || t('common.error', 'Crop listing not found'));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('common.error', 'Failed to retrieve produce details'));
      } finally {
        setLoading(false);
      }
    }
    loadListing();
    if (user) loadOffers();
  }, [id, user, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1"><PageSpinner message={t('common.loading', 'Loading produce details...')} /></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={AlertCircle}
            title={t('common.noResults', 'Produce not available')}
            message={error || t('marketplace.noProduceDesc', 'This listing does not exist or has been archived.')}
            action={{ label: t('cropDetail.back', 'Back to marketplace'), onClick: () => navigate('/marketplace') }}
            className="max-w-md"
          />
        </div>
      </div>
    );
  }

  const images = listing.productImages || [];
  const farmer = listing.farmerProfile;
  const isOwner = user?.id && farmer?.userId === user.id;
  const primaryImg =
    images.length > 0 && images[selectedImageIdx]?.imageUrl
      ? images[selectedImageIdx].imageUrl
      : getCropImageUrl(listing.cropName, listing.category?.name);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 flex-1 fade-in">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between">
          <Link to="/marketplace" className="text-sm text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> {t('cropDetail.back', 'Back to marketplace')}
          </Link>
          {isOwner && (
            <Link to="/my-listings" className="text-sm text-brand-800 hover:text-brand-900 font-medium flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> {t('cropDetail.editListing', 'Edit Produce Batch')}
            </Link>
          )}
        </nav>

        {/* Main two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-muted border border-line shadow-card">
              <img
                src={primaryImg}
                alt={listing.cropName}
                onError={(e) => handleImageFallback(e, listing.cropName, listing.category?.name)}
                className="w-full h-full object-cover"
              />
              {listing.isOrganic && (
                <span className="absolute top-4 left-4">
                  <Badge colour="brand" icon={<Leaf className="w-3.5 h-3.5" />}>
                    {t('cropDetail.organicCertified', 'Certified Organic')}
                  </Badge>
                </span>
              )}
              {listing.quality && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-md bg-surface/95 text-ink border border-line backdrop-blur-sm">
                  {t('marketplace.grade', { grade: listing.quality, defaultValue: `Grade ${listing.quality}` })}
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                      selectedImageIdx === idx ? 'border-brand-800' : 'border-line opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.imageUrl}
                      alt=""
                      onError={(e) => handleImageFallback(e, listing.cropName, listing.category?.name)}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <Badge>{listing.category?.name}</Badge>
                {listing.quality && <Badge colour="info">{t('marketplace.grade', { grade: listing.quality, defaultValue: `Grade ${listing.quality}` })}</Badge>}
                {listing.isOrganic && <Badge colour="brand" icon={<Leaf className="w-3 h-3" />}>{t('marketplace.organic', 'Organic')}</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">{listing.cropName}</h1>
              {listing.location && (
                <p className="text-sm text-ink-muted flex items-center gap-1.5 mt-2">
                  <MapPin className="w-4 h-4 text-brand-700" /> {listing.location}
                </p>
              )}
            </div>

            {/* Pricing card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs text-ink-muted block">{t('common.price', 'Price per unit')}</span>
                  <span className="text-3xl font-semibold text-brand-800">
                    {formatCurrency(listing.pricePerUnit)}
                  </span>
                  <span className="text-sm text-ink-muted ml-1">/ {listing.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink-muted block">{t('marketplace.available', 'Available stock')}</span>
                  <span className="text-lg font-semibold text-ink">
                    {formatNumber(listing.quantity)} {listing.unit}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-line text-xs">
                <div>
                  <span className="text-ink-muted">{t('cropDetail.harvestDate', 'Harvest date')}</span>
                  <p className="text-ink font-medium">
                    {listing.harvestDate ? formatDate(listing.harvestDate) : t('common.justNow', 'Recent')}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">{t('common.status', 'Status')}</span>
                  <p className="text-brand-800 font-semibold uppercase">{listing.status}</p>
                </div>
              </div>
            </Card>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">{t('cropDetail.description', 'Description')}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Farm info */}
            {listing.farm && (
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 text-brand-800 rounded-lg flex items-center justify-center">
                  <Tractor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-ink">{listing.farm.name}</h4>
                  <p className="text-xs text-ink-muted truncate">
                    {[listing.farm.address, listing.farm.district, listing.farm.state, listing.farm.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Farmer / actions card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-surface-muted text-ink-muted rounded-full flex items-center justify-center text-sm font-semibold">
                    {farmer?.user?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-ink truncate">{farmer?.user?.name || farmer?.farmName}</h4>
                    <p className="text-xs text-ink-muted truncate">
                      {[farmer?.district, farmer?.state].filter(Boolean).join(', ') || t('cropDetail.verifiedSeller', 'Verified farmer')}
                    </p>
                  </div>
                </div>
                <Badge colour="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {farmer?.verificationStatus || t('status.verified', 'VERIFIED')}
                </Badge>
              </div>

              <div className="pt-3 border-t border-line space-y-3">
                {offerSuccessMessage && (
                  <InlineAlert type="success" message={offerSuccessMessage} onDismiss={() => setOfferSuccessMessage('')} />
                )}

                {isOwner ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">{t('cropDetail.activeOffersTitle', 'Incoming offers')}</span>
                      <span className="font-semibold text-brand-800">{myOffers.length}</span>
                    </div>
                    <ButtonLink to="/offers" className="w-full">{t('offers.titleFarmer', 'Manage offers')}</ButtonLink>
                  </div>
                ) : user?.role === 'BUYER' ? (
                  (() => {
                    const activeOffer = myOffers.find((o) => ['PENDING', 'COUNTERED'].includes(o.status));
                    const acceptedOffer = myOffers.find((o) => o.status === 'ACCEPTED');

                    if (activeOffer) {
                      return (
                        <div className="p-4 rounded-lg bg-warning-soft border border-warning-edge space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-warning font-semibold">{t('offers.counterOffer', 'Active negotiation')}</span>
                            <Badge colour="warning">{activeOffer.status}</Badge>
                          </div>
                          <p className="text-sm text-warning">
                            {formatCurrency(activeOffer.offeredPrice)}/{listing.unit} × {formatNumber(activeOffer.quantity)} {listing.unit}
                          </p>
                          <ButtonLink to="/offers" variant="secondary" className="w-full">
                            {t('offers.card.counterOffer', 'View negotiation')}
                          </ButtonLink>
                        </div>
                      );
                    }

                    if (acceptedOffer) {
                      return (
                        <div className="p-4 rounded-lg bg-success-soft border border-success-edge space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-success font-semibold">{t('status.accepted', 'Offer accepted!')}</span>
                            <span className="font-medium text-success">
                              {formatCurrency(acceptedOffer.offeredPrice)}/{listing.unit}
                            </span>
                          </div>
                          <ButtonLink to="/offers" className="w-full">
                            {t('offers.card.actions.checkout', 'Proceed to Settlement & Pay')}
                          </ButtonLink>
                        </div>
                      );
                    }

                    return (
                      <div className="flex gap-2">
                        <Button className="flex-1" icon={<Handshake className="w-4 h-4" />} onClick={() => setOfferModalOpen(true)}>
                          {t('cropDetail.makeOffer', 'Make an offer')}
                        </Button>
                        <Button
                          variant="secondary"
                          icon={<MessageSquare className="w-4 h-4 text-brand-800" />}
                          onClick={handleMessageFarmer}
                          loading={startingChat}
                        >
                          <span className="hidden sm:inline">{t('cropDetail.messageFarmer', 'Message')}</span>
                        </Button>
                      </div>
                    );
                  })()
                ) : !user ? (
                  <ButtonLink to="/login" variant="secondary" className="w-full">
                    {t('auth.signInTitle', 'Sign in to place an offer')}
                  </ButtonLink>
                ) : null}
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom info section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-line">
          <InfoCard icon={Package} title={t('cropDetail.cropDetailsTitle', 'Produce specifications')}>
            <Row label={t('common.filter', 'Category')} value={listing.category?.name} />
            <Row label={t('cropDetail.qualityStandard', 'Quality Grade')} value={listing.quality || 'Standard'} />
            <Row label={t('modals.cropListing.isOrganic', 'Certified Organic')} value={listing.isOrganic ? t('common.yes', 'Yes') : t('common.no', 'No')} />
            <Row label={t('marketplace.available', 'Available stock')} value={`${formatNumber(listing.quantity)} ${listing.unit}`} last />
          </InfoCard>

          <InfoCard icon={Handshake} title={t('footer.howItWorks', 'How trade works')}>
            <Step n={1} text={t('home.features.directDesc', 'Connect directly with verified farmers')} />
            <Step n={2} text={t('home.features.negotiationDesc', 'Place formal offers, receive counter-offers')} />
            <Step n={3} text={t('home.features.settlementDesc', 'Secure test payments with instant receipt generation')} />
            <Step n={4} text={t('home.features.trackingDesc', 'Real-time 4-stage tracking from farm gate dispatch')} last />
          </InfoCard>

          <InfoCard icon={Shield} title={t('home.benefits.secureSettlements', 'Protected Payments')}>
            <Bullet text={t('modals.checkout.paymentNotice', 'Uses secure Razorpay test payment simulation')} />
            <Bullet text={t('orders.subtitle', 'Track purchase orders, confirm settlements, and follow carrier dispatch')} />
            <Bullet text={t('messages.subtitle', 'Direct negotiation with farmers and verified buyers')} last />
          </InfoCard>
        </div>
      </main>

      <Footer />

      <MakeOfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        listing={listing}
        onSuccess={(createdOffer) => {
          setOfferSuccessMessage(`Your offer of ₹${Number(createdOffer.offeredPrice).toLocaleString('en-IN')}/${listing.unit} was submitted.`);
          loadOffers();
        }}
      />
    </div>
  );
}

/* ── Local helpers ─────────────────────────────────────────── */
function InfoCard({ icon: Icon, title, children }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2.5 text-ink font-semibold text-sm">
        <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        {title}
      </div>
      <div className="space-y-0">{children}</div>
    </Card>
  );
}

function Row({ label, value, last }) {
  return (
    <div className={`flex justify-between py-1.5 text-xs ${last ? '' : 'border-b border-line/60'}`}>
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function Step({ n, text, last }) {
  return (
    <div className={`flex items-start gap-2.5 py-1.5 ${last ? '' : 'border-b border-line/60'}`}>
      <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-800 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-xs text-ink-muted leading-relaxed">{text}</span>
    </div>
  );
}

function Bullet({ text, last }) {
  return (
    <div className={`flex items-start gap-2 py-1.5 ${last ? '' : 'border-b border-line/60'}`}>
      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
      <span className="text-xs text-ink-muted leading-relaxed">{text}</span>
    </div>
  );
}
