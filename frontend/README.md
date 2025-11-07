# PostPart - Frontend Application

React + TypeScript + Vite frontend for PostPart - Child Health Monitoring System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:3000`

## ✅ Features Implemented

- ✅ **User Authentication** - Login/Logout with JWT
- ✅ **Dashboard** - Statistics and overview
- ✅ **Child Management** - List, view, search children
- ✅ **Photo Management** - View and analyze photos
- ✅ **Responsive Design** - Mobile-first Tailwind CSS
- ✅ **API Integration** - Full backend integration

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── Layout.tsx     # Main navigation layout
│   ├── pages/             # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ChildrenPage.tsx
│   │   ├── ChildDetailPage.tsx
│   │   └── PhotosPage.tsx
│   ├── services/          # API services
│   │   ├── api.ts         # Axios instance
│   │   ├── authService.ts
│   │   ├── childService.ts
│   │   └── photoService.ts
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── styles/            # Global styles
│   │   └── index.css      # Tailwind imports
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── tailwind.config.js     # Tailwind CSS config
```

## 🔌 API Integration

The frontend connects to the FastAPI backend:
- **Development**: `http://localhost:8000/api/v1`
- Configure in `.env`: `VITE_API_URL=http://localhost:8000/api/v1`

### Available Services

- **AuthService**: Login, logout, user management
- **ChildService**: Child CRUD operations
- **PhotoService**: Photo upload, analysis, management

## 🎨 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **TanStack Query** - Data fetching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📝 Next Steps

To complete the frontend:
1. Add child creation/edit forms
2. Implement photo upload functionality
3. Add growth monitoring forms
4. Create health assessment forms
5. Add charts and visualizations
6. Implement search and filtering
7. Add pagination for large lists

## 🔧 Development

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Format code (if using prettier)
npx prettier --write .
```

