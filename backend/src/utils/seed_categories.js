import prisma from '../config/db.js';

export const standardIndianCategories = [
  {
    name: 'Grains & Cereals',
    description: 'Wheat, Rice, Barley, Maize, Millets, Sorghum, and other grain staples.',
  },
  {
    name: 'Pulses & Lentils',
    description: 'Chickpeas (Chana), Pigeon Peas (Tur/Arhar), Moong, Urad, Masoor, and Kidney Beans.',
  },
  {
    name: 'Vegetables',
    description: 'Fresh farm vegetables including Onions, Potatoes, Tomatoes, Leafy greens, and root vegetables.',
  },
  {
    name: 'Fruits',
    description: 'Fresh orchard and seasonal fruits including Mangoes, Bananas, Apples, Grapes, and Pomegranates.',
  },
  {
    name: 'Spices',
    description: 'Turmeric, Cardamom, Black Pepper, Cumin, Coriander, Chili, and specialty spices.',
  },
  {
    name: 'Oilseeds',
    description: 'Mustard, Soybean, Groundnut, Sunflower, and Sesame seeds.',
  },
  {
    name: 'Cash Crops & Fiber',
    description: 'Cotton, Sugarcane, Jute, and commercial agricultural produce.',
  },
  {
    name: 'Medicinal & Herbal',
    description: 'Ashwagandha, Tulsi, Aloe Vera, and medicinal agricultural crops.',
  },
];

/**
 * Non-destructive, repeatable seed utility for Indian agricultural categories.
 * Uses unique category name to create or preserve existing categories.
 */
export async function seedCategories() {
  console.log('🌱 Starting idempotent FarmDex category seed...');
  let createdCount = 0;
  let preservedCount = 0;

  for (const cat of standardIndianCategories) {
    const existing = await prisma.category.findUnique({
      where: { name: cat.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          isActive: true,
        },
      });
      createdCount++;
      console.log(`  + Created: ${cat.name}`);
    } else {
      preservedCount++;
      if (!existing.description && cat.description) {
        await prisma.category.update({
          where: { id: existing.id },
          data: { description: cat.description },
        });
        console.log(`  ~ Added missing description: ${cat.name}`);
      } else {
        console.log(`  = Already present (preserved): ${cat.name}`);
      }
    }
  }

  console.log(`✅ Category seed complete! (${createdCount} created, ${preservedCount} preserved, ${standardIndianCategories.length} total verified)`);
}

// Direct execution guard
if (process.argv[1]?.endsWith('seed_categories.js') || process.argv[1]?.endsWith('seed.js')) {
  seedCategories()
    .catch((err) => {
      console.error('❌ Error seeding categories:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
