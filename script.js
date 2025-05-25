# PayPal Integration - Backend & Frontend Separation

This project separates the PayPal integration into a backend API server (to be deployed on Render.com) and a frontend that calls the backend APIs.

## Backend Setup (Render.com)

### 1. Files Structure
```
backend/
├── server.js
├── package.json
├── .env
└── README.md
```

### 2. Environment Variables on Render.com
Set these environment variables in your Render.com dashboard:

```bash
CLIENT_ID=your_paypal_client_id_here
CLIENT_SECRET=your_paypal_client_secret_here
ENVIRONMENT=sandbox
SENDGRID_API_KEY=your_sendgrid_api_key_here (optional)
FROM_EMAIL=your_from_email@domain.com (optional)
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Deploy to Render.com

1. **Create a new Web Service** on Render.com
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name:** `paypal-backend`
   - **Environment:** `Node`
   - **Region:** Choose your preferred region
   - **Branch:** `main` (or your default branch)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Add environment variables** in the Render dashboard
5. **Deploy** the service

### 4. Backend API Endpoints

Once deployed, your backend will have these endpoints:

- `GET /health` - Health check
- `POST /api/get_client_token` - Get PayPal client token
- `POST /api/create_order` - Create PayPal order
- `POST /api/complete_order` - Complete PayPal order

## Frontend Setup

### 1. Update Configuration

In the frontend `index.html`, update the `CONFIG` object:

```javascript
const CONFIG = {
  BACKEND_URL: 'https://your-render-app-name.onrender.com', // Your Render.com backend URL
  PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID', // Your PayPal client ID
  CURRENCY: 'USD',
  INTENT: 'capture'
};
```

### 2. Deploy Frontend

You can deploy the frontend to:
- **Netlify** (drag & drop the HTML file)
- **Vercel** 
- **GitHub Pages**
- **Any static hosting service**

### 3. Update CORS Settings

After deploying the frontend, update the `FRONTEND_URL` environment variable in your Render.com backend to match your frontend domain.

## PayPal Configuration

### 1. Get PayPal Credentials

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Log in to your account
3. Create a new app or use an existing one
4. Copy the **Client ID** and **Client Secret**

### 2. Sandbox vs Live

- **Sandbox:** Use `sandbox` for testing
- **Live:** Use `live` for production

Set the `ENVIRONMENT` variable accordingly.

## SendGrid Configuration (Optional)

If you want to send email receipts:

1. Sign up for [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Set the `SENDGRID_API_KEY` environment variable
4. Set the `FROM_EMAIL` environment variable

## Testing

### 1. Test Backend Endpoints

```bash
# Health check
curl https://your-app.onrender.com/health

# Get client token
curl -X POST https://your-app.onrender.com/api/get_client_token \
  -H "Content-Type: application/json" \
  -d '{"customer_id": ""}'
```

### 2. Test Frontend

1. Open your deployed frontend URL
2. The PayPal buttons should load
3. Test with PayPal sandbox credentials
4. Check the browser console for any errors

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure `FRONTEND_URL` is set correctly in backend
   - Check that your frontend domain matches the CORS configuration

2. **PayPal SDK Not Loading**
   - Verify your `PAYPAL_CLIENT_ID` is correct
   - Check browser console for errors
   - Ensure you're using the correct sandbox/live environment

3. **Backend API