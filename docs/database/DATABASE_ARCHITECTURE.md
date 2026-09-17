# FarmDex Database Architecture & Domain Specifications

This document defines the production database architecture, domain models, entity relationships, constraints, indexes, cascade deletion policies, and migration instructions for **FarmDex – Real-Time Agricultural Marketplace & Trading Platform**.

---

## 🏛️ 1. Architecture Overview

FarmDex utilizes **PostgreSQL 18** managed via **Prisma ORM (v6.19.3)**. The database schema is fully normalized, type-safe, and designed to maintain strict audit trails and transactional integrity across all trading, auction, negotiation, payment, order fulfillment, and communication sub-domains.

Key design principles:
- **UUID Primary Keys**: Every primary entity uses database-generated UUID v4 strings (`@id @default(uuid())`).
- **Fixed-Point Currency & Precision**: Floating-point types are strictly forbidden for monetary and agricultural quantity data to avoid rounding errors.
- **Enforced Enums**: Controlled finite sets (roles, statuses, types) are enforced via PostgreSQL native `ENUM` types.
- **Historical Immutability**: Historical financial records (`Order`, `OrderItem`, `Payment`, `Delivery`, `Review`, `Message`) use `onDelete: Restrict` or `onDelete: SetNull` to prevent cascading deletion.

---

## 📋 2. Entity Summary (23 Models & 11 Enums)

