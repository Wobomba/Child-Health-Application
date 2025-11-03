#!/usr/bin/env python3
"""
Quick Training Script for Production Model
Optimized for speed - trains a model quickly for immediate use
"""

import os
import sys
import zipfile
import shutil
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import get_logger
from app.services.data_preprocessing import DataPreprocessingService
from app.services.training_service import TrainingService

logger = get_logger("quick_train")

def extract_dataset(zip_path: str, extract_dir: str):
    """Extract dataset zip file"""
    logger.info(f"Extracting dataset from {zip_path}...")
    
    extract_path = Path(extract_dir)
    extract_path.mkdir(parents=True, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
    
    logger.info(f"Dataset extracted to {extract_path}")
    return extract_path

def organize_dataset(source_dir: Path, target_dir: str):
    """Organize extracted dataset into training structure"""
    logger.info("Organizing dataset into training structure...")
    
    preprocessing = DataPreprocessingService()
    
    # Organize data
    result = preprocessing.organize_training_data(
        source_dir=str(source_dir),
        target_dir=target_dir
    )
    
    logger.info(f"Organized {result['processed_count']} images")
    logger.info(f"Skipped {result['skipped_count']} invalid images")
    
    return result

def quick_train(data_dir: str, model_name: str = "malnutrition_production"):
    """Quick training with optimized settings for speed"""
    logger.info("Starting quick training...")
    
    # Load config and modify for quick training
    config_path = Path(__file__).parent.parent / "config" / "training_config.json"
    
    if config_path.exists():
        import json
        with open(config_path, 'r') as f:
            config = json.load(f)
    else:
        # Use default config
        config = {}
    
    # Override with quick training settings
    if "training" not in config:
        config["training"] = {}
    
    config["training"]["batch_size"] = 32
    config["training"]["epochs"] = 20  # Reduced for speed
    config["training"]["patience"] = 5  # Early stopping
    config["training"]["validation_split"] = 0.2
    
    logger.info("Training settings:")
    logger.info(f"  - Epochs: {config['training']['epochs']}")
    logger.info(f"  - Batch size: {config['training']['batch_size']}")
    logger.info(f"  - Early stopping patience: {config['training']['patience']}")
    
    # Initialize training service
    training_service = TrainingService(config=config)
    
    # Create model
    model = training_service.create_model()
    logger.info("Model created successfully")
    
    # Prepare data
    train_gen, val_gen = training_service.prepare_data(data_dir)
    logger.info(f"Training samples: {train_gen.samples}")
    logger.info(f"Validation samples: {val_gen.samples}")
    
    # Train model
    logger.info("Starting training...")
    history = training_service.train_model(
        train_generator=train_gen,
        validation_generator=val_gen,
        model_name=model_name
    )
    
    logger.info("Training completed!")
    
    # Save model info
    model_info = training_service.get_model_info()
    logger.info(f"Model saved: {model_info['model_path']}")
    
    return model_info

def main():
    parser = argparse.ArgumentParser(description="Quick training script for production model")
    
    parser.add_argument(
        "--dataset-zip",
        type=str,
        help="Path to dataset zip file"
    )
    
    parser.add_argument(
        "--data-dir",
        type=str,
        default="data/training",
        help="Directory with organized training data (skip extraction if provided)"
    )
    
    parser.add_argument(
        "--model-name",
        type=str,
        default="malnutrition_production",
        help="Name for the trained model"
    )
    
    parser.add_argument(
        "--extract-dir",
        type=str,
        default="data/raw",
        help="Directory to extract zip file to"
    )
    
    args = parser.parse_args()
    
    try:
        # Step 1: Extract dataset if zip provided
        if args.dataset_zip:
            logger.info(f"Working with dataset: {args.dataset_zip}")
            extract_path = extract_dataset(args.dataset_zip, args.extract_dir)
            
            # Step 2: Organize dataset
            organize_dataset(extract_path, args.data_dir)
        else:
            logger.info(f"Using existing data directory: {args.data_dir}")
            if not os.path.exists(args.data_dir):
                logger.error(f"Data directory {args.data_dir} does not exist!")
                return 1
        
        # Step 3: Quick preprocessing
        logger.info("Running quick preprocessing...")
        preprocessing = DataPreprocessingService()
        preprocessing.create_data_splits(args.data_dir)
        
        # Step 4: Quick train
        model_info = quick_train(args.data_dir, args.model_name)
        
        logger.info("=" * 60)
        logger.info("Training completed successfully!")
        logger.info(f"Model saved to: {model_info.get('model_path', 'ml_models/')}")
        logger.info(f"Model version: {model_info.get('version', 'N/A')}")
        logger.info("=" * 60)
        
        return 0
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())

