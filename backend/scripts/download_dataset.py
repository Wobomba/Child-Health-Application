#!/usr/bin/env python3
"""
Dataset Download Script for Malnutrition Detection Training

This script helps download and organize datasets from various sources:
- Hugging Face datasets
- Kaggle datasets
- Local datasets

Usage:
    python scripts/download_dataset.py --source huggingface --dataset danielkraic/facedetection
    python scripts/download_dataset.py --source kaggle --dataset username/dataset-name
    python scripts/download_dataset.py --source local --path /path/to/images
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import get_logger
from app.core.exceptions import ConfigurationError

logger = get_logger("download_dataset")

class DatasetDownloader:
    """Download and organize datasets for training"""
    
    def __init__(self, output_dir: str = "data/training"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create class directories
        for class_name in ["normal", "moderate_malnutrition", "severe_malnutrition"]:
            (self.output_dir / class_name).mkdir(exist_ok=True)
    
    def download_huggingface(self, dataset_name: str, split: str = "train", limit: Optional[int] = None, default_class: str = "normal"):
        """Download dataset from Hugging Face"""
        try:
            from datasets import load_dataset
            
            logger.info(f"Downloading dataset {dataset_name} from Hugging Face...")
            
            # Try to load dataset
            try:
                # First try with split
                dataset = load_dataset(dataset_name, split=split)
            except Exception:
                # If split fails, try loading the whole dataset
                logger.info(f"Trying to load full dataset (split '{split}' not available)")
                full_dataset = load_dataset(dataset_name)
                # Try to get train split or first available split
                if split in full_dataset:
                    dataset = full_dataset[split]
                else:
                    # Get first available split
                    available_splits = list(full_dataset.keys())
                    logger.info(f"Using split: {available_splits[0]}")
                    dataset = full_dataset[available_splits[0]]
            
            # Limit if specified
            if limit:
                dataset = dataset.select(range(min(limit, len(dataset))))
            
            logger.info(f"Downloaded {len(dataset)} samples")
            
            # Process and organize images
            self._organize_images(dataset, default_class)
            
            logger.info(f"Dataset organized in {self.output_dir}")
            
        except ImportError:
            logger.error("datasets library not found. Install with: pip install datasets")
            raise
        except Exception as e:
            logger.error(f"Failed to download from Hugging Face: {e}")
            raise
    
    def download_kaggle(self, dataset_name: str, unzip: bool = True):
        """Download dataset from Kaggle (requires API key)"""
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
            
            logger.info(f"Downloading dataset {dataset_name} from Kaggle...")
            
            # Check for API credentials in multiple locations
            kaggle_dirs = [
                os.path.expanduser("~/.kaggle/kaggle.json"),
                os.path.expanduser("~/.config/kaggle/kaggle.json")
            ]
            
            kaggle_json = None
            for path in kaggle_dirs:
                if os.path.exists(path):
                    kaggle_json = path
                    break
            
            if not kaggle_json:
                logger.error("Kaggle API credentials not found!")
                logger.info("Please:")
                logger.info("1. Go to https://www.kaggle.com/account")
                logger.info("2. Create API token")
                logger.info("3. Save kaggle.json to ~/.kaggle/ or ~/.config/kaggle/")
                logger.info("4. chmod 600 kaggle.json")
                raise ConfigurationError(
                    "Kaggle API credentials not configured",
                    error_code="KAGGLE_NOT_CONFIGURED"
                )
            
            # Initialize Kaggle API
            api = KaggleApi()
            api.authenticate()
            
            # Create raw data directory
            raw_dir = self.output_dir.parent / "raw"
            raw_dir.mkdir(parents=True, exist_ok=True)
            
            # Download dataset
            api.dataset_download_files(
                dataset_name,
                path=str(raw_dir),
                unzip=unzip
            )
            
            logger.info(f"Dataset downloaded to {raw_dir}")
            logger.info("Please organize images into class folders manually or use preprocessing service")
            
        except ImportError:
            logger.error("kaggle library not found. Install with: pip install kaggle")
            raise
        except Exception as e:
            logger.error(f"Failed to download from Kaggle: {e}")
            raise
    
    def organize_local(self, source_path: str, class_mapping: Dict[str, str] = None):
        """Organize local dataset into class folders"""
        from app.services.data_preprocessing import DataPreprocessingService
        
        logger.info(f"Organizing local dataset from {source_path}...")
        
        preprocessing_service = DataPreprocessingService()
        
        # Organize data
        result = preprocessing_service.organize_training_data(
            source_dir=source_path,
            target_dir=str(self.output_dir),
            class_mapping=class_mapping
        )
        
        logger.info(f"Organized {result['processed_count']} images")
        logger.info(f"Skipped {result['skipped_count']} invalid images")
    
    def _organize_images(self, dataset, default_class: str = "normal"):
        """Organize dataset images into class folders"""
        try:
            from PIL import Image
            
            count = 0
            skipped = 0
            
            logger.info("Processing images from dataset...")
            
            for idx, item in enumerate(dataset):
                try:
                    # Get image - try multiple common field names
                    image = None
                    image_keys = ["image", "img", "photo", "picture", "pixel_values"]
                    
                    for key in image_keys:
                        if key in item:
                            image = item[key]
                            break
                    
                    # If not found, try to find any PIL Image in the item
                    if not image:
                        for key, value in item.items():
                            if isinstance(value, Image.Image):
                                image = value
                                break
                    
                    if not image:
                        skipped += 1
                        if idx < 5:  # Log first few for debugging
                            logger.debug(f"No image found in item {idx}, keys: {list(item.keys())}")
                        continue
                    
                    # Convert to PIL Image if needed
                    if not isinstance(image, Image.Image):
                        # Try to convert from array or other formats
                        if hasattr(image, 'convert'):
                            image = image.convert('RGB')
                        else:
                            try:
                                import numpy as np
                                if isinstance(image, np.ndarray):
                                    image = Image.fromarray(image)
                                else:
                                    skipped += 1
                                    continue
                            except:
                                skipped += 1
                                continue
                    
                    # Determine class from label
                    class_name = default_class
                    if "label" in item:
                        label = item["label"]
                        if isinstance(label, (int, float)):
                            # Numeric label - map if you know the mapping
                            # For now, default
                            pass
                        elif isinstance(label, str):
                            label_lower = label.lower()
                            if "moderate" in label_lower or "mild" in label_lower:
                                class_name = "moderate_malnutrition"
                            elif "severe" in label_lower or "critical" in label_lower:
                                class_name = "severe_malnutrition"
                            elif "normal" in label_lower or "healthy" in label_lower:
                                class_name = "normal"
                    
                    # Ensure RGB mode
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    # Save image
                    class_dir = self.output_dir / class_name
                    image_path = class_dir / f"image_{idx:05d}.jpg"
                    
                    image.save(image_path, "JPEG", quality=95)
                    
                    count += 1
                    
                    if count % 100 == 0:
                        logger.info(f"Processed {count} images...")
                
                except Exception as e:
                    logger.warning(f"Failed to process item {idx}: {e}")
                    skipped += 1
                    continue
            
            logger.info(f"Organized {count} images, skipped {skipped}")
            logger.info(f"Images saved to: {self.output_dir}")
            
        except Exception as e:
            logger.error(f"Failed to organize images: {e}")
            raise

def main():
    parser = argparse.ArgumentParser(description="Download datasets for malnutrition detection training")
    
    parser.add_argument(
        "--source",
        type=str,
        required=True,
        choices=["huggingface", "kaggle", "local"],
        help="Data source: huggingface, kaggle, or local"
    )
    
    parser.add_argument(
        "--dataset",
        type=str,
        help="Dataset name (for Hugging Face or Kaggle)"
    )
    
    parser.add_argument(
        "--path",
        type=str,
        help="Local path to images (for local source)"
    )
    
    parser.add_argument(
        "--output",
        type=str,
        default="data/training",
        help="Output directory for organized data"
    )
    
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of samples (for Hugging Face)"
    )
    
    parser.add_argument(
        "--split",
        type=str,
        default="train",
        help="Dataset split to download (for Hugging Face)"
    )
    
    parser.add_argument(
        "--default-class",
        type=str,
        default="normal",
        choices=["normal", "moderate_malnutrition", "severe_malnutrition"],
        help="Default class for unlabeled images (for Hugging Face)"
    )
    
    parser.add_argument(
        "--class-mapping",
        type=str,
        help="JSON file with class mapping for local datasets"
    )
    
    args = parser.parse_args()
    
    downloader = DatasetDownloader(output_dir=args.output)
    
    try:
        if args.source == "huggingface":
            if not args.dataset:
                logger.error("--dataset required for Hugging Face source")
                return
            
            downloader.download_huggingface(
                dataset_name=args.dataset,
                split=args.split,
                limit=args.limit,
                default_class=args.default_class
            )
        
        elif args.source == "kaggle":
            if not args.dataset:
                logger.error("--dataset required for Kaggle source")
                return
            
            downloader.download_kaggle(dataset_name=args.dataset)
        
        elif args.source == "local":
            if not args.path:
                logger.error("--path required for local source")
                return
            
            class_mapping = None
            if args.class_mapping:
                with open(args.class_mapping, 'r') as f:
                    class_mapping = json.load(f)
            
            downloader.organize_local(
                source_path=args.path,
                class_mapping=class_mapping
            )
        
        logger.info("Dataset download and organization completed successfully!")
        
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

