"""
Custom exceptions for AI Child Health application
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status

class AIChildHealthException(Exception):
    """Base exception for AI Child Health application"""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(AIChildHealthException):
    """Raised when data validation fails"""
    pass

class AuthenticationError(AIChildHealthException):
    """Raised when authentication fails"""
    pass

class AuthorizationError(AIChildHealthException):
    """Raised when user lacks required permissions"""
    pass

class ResourceNotFoundError(AIChildHealthException):
    """Raised when a requested resource is not found"""
    pass

class DatabaseError(AIChildHealthException):
    """Raised when database operations fail"""
    pass

class AIServiceError(AIChildHealthException):
    """Raised when AI service operations fail"""
    pass

class FileProcessingError(AIChildHealthException):
    """Raised when file processing fails"""
    pass

class ExternalServiceError(AIChildHealthException):
    """Raised when external service calls fail"""
    pass

class ConfigurationError(AIChildHealthException):
    """Raised when configuration is invalid"""
    pass

class BusinessLogicError(AIChildHealthException):
    """Raised when business logic constraints are violated"""
    pass

# HTTP Exception mappings
EXCEPTION_TO_HTTP_STATUS = {
    ValidationError: status.HTTP_400_BAD_REQUEST,
    AuthenticationError: status.HTTP_401_UNAUTHORIZED,
    AuthorizationError: status.HTTP_403_FORBIDDEN,
    ResourceNotFoundError: status.HTTP_404_NOT_FOUND,
    DatabaseError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    AIServiceError: status.HTTP_503_SERVICE_UNAVAILABLE,
    FileProcessingError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    ExternalServiceError: status.HTTP_502_BAD_GATEWAY,
    ConfigurationError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    BusinessLogicError: status.HTTP_400_BAD_REQUEST,
}

def convert_to_http_exception(exception: AIChildHealthException) -> HTTPException:
    """Convert custom exception to HTTPException"""
    status_code = EXCEPTION_TO_HTTP_STATUS.get(type(exception), status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return HTTPException(
        status_code=status_code,
        detail={
            "message": exception.message,
            "error_code": exception.error_code,
            "details": exception.details
        }
    )

# Specific business exceptions
class ChildNotFoundError(ResourceNotFoundError):
    """Raised when a child record is not found"""
    def __init__(self, child_id: int):
        super().__init__(
            message=f"Child with ID {child_id} not found",
            error_code="CHILD_NOT_FOUND",
            details={"child_id": child_id}
        )

class UserNotFoundError(ResourceNotFoundError):
    """Raised when a user record is not found"""
    def __init__(self, user_id: int):
        super().__init__(
            message=f"User with ID {user_id} not found",
            error_code="USER_NOT_FOUND",
            details={"user_id": user_id}
        )

class AssessmentNotFoundError(ResourceNotFoundError):
    """Raised when an assessment record is not found"""
    def __init__(self, assessment_id: int):
        super().__init__(
            message=f"Assessment with ID {assessment_id} not found",
            error_code="ASSESSMENT_NOT_FOUND",
            details={"assessment_id": assessment_id}
        )

class PhotoNotFoundError(ResourceNotFoundError):
    """Raised when a photo record is not found"""
    def __init__(self, photo_id: int):
        super().__init__(
            message=f"Photo with ID {photo_id} not found",
            error_code="PHOTO_NOT_FOUND",
            details={"photo_id": photo_id}
        )

class InvalidCredentialsError(AuthenticationError):
    """Raised when user credentials are invalid"""
    def __init__(self):
        super().__init__(
            message="Invalid username or password",
            error_code="INVALID_CREDENTIALS"
        )

class InsufficientPermissionsError(AuthorizationError):
    """Raised when user lacks required permissions"""
    def __init__(self, required_role: str, user_role: str):
        super().__init__(
            message=f"Insufficient permissions. Required: {required_role}, Current: {user_role}",
            error_code="INSUFFICIENT_PERMISSIONS",
            details={"required_role": required_role, "user_role": user_role}
        )

class DuplicateChildError(BusinessLogicError):
    """Raised when trying to create a duplicate child record"""
    def __init__(self, unique_id: str):
        super().__init__(
            message=f"Child with unique ID {unique_id} already exists",
            error_code="DUPLICATE_CHILD",
            details={"unique_id": unique_id}
        )

class InvalidImageFormatError(FileProcessingError):
    """Raised when image format is not supported"""
    def __init__(self, file_type: str, allowed_types: list):
        super().__init__(
            message=f"Invalid image format: {file_type}. Allowed formats: {allowed_types}",
            error_code="INVALID_IMAGE_FORMAT",
            details={"file_type": file_type, "allowed_types": allowed_types}
        )

class ImageTooLargeError(FileProcessingError):
    """Raised when image file is too large"""
    def __init__(self, file_size: int, max_size: int):
        super().__init__(
            message=f"Image file too large: {file_size} bytes. Maximum allowed: {max_size} bytes",
            error_code="IMAGE_TOO_LARGE",
            details={"file_size": file_size, "max_size": max_size}
        )

class AIModelLoadError(AIServiceError):
    """Raised when AI model fails to load"""
    def __init__(self, model_path: str, error: str):
        super().__init__(
            message=f"Failed to load AI model from {model_path}: {error}",
            error_code="AI_MODEL_LOAD_ERROR",
            details={"model_path": model_path, "error": error}
        )

class AIAnalysisError(AIServiceError):
    """Raised when AI analysis fails"""
    def __init__(self, photo_id: int, error: str):
        super().__init__(
            message=f"AI analysis failed for photo {photo_id}: {error}",
            error_code="AI_ANALYSIS_ERROR",
            details={"photo_id": photo_id, "error": error}
        )

class DatabaseConnectionError(DatabaseError):
    """Raised when database connection fails"""
    def __init__(self, error: str):
        super().__init__(
            message=f"Database connection failed: {error}",
            error_code="DATABASE_CONNECTION_ERROR",
            details={"error": error}
        )

class DatabaseQueryError(DatabaseError):
    """Raised when database query fails"""
    def __init__(self, query: str, error: str):
        super().__init__(
            message=f"Database query failed: {error}",
            error_code="DATABASE_QUERY_ERROR",
            details={"query": query, "error": error}
        )
