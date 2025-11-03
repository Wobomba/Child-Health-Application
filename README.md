# AI Child Health - Malnutrition Detection & Growth Monitoring

An AI-powered malnutrition detection and growth monitoring tool designed for Village Health Teams (VHTs) in Uganda. This application helps healthcare workers identify and track malnutrition in children through photo analysis and comprehensive health assessments.

## 🚀 Features

### ✅ Implemented Features
- **User Authentication & Authorization**: JWT-based auth with role-based access control (Admin, VHT, Nurse)
- **Child Management**: Complete CRUD operations for child records with unique ID generation
- **Growth Monitoring**: Track weight, height, BMI, and Z-scores with growth trend analysis
- **Photo Upload & AI Analysis**: Real MobileNetV2-based malnutrition detection with TensorFlow
- **AI Training Pipeline**: Complete model training system with data preprocessing
- **Dataset Download Tools**: Scripts to download datasets from Hugging Face, Kaggle, or organize local data
- **Health Assessments**: Comprehensive health assessment CRUD operations
- **Comprehensive API**: RESTful API with automatic OpenAPI documentation
- **Database Migrations**: Alembic-based database schema management
- **Data Validation**: Pydantic schemas for robust data validation
- **Error Handling & Logging**: Structured logging and comprehensive error handling
- **Health Endpoints**: Server health checks and monitoring

### 🚧 Planned Features
- **Enhanced AI Models**: Additional model architectures and ensemble methods
- **Advanced Health Assessments**: Clinical findings and treatment plans
- **Real-time Alerts**: Notifications for children requiring attention
- **Multi-language Support**: English, Luganda, Runyankole, Luo, and Swahili
- **Offline Capability**: Work in areas with limited connectivity
- **Mobile-First Design**: Optimized UI for mobile devices
- **Dashboard & Analytics**: Comprehensive reporting and insights

## 🏗️ Architecture

- **Backend**: FastAPI with Python 3.11
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML**: TensorFlow for malnutrition detection models
- **File Storage**: Local file system with optional cloud storage
- **Authentication**: JWT-based authentication with role-based access control
- **API**: RESTful API with OpenAPI documentation
- **Containerization**: Docker and Docker Compose for easy deployment

## 📋 Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

## 🛠️ Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Child-Health
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Database: localhost:5432

### Option 2: Local Development

1. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

2. **Set up database**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Run database migrations
   cd backend
   python -m alembic upgrade head
   ```

3. **Run the application**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🗄️ Database Setup

The application uses PostgreSQL with the following main tables:

- **users**: VHT members and healthcare workers
- **children**: Child information and demographics
- **growth_records**: Growth measurements over time
- **photos**: Child photos and AI analysis results
- **assessments**: Comprehensive health assessments

### Sample Data

The database comes pre-populated with sample data:
- 4 VHT users (2 VHTs, 1 nurse, 1 admin)
- 4 sample children with growth records
- Sample assessments and photo metadata

### Database Views

- `child_growth_summary`: Summary of child growth and assessment data
- `malnutrition_alerts`: Children requiring immediate attention
- `dashboard_stats`: Aggregated statistics for dashboard

## 🔐 Authentication

The application uses JWT-based authentication with the following roles:

- **vht**: Village Health Team member (basic access)
- **nurse**: Healthcare worker (extended access)
- **doctor**: Medical professional (full access)
- **admin**: System administrator (all access)

### Default Users

- **VHT**: `vht_kampala_001` / `password123`
- **Nurse**: `nurse_kampala_001` / `password123`
- **Admin**: `admin_001` / `password123`

## 📱 API Endpoints

### Core Endpoints

- `GET /`: Application information
- `GET /health`: Health check
- `GET /docs`: Interactive API documentation (Swagger UI)
- `GET /redoc`: Alternative API documentation

### 🔐 Authentication (`/api/v1/auth`)

- `POST /login`: User login with username/password
- `POST /register`: Register new user (admin only)
- `POST /refresh`: Refresh access token
- `POST /logout`: User logout
- `GET /me`: Get current user profile
- `PUT /me`: Update user profile
- `POST /change-password`: Change user password

### 👶 Children Management (`/api/v1/children`)

- `GET /`: List children with filtering, pagination, and search
- `POST /`: Create new child record
- `GET /{id}`: Get child by database ID
- `GET /unique/{unique_id}`: Get child by unique identifier
- `PUT /{id}`: Update child information
- `DELETE /{id}`: Soft delete child record
- `GET /vht/{vht_id}`: Get children assigned to specific VHT
- `GET /summary/stats`: Get children statistics and summaries

### 📈 Growth Monitoring (`/api/v1/growth`)

- `GET /search`: Search growth records with advanced filtering
- `POST /`: Create new growth measurement record
- `GET /{id}`: Get specific growth record by ID
- `PUT /{id}`: Update existing growth record
- `DELETE /{id}`: Delete growth record
- `GET /child/{child_id}`: Get complete growth history for a child
- `GET /child/{child_id}/trends`: Get growth trends and analytics
- `GET /summary/stats`: Get growth monitoring statistics

### 📸 Photo Analysis (`/api/v1/photos`)

- `POST /`: Upload child photo with metadata
- `GET /`: List photos with filtering and pagination
- `GET /{id}`: Get photo details and analysis results
- `PUT /{id}`: Update photo metadata and notes
- `DELETE /{id}`: Delete photo and associated files
- `POST /{id}/analyze`: Trigger or re-run AI analysis
- `GET /child/{child_id}`: Get all photos for specific child
- `GET /summary/stats`: Get photo upload and analysis statistics
- `GET /ai/model-info`: Get AI model information and capabilities

### 🏥 Health Assessments (`/api/v1/assessments`)

- `GET /`: List assessments with filtering and pagination
- `POST /`: Create new health assessment
- `GET /{id}`: Get assessment details
- `PUT /{id}`: Update assessment
- `DELETE /{id}`: Delete assessment
- `GET /child/{child_id}`: Get all assessments for a child
- `GET /search`: Advanced search with multiple filters

## 🤖 AI/ML Models

The application includes MobileNetV2-based models for:

- **Malnutrition Detection**: Real-time analysis of facial and body photos using TensorFlow
- **Growth Prediction**: Analyze growth trends and predict future patterns
- **Risk Assessment**: Identify children at risk based on multiple indicators

### Dataset Download

Download and organize training datasets from multiple sources:

```bash
# From Hugging Face
python scripts/download_dataset.py \
    --source huggingface \
    --dataset dataset-name \
    --limit 1000 \
    --output data/training

