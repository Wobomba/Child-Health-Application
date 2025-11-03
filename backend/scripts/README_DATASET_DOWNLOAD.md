# Dataset Download Script

This script helps you download and organize datasets from various sources for training the malnutrition detection model.

## Features

- ✅ Download from **Hugging Face** datasets
- ✅ Download from **Kaggle** datasets (requires API setup)
- ✅ Organize **local** image collections
- ✅ Automatic image organization into class folders
- ✅ Support for multiple image formats
- ✅ Validation and preprocessing

## Installation

First, install the required dependencies:

```bash
pip install -r requirements-training.txt
```

This will install:
- `datasets` - For Hugging Face dataset downloads
- `kaggle` - For Kaggle dataset downloads

## Quick Start

### Option 1: Download from Hugging Face

```bash
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 1000 \
    --default-class normal \
    --output data/training
```

### Option 2: Download from Kaggle

**First, set up Kaggle API** (one-time setup):
1. Go to https://www.kaggle.com/account
2. Scroll to "API" section
3. Click "Create New API Token"
4. Save `kaggle.json` to `~/.kaggle/` or `~/.config/kaggle/`
5. Set permissions: `chmod 600 ~/.kaggle/kaggle.json`

**Then download:**
```bash
python scripts/download_dataset.py \
    --source kaggle \
    --dataset username/dataset-name \
    --output data/training
```

### Option 3: Organize Local Images

```bash
python scripts/download_dataset.py \
    --source local \
    --path /path/to/your/images \
    --output data/training
```

**With class mapping:**
Create `class_mapping.json`:
```json
{
  "healthy": "normal",
  "mild": "moderate_malnutrition",
  "critical": "severe_malnutrition"
}
```

Then:
```bash
python scripts/download_dataset.py \
    --source local \
    --path /path/to/your/images \
    --class-mapping class_mapping.json \
    --output data/training
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--source` | Yes | Data source: `huggingface`, `kaggle`, or `local` |
| `--dataset` | Yes* | Dataset name (for Hugging Face or Kaggle) |
| `--path` | Yes* | Local path to images (for local source) |
| `--output` | No | Output directory (default: `data/training`) |
| `--limit` | No | Limit number of samples (Hugging Face) |
| `--split` | No | Dataset split to download (default: `train`) |
| `--default-class` | No | Default class for unlabeled images (default: `normal`) |
| `--class-mapping` | No | JSON file with class mapping (for local) |

\* Required depending on source

## Output Structure

After downloading, your data will be organized as:

```
data/training/
├── normal/
│   ├── image_00000.jpg
│   ├── image_00001.jpg
│   └── ...
├── moderate_malnutrition/
│   └── ...
└── severe_malnutrition/
    └── ...
```

## Examples

### Example 1: Small Test Dataset
```bash
# Download 100 images for testing
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 100 \
    --output data/training/test
```

### Example 2: Full Dataset
```bash
# Download full dataset (no limit)
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --output data/training
```

### Example 3: Multiple Classes
```bash
# Download normal images
python scripts/download_dataset.py \
    --source huggingface \
    --dataset dataset1 \
    --default-class normal \
    --output data/training

# Download moderate images (if dataset has labels)
python scripts/download_dataset.py \
    --source huggingface \
    --dataset dataset2 \
    --default-class moderate_malnutrition \
    --output data/training
```

## Tips

1. **Start Small**: Test with `--limit 100` first
2. **Check Output**: Verify images in `data/training/` before training
3. **Data Quality**: The script validates images automatically
4. **Multiple Sources**: You can download from multiple sources to build your dataset

## Troubleshooting

### "datasets library not found"
```bash
pip install datasets
```

### "kaggle library not found"
```bash
pip install kaggle
```

### "Kaggle API credentials not found"
Set up Kaggle API as described in Option 2 above.

### "Failed to download dataset"
- Check internet connection
- Verify dataset name is correct
- Check Hugging Face/Kaggle for dataset availability
- Review logs in `logs/` directory

### "No images found"
- Check dataset format (some datasets may not have image fields)
- Try different dataset
- Use `--limit` to test with smaller sample first

## Next Steps

After downloading:
1. **Preprocess**: Run preprocessing to validate images
   ```bash
   python scripts/train_model.py --data-dir data/training --preprocess
   ```

2. **Train**: Start training your model
   ```bash
   python scripts/train_model.py --data-dir data/training --model-name malnutrition_v1
   ```

## Support

For more information:
- See `docs/DATASET_RECOMMENDATIONS.md` for dataset suggestions
- See `docs/DATASET_QUICK_START.md` for workflow guide
- Check logs in `logs/` for detailed error messages

