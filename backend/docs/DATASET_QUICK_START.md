# Dataset Quick Start Guide

## Quick Recommendations

### Best Options for Starting Training

#### 1. **Start with General Face Datasets** (For Proof of Concept)

Since specific malnutrition datasets are limited, you can:

**Option A: Use Hugging Face Face Datasets**
```bash
# Download a face dataset (will default to 'normal' class)
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 1000 \
    --output data/training

# This downloads face images to data/training/normal/
```

**Option B: Use Kaggle Datasets**
```bash
# First, set up Kaggle API (one-time setup)
# 1. Go to https://www.kaggle.com/account
# 2. Create API token
# 3. Save kaggle.json to ~/.kaggle/
# 4. chmod 600 ~/.kaggle/kaggle.json

# Then download a dataset
python scripts/download_dataset.py \
    --source kaggle \
    --dataset username/dataset-name \
    --output data/training
```

#### 2. **Search Kaggle for Better Datasets**

Recommended Kaggle search terms:
- "malnutrition"
- "child health"
- "nutrition assessment"
- "pediatric imaging"
- "global health children"

#### 3. **Use Local Data Organization**

If you have images in a folder:
```bash
python scripts/download_dataset.py \
    --source local \
    --path /path/to/your/images \
    --output data/training

# Create class_mapping.json to map your folder names:
# {
#   "healthy": "normal",
#   "mild": "moderate_malnutrition",
#   "critical": "severe_malnutrition"
# }

python scripts/download_dataset.py \
    --source local \
    --path /path/to/your/images \
    --class-mapping class_mapping.json \
    --output data/training
```

## Step-by-Step Workflow

### Step 1: Install Dependencies
```bash
pip install -r requirements-training.txt
```

### Step 2: Download Initial Dataset
```bash
# Start with a face dataset for 'normal' class
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 500 \
    --output data/training/normal
```

### Step 3: Organize Your Data Structure

After downloading, your structure should be:
```
data/training/
├── normal/
│   ├── image_00000.jpg
│   ├── image_00001.jpg
│   └── ...
├── moderate_malnutrition/
│   └── (add your moderate cases here)
└── severe_malnutrition/
    └── (add your severe cases here)
```

### Step 4: Preprocess Your Data
```bash
python scripts/train_model.py \
    --data-dir data/training \
    --preprocess
```

### Step 5: Train Your Model
```bash
python scripts/train_model.py \
    --data-dir data/training \
    --model-name malnutrition_v1
```

## Important Notes

### Data Collection Strategy

1. **Start Small**: Begin with whatever data you have
   - Even a few hundred images per class is a good start
   - You can retrain later with more data

2. **Synthetic Augmentation**: The training pipeline includes extensive augmentation
   - Rotation, zoom, brightness adjustments
   - This helps with small datasets

3. **Gradual Improvement**: 
   - Train initial model with available data
   - Collect real data through your application
   - Retrain periodically with new data

### Ethical Considerations

⚠️ **IMPORTANT**: When collecting real data:
- Obtain proper consent from parents/guardians
- Ensure data anonymization
- Follow local regulations (HIPAA, GDPR, etc.)
- Partner with medical professionals for accurate labeling

### Data Quality Tips

1. **Image Quality**: 
   - Clear, front-facing photos
   - Good lighting
   - Minimum 100x100 resolution

2. **Class Balance**:
   - Try to have similar numbers in each class
   - If unbalanced, the model will adjust but may need more epochs

3. **Validation**:
   - The preprocessing script validates image quality
   - Removes blurry, too-small, or corrupted images

## Example: Complete Workflow

```bash
# 1. Create directories
mkdir -p data/training/{normal,moderate_malnutrition,severe_malnutrition}

# 2. Download initial dataset (if using Hugging Face)
python scripts/download_dataset.py \
    --source huggingface \
    --dataset danielkraic/facedetection \
    --limit 1000 \
    --output data/training

# 3. Add your other classes manually or via script
# (Place moderate and severe images in respective folders)

# 4. Preprocess and validate
python scripts/train_model.py \
    --data-dir data/training \
    --preprocess

# 5. Train model
python scripts/train_model.py \
    --data-dir data/training \
    --model-name malnutrition_v1 \
    --config config/training_config.json
```

## Next Steps After Training

1. **Evaluate Model**: Check evaluation metrics in `ml_models/{model_name}_evaluation.json`
2. **Test with Real Data**: Try the model with real images
3. **Collect More Data**: Use your application to gather more training data
4. **Retrain**: Improve model with more diverse data
5. **Deploy**: Use the trained model in production

## Getting Help

- Check `DATASET_RECOMMENDATIONS.md` for more detailed information
- Review `TRAINING_GUIDE.md` for training specifics
- Check logs in `logs/training/` for debugging