### Prisma Enums
1. `UserRole`: `FARMER`, `BUYER`, `ADMIN`
2. `BuyerType`: `RETAILER`, `WHOLESALER`, `RESTAURANT`, `CONSUMER`
3. `VerificationStatus`: `PENDING`, `VERIFIED`, `REJECTED`
4. `ListingStatus`: `ACTIVE`, `INACTIVE`, `SOLD_OUT`, `SUSPENDED`, `ARCHIVED`
5. `OfferStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `COUNTERED`, `EXPIRED`, `CANCELLED`
6. `AuctionStatus`: `SCHEDULED`, `ACTIVE`, `ENDED`, `CANCELLED`
7. `OrderStatus`: `PENDING`, `CONFIRMED`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
8. `PaymentStatus`: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`
9. `DeliveryStatus`: `PENDING`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
10. `NotificationType`: `NEW_OFFER`, `OFFER_ACCEPTED`, `OFFER_REJECTED`, `COUNTER_OFFER`, `NEW_BID`, `AUCTION_ENDING`, `NEW_MESSAGE`, `ORDER_CONFIRMED`, `PAYMENT_SUCCESS`, `ORDER_SHIPPED`, `ORDER_DELIVERED`
11. `ComplaintStatus`: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`

---

## 🔗 3. Entity Domain Specifications & Relationships

### A. User & Profile Domain
- `users`: Core authentication identity. Stores hashed passwords, email (`@unique`), phone (`@unique`), role, and verification flags.
- `farmer_profiles`: 1-to-1 extension of `User` for farmers. Tracks farm name, size, address, lat/lng, and `VerificationStatus`.
- `buyer_profiles`: 1-to-1 extension of `User` for buyers. Tracks business name, `BuyerType`, and address.
- `farms`: Belongs to `FarmerProfile` (1-to-many). Allows a single farmer to manage multiple distinct farm locations.

### B. Marketplace & Crop Domain
- `categories`: Marketplace crop taxonomy (`@unique` name).
- `crop_listings`: Agricultural produce listings. Belongs to `FarmerProfile`, `Category`, and optional `Farm`. Contains quantity, price per unit, harvest date, location, and organic indicator.
- `product_images`: 1-to-many child of `CropListing`. Stores Cloudinary image URLs and sorting order metadata.

### C. Negotiation & Live Auction Domain
- `offers`: Direct buyer ↔ listing price negotiation. Tracks requested quantity, offered price per unit, status, and expiration.
- `auctions`: 1-to-1 with `CropListing` (a listing may have at most 1 auction). Defines start price, current price, minimum bid increment, start/end timestamps, and winning bid reference.
- `bids`: 1-to-many child of `Auction`. Submitted by buyers with amount and timestamp.

### D. Order, Payment & Delivery Domain
- `orders`: Transactional purchase contract. Belongs to 1 buyer and 1 farmer. Stores total amount, shipping address, and `OrderStatus`.
- `order_items`: Line-item snapshot of `Order`. Captures transaction snapshot of `quantity`, `pricePerUnit`, and `subtotal` independent of future listing edits.
- `payments`: 1-to-1 with `Order`. Stores payment provider (`RAZORPAY`), transaction ID, status, and paid timestamp.
- `deliveries`: 1-to-1 with `Order`. Stores shipping tracking number, status, estimated delivery, and timestamps.

### E. Communication & Notification Domain
- `conversations`: Chat container between buyer and farmer.
- `conversation_participants`: Join table (`@@unique([conversationId, userId])`).
- `messages`: Immutable chat history stored permanently in PostgreSQL (`conversationId`, `senderId`, `content`, `isRead`).
- `notifications`: User alert queue (`userId`, `type`, `title`, `message`, `isRead`).

### F. Reviews, Wishlist & Complaints Domain
- `reviews`: Order review rating (1 to 5) and comment (`@@unique([orderId, reviewerId])`).
- `wishlists`: Buyer saved listings (`@@unique([buyerId, listingId])`).
- `complaints`: User report referencing `CropListing` or `Order` with reason, description, status, and admin response.

### G. External Agricultural & Weather Domain
- `market_prices`: External mandi price logs (`cropName`, `marketName`, `location`, `price`, `source`, `recordedAt`).
- `weather_data`: Agricultural weather logs (`location`, `temperature`, `humidity`, `rainfall`, `source`, `recordedAt`).

---

## 🛡️ 4. Cascade & Delete Policies

| Parent Entity | Child Entity | Policy (`onDelete`) | Rationale |
| :--- | :--- | :--- | :--- |
| `User` | `FarmerProfile` / `BuyerProfile` | `Cascade` | Profile extensions have no meaning without parent identity. |
| `User` | `Order` / `Offer` / `Message` | `Restrict` | Retains financial, negotiation, and audit trail records. |
| `FarmerProfile` | `CropListing` | `Restrict` | Prevents deleting a profile that has active or past listing history. |
| `CropListing` | `OrderItem` | `Restrict` | Historical orders must maintain foreign key integrity to original listings. |
| `CropListing` | `ProductImage` | `Cascade` | Deleting an unreferenced listing purges associated image metadata. |
| `Auction` | `Bid` | `Cascade` | Purges bids if an unstarted auction is removed. |
| `Order` | `Payment` / `Delivery` | `Restrict` | Payment & shipping logs cannot be orphaned. |
| `Conversation` | `Message` | `Cascade` | Deleting a conversation purges its message history. |

---

## 💰 5. Numeric Precision & Quantity Handling

- **Monetary Values**: Mapped to `@db.Decimal(12, 2)` (up to `9,999,999,999.99` with 2 decimal places). Applies to `pricePerUnit`, `offeredPrice`, `startPrice`, `currentPrice`, `minimumIncrement`, `amount`, `totalAmount`, `subtotal`, and `price`.
- **Agricultural Quantities**: Mapped to `@db.Decimal(12, 3)` (up to 3 decimal places). Supports precise weights in metric tons, kilograms, grams, quintals, or farm size in acres/hectares (e.g., `12.500 kg`).

---

## ⚡ 6. Indexing Strategy

Comprehensive B-Tree indexes (`@@index`) are established on all high-frequency query paths:
- **Filtering**: `User.role`, `CropListing.status`, `CropListing.categoryId`, `Order.status`, `Complaint.status`
- **Lookup & Joins**: `CropListing.farmerProfileId`, `Offer.listingId`, `Offer.buyerId`, `Bid.auctionId`, `Order.buyerId`, `Order.farmerId`, `Message.conversationId`, `Notification.userId`
- **Time-Series Queries**: `MarketPrice.recordedAt`, `WeatherData.recordedAt`

---

## 🔄 7. Migration Instructions

To apply schema changes to the local or production database:

```bash
# 1. Validate schema syntax
cd backend
npx prisma validate

# 2. Run Prisma migration
npx prisma migrate dev --name domain_layer_init

# 3. Generate Prisma Client
npx prisma generate

# 4. Verify database structure
node src/utils/verify_db.js
```
