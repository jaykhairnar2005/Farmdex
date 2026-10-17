import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sprout,
  MapPin,
  Calendar,
  ShieldCheck,
  Tractor,
  Tag,
  CheckCircle2,
  Package,
  Layers,
  User,
  AlertCircle,
  Edit,
  Handshake,
  Check,
  MessageSquare,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MakeOfferModal from '../components/MakeOfferModal';
import { useAuth } from '../hooks/useAuth';
import { fetchCropListingByIdApi, fetchListingOffersApi, startConversationApi } from '../services/api';

export default function CropDetail() {
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
    if (!user) {
      navigate('/login');
      return;
    }
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
    } catch (err) {
      navigate('/messages');
    } finally {
      setStartingChat(false);
    }
  };

  const loadOffers = async () => {
    if (!user) return;
    try {
      const res = await fetchListingOffersApi(id);
      if (res.success && Array.isArray(res.data)) {
        setMyOffers(res.data);
      }
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
          setError(res.message || 'Crop listing not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to retrieve produce details');
      } finally {
        setLoading(false);
      }
    }
    loadListing();
    if (user) {
      loadOffers();
    }
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 text-center font-mono text-sm text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading produce specifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Produce Not Available</h2>
          <p className="text-sm text-slate-400">{error || 'This listing does not exist or has been archived.'}</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.productImages || [];
  const farmer = listing.farmerProfile;
  const isOwner = user?.id && farmer?.userId === user.id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>

          {isOwner && (
            <Link
              to="/my-listings"
              className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" /> Manage this listing in My Listings
            </Link>
          )}
        </div>

        {/* Produce Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIdx]?.imageUrl}
                  alt={listing.cropName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-2 bg-gradient-to-br from-slate-950 to-slate-900">
                  <Sprout className="w-16 h-16 text-emerald-500/20" />
                  <p className="text-xs font-mono text-slate-500">No photos uploaded for this produce</p>
                </div>
              )}

              {listing.isOrganic && (
                <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                  100% CERTIFIED ORGANIC
                </span>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                      selectedImageIdx === idx ? 'border-emerald-500 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Listing Specifications & Farmer Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {listing.category?.name}
                </span>
                {listing.quality && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {listing.quality}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">{listing.cropName}</h1>

              {listing.location && (
                <p className="text-sm text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{listing.location}</span>
                </p>
              )}
            </div>

            {/* Pricing & Stock Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-slate-400 block">Offer Price</span>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    ₹{Number(listing.pricePerUnit).toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-slate-400"> / {listing.unit}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Available Batch</span>
                  <div className="text-xl font-bold text-slate-100 font-mono">
                    {Number(listing.quantity).toLocaleString('en-IN')} {listing.unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Harvest Date:</span>
                  <span className="text-slate-200">
                    {listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString('en-IN') : 'Recent Harvest'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Listing Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{listing.status}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Produce Description
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Origin Farm Card */}
            {listing.farm && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3.5 text-xs">
                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 flex-shrink-0">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">{listing.farm.name}</h4>
                  <p className="text-slate-400">
                    {[listing.farm.address, listing.farm.district, listing.farm.state, listing.farm.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Farmer Profile Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{farmer?.user?.name || farmer?.farmName}</h4>
                    <p className="text-xs text-slate-400">
                      {[farmer?.district, farmer?.state].filter(Boolean).join(', ') || 'Verified Agricultural Producer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{farmer?.verificationStatus || 'VERIFIED'}</span>
                </div>
              </div>

              {/* Trade Negotiation Action Section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                {offerSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{offerSuccessMessage}</span>
                  </div>
                )}

                {isOwner ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Incoming Buyer Offers:</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {myOffers.length} {myOffers.length === 1 ? 'offer' : 'offers'}
                      </span>
                    </div>
                    <Link
                      to="/offers"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-center block transition-all shadow-md"
                    >
                      Manage &amp; Respond to Offers
                    </Link>
                  </div>
                ) : user?.role === 'BUYER' ? (
                  (() => {
                    const activeOffer = myOffers.find((o) => ['PENDING', 'COUNTERED'].includes(o.status));
                    const acceptedOffer = myOffers.find((o) => o.status === 'ACCEPTED');

                    if (activeOffer) {
                      return (
                        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-300 font-semibold">Active Negotiation</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 uppercase">
                              {activeOffer.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 font-mono">
                            <span>Your Offer: ₹{Number(activeOffer.offeredPrice).toLocaleString('en-IN')}/{listing.unit}</span>
                            <span>{Number(activeOffer.quantity)} {listing.unit}</span>
                          </div>
                          {activeOffer.message && (
                            <p className="text-[11px] text-slate-400 italic font-mono bg-slate-950/80 p-2 rounded">
                              {activeOffer.message}
                            </p>
                          )}
                          <Link
                            to="/offers"
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-center block transition-all shadow-md"
                          >
                            Open Offers Dashboard
                          </Link>
                        </div>
                      );
                    }

                    if (acceptedOffer) {
                      return (
                        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-emerald-400 font-semibold">
                            <span>Trade Offer Accepted!</span>
                            <span className="font-mono">₹{Number(acceptedOffer.offeredPrice).toLocaleString('en-IN')}/{listing.unit}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Your offer of ₹{Number(acceptedOffer.offeredPrice)} for {Number(acceptedOffer.quantity)} {listing.unit} was accepted by the farmer.
                          </p>
                          <Link
                            to="/offers"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-center block transition-all shadow-md"
                          >
                            View Negotiation Details
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOfferModalOpen(true)}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                          <Handshake className="w-4 h-4" />
                          <span>Place Trade Offer / Negotiate</span>
                        </button>
                        <button
                          onClick={handleMessageFarmer}
                          disabled={startingChat}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer text-sm"
                          title="Message Farmer directly"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span className="hidden sm:inline">Message</span>
                        </button>
                      </div>
                    );
                  })()
                ) : !user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl text-center block transition-colors border border-slate-700"
                    >
                      Log In as Buyer to Place an Offer
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <MakeOfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        listing={listing}
        onSuccess={(createdOffer) => {
          setOfferSuccessMessage(`Your offer of ₹${Number(createdOffer.offeredPrice).toLocaleString('en-IN')}/${listing.unit} was submitted to the farmer!`);
          loadOffers();
        }}
      />
    </div>
  );
}

