# Password Reset Feature Guide

This guide explains the password reset functionality that has been implemented in the Application Portal.

## Overview

The password reset feature allows users to reset their passwords when they forget them, providing a secure way to regain access to their accounts.

## User Flow

### 1. Request Password Reset

1. User goes to the login page (`/login`)
2. Clicks the **"Forgot Password?"** link next to the password field
3. Enters their email address in the reset modal
4. Clicks **"Send Reset Email"**
5. Receives confirmation that the email was sent

### 2. Password Reset Confirmation

1. User receives email with reset link
2. Clicks the reset link (goes to `/reset-password?token=xyz`)
3. Enters new password and confirmation
4. Submits the form to complete the reset
5. Redirected to login page with success message

## Frontend Implementation

### Components Added

1. **Reset Password Modal** (in `/login`)

   - Email input form
   - Success confirmation screen
   - Error handling

2. **Reset Password Page** (`/reset-password`)
   - Token validation
   - New password form with confirmation
   - Password requirements display
   - Success/error states

### API Endpoints Expected

The frontend calls these backend endpoints:

```typescript
// Request password reset
POST /api/auth/reset-password
Body: { email: string }
Response: { message: string }

// Validate reset token
POST /api/auth/validate-reset-token
Body: { token: string }
Response: { valid: boolean }

// Confirm password reset
POST /api/auth/confirm-reset-password
Body: { token: string, password: string }
Response: { message: string }
```

## Features

### ✅ **Security Features**

- Token-based reset system
- Token validation before allowing password change
- Password requirements enforcement
- Secure form handling with validation

### ✅ **User Experience**

- Clear step-by-step process
- Helpful error messages
- Loading states and feedback
- Mobile-responsive design

### ✅ **Email Integration**

- Automatic email sending
- Clear instructions for users
- Spam/junk folder reminders
- Option to send to different email

## Password Requirements

- **Minimum Length**: 6 characters
- **Confirmation**: Must match original password
- **Validation**: Real-time form validation
- **Security**: Encourages strong passwords

## Email Template Requirements

The reset email should include:

1. **Subject**: "Reset Your Password - Application Portal"
2. **Reset Link**: `https://your-domain.com/reset-password?token={RESET_TOKEN}`
3. **Expiration Time**: Token should expire (recommended: 1 hour)
4. **Security Note**: Mention this is a secure, one-time link

### Sample Email Content

```
Subject: Reset Your Password - Application Portal

Hello,

You requested to reset your password for the Application Portal. Click the link below to set a new password:

[Reset Password Button/Link]

This link will expire in 1 hour for security reasons.

If you didn't request this reset, please ignore this email.

Best regards,
Application Portal Team
```

## Backend Implementation Notes

### Required Database Fields

```sql
-- Add to users table or create separate table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

-- Or create separate table
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Token Generation

```javascript
// Generate secure random token
const crypto = require("crypto");
const resetToken = crypto.randomBytes(32).toString("hex");
const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
```

### Security Considerations

1. **Token Expiration**: Tokens should expire within 1 hour
2. **Single Use**: Tokens should be invalidated after use
3. **Rate Limiting**: Limit reset requests per email
4. **HTTPS Only**: All reset links should use HTTPS
5. **Input Validation**: Validate all inputs server-side

## Testing the Feature

### Manual Testing Steps

1. **Test Valid Email**:

   - Enter registered email → Should send reset email
   - Check email delivery and link format

2. **Test Invalid Email**:

   - Enter unregistered email → Should show appropriate message

3. **Test Reset Page**:

   - Valid token → Should show password form
   - Invalid/expired token → Should show error message
   - Password mismatch → Should show validation error

4. **Test Complete Flow**:
   - Request reset → Receive email → Click link → Set password → Login

### Error Scenarios to Test

- Expired reset tokens
- Already used reset tokens
- Invalid token format
- Network errors during reset
- Password validation failures

## Configuration

### Environment Variables

```env
# Email configuration for password reset
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=your-email-password

# Password reset settings
RESET_TOKEN_EXPIRY=3600000  # 1 hour in milliseconds
RESET_EMAIL_FROM=noreply@company.com
RESET_BASE_URL=https://your-domain.com
```

## Future Enhancements

- **Multiple Email Templates**: Different templates for different user types
- **SMS Reset Option**: Alternative to email reset
- **Password History**: Prevent reuse of recent passwords
- **Account Lockout**: Temporary lockout after multiple failed attempts
- **Two-Factor Reset**: Additional security for admin accounts

## Support

For technical issues:

1. Check browser console for frontend errors
2. Check server logs for API errors
3. Verify email delivery systems
4. Test with different email providers
