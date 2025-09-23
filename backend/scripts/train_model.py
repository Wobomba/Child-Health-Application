#!/usr/bin/env python3
"""
Training Pipeline Script for Malnutrition Detection Model
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.training_service import TrainingService
from app.services.data_preprocessing import DataPreprocessingService
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError, ConfigurationError

logger = get_logger("training_pipeline")

def main():
    """Main training pipeline function"""
    parser = argparse.ArgumentParser(description="Train malnutrition detection model")
    parser.add_argument("--data-dir", required=True, help="Path to training data directory")
    parser.add_argument("--output-dir", default="ml_models", help="Output directory for trained model")
    parser.add_argument("--model-name", help="Name for the trained model")
    parser.add_argument("--config", help="Path to training configuration file")
    parser.add_argument("--preprocess", action="store_true", help="Run data preprocessing")
    parser.add_argument("--evaluate", action="store_true", help="Evaluate model after training")
    parser.add_argument("--test-data", help="Path to test data for evaluation")
    
    args = parser.parse_args()
    
    try:
        logger.info("Starting malnutrition detection model training pipeline")
        
        # Load configuration
        config = load_config(args.config)
        
        # Initialize services
        preprocessing_service = DataPreprocessingService(config.get("preprocessing", {}))
        training_service = TrainingService(config.get("training", {}))
        
        # Data preprocessing
        if args.preprocess:
            logger.info("Running data preprocessing...")
            preprocess_data(args.data_dir, preprocessing_service)
        
        # Train model
        logger.info("Starting model training...")
        training_results = training_service.train_model(
            data_dir=args.data_dir,
            model_name=args.model_name
        )
        
        logger.info(f"Model training completed successfully")
        logger.info(f"Model saved to: {training_results['model_path']}")
        
        # Model evaluation
        if args.evaluate and args.test_data:
            logger.info("Evaluating model...")
            evaluation_results = training_service.evaluate_model(args.test_data)
            
            # Save evaluation results
            eval_path = Path(args.output_dir) / f"{args.model_name or 'model'}_evaluation.json"
            with open(eval_path, 'w') as f:
                json.dump(evaluation_results, f, indent=2)
            
            logger.info(f"Evaluation results saved to: {eval_path}")
            logger.info(f"Test accuracy: {evaluation_results['test_accuracy']:.4f}")
        
        logger.info("Training pipeline completed successfully")
        
    except Exception as e:
        logger.error(f"Training pipeline failed: {str(e)}")
        sys.exit(1)

def load_config(config_path: str = None) -> dict:
    """Load training configuration"""
    if config_path and os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    else:
        # Return default configuration
        return {
            "preprocessing": {
                "image": {
                    "target_size": (224, 224),
                    "channels": 3,
                    "normalize": True
                },
                "quality": {
                    "min_resolution": (100, 100),
                    "max_file_size": 10 * 1024 * 1024,
                    "blur_threshold": 100
                }
            },
            "training": {
                "model": {
                    "input_shape": (224, 224, 3),
                    "num_classes": 3,
                    "dropout_rate": 0.2,
                    "learning_rate": 0.001
                },
                "training": {
                    "batch_size": 32,
                    "epochs": 100,
                    "validation_split": 0.2,
                    "patience": 10
                }
            }
        }

def preprocess_data(data_dir: str, preprocessing_service: DataPreprocessingService):
    """Preprocess training data"""
    try:
        # Organize data
        organized_dir = os.path.join(data_dir, "organized")
        organization_report = preprocessing_service.organize_training_data(
            source_dir=data_dir,
            target_dir=organized_dir
        )
        
        logger.info(f"Data organization completed: {organization_report['processed_count']} images processed")
        
        # Create data splits
        splits_report = preprocessing_service.create_data_splits(organized_dir)
        logger.info(f"Data splits created: {len(splits_report['splits']['train'])} train, {len(splits_report['splits']['validation'])} val, {len(splits_report['splits']['test'])} test")
        
    except Exception as e:
        logger.error(f"Data preprocessing failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
