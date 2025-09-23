"""
Global error handlers for AI Child Health application
"""

import logging
import traceback
from typing import Union
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import (
    AIChildHealthException,
    convert_to_http_exception,
    EXCEPTION_TO_HTTP_STATUS
)
from app.core.logging import get_logger

logger = get_logger("error_handlers")

async def custom_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for all unhandled exceptions"""
    
    # Log the exception
    logger.error(
        f"Unhandled exception in {request.method} {request.url}",
        exc_info=True,
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method
        }
    )
    
    # Return generic error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "details": {
                "path": str(request.url),
                "method": request.method
            }
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler for HTTP exceptions"""
    
    logger.warning(
        f"HTTP exception in {request.method} {request.url}: {exc.detail}",
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "details": {
                "path": str(request.url),
                "method": request.method
            }
        }
    )

async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handler for Starlette HTTP exceptions"""
    
    logger.warning(
        f"Starlette HTTP exception in {request.method} {request.url}: {exc.detail}",
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "details": {
                "path": str(request.url),
                "method": request.method
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handler for request validation errors"""
    
    logger.warning(
        f"Validation error in {request.method} {request.url}: {exc.errors()}",
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "validation_errors": exc.errors()
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "error_code": "VALIDATION_ERROR",
            "details": {
                "path": str(request.url),
                "method": request.method,
                "validation_errors": exc.errors()
            }
        }
    )

async def pydantic_validation_exception_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
    """Handler for Pydantic validation errors"""
    
    logger.warning(
        f"Pydantic validation error in {request.method} {request.url}: {exc.errors()}",
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "validation_errors": exc.errors()
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Data validation failed",
            "error_code": "PYDANTIC_VALIDATION_ERROR",
            "details": {
                "path": str(request.url),
                "method": request.method,
                "validation_errors": exc.errors()
            }
        }
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handler for SQLAlchemy database errors"""
    
    logger.error(
        f"Database error in {request.method} {request.url}: {str(exc)}",
        exc_info=True,
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "database_error": str(exc)
        }
    )
    
    # Determine specific error type and response
    if isinstance(exc, IntegrityError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": "Database Integrity Error",
                "message": "Data integrity constraint violated",
                "error_code": "DATABASE_INTEGRITY_ERROR",
                "details": {
                    "path": str(request.url),
                    "method": request.method,
                    "database_error": str(exc)
                }
            }
        )
    elif isinstance(exc, OperationalError):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Database Connection Error",
                "message": "Database service is temporarily unavailable",
                "error_code": "DATABASE_CONNECTION_ERROR",
                "details": {
                    "path": str(request.url),
                    "method": request.method,
                    "database_error": str(exc)
                }
            }
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Database Error",
                "message": "A database error occurred",
                "error_code": "DATABASE_ERROR",
                "details": {
                    "path": str(request.url),
                    "method": request.method,
                    "database_error": str(exc)
                }
            }
        )

async def ai_child_health_exception_handler(request: Request, exc: AIChildHealthException) -> JSONResponse:
    """Handler for custom AI Child Health exceptions"""
    
    # Convert to HTTP exception
    http_exc = convert_to_http_exception(exc)
    
    # Log the exception
    log_level = "warning" if http_exc.status_code < 500 else "error"
    getattr(logger, log_level)(
        f"AI Child Health exception in {request.method} {request.url}: {exc.message}",
        extra={
            "request_id": getattr(request.state, 'request_id', None),
            "user_id": getattr(request.state, 'user_id', None),
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get('user-agent'),
            "path": str(request.url),
            "method": request.method,
            "error_code": exc.error_code,
            "error_details": exc.details
        }
    )
    
    return JSONResponse(
        status_code=http_exc.status_code,
        content={
            "error": "Application Error",
            "message": exc.message,
            "error_code": exc.error_code,
            "details": {
                "path": str(request.url),
                "method": request.method,
                **exc.details
            }
        }
    )

def register_error_handlers(app):
    """Register all error handlers with the FastAPI app"""
    
    # Custom exception handlers
    app.add_exception_handler(Exception, custom_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(AIChildHealthException, ai_child_health_exception_handler)
    
    logger.info("Error handlers registered successfully")
