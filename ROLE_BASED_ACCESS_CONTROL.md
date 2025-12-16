# Role-Based Access Control (RBAC) Implementation

This document explains the role-based access control system implemented in the Church Konet application.

## Overview

The application implements a two-tier role system:
- **Admin**: Full access to all features including user management
- **User**: Limited access to basic features

## Predefined Users

The system comes with two predefined users for testing:

### Admin User
- **Email**: admin@church.org
- **Password**: admin123
- **Role**: admin
- **Access**: All features including user management, organization management, member management, etc.

### Regular User
- **Email**: user@church.org
- **Password**: user123
- **Role**: user
- **Access**: Basic features only (no user/organization management)

## Setting Up User Roles

### 1. Run the Setup Script

To create the predefined users in your Firebase project, run:

```bash
npm run setup-users
```

This script will:
- Create the two predefined users in Firebase Authentication
- Set up their role information in the Firestore `users` collection
- Handle cases where users already exist

**✅ Setup completed successfully!** The following users have been created:
- **Admin**: admin@church.org with admin role
- **User**: user@church.org with user role

### 2. Manual User Setup (Optional)

If you need to add additional users or change roles manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Authentication → Users
3. Create new users with email/password
4. Go to Firestore → Users collection
5. Add a document for each user with:
   ```json
   {
     "email": "user@example.com",
     "fullName": "User Name",
     "role": "admin" or "user",
     "createdAt": "timestamp"
   }
   ```

## Role-Based Features

### Admin Features Only
- User Management (Settings → User Management tab)
- Organization Management (add/delete organizations)
- Member Import (CSV import in Members page)
- Delete members and organizations

### User Features
- View dashboard and statistics
- Send birthday messages
- View members list (read-only)
- View organizations list (read-only)
- Basic settings (theme, birthday preferences)

## Implementation Details

### AuthContext
- Fetches user role from Firestore on authentication
- Provides `isAdmin` property for easy role checking
- Handles role-based state management

### Route Protection
- `ProtectedRoute`: Ensures user is authenticated
- `AdminProtectedRoute`: Ensures user is authenticated AND has admin role

### Component-Level Permissions
- Uses `isAdmin` from AuthContext to conditionally render UI elements
- Hides admin-only features from regular users

## Testing the System

### 1. Test Admin User
1. Login with admin@church.org / admin123
2. Verify you can see:
   - User Management tab in Settings
   - Import CSV button in Members page
   - Add/Delete organization buttons
   - Delete member buttons
3. Check role badge shows "👑 Admin" in dashboard

### 2. Test Regular User
1. Login with user@church.org / user123
2. Verify you cannot see:
   - User Management tab in Settings
   - Import CSV button in Members page
   - Add/Delete organization buttons
   - Delete member buttons
3. Check role badge shows "👤 User" in dashboard

### 3. Test Route Protection
1. Try to access admin-only routes directly when logged in as regular user
2. Verify you're redirected to dashboard or login page

## Security Notes

- Always verify user role on both frontend and backend
- Never trust frontend-only permission checks
- Implement proper Firestore security rules
- Regularly audit user permissions

## Troubleshooting

### User Role Not Showing
1. Check if user document exists in Firestore `users` collection
2. Verify the `role` field is correctly set
3. Check browser console for errors

### Setup Script Issues
1. Ensure Firebase environment variables are set
2. Check Firebase project configuration
3. Verify you have the necessary permissions

## Adding New Roles

To add additional roles (e.g., "moderator"):

1. Update the `role` type in `AuthContext.tsx`
2. Modify the `fetchUserRole` function to handle new roles
3. Update UI components to check for new roles
4. Add role-based permissions as needed