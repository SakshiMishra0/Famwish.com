import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb://localhost:27017";
const dbName = "famwish";

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB.");
    const db = client.db(dbName);

    // 1. Flush the collections
    console.log("Flushing collections...");
    await db.collection("users").deleteMany({});
    await db.collection("auctions").deleteMany({});
    await db.collection("transactions").deleteMany({});
    await db.collection("wishlists").deleteMany({});
    await db.collection("ngo_posts").deleteMany({});

    // 2. Create Indian Celebrities
    console.log("Seeding Celebrities...");
    const srkId = new ObjectId();
    const viratId = new ObjectId();
    const dhoniId = new ObjectId();

    await db.collection("users").insertMany([
      { _id: srkId, name: "Shah Rukh Khan", email: "srk@famwish.com", role: "celebrity", kycVerified: true },
      { _id: viratId, name: "Virat Kohli", email: "virat@famwish.com", role: "celebrity", kycVerified: true },
      { _id: dhoniId, name: "MS Dhoni", email: "dhoni@famwish.com", role: "celebrity", kycVerified: true }
    ]);

    // 2.5. Create NGOs
    console.log("Seeding NGOs...");
    const ngo1Id = new ObjectId();
    const ngo2Id = new ObjectId();
    const ngo3Id = new ObjectId();

    await db.collection("users").insertMany([
      { _id: ngo1Id, name: "Smile Foundation", email: "contact@smilefoundation.org", role: "ngo" },
      { _id: ngo2Id, name: "Goonj", email: "mail@goonj.org", role: "ngo" },
      { _id: ngo3Id, name: "Akshaya Patra Foundation", email: "info@akshayapatra.org", role: "ngo" }
    ]);

    // 3. Create VIP Bidders
    console.log("Seeding Bidders...");
    const mukeshId = new ObjectId();
    const ratanId = new ObjectId();
    const nitaId = new ObjectId();
    // Keep Ankit for testing if needed
    const ankitId = new ObjectId();

    await db.collection("users").insertMany([
      { _id: mukeshId, name: "Mukesh Ambani", email: "mukesh@famwish.com", role: "bidder", kycVerified: true },
      { _id: ratanId, name: "Ratan Tata", email: "ratan@famwish.com", role: "bidder", kycVerified: true },
      { _id: nitaId, name: "Nita Ambani", email: "nita@famwish.com", role: "bidder", kycVerified: true },
      { _id: ankitId, name: "Ankit Singh", email: "ankit@famwish.com", role: "bidder", kycVerified: true }
    ]);

    // 4. Create Auctions (Ended)
    console.log("Seeding Ended Auctions...");
    const now = new Date();
    
    // Ended Auction 1: Virat's Jersey
    const ended1Id = new ObjectId();
    await db.collection("auctions").insertOne({
      _id: ended1Id,
      title: "World Cup 2011 Final Jersey - Signed",
      description: "Own a piece of history. The exact jersey worn by Virat Kohli during the 2011 World Cup final.",
      category: "Sports",
      startingBid: 1000000,
      currentHighBid: 5000000,
      bid: "₹50,00,000",
      bids: 15,
      endDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
      createdBy: viratId,
      topBidderId: mukeshId,
      ngoPartnerId: ngo1Id,
      titleImage: "https://images.unsplash.com/photo-1593341646782-e0be109b867c?q=80&w=600&auto=format&fit=crop",
      bidsHistory: [
          { userId: mukeshId, userName: "Mukesh Ambani", amount: 5000000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 31).toISOString() }
      ],
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60),
      status: "SETTLED"
    });

    // Ended Auction 2: Dinner with SRK
    const ended2Id = new ObjectId();
    await db.collection("auctions").insertOne({
      _id: ended2Id,
      title: "Exclusive Dinner with SRK at Mannat",
      description: "An unforgettable evening dining with the King of Bollywood at his iconic residence.",
      category: "Experiences",
      startingBid: 5000000,
      currentHighBid: 12000000,
      bid: "₹1,20,00,000",
      bids: 30,
      endDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      createdBy: srkId,
      topBidderId: nitaId,
      ngoPartnerId: ngo2Id,
      titleImage: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=600&auto=format&fit=crop",
      bidsHistory: [
          { userId: nitaId, userName: "Nita Ambani", amount: 12000000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString() }
      ],
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      status: "SETTLED"
    });

    // 5. Create Auctions (Live)
    console.log("Seeding Live Auctions...");
    
    // Live Auction 1: Dhoni's Bat
    const live1Id = new ObjectId();
    await db.collection("auctions").insertOne({
      _id: live1Id,
      title: "World Cup 2011 Final Match Bat",
      description: "The legendary bat used to hit the winning six by MS Dhoni.",
      category: "Sports",
      startingBid: 2000000,
      currentHighBid: 7500000,
      bidIncrement: 500000,
      bid: "₹75,00,000",
      bids: 5,
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(), // Ends in 3 days
      createdBy: dhoniId,
      topBidderId: ratanId,
      ngoPartnerId: ngo3Id,
      titleImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop",
      bidsHistory: [
          { userId: ratanId, userName: "Ratan Tata", amount: 7500000, timestamp: new Date().toISOString() }
      ],
      createdAt: new Date(),
      status: "ACTIVE"
    });

    // Live Auction 2: SRK's Jacket
    const live2Id = new ObjectId();
    await db.collection("auctions").insertOne({
      _id: live2Id,
      title: "Signature Leather Jacket from DDLJ",
      description: "The original leather jacket worn by Raj in Dilwale Dulhania Le Jayenge.",
      category: "Merchandise",
      startingBid: 1000000,
      currentHighBid: 1000000,
      bidIncrement: 100000,
      bid: "₹10,00,000",
      bids: 0,
      endDate: new Date(now.getTime() + 1000 * 60 * 60 * 5).toISOString(), // Ends in 5 hours
      createdBy: srkId,
      topBidderId: null,
      ngoPartnerId: ngo1Id,
      titleImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
      bidsHistory: [],
      createdAt: new Date(),
      status: "ACTIVE"
    });

    // Live Auction 3: Very short duration auction for testing
    const live3Id = new ObjectId();
    await db.collection("auctions").insertOne({
      _id: live3Id,
      title: "VIP Lounge Tickets for IPL Finals",
      description: "Two VIP tickets for the IPL Finals sitting next to Virat Kohli's family.",
      category: "Experiences",
      startingBid: 500000,
      currentHighBid: 500000,
      bidIncrement: 50000,
      bid: "₹5,00,000",
      bids: 0,
      endDate: new Date(now.getTime() + 1000 * 60 * 15).toISOString(), // Ends in 15 minutes
      createdBy: viratId,
      topBidderId: null,
      ngoPartnerId: ngo2Id,
      titleImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop",
      bidsHistory: [],
      createdAt: new Date(),
      status: "ACTIVE"
    });

    // 6. Create NGO Impact Feed Posts
    console.log("Seeding NGO Impact Feed...");
    await db.collection("ngo_posts").insertMany([
      {
        ngoId: ngo1Id,
        ngoName: "Smile Foundation",
        title: "New Education Center Inaugurated!",
        content: "Thanks to the generous donations from the recent celebrity auction, we have successfully inaugurated a new digital learning center for 500 underprivileged children in rural Rajasthan. Education is the key to breaking the cycle of poverty. Thank you to everyone who bid!",
        mediaUrls: ["https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop"],
        likesCount: 124,
        likedBy: [mukeshId, ratanId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 48) // 2 days ago
      },
      {
        ngoId: ngo3Id,
        ngoName: "Akshaya Patra Foundation",
        title: "1 Million Meals Milestone 🍲",
        content: "We are thrilled to announce that with your continuous support, we've served over 1 Million midday meals this month alone! Proper nutrition keeps children in school and helps them focus on their dreams. Next milestone: 2 Million!",
        mediaUrls: ["https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop"],
        likesCount: 89,
        likedBy: [dhoniId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        ngoId: ngo2Id,
        ngoName: "Goonj",
        title: "Winter Relief Drive Complete",
        content: "Our team just returned from the northern regions after distributing over 10,000 winter survival kits to families in remote villages. A special shoutout to the Famwish community for raising crucial funds during the Winter Auction week.",
        mediaUrls: [],
        likesCount: 45,
        likedBy: [srkId, ratanId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        ngoId: ngo1Id,
        ngoName: "Smile Foundation",
        title: "Health Camp in Rural Maharashtra 🩺",
        content: "We partnered with top medical professionals to host a free 3-day health camp. Over 1,200 villagers received vital checkups, free medicines, and eye-care surgeries. This was made possible completely by the proceeds from last month's Famwish auction. Thank you for making a difference!",
        mediaUrls: ["https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=800&auto=format&fit=crop"],
        likesCount: 312,
        likedBy: [viratId, mukeshId, nitaId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
      },
      {
        ngoId: ngo2Id,
        ngoName: "Goonj",
        title: "Transforming Discarded Materials into Happiness ♻️",
        content: "Our 'School to School' initiative is successfully bridging the gap between urban abundance and rural scarcity. This week, we distributed thousands of recycled school bags and stationary kits to children who previously had none. Every bid on Famwish contributes directly to this circular economy of care.",
        mediaUrls: ["https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=800&auto=format&fit=crop"],
        likesCount: 204,
        likedBy: [ratanId, dhoniId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
      },
      {
        ngoId: ngo3Id,
        ngoName: "Akshaya Patra Foundation",
        title: "New Mega-Kitchen Launched in Gujarat!",
        content: "To scale our midday meal operations, we have officially launched our newest mega-kitchen capable of preparing 100,000 hygienic meals in under 4 hours. The infrastructure was heavily subsidized by the massive success of the recent VIP Escrow settlements. Together, we are eliminating classroom hunger.",
        mediaUrls: ["https://images.unsplash.com/photo-1541888086824-345f1bafb83b?q=80&w=800&auto=format&fit=crop"],
        likesCount: 450,
        likedBy: [mukeshId, srkId, nitaId],
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14) // 14 days ago
      }
    ]);

    console.log("===============================");
    console.log("✅ Database successfully seeded!");
    console.log("===============================");

  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.close();
  }
}

seed();
