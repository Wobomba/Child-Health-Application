# AI Model Training Guide

This guide explains how to train the malnutrition detection model for the AI Child Health application.

## Overview

The training pipeline consists of:
1. **Data Preprocessing**: Organize and validate training images
2. **Model Training**: Train MobileNetV2-based malnutrition detection model
3. **Model Evaluation**: Evaluate model performance on test data
4. **Model Deployment**: Save trained model for production use

## Prerequisites

### Software Requirements
- Python 3.8+
- TensorFlow 2.13+
- OpenCV 4.8+
- PIL/Pillow 10.0+

### Hardware Requirements
- **Minimum**: 8GB RAM, CPU training
- **Recommended**: 16GB+ RAM, GPU with 8GB+ VRAM
- **Storage**: 10GB+ free space for data and models

### Installation

1. Install training dependencies:
```bash
pip install -r requirements-training.txt
```

2. Create necessary directories:
```bash
mkdir -p data/training
mkdir -p ml_models
mkdir -p logs/training
mkdir -p haarcascades
```

## Data Preparation

### 1. Organize Training Data

Your training data should be organized as follows:
```
data/training/
├── normal/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── moderate_malnutrition/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
└── severe_malnutrition/
    ├── image1.jpg
    ├── image2.jpg
    └── ...
```

### 2. Data Quality Requirements

- **Format**: JPG, JPEG, PNG, BMP
- **Resolution**: Minimum 100x100 pixels
- **File Size**: Maximum 10MB per image
- **Quality**: Clear, non-blurry images
- **Content**: Front-facing photos of children's faces

### 3. Data Preprocessing

Run data preprocessing to validate and organize your data:

```bash
python scripts/train_model.py --data-dir data/training --preprocess
```

This will:
- Validate image quality
- Organize data into class directories
- Create train/validation/test splits
- Generate preprocessing report

## Model Training

### 1. Basic Training

Train the model with default settings:

```bash
python scripts/train_model.py --data-dir data/training --model-name malnutrition_v1
```

### 2. Advanced Training

Train with custom configuration:

```bash
python scripts/train_model.py \
    --data-dir data/training \
    --model-name malnutrition_v1 \
    --config config/training_config.json \
    --preprocess \
    --evaluate \
    --test-data data/test
```

### 3. Training Parameters

Key training parameters in `config/training_config.json`:

```json
{
  "training": {
    "model": {
      "input_shape": [224, 224, 3],
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
```

## Model Architecture

The model uses a transfer learning approach:

1. **Base Model**: MobileNetV2 (pre-trained on ImageNet)
2. **Custom Head**: 
   - Global Average Pooling
   - Dense layer (512 units, ReLU)
   - Dropout (0.2)
   - Dense layer (256 units, ReLU)
   - Dropout (0.2)
   - Output layer (3 classes, Softmax)

## Training Process

### 1. Data Augmentation

The training pipeline includes extensive data augmentation:
- Rotation: ±20 degrees
- Translation: ±20% width/height
- Horizontal flip: 50% probability
- Zoom: ±20%
- Brightness: ±20%

### 2. Training Callbacks

- **Early Stopping**: Stop if validation loss doesn't improve for 10 epochs
- **Learning Rate Reduction**: Reduce LR by 50% if validation loss plateaus
- **Model Checkpointing**: Save best model based on validation loss

### 3. Monitoring

Training progress is logged to:
- Console output
- `logs/training/training.log`
- TensorBoard (optional)

## Model Evaluation

### 1. Automatic Evaluation

If test data is provided, the model is automatically evaluated:

```bash
python scripts/train_model.py \
    --data-dir data/training \
    --test-data data/test \
    --evaluate
```

### 2. Evaluation Metrics

The model is evaluated on:
- **Accuracy**: Overall classification accuracy
- **Precision**: Per-class precision scores
- **Recall**: Per-class recall scores
- **F1-Score**: Per-class F1 scores
- **Confusion Matrix**: Detailed classification results

### 3. Evaluation Results

Results are saved to:
- `ml_models/{model_name}_evaluation.json`
- Detailed classification report
- Confusion matrix visualization

## Model Deployment

### 1. Model Files

After training, the following files are created:
- `{model_name}.h5`: Trained model weights
- `{model_name}_metadata.json`: Training metadata
- `{model_name}_evaluation.json`: Evaluation results

### 2. Integration

The trained model is automatically integrated into the AI service:
- Model loading in `AIAnalysisService`
- Fallback mechanisms for missing dependencies
- Error handling and logging

## Troubleshooting

### Common Issues

1. **Out of Memory Error**
   - Reduce batch size in config
   - Use CPU training instead of GPU
   - Reduce image resolution

2. **Poor Model Performance**
   - Increase training data
   - Adjust learning rate
   - Modify data augmentation
   - Check data quality

3. **Training Stops Early**
   - Increase patience parameter
   - Check for overfitting
   - Adjust learning rate schedule

### Performance Optimization

1. **GPU Training**
   - Install TensorFlow GPU version
   - Ensure CUDA compatibility
   - Monitor GPU memory usage

2. **Data Loading**
   - Use SSD storage
   - Optimize image preprocessing
   - Use data generators efficiently

## Best Practices

### 1. Data Quality
- Use high-quality, diverse images
- Ensure balanced class distribution
- Validate image quality before training

### 2. Training Strategy
- Start with small datasets for testing
- Use validation data for model selection
- Monitor for overfitting

### 3. Model Selection
- Compare different architectures
- Use cross-validation for robust evaluation
- Test on unseen data

## Example Training Session

```bash
# 1. Prepare data
python scripts/train_model.py --data-dir data/raw --preprocess

# 2. Train model
python scripts/train_model.py \
    --data-dir data/raw/organized \
    --model-name malnutrition_v1 \
    --config config/training_config.json \
    --evaluate \
    --test-data data/test

# 3. Check results
ls ml_models/
cat ml_models/malnutrition_v1_evaluation.json
```

## Support

For issues or questions:
1. Check the logs in `logs/training/`
2. Review the training configuration
3. Verify data quality and organization
4. Check system requirements

## Next Steps

After successful training:
1. Test the model with the AI service
2. Deploy to production environment
3. Monitor model performance
4. Plan for model updates and retraining
