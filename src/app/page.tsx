import TopPhilanthropists from "@/components/TopPhilanthropists";

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-[1.6fr_1fr]">
      
      {/* LEFT SECTION */}
      <div>
        {/* HERO */}
        <h1 className="text-5xl font-extrabold leading-tight">
          Make Wishes Come True. <br />
          One Bid. One Act. One Impact.
        </h1>

        <p className="mt-3 text-lg text-[#6A6674]">
          Discover verified NGOs and meaningful auctions that change lives.
        </p>

        {/* SEARCH */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search auctions, NGOs, causes..."
            className="w-full rounded-xl border border-[#D5D0C7] bg-white px-4 py-3 text-sm shadow-sm"
          />

          <button className="rounded-xl bg-[#1E1635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#463985]">
            Explore
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            "Trending",
            "Art",
            "Experiences",
            "Merchandise",
            "Children",
            "Healthcare",
            "Education",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-4 py-1.5 shadow-sm border border-[#E4E0DA]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* SECTION TITLE */}
        <h2 className="mt-8 mb-3 text-2xl font-bold">Top Auctions</h2>

        {/* AUCTIONS GRID */}
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="
              rounded-2xl border border-[#E5E2DC] bg-white p-4 shadow-sm
              transition-all duration-300
              hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2F235A15]
              "
              >
              {/* LIVE BADGE */}
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                🔴 LIVE
              </span>

              {/* IMAGE */}
              <div className="h-28 w-full rounded-lg bg-gray-200" />

              {/* TITLE */}
              <h3 className="mt-3 text-base font-semibold">
                Vintage Art — Charity Edition
              </h3>

              {/* DETAILS ROW */}
              <div className="mt-2 flex justify-between text-sm text-[#463985]">
                <div>
                  <p className="text-xs text-gray-500">Current Bid</p>
                  <p className="font-bold">₹4,300</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Bids</p>
                  <p className="font-bold">32</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Ends In</p>
                  <p className="font-bold">03:12:21</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NGOs SECTION */}
        <h2 className="mt-10 text-xl font-bold">Featured NGO Partners</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6A6674]">
          Famwish works with verified NGOs and organizations to ensure
          transparency and measurable impact for every auction.
        </p>

        <button className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-white">
          View all NGOs →
        </button>
      </div>

      {/* RIGHT SIDEBAR */}
      <TopPhilanthropists />
    </div>
  );
}
