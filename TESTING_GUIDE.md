# Testing Guide - AI Child Health Application

## 🚀 Servers Running

### Backend (FastAPI)
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Status**: ✅ Running

### Frontend (React + Vite)
- **URL**: http://localhost:3000
- **Status**: ✅ Running

## 🧪 Testing the Application

### 1. Open the Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. Test Login

The application should show a login page. You'll need credentials:

**Option A: Use existing test user**
- Check backend database or create one via API

**Option B: Create user via API**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User",
    "role": "vht"
  }'
```

Then login with:
- **Username**: `testuser`
- **Password**: `testpass123`

### 3. Test Features

Once logged in, you can test:

#### Dashboard
- View statistics cards
- See recent children and photos
- Navigate using the top menu

#### Children Page
- View list of children (if any exist)
- Search functionality
- Click on a child to view details

#### Child Detail Page
- View child information
- See associated photos
- Quick action buttons

#### Photos Page
- View uploaded photos
- See analysis results
- Trigger AI analysis

### 4. Test API Directly

You can also test the backend API directly:

```bash
# Health check
curl http://localhost:8000/health

# Get API docs
open http://localhost:8000/docs

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123"
```

## 📝 Creating Test Data

To test with real data, create some children and photos:

### Via API

```bash
# First, get your auth token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123" | jq -r '.access_token')

# Create a child
curl -X POST http://localhost:8000/api/v1/children/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2020-01-15",
    "gender": "male",
    "parent_name": "Jane Doe",
    "village": "Test Village",
    "district": "Test District"
  }'
```

### Via Frontend
- Use the "Add Child" button (form implementation pending)
- Or use the API directly as shown above

## 🔍 What to Check

### Visual Testing
- [ ] Login page displays correctly
- [ ] Dashboard shows statistics
- [ ] Navigation menu works
- [ ] Children list displays
- [ ] Child detail page loads
- [ ] Photos page shows images
- [ ] Responsive design on mobile/tablet

### Functional Testing
- [ ] Login/logout works
- [ ] Protected routes redirect to login
- [ ] API calls succeed
- [ ] Error messages display
- [ ] Loading states show
- [ ] Toast notifications appear

### Browser Console
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for API calls

## 🐛 Troubleshooting

### Frontend not loading?
1. Check if Vite is running: `ps aux | grep vite`
2. Check port 3000: `lsof -i :3000`
3. Check for build errors in terminal

### Backend not responding?
1. Check if uvicorn is running: `ps aux | grep uvicorn`
2. Check port 8000: `lsof -i :8000`
3. Check backend logs

### API calls failing?
1. Check CORS settings in backend
2. Verify API URL in `.env`
3. Check browser Network tab for errors
4. Verify authentication token is being sent

### TypeScript errors?
- Run: `npx tsc --noEmit`
- Fix any type errors
- Restart dev server

## 📸 Expected Appearance

### Login Page
- Clean gradient background
- Centered login form
- Blue primary button

### Dashboard
- Statistics cards at top (4 cards)
- Recent children section
- Recent photos section
- Clean, modern design

### Navigation
- Top navigation bar
- Responsive menu (hamburger on mobile)
- User info and logout button

## 🎯 Next Steps

After testing, you can:
1. Add child creation forms
2. Implement photo upload
3. Add growth monitoring forms
4. Create more detailed pages
5. Add charts and visualizations

Happy testing! 🚀

