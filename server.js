import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://preview--vivid-verse-voyage-05u-51-95-35.lovable.app/nft-purchase', // Adjust based on your frontend URL
  credentials: true
}));

// Environment variables
const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || 'sandbox';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const sendgrid_api_key = process.env.SENDGRID_API_KEY;
const endpoint_url = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PayPal Backend Server is running' });
});

/**
 * Creates an order and returns it as a JSON response.
 */
app.post('/api/create_order', (req, res) => {
  get_access_token()
    .then(access_token => {
      let order_data_json = {
        'intent': req.body.intent.toUpperCase(),
        'purchase_units': [{
          'amount': {
            'currency_code': 'USD',
            'value': '100.00'
          }
        }]
      };
      const data = JSON.stringify(order_data_json);

      fetch(endpoint_url + '/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: data
      })
      .then(res => res.json())
      .then(json => {
        res.json(json);
      })
      .catch(err => {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
      });
    })
    .catch(err => {
      console.error('Access token error:', err);
      res.status(500).json({ error: 'Failed to get access token' });
    });
});

/**
 * Completes an order and returns it as a JSON response.
 */
app.post('/api/complete_order', (req, res) => {
  get_access_token()
    .then(access_token => {
      fetch(endpoint_url + '/v2/checkout/orders/' + req.body.order_id + '/' + req.body.intent, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      })
      .then(res => res.json())
      .then(json => {
        console.log('Order completed:', json);
        
        // Send email receipt if order is successful and email is provided
        if (json.id && req.body.email) {
          send_email_receipt({ 
            id: json.id, 
            email: req.body.email 
          });
        }
        
        res.json(json);
      })
      .catch(err => {
        console.error('Complete order error:', err);
        res.status(500).json({ error: 'Failed to complete order' });
      });
    })
    .catch(err => {
      console.error('Access token error:', err);
      res.status(500).json({ error: 'Failed to get access token' });
    });
});

/**
 * Retrieves a client token and returns it as a JSON response.
 */
app.post("/api/get_client_token", (req, res) => {
  get_access_token()
    .then((access_token) => {
      const payload = req.body.customer_id
        ? JSON.stringify({ customer_id: req.body.customer_id })
        : null;

      fetch(endpoint_url + "/v1/identity/generate-token", {
        method: "post",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: payload,
      })
      .then((response) => response.json())
      .then((data) => res.json({ client_token: data.client_token }))
      .catch(err => {
        console.error('Client token error:', err);
        res.status(500).json({ error: 'Failed to get client token' });
      });
    })
    .catch((error) => {
      console.error("Access token error:", error);
      res.status(500).json({ error: "Failed to get access token" });
    });
});

// Utility Functions

/**
 * Get PayPal access token
 */
function get_access_token() {
  const auth = `${client_id}:${client_secret}`;
  const data = 'grant_type=client_credentials';
  
  return fetch(endpoint_url + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
    },
    body: data
  })
  .then(res => res.json())
  .then(json => {
    return json.access_token;
  });
}

/**
 * Send email receipt using SendGrid
 */
function send_email_receipt(object) {
  if (!sendgrid_api_key || sendgrid_api_key === 'REPLACE_WITH_SENDGRID_API_KEY') {
    console.log('SendGrid API key not configured, skipping email');
    return;
  }

  let html_email_content = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
      <style type="text/css">
        body, p, div { font-family: inherit; font-size: 14px; }
        body { color: #000000; }
        body a { color: #000000; text-decoration: none; }
        p { margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #dde6de; padding: 20px; text-align: center; }
        .content { background-color: #fe737c; padding: 40px; text-align: center; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Thank you for purchasing the NFT!</h2>
          <p>Your transaction ID is: ${object.id}</p>
          <p>We appreciate your patronage</p>
        </div>
        <div class="content">
          <p>Need more help figuring things out? Our support team is here to help!</p>
          <a href="#" style="color: white; text-decoration: underline;">Help Center</a>
        </div>
      </div>
    </body>
    </html>`;

  const sendgrid_options = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sendgrid_api_key}`
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: object.email }],
        subject: 'Thank you for purchasing our NFT!',
      }],
      from: { email: process.env.FROM_EMAIL || 'mycompany@email.com' },
      content: [{
        type: 'text/html',
        value: html_email_content,
      }],
    }),
  };

  fetch('https://api.sendgrid.com/v3/mail/send', sendgrid_options)
  .then(response => {
    if (response.ok) {
      console.log('Email sent successfully');
    } else {
      console.error('Error sending email:', response.statusText);
    }
  })
  .catch(error => {
    console.error('Error sending email:', error.message);
  });
}

// Start server
app.listen(port, () => {
  console.log(`PayPal Backend Server listening at http://localhost:${port}`);
  console.log(`Environment: ${environment}`);
  console.log(`Client ID: ${client_id ? 'Configured' : 'Missing'}`);
  console.log(`Client Secret: ${client_secret ? 'Configured' : 'Missing'}`);
});
