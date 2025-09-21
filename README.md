# Catat-Ku - Debt and Transaction Management App

Catat-Ku is a modern web application for managing personal debts and transactions. Built with React, TypeScript, and Firebase, it helps you keep track of your financial activities with an intuitive interface.

## Features

- 📝 Record and manage debts
- 💰 Track transactions
- 📅 Set due dates and payment schedules
- 🔒 Secure authentication with Firebase
- 📱 Responsive design for all devices
- 📊 View transaction history and summaries

## Technologies Used

- ⚡ [Vite](https://vitejs.dev/) - Fast frontend tooling
- 🎨 [HeroUI](https://heroui.com) - Beautiful UI components
- 🎨 [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- 🔷 [TypeScript](https://www.typescriptlang.org) - Type-safe JavaScript
- 🔥 [Firebase](https://firebase.google.com) - Backend services
- 📱 [React Router](https://reactrouter.com/) - Client-side routing
- 📅 [date-fns](https://date-fns.org/) - Date utilities

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase project (for backend services)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/catat-ku.git
   cd catat-ku
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### Running the App

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Firebase configuration and utilities
├── pages/         # Application pages
└── utils/         # Helper functions and utilities
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
