# Haunted Home Frontend

React frontend for the Haunted Home Orchestrator.

## Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # API client and services
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── dist/                 # Build output (generated)
```

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Features

- Halloween-themed UI with dark colors and spooky fonts
- User authentication with AWS Cognito
- Device setup wizard (Simple and Connected modes)
- Real-time haunting control
- Activity monitoring dashboard
- Theme and settings management

## Environment Variables

Create a `.env` file in the frontend directory:

```
VITE_API_ENDPOINT=https://api.kiro-haunting.me
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

## Deployment

Build the app and upload to S3:

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```
