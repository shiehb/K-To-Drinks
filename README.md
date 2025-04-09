# Project Setup and Usage

This project consists of a frontend and a backend. Below are the steps to set up and run the development servers.

-----------------------------------------------------------------------


http://k-to-drinks-management-system.onrender.com/
### Backend Setup and Usage

Name:  JERICHO URBANO
Email: jerichourbano.01.01.04@gmail.com
Teams:
  Nigguss: Owner Reviewer
────────────────────┐
 Netlify Site Info  │
────────────────────┘
Current site: stately-brioche-cceac8
Admin URL:    https://app.netlify.com/sites/stately-brioche-cceac8
Site URL:     https://k-to-drinks.netlify.app/
Site Id:      dec03552-0c26-46a1-855f-15e8ddc9f113


## Commands

### Frontend
- **`npm run dev`**: Starts the frontend development server. 

### Backend
1. Navigate to the backend directory:
   - cmd
  **`cd backend\user_management`**

2. Start the backend development server:
   - cmd
   **`py manage.py runserver`**

----------------------------------------------------------------

### Development URLs

Frontend
Access the frontend at: `http://localhost:5173/`

Login to the frontend
## Username: `admin`
## Password: `123`

Backend API Endpoints
Fetch all users:
GET `http://127.0.0.1:8000/api/users/`

Add a new user:
POST `http://127.0.0.1:8000/api/users/`

Update a user:
PUT `http://127.0.0.1:8000/api/users/1/`

Archive a user:
PUT `http://127.0.0.1:8000/api/users/1/archive/`

Unarchive a user:
PUT `http://127.0.0.1:8000/api/users/1/unarchive/`

Delete a user:
DELETE `http://localhost:8000/api/users/1/delete/`

Admin user
Access the admin panel at: `http://127.0.0.1:8000/admin/`
## Username: `admin`
## Password: `123`


/*
Backend Setup Instructions:

1. Extract the backend.zip file to a directory
2. Navigate to the backend directory in your terminal
3. Create a virtual environment (optional but recommended):
   python -m venv venv
   
4. Activate the virtual environment:
   - On Windows: venv\Scripts\activate
   - On macOS/Linux: source venv/bin/activate
   
5. Install the required dependencies:
   pip install -r requirements.txt
   
6. Run migrations to set up the database:
   python manage.py migrate
   
7. Create a superuser (admin) account:
   python manage.py createsuperuser
   
8. Start the development server:
   python manage.py runserver
   
9. The API will be available at http://127.0.0.1:8000/api/
   - Stores API: http://127.0.0.1:8000/api/stores/
   - User API: http://127.0.0.1:8000/api/users/
   - Login: http://127.0.0.1:8000/api/login/

10. You can access the admin interface at http://127.0.0.1:8000/admin/
*/

// This file documents the available API endpoints

/*
API Endpoints:

1. Authentication:
   - POST /api/login/ - Login and get JWT token
     Body: { "username": "your_username", "password": "your_password" }
     Response: { "token": "your_jwt_token" }

   - POST /api/register/ - Register a new user
     Body: { "username": "new_username", "password": "new_password", "email": "email@example.com" }

2. Stores:
   - GET /api/stores/ - List all stores
     Query params: 
       - archived=true|false (filter by archived status)
       - day=Monday|Tuesday|... (filter by day)

   - POST /api/stores/ - Create a new store
     Body: {
       "name": "Store Name",
       "location": "Store Address",
       "lat": 16.123456,
       "lng": 120.123456,
       "owner_name": "Owner Name",
       "email": "owner@example.com",
       "number": "+1234567890",
       "day": "Monday"
     }

   - GET /api/stores/:id/ - Get store details
   
   - PUT /api/stores/:id/ - Update store
     Body: Same as POST with updated fields
   
   - PATCH /api/stores/:id/archive/ - Archive/unarchive a store
     Body: { "archive": true|false }

3. Users:
   - GET /api/users/ - List all users (admin only)
   - POST /api/users/ - Create a new user (admin only)
   - GET /api/users/:id/ - Get user details
   - PUT /api/users/:id/ - Update user
   - DELETE /api/users/:id/ - Delete user
*/

