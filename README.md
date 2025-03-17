# Wikipedia Project

A full-stack application that consists of a Next.js frontend and Python backend for Wikipedia-related functionality.

## 🚀 Project Structure

The project is organized into two main components:

- `wiki-hackathon/` - Frontend application built with Next.js
- `wiki-backend/` - Backend API built with Python (FastAPI)

## 🛠️ Prerequisites

Before running the application, make sure you have the following installed:

- Docker
- Docker Compose
- Node.js (for local development)
- Python 3.x (for local development)
- OpenAI API Key

## 🔧 Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd wikipedia-project
```

2. Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 Running the Application

### Development Mode

To run the application in development mode:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- Frontend server at http://localhost:3000
- Backend server at http://localhost:8000

The development setup includes:
- Hot-reloading for both frontend and backend
- Volume mounting for real-time code updates
- Environment variables configured for development

## 📦 Project Features

- Next.js frontend with development configuration
- Python backend with FastAPI
- Docker containerization for both services
- OpenAI integration
- CORS configuration for secure communication
- Development-optimized setup with hot-reloading

## 🔍 API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🛠️ Development Notes

- Frontend development server runs on port 3000
- Backend API server runs on port 8000
- The frontend communicates with the backend through the `NEXT_PUBLIC_API_URL` environment variable
- Both services are configured with volume mounts for real-time development
- Node modules are excluded from volume mounting to improve performance

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. 