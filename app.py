import os
import numpy as np
from PIL import Image
import streamlit as st

try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

WEIGHTS = "best.pt"
CONF = 0.4

st.set_page_config(page_title="Car Damage — Object Detection", page_icon="🚗", layout="centered")
st.title("Car Damage — Object Detection")

if not os.path.exists(WEIGHTS):
    st.error("'best.pt' not found next to app.py. Please place the file and rerun.")
    st.stop()

@st.cache_resource(show_spinner=False)
def load_model():
    if YOLO is None:
        raise RuntimeError("'ultralytics' is not installed. Run: pip install ultralytics")
    return YOLO(WEIGHTS)

model = load_model()

uploaded = st.file_uploader("Upload image (JPG/PNG)", type=["jpg", "jpeg", "png"])

if uploaded:
    img = Image.open(uploaded).convert("RGB")
    st.image(img, caption="Original", use_container_width=True)

    res = model(np.array(img), conf=CONF, verbose=False)[0]

    annotated_bgr = res.plot()
    annotated_rgb = annotated_bgr[:, :, ::-1]
    st.image(annotated_rgb, caption=f"Detections (conf ≥ {CONF})", use_container_width=True)

    boxes = []
    names = getattr(res, "names", {})
    if getattr(res, "boxes", None) is not None and len(res.boxes) > 0:
        xyxy = res.boxes.xyxy.cpu().numpy()
        confs = res.boxes.conf.cpu().numpy() if res.boxes.conf is not None else np.zeros(len(xyxy))
        clses = res.boxes.cls.cpu().numpy().astype(int) if res.boxes.cls is not None else np.zeros(len(xyxy), dtype=int)
        for (x1, y1, x2, y2), c, k in zip(xyxy, confs, clses):
            boxes.append({
                "class": names.get(int(k), str(int(k))),
                "conf": float(round(float(c), 4)),
                "bbox[x1,y1,x2,y2]": [int(x1), int(y1), int(x2), int(y2)],
            })

    if boxes:
        import pandas as pd
        st.subheader("Detections table")
        st.dataframe(pd.DataFrame(boxes), use_container_width=True)
    else:
        st.info("No objects detected.")
else:
    st.info("Upload an image to get started.")