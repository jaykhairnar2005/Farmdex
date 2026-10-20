/**
 * Authentic Indian Agricultural Imagery Utility
 * Provides curated, high-resolution photography of real crops, grains, and produce
 * for the FarmDex marketplace, ensuring zero broken placeholders or empty states.
 */

export const CROP_IMAGE_MAP = {
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80', // Fresh ripe mangoes
  kesar: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  alphonso: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80', // Golden Alphonso mangoes
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', // Basmati rice grains
  indrayani: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  paddy: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80', // Lush paddy field
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80', // Golden wheat harvest
  gehu: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  sharbati: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80', // Ripe golden maize cobs
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80', // White cotton field
  kapas: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', // Fresh red farm tomatoes
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80', // Fresh red onions
  pyaz: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', // Farm harvested potatoes
  aloo: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  mustard: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80', // Yellow blooming mustard
  sarson: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80', // Soybean crop
  chana: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80', // Chickpeas / pulses
  gram: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
  dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
  turmeric: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80', // Raw turmeric
  haldi: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
  chili: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80', // Red chillies
  mirch: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=800&q=80', // Sugarcane stalks
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80', // Farm fresh bananas
  pomegranate: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?auto=format&fit=crop&w=800&q=80', // Bhagwa pomegranate
};

export const CATEGORY_IMAGE_MAP = {
  'grains & cereals': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  'cash crops & fiber': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80',
  'fruits & vegetables': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
  'pulses & legumes': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
  'oilseeds': 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
  'spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_FARM_HERO_IMAGE = 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=1200&q=80';
export const DEFAULT_CROP_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80';

/**
 * Returns a high-res authentic image URL for a crop listing.
 * Checks existing imageUrl first, then checks crop name keyword, then category name, then default.
 */
export function getCropImageUrl(cropName = '', categoryName = '', existingUrl = null) {
  if (existingUrl && typeof existingUrl === 'string' && existingUrl.trim().startsWith('http')) {
    return existingUrl.trim();
  }

  const nameLower = (cropName || '').toLowerCase();
  for (const [key, url] of Object.entries(CROP_IMAGE_MAP)) {
    if (nameLower.includes(key)) {
      return url;
    }
  }

  const catLower = (categoryName || '').toLowerCase();
  for (const [catKey, url] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (catLower.includes(catKey)) {
      return url;
    }
  }

  return DEFAULT_CROP_IMAGE;
}

/**
 * Image onError handler to prevent broken image icons and infinite loops.
 */
export function handleImageFallback(e, cropName = '', categoryName = '') {
  if (e.target.dataset.fallbackApplied === 'true') {
    return;
  }
  e.target.dataset.fallbackApplied = 'true';
  e.target.src = getCropImageUrl(cropName, categoryName, null);
}
