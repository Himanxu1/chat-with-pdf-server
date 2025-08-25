# ChatPDF Server

A robust backend server for processing PDF documents and enabling chat interactions with their content using AI.

## Features

- 📄 PDF document processing and vectorization
- 🤖 AI-powered chat with PDF content
- 🌐 Website content processing and chat
- 🔄 Background job processing with BullMQ
- 🗄️ Vector storage with Qdrant
- 📊 Comprehensive logging and monitoring
- 🛡️ Input validation and error handling
- ⚡ Rate limiting with express-rate-limit
- ☁️ GCP Cloud Storage integration for PDF files
- 📤 Automated log sync to GCP Cloud Storage
- 🧹 Automatic cleanup of old files and logs

## Prerequisites

- Node.js 18+
- MySQL/MariaDB
- Redis
- Qdrant Vector Database
- Google AI API Key
- Google Cloud Platform account (for PDF storage and log sync)

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start dependencies with Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Build and start the server:**
   ```bash
   npm run build
   npm start
   ```

## Environment Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=mysql://root:password@localhost:3306/chatpdf

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google AI
GOOGLE_API_KEY=your_google_api_key_here

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=langchainjs-testing

# File Upload
UPLOAD_MAX_SIZE=10485760
```

## API Endpoints

### Health Check

- `GET /health` - Service health status

### PDF Processing

- `POST /api/v1/chat/pdf/upload` - Upload PDF for processing
- `POST /api/v1/chat/chat` - Chat with processed PDF content

### Website Processing

- `POST /api/v1/website/` - Process website content
- `POST /api/v1/website/chat` - Chat with website content

## Development

```bash
# Development mode with hot reload
npm run dev

# Run worker separately
npm run dev:worker

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## GCP Cloud Storage Setup

### PDF Storage

The application can store PDF files in Google Cloud Storage for better scalability and reliability.

1. **Configure GCP credentials:**

   ```bash
   # Set up GCP project and authentication
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Create storage bucket:**

   ```bash
   gsutil mb gs://your-pdf-storage-bucket
   gsutil iam ch allUsers:objectViewer gs://your-pdf-storage-bucket
   ```

3. **Update environment variables:**
   ```env
   GCP_PROJECT_ID=your-gcp-project-id
   GCP_KEY_FILE_PATH=path/to/your/service-account-key.json
   GCP_STORAGE_BUCKET=your-pdf-storage-bucket
   ```

### Log Sync Setup

Automatically sync application logs to GCP Cloud Storage every 10 hours.

1. **Run the setup script:**

   ```bash
   ./scripts/setup-log-sync.sh
   ```

2. **Manual log sync:**

   ```bash
   ./scripts/sync-logs.sh manual
   ```

3. **View sync status:**
   ```bash
   ./scripts/sync-logs.sh setup
   ```

The setup script will:

- Install Google Cloud SDK
- Create necessary buckets
- Set up service accounts
- Configure cron jobs for automatic sync
- Test the configuration

## Production Deployment

```bash
# Build for production
npm run build

# Start with PM2
pm2 start pm2.json

# Or start directly
npm start
```

## Architecture

- **Express.js** - Web framework
- **TypeORM** - Database ORM
- **BullMQ** - Job queue management
- **Qdrant** - Vector database
- **Google AI** - LLM and embeddings
- **Winston** - Logging
- **Zod** - Validation

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── workers/         # Background job workers
├── typeorm/         # Database entities and config
├── utils/           # Utility functions
└── events/          # Event handlers
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
