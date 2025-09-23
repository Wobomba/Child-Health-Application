"""
Comprehensive logging configuration for AI Child Health application
"""

import logging
import logging.config
import sys
from pathlib import Path
from typing import Dict, Any
import json
from datetime import datetime
import traceback

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "thread": record.thread,
            "process": record.process
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'child_id'):
            log_entry["child_id"] = record.child_id
        if hasattr(record, 'assessment_id'):
            log_entry["assessment_id"] = record.assessment_id
        if hasattr(record, 'photo_id'):
            log_entry["photo_id"] = record.photo_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry["ip_address"] = record.ip_address
        if hasattr(record, 'user_agent'):
            log_entry["user_agent"] = record.user_agent
        
        return json.dumps(log_entry, ensure_ascii=False)

class ContextFilter(logging.Filter):
    """Filter to add context information to log records"""
    
    def filter(self, record):
        # Add request context if available
        if hasattr(record, 'request'):
            request = record.request
            record.ip_address = getattr(request.client, 'host', 'unknown')
            record.user_agent = request.headers.get('user-agent', 'unknown')
        
        return True

def setup_logging(debug: bool = False, log_level: str = "INFO") -> None:
    """Setup comprehensive logging configuration"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Determine log level
    level = logging.DEBUG if debug else getattr(logging, log_level.upper(), logging.INFO)
    
    # Logging configuration
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d - %(funcName)s(): %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "()": JSONFormatter
            }
        },
        "filters": {
            "context": {
                "()": ContextFilter
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": level,
                "formatter": "standard",
                "stream": sys.stdout,
                "filters": ["context"]
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": level,
                "formatter": "detailed",
                "filename": "logs/app.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "filters": ["context"]
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": "logs/error.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "filters": ["context"]
            },
            "json_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": level,
                "formatter": "json",
                "filename": "logs/structured.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "filters": ["context"]
            }
        },
        "loggers": {
            "": {  # Root logger
                "level": level,
                "handlers": ["console", "file", "json_file"],
                "propagate": False
            },
            "app": {
                "level": level,
                "handlers": ["console", "file", "error_file", "json_file"],
                "propagate": False
            },
            "app.api": {
                "level": level,
                "handlers": ["console", "file", "json_file"],
                "propagate": False
            },
            "app.services": {
                "level": level,
                "handlers": ["console", "file", "error_file", "json_file"],
                "propagate": False
            },
            "app.core": {
                "level": level,
                "handlers": ["console", "file", "json_file"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            },
            "sqlalchemy": {
                "level": "WARNING",
                "handlers": ["file"],
                "propagate": False
            },
            "tensorflow": {
                "level": "WARNING",
                "handlers": ["file"],
                "propagate": False
            },
            "cv2": {
                "level": "WARNING",
                "handlers": ["file"],
                "propagate": False
            }
        }
    }
    
    # Apply configuration
    logging.config.dictConfig(config)
    
    # Set up specific loggers
    logger = logging.getLogger("app")
    logger.info(f"Logging configured - Level: {log_level}, Debug: {debug}")

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(f"app.{name}")

class LoggerMixin:
    """Mixin class to add logging capabilities to any class"""
    
    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class"""
        return get_logger(self.__class__.__module__ + "." + self.__class__.__name__)

def log_function_call(func):
    """Decorator to log function calls with parameters and results"""
    def wrapper(*args, **kwargs):
        logger = get_logger(func.__module__)
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} failed with error: {str(e)}", exc_info=True)
            raise
    return wrapper

def log_api_request(func):
    """Decorator to log API requests"""
    def wrapper(*args, **kwargs):
        logger = get_logger("api")
        # Extract request info if available
        request = None
        for arg in args:
            if hasattr(arg, 'request'):
                request = arg.request
                break
        
        if request:
            logger.info(f"API Request: {request.method} {request.url}")
            logger.debug(f"Headers: {dict(request.headers)}")
        
        try:
            result = func(*args, **kwargs)
            logger.info(f"API Response: {func.__name__} completed successfully")
            return result
        except Exception as e:
            logger.error(f"API Error in {func.__name__}: {str(e)}", exc_info=True)
            raise
    return wrapper

# Initialize logging when module is imported
setup_logging()
