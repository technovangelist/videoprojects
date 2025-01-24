# Unsloth Mistral-7B Finetuning Example

This repository demonstrates how to finetune Mistral-7B using Unsloth, a library that optimizes LLM training. The example uses the Guanaco dataset in ShareGPT format for instruction tuning.

## Installation

1. Clone this repository:
```bash
git clone [your-repo-url]
cd [repo-name]
```

2. Install dependencies from requirements.txt:
```bash
pip install -r requirements.txt
```

The requirements.txt includes all necessary packages for running the finetuning script.

## Hardware Requirements

- Minimum 16GB GPU VRAM
- CUDA-compatible GPU with 7.0 or higher compute capability
- Linux or Windows

## Quick Start

1. Clone this repository:
```bash
git clone https://github.com/technovangelist/videoprojects.git
cd videoprojects/2025-01-24-unslothfinetune
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the training script:
```bash
python train.py
```

## Code Explanation

### Model Initialization
```python
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="mistralai/Mistral-7B-v0.1", 
    max_seq_length=2048
)
```
Loads the Mistral-7B model with Unsloth optimizations.

### Chat Template Configuration
```python
tokenizer = get_chat_template(
    tokenizer, 
    mapping = {"role": "from", "content": "value", "user": "human", "assistant": "gpt"}
)
```
Configures the chat template for proper conversation formatting.

### Dataset Loading
```python
origdataset = load_dataset("philschmid/guanaco-sharegpt-style", split="train")
conversations_dataset = origdataset.select_columns(['conversations'])
```
Loads the Guanaco dataset in ShareGPT format.

### Training Configuration
Key training parameters:
- Batch size: 2
- Gradient accumulation steps: 4
- Learning rate: 2e-4
- Maximum steps: 60
- Sequence length: 2048

### Model Export
```python
model.save_pretrained_gguf("ggufmodel", tokenizer, quantization_method = "q4_k_m")
```
Saves the model in GGUF format with q4_k_m quantization.

## Training Parameters

| Parameter | Value |
|-----------|--------|
| Learning Rate | 2e-4 |
| Batch Size | 2 |
| Gradient Accumulation | 4 |
| Max Steps | 60 |
| Warmup Steps | 5 |
| Weight Decay | 0.01 |
| Optimizer | AdamW 8-bit |
| Scheduler | Linear |

## Output

The finetuned model will be saved in:
- `outputs/` - Checkpoint files
- `ggufmodel/` - GGUF format for inference

