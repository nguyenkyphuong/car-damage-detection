# 🚗🛠️ Car Damage Object Detection Web App

This project is a **Streamlit** web application that runs a **YOLOv8** object detector to locate car-damage regions (e.g., *dent, scratch, crack, broken light*). Users upload an image and instantly see an annotated result plus a small detections table.

> **Note:** Place your trained weights file `best.pt` next to `app.py`. The app uses a fixed confidence threshold (default `0.4`).

---

## Project Structure

```
car_damage_detection/
│
├── app.py              
├── best.pt               # Trained YOLOv8 weights 
├── data.yaml             
├── data_preparation.ipynb
├── model_training.ipynb  # YOLOv8 training notebook
├── requirements.txt      
├── .gitignore   
└── README.md 
```

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/nguyenkyphuong/car_damage_detection.git
cd car_damage_detection
```

2. **Create a virtual environment and install dependencies**

```bash
python -m venv venv
# Activate the environment
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt
```

> Minimal requirements: `streamlit`, `ultralytics`, `pillow`, `numpy`.

---

## Running the Application

```bash
streamlit run app.py
```

Once started, open:
[http://localhost:8501](http://localhost:8501)

---

## Usage Instructions

1. Click **Browse files** and select a `.jpg`, `.jpeg`, or `.png` image.
2. The app will display:

   * The **original** image.
   * The **annotated** image with bounding boxes.
   * A **detections table** with `class`, `conf`, and `bbox[x1,y1,x2,y2]`.

> To change the confidence threshold, edit `CONF` in `app.py`.

---

## Model Details

* **Architecture:** YOLOv8 (Ultralytics)
* **Training Data:** Custom car-damage dataset (paths/classes defined in `data.yaml`)
* **Input:** RGB image (arbitrary size; resized internally by the model)
* **Output Classes (example):** `bumper_dent`, `bumper_scratch`, `door_dent`, `door_scratch`, `glass_shatter`, `head_lamp`, `tail_lamp`

---

## Tips & Notes

* Avoid committing large datasets to the repo; use the provided `.gitignore`.
* GPU is optional. If CUDA is available, Ultralytics can leverage it automatically.

---

## Test Results

This repository includes two folders so others can quickly **see results** without running notebooks:

- `predict_test_v8n_896/` — annotated predictions on a small test set.
  - Open the images to view bounding boxes.
  - If present, the `labels/` subfolder holds YOLO-format `.txt` predictions.

- `eval_test_v8n_896/` — evaluation artifacts.
  - Common files: `PR_curve.png`, `F1_curve.png`, `confusion_matrix.png`, and `results.csv` (mAP, precision, recall).

---

## Sample Images

The `sample_images/` folder is included so others can quickly test the app and the YOLO CLI examples.

- Put a few small `.jpg/.jpeg/.png` files here (e.g., close-ups of dents/scratches).
- The Streamlit app does **not** auto-scan this folder — simply click **Browse files** and pick any image (you can select one from `sample_images/`).

---

## Demo 

```markdown
![Demo](demo.gif)
```

---
