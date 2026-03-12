# SEO Tool Frontend

A premium, high-performance dashboard for SEO professionals. Built with a focus on speed, clarity, and advanced data visualization.

## ✨ Features

- **Dynamic Audits**: Real-time progress tracking with WebSockets.
- **AI Intelligence**: Strategic insights and content optimization recommendations.
- **Advanced Reports**: Professional-grade PDF and advanced strategic report views.
- **Premium Aesthetics**: Glassmorphic UI with dark mode and smooth animations.
- **SEO Assistant**: Integrated AI chatbot for deep dive audit analysis.
- **History & Projects**: Manage multiple properties and track score improvements over time.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State**: React Hooks + Context
- **Real-time**: Socket.io-client
- **Auth**: NextAuth.js

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Backend server running (default: port 5000)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   NEXTAUTH_SECRET="your_shared_secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Start Development Server:
   ```bash
   npm run dev
   ```

## 🏗️ Structure

- `src/app/audit/[jobId]`: Main audit results and real-time dashboard.
- `src/app/audit/[jobId]/report`: Specialized report formats (Basic & Advanced).
- `src/components`: Reusable UI components (Issue cards, charts, Navbar, etc.)
- `src/app/projects`: Multi-site management system.

## 📄 License

Proprietary — All Rights Reserved.