# From Kaggle (requires API setup)
python scripts/download_dataset.py \
    --source kaggle \
    --dataset username/dataset-name \
    --output data/training

# Organize local images
python scripts/download_dataset.py \
    --source local \
    --path /path/to/images \
    --output data/training
```

See `backend/scripts/README_DATASET_DOWNLOAD.md` for detailed usage.

### Model Training

To train custom models:

1. **Download or prepare training data**:
   ```bash
   python scripts/download_dataset.py --source huggingface --dataset dataset-name
   ```

2. **Preprocess data**:
   ```bash
   python scripts/train_model.py --data-dir data/training --preprocess
   ```

3. **Train the model**:
   ```bash
   python scripts/train_model.py \
       --data-dir data/training \
       --model-name malnutrition_v1 \
       --config config/training_config.json
   ```

4. **Model files**:
   - Trained model: `ml_models/{model_name}.h5`
   - Metadata: `ml_models/{model_name}_metadata.json`
   - Evaluation: `ml_models/{model_name}_evaluation.json`

See `backend/docs/TRAINING_GUIDE.md` for comprehensive training documentation.

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   ```bash
   export ENVIRONMENT=production
   export DATABASE_URL=postgresql://user:pass@host:5432/db
   export SECRET_KEY=your-secure-secret-key
   ```

2. **Database Migration**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **SSL Configuration**
   - Update `nginx/nginx.conf` with SSL certificates
   - Configure domain names in CORS settings

### Scaling

- **Horizontal Scaling**: Run multiple backend instances behind load balancer
- **Database Scaling**: Use read replicas for analytics queries
- **ML Service**: Deploy ML models on GPU-enabled instances

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html

# Integration tests
pytest tests/integration/
```

### Test Data

- Unit tests use in-memory SQLite database
- Integration tests use test PostgreSQL database
- Mock data available in `tests/fixtures/`

## 📊 Monitoring

### Health Checks

- Application health: `/health`
- Database connectivity: Database connection pool
- ML model status: Model loading and inference

### Logging

- Application logs: `logs/app.log`
- Access logs: Nginx access logs
- Error logs: Structured error logging with context

### Metrics

- Request/response times
- Database query performance
- ML model inference latency
- Error rates and types

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=development|production
DEBUG=true|false
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_TEST_URL=postgresql://user:pass@host:5432/test_db

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# AI/ML
MODEL_PATH=ml_models/malnutrition_detection.h5
CONFIDENCE_THRESHOLD=0.7
```

### Configuration Files

- `backend/app/core/config.py`: Application configuration
- `docker-compose.yml`: Service configuration
- `nginx/nginx.conf`: Web server configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `pytest`
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Create a Pull Request

### Development Guidelines

- Follow PEP 8 Python style guide
- Add type hints to all functions
- Write comprehensive docstrings
- Include unit tests for new features
- Update API documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Village Health Teams in Uganda
- WHO Growth Standards
- Open source AI/ML community
- FastAPI and SQLAlchemy communities

## 📞 Support

For support and questions:

- **Issues**: Create an issue on GitHub
- **Documentation**: Check `/docs` endpoint
- **Email**: support@aichildhealth.org

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core functionality
- AI-powered malnutrition detection
- Growth monitoring and assessment tools
- VHT management system
- RESTful API with comprehensive documentation

---

**Note**: This application is designed for healthcare use in Uganda. Please ensure compliance with local healthcare regulations and data protection laws.
