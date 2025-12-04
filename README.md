# Haunted Home Orchestrator 👻

An agentic AI application that transforms smart homes into dynamic haunted house experiences using specialized AI agents to orchestrate spooky behaviors across lights, speakers, TVs, and smart plugs.

## Features

- 🎃 **Two Modes**: Simple Mode (voice commands via browser) or Connected Mode (direct device control)
- 🤖 **AI-Powered**: OpenAI-driven sub-agents for each device type
- 🏠 **Smart Home Integration**: Works with Amazon Alexa and Google Home
- 🎨 **Themed Experiences**: Multiple haunting themes with customizable intensity
- 🔒 **Safety First**: Epilepsy-safe mode to prevent strobe effects
- 🌐 **Web Interface**: Halloween-themed React UI for setup and monitoring
- ☁️ **Serverless**: Built on AWS Lambda, DynamoDB, and Cognito

## Quick Start

### Local Development (No AWS Required)

```bash
# Run setup script
./scripts/setup.sh

# Start frontend
cd frontend
bun run dev
```

Visit http://localhost:3000 to see the UI.

### Full AWS Deployment

See [QUICKSTART.md](QUICKSTART.md) for step-by-step instructions.

## Project Structure

```
haunted-home-orchestrator/
├── frontend/              # React app (Vite + TypeScript + TailwindCSS)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── backend/              # Lambda functions (Node.js + TypeScript)
│   ├── src/
│   │   ├── handlers/    # Lambda handlers
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── utils/       # Utilities
│   └── package.json
│
├── infrastructure/       # AWS CDK (TypeScript)
│   ├── lib/
│   │   └── haunted-home-stack.ts  # Main CDK stack
│   ├── bin/
│   │   └── infrastructure.ts      # CDK app entry
│   └── package.json
│
├── scripts/             # Helper scripts
│   └── setup.sh        # Initial setup script
│
└── .kiro/specs/        # Feature specifications
    └── haunted-home-orchestrator/
        ├── requirements.md  # Requirements document
        ├── design.md       # Design document
        └── tasks.md        # Implementation tasks
```

## Prerequisites

- Bun 1.0+ (faster alternative to Node.js)
- AWS Account (for deployment)
- AWS CLI configured
- OpenAI API key
- Domain name (optional, for custom domain)

## Documentation

- [Quick Start Guide](QUICKSTART.md) - Get up and running fast
- [AWS Setup Checklist](infrastructure/AWS_SETUP_CHECKLIST.md) - Complete AWS setup guide
- [Deployment Guide](infrastructure/DEPLOYMENT.md) - Detailed deployment instructions
- [Requirements](. kiro/specs/haunted-home-orchestrator/requirements.md) - Feature requirements
- [Design Document](.kiro/specs/haunted-home-orchestrator/design.md) - System architecture
- [Implementation Tasks](.kiro/specs/haunted-home-orchestrator/tasks.md) - Development roadmap

## Development

### Frontend Development
```bash
cd frontend
bun install
bun run dev          # Start dev server at localhost:3000
bun test            # Run tests
bun run build       # Build for production
```

### Backend Development
```bash
cd backend
bun install
bun run build       # Compile TypeScript
bun test           # Run tests
bun run package    # Package for Lambda deployment
```

### Infrastructure Changes
```bash
cd infrastructure
bun install
bun run cdk diff           # Preview changes
bun run cdk deploy         # Deploy to AWS
bun run cdk destroy        # Remove all resources
```

## Architecture

The system uses a multi-agent architecture:

1. **Main Orchestrator**: Coordinates all sub-agents and manages haunting sessions
2. **Lights Sub-Agent**: Controls smart lights for eerie effects
3. **Audio Sub-Agent**: Manages speakers for spooky sounds
4. **TV Sub-Agent**: Controls smart TVs for creepy visuals
5. **Smart Plug Sub-Agent**: Creates unexpected events with connected devices

### Technology Stack

**Frontend**: React 18, TypeScript, Vite, TailwindCSS, Web Speech API

**Backend**: AWS Lambda (Node.js 20), TypeScript, OpenAI API

**Infrastructure**: AWS CDK, DynamoDB, Cognito, API Gateway, S3, CloudFront, Route 53

**Testing**: Jest (backend), Vitest (frontend), fast-check (property-based testing)

## Cost Estimate

Running this application costs approximately **$5-25/month**:
- DynamoDB: $1-5/month (on-demand pricing)
- Lambda: $1-10/month (mostly free tier)
- S3 + CloudFront: $1-5/month
- Route 53: $0.50/month (if using custom domain)
- Cognito: Free tier covers most usage
- Certificate Manager: Free

Development work typically stays within AWS free tier limits.

## Contributing

This is a hackathon project built with Kiro AI. See the implementation tasks in `.kiro/specs/haunted-home-orchestrator/tasks.md` for the development roadmap.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built for the Kiro AI Hackathon using:
- OpenAI GPT-4 for AI agent intelligence
- AWS for serverless infrastructure
- Kiro AI for development assistance
