#!/bin/bash

# AI Child Health Setup Script
# This script sets up the initial environment and starts the application

set -e

echo "🚀 Setting up AI Child Health Application..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please review and update the configuration."
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads logs ml_models/models nginx/ssl

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod 755 uploads logs ml_models/models nginx/ssl

# Build and start the application
echo "🐳 Building and starting Docker containers..."
docker-compose build

echo "🚀 Starting the application..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Check database connection
echo "🗄️ Checking database connection..."
if docker-compose exec -T postgres pg_isready -U postgres; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready. Please check the logs: docker-compose logs postgres"
fi

# Check backend health
echo "🏥 Checking backend health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding. Please check the logs: docker-compose logs backend"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📱 Access your application:"
echo "   - API Documentation: http://localhost:8000/docs"
echo "   - Health Check: http://localhost:8000/health"
echo "   - Database: localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📚 Next steps:"
echo "   1. Review and update .env file if needed"
echo "   2. Access the API documentation at http://localhost:8000/docs"
echo "   3. Test the endpoints with the sample data"
echo "   4. Customize the configuration for your needs"
echo ""
echo "⚠️  Important: Change the default passwords in production!"
echo "   Default users are created with password 'password123'"
