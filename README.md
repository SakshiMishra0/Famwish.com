# ✨ Famwish

> **Make Wishes Come True. One Bid. One Act. One Impact.**

**Famwish** is a modern philanthropy platform that connects donors, celebrities, and NGOs through meaningful auctions. Built with the latest web technologies, it ensures transparency and measurable impact for every contribution.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb)

---

## 🚀 Key Features

- **🏷️ Live Auctions**: Real-time bidding system for exclusive items and experiences.
- **❤️ Philanthropy Tracking**: Track top philanthropists and their contributions.
- **🤝 Verified NGOs**: Partnered with verified organizations for transparent impact.
- **🎁 Wishlists**: Users can save and track their favorite auctions.
- **🔐 Secure Authentication**: Powered by NextAuth.js for safe and easy login.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository

```bash
git clone [<repository-url>](https://github.com/SakshiMishra0/Famwish.com.git)
cd Famwish.com
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
MONGODB_URI=mongodb://localhost:27017
NEXTAUTH_SECRET=your_super_secret_key
NEXTAUTH_URL=http://localhost:3000
MONGODB_DB="famwish"
```

> **Note**: Replace `your_super_secret_key` with a secure random string.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

```
src/
├── app/             # App Router pages and layouts
├── components/      # Reusable UI components
├── lib/             # Utility libraries (MongoDB connection, etc.)
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
