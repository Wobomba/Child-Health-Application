# Dataset Recommendations for Malnutrition Detection

## Overview

Since there isn't a ready-made malnutrition detection dataset on Hugging Face, here are the best options for training your model:

## Recommended Approach

### Option 1: Kaggle Datasets (RECOMMENDED)

Kaggle has more medical imaging datasets. Here are specific recommendations:

1. **Child Face Recognition Datasets**
   - Search for: "children faces dataset"
   - Combine with health metadata if available
   - Use for baseline normal/healthy images

2. **Medical Imaging Datasets**
   - Search: "medical imaging children" or "pediatric imaging"
   - May include nutritional assessment images

3. **Create Your Own Dataset** (BEST LONG-TERM SOLUTION)
   - Partner with medical institutions
   - Use public health organizations data
   - Ensure proper consent and anonymization

### Option 2: Hugging Face Image Datasets

While specific malnutrition datasets aren't available, you can use these:

#### 1. **Face Detection/Recognition Datasets**
- **dataset**: `danielkraic/facedetection`
- **dataset**: `Detoxify/unsplash-googles-images`
- **Use**: As a starting point, combine with synthetic augmentation

#### 2. **Medical Image Datasets** (Limited)
- Search Hugging Face for: "medical images", "health images"
- Note: Most are text-based, not image datasets

#### 3. **General Image Classification**
- **dataset**: `imagenet-1k` (for transfer learning base)
- **dataset**: `food101` (nutritional context, but not faces)

### Option 3: Synthetic Data + Real Data Combination

1. **Start with Face Datasets**
   - Download children's face datasets
   - Apply synthetic transformations to simulate malnutrition indicators

2. **Gradual Real Data Collection**
   - Begin with public datasets
   - Collect real data through your application
   - Annotate with expert medical professionals

## Specific Dataset Sources

### Kaggle (Recommended Platform)

1. **Search Terms**:
   - "malnutrition detection"
   - "child health images"
   - "nutritional assessment"
   - "pediatric health"

2. **Popular Kaggle Datasets**:
   - Many medical imaging competitions provide datasets
   - Look for competitions related to:
     - Global health
     - Nutrition
     - Child health

### Academic Sources

1. **Research Papers**
   - Search PubMed, Google Scholar
   - Many papers include supplementary datasets
   - Contact authors for dataset access

2. **Public Health Organizations**
   - WHO (World Health Organization)
   - UNICEF
   - CDC (Centers for Disease Control)

## Data Collection Strategy

### Phase 1: Initial Training (Proof of Concept)
- Use synthetic data generation
- Combine multiple face datasets
- Focus on face feature extraction

### Phase 2: Real Data Collection
- Collect data through your application
- Partner with medical institutions
- Ensure proper ethical approval

### Phase 3: Continuous Improvement
- Retrain with real-world data
- Monitor model performance
- Update with new data regularly

## Ethical Considerations

1. **Consent**: Ensure proper consent for all images
2. **Anonymization**: Remove identifying information
3. **Privacy**: Follow HIPAA/GDPR regulations
4. **Bias**: Ensure diverse dataset representation
5. **Transparency**: Document data sources and limitations

## Recommended Next Steps

1. **Immediate**: Use the `download_dataset.py` script to fetch face datasets
2. **Short-term**: Partner with medical institutions for real data
3. **Long-term**: Build your own dataset through the application

## Using the Download Script

We've created a script (`scripts/download_dataset.py`) that can:
- Download datasets from Hugging Face
- Download datasets from Kaggle (requires API key)
- Organize data into required folder structure
- Validate and preprocess images

See `scripts/download_dataset.py` for usage instructions.

