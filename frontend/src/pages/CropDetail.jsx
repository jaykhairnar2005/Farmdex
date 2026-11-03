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

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 fade-in">
        {/* Breadcrumb & Lot Bar */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between">
          <Link to="/marketplace" className="text-xs sm:text-sm text-ink-muted hover:text-brand-800 dark:hover:text-lime-400 flex items-center gap-1.5 transition-colors font-semibold">
            <ArrowLeft className="w-4 h-4" /> {t('cropDetail.back', 'Back to Marketplace')}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-ink-subtle font-mono">Lot #{listing.id.slice(0, 8)}</span>
            {isOwner && (
              <Link to="/my-listings" className="text-xs sm:text-sm text-brand-800 dark:text-lime-400 font-bold flex items-center gap-1.5 hover:underline">
                <Edit className="w-3.5 h-3.5" /> {t('cropDetail.editListing', 'Edit Produce Batch')}
              </Link>
            )}
          </div>
        </nav>

        {/* Main two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-muted border border-line shadow-card">
              <img
                src={primaryImg}
                alt={listing.cropName}
                onError={(e) => handleImageFallback(e, listing.cropName, listing.category?.name)}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Badges on image */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {listing.isOrganic && (
                  <Badge colour="lime" icon={<Leaf className="w-3.5 h-3.5" />}>
                    {t('cropDetail.organicCertified', 'Certified Organic')}
                  </Badge>
                )}
                <Badge colour="brand">
                  {listing.category?.name || 'Agri Commodity'}
                </Badge>
              </div>

              {listing.quality && (
                <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-lg bg-surface/95 text-ink border border-line backdrop-blur-md shadow-md">
                  {t('marketplace.grade', { grade: listing.quality, defaultValue: `Grade ${listing.quality}` })}
                </span>
              )}

              {listing.location && (
                <div className="absolute bottom-3 left-4 text-xs text-white font-medium flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5 text-lime-400" />
                  <span>{listing.location}</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                      selectedImageIdx === idx ? 'border-brand-800 dark:border-lime-400 ring-2 ring-brand-500/20 shadow-md' : 'border-line opacity-60 hover:opacity-100'
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

          {/* Details & Trade Action */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400 border border-brand-200/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" /> Verified Farm Source
                </span>
                <span className="text-xs text-ink-subtle">•</span>
                <span className="text-xs text-ink-muted">Listed {listing.createdAt ? formatDate(listing.createdAt) : 'Recently'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">{listing.cropName}</h1>
            </div>

            {/* Pricing card */}
            <Card className="p-6 space-y-4 rounded-2xl border border-line shadow-card">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block">{t('common.price', 'Base Mandi Price')}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-brand-800 dark:text-lime-400 font-mono">
                      {formatCurrency(listing.pricePerUnit)}
                    </span>
                    <span className="text-sm font-semibold text-ink-subtle">/ {listing.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-ink-subtle font-semibold block">{t('marketplace.available', 'Available Stock')}</span>
                  <span className="inline-block text-base font-extrabold text-ink bg-surface-muted px-3 py-1 rounded-xl border border-line mt-1 font-mono">
                    {formatNumber(listing.quantity)} {listing.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line text-xs">
                <div>
                  <span className="text-ink-subtle font-medium">{t('cropDetail.harvestDate', 'Harvest date')}</span>
                  <p className="text-ink font-bold mt-0.5">
                    {listing.harvestDate ? formatDate(listing.harvestDate) : t('common.justNow', 'Recent Harvest')}
                  </p>
                </div>
                <div>
                  <span className="text-ink-subtle font-medium">{t('common.status', 'Trading Status')}</span>
                  <p className="text-brand-800 dark:text-lime-400 font-extrabold uppercase mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                    {listing.status}
                  </p>
                </div>
              </div>
            </Card>

            {/* Description */}
            {listing.description && (
              <div className="bg-surface-muted/50 rounded-2xl p-5 border border-line">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle mb-2 font-heading">{t('cropDetail.description', 'Produce Specifications')}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Farm info */}
            {listing.farm && (
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-card">
                <div className="w-11 h-11 bg-brand-50 dark:bg-brand-900/40 text-brand-800 dark:text-lime-400 rounded-xl flex items-center justify-center border border-brand-200/50 shrink-0">
                  <Tractor className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold">Origin Farm Holding</div>
                  <h4 className="text-sm font-bold text-ink truncate font-heading">{listing.farm.name}</h4>
                  <p className="text-xs text-ink-muted truncate mt-0.5">
                    {[listing.farm.address, listing.farm.district, listing.farm.state, listing.farm.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Farmer / actions card */}
            <Card className="p-6 space-y-4 rounded-2xl border border-line shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-brand-800 text-white rounded-xl flex items-center justify-center text-base font-bold shadow-sm">
                    {farmer?.user?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate font-heading">{farmer?.user?.name || farmer?.farmName}</h4>
                    <p className="text-xs text-ink-muted truncate">
                      {[farmer?.district, farmer?.state].filter(Boolean).join(', ') || t('cropDetail.verifiedSeller', 'Verified Agricultural Producer')}
                    </p>
                  </div>
                </div>
                <Badge colour="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {farmer?.verificationStatus || t('status.verified', 'VERIFIED')}
                </Badge>
              </div>

              <div className="pt-4 border-t border-line space-y-3">
                {offerSuccessMessage && (
                  <InlineAlert type="success" message={offerSuccessMessage} onDismiss={() => setOfferSuccessMessage('')} />
                )}

                {isOwner ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm py-1">
                      <span className="text-ink-muted">{t('cropDetail.activeOffersTitle', 'Incoming Trade Offers')}</span>
                      <span className="font-extrabold text-brand-800 dark:text-lime-400 font-mono text-base">{myOffers.length} Offers</span>
                    </div>
                    <ButtonLink to="/offers" className="w-full justify-center">{t('offers.titleFarmer', 'Manage Offers & Bids')}</ButtonLink>
                  </div>
                ) : user?.role === 'BUYER' ? (
                  (() => {
                    const activeOffer = myOffers.find((o) => ['PENDING', 'COUNTERED'].includes(o.status));
                    const acceptedOffer = myOffers.find((o) => o.status === 'ACCEPTED');

                    if (activeOffer) {
                      return (
                        <div className="p-4 rounded-xl bg-warning-soft border border-warning-edge space-y-2.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-warning font-bold flex items-center gap-1.5">
                              <Handshake className="w-4 h-4" /> Active Negotiation In Progress
                            </span>
                            <Badge colour="warning">{activeOffer.status}</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-warning/90">
                            Current offered rate: <strong className="font-mono">{formatCurrency(activeOffer.offeredPrice)}/{listing.unit}</strong> for {formatNumber(activeOffer.quantity)} {listing.unit}
                          </p>
                          <ButtonLink to="/offers" variant="secondary" className="w-full justify-center">
                            {t('offers.card.counterOffer', 'View Negotiation Desk')}
                          </ButtonLink>
                        </div>
                      );
                    }

                    if (acceptedOffer) {
                      return (
                        <div className="p-4 rounded-xl bg-success-soft border border-success-edge space-y-2.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-success font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Offer Accepted by Farmer!
                            </span>
                            <span className="font-extrabold text-success font-mono">
                              {formatCurrency(acceptedOffer.offeredPrice)}/{listing.unit}
                            </span>
                          </div>
                          <ButtonLink to="/offers" className="w-full justify-center bg-brand-800 text-white font-bold">
                            {t('offers.card.actions.checkout', 'Proceed to Settlement & Waybill')}
                          </ButtonLink>
                        </div>
                      );
                    }

                    return (
                      <div className="flex gap-2.5">
                        <Button className="flex-1 justify-center" icon={<Handshake className="w-4 h-4" />} onClick={() => setOfferModalOpen(true)}>
                          {t('cropDetail.makeOffer', 'Place Trade Offer')}
                        </Button>
                        <Button
                          variant="secondary"
                          icon={<MessageSquare className="w-4 h-4 text-brand-800 dark:text-lime-400" />}
                          onClick={handleMessageFarmer}
                          loading={startingChat}
                        >
                          <span className="hidden sm:inline">{t('cropDetail.messageFarmer', 'Message')}</span>
                        </Button>
                      </div>
                    );
                  })()
                ) : !user ? (
                  <ButtonLink to="/login" variant="secondary" className="w-full justify-center">
                    {t('auth.signInTitle', 'Sign in to Place Trade Offer')}
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
