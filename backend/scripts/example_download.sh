#!/bin/bash
# Example script for downloading datasets

# Make sure we're in the backend directory
cd "$(dirname "$0")/.." || exit 1

# Activate virtual environment
source venv/bin/activate

# Example 1: Download from Hugging Face (face dataset - for normal class)
echo "Example 1: Downloading face dataset from Hugging Face..."
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 100 \
    --default-class normal \
    --output data/training

# Example 2: Download from Kaggle (requires API setup first)
# Uncomment after setting up Kaggle API:
# echo "Example 2: Downloading from Kaggle..."
# python scripts/download_dataset.py \
#     --source kaggle \
#     --dataset username/dataset-name \
#     --output data/training

# Example 3: Organize local images
# echo "Example 3: Organizing local images..."
# python scripts/download_dataset.py \
#     --source local \
#     --path /path/to/your/images \
#     --output data/training

echo "Done! Check data/training/ for organized images"

