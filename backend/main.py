import os
import uuid
import shutil
from datetime import datetime, timedelta

import cv2
import numpy as np
from PIL import Image
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from ultralytics import YOLO
import json

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# =========================
# Config
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WEIGHTS = os.path.join(BASE_DIR, "best.pt")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
RESULT_DIR = os.path.join(BASE_DIR, "results")
DB_PATH = os.path.join(BASE_DIR, "car_damage.db")

CONF = 0.4

SECRET_KEY = "car_damage_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# =========================
# Init
# =========================

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

app = FastAPI(title="Car Damage Detection API")

security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/results", StaticFiles(directory=RESULT_DIR), name="results")

# =========================
# Database
# =========================

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class DetectionHistory(Base):
    __tablename__ = "detection_history"

    id = Column(Integer, primary_key=True, index=True)
    original_image = Column(String)
    result_image = Column(String)
    damage_type = Column(String)
    confidence = Column(Float)
    bbox = Column(String)
    all_detections = Column(String)
    created_at = Column(DateTime, default=datetime.now)


Base.metadata.create_all(bind=engine)


# =========================
# Schemas
# =========================

class LoginRequest(BaseModel):
    username: str
    password: str


# =========================
# Auth
# =========================

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Forbidden"
            )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

def get_optional_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        return None

    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("role") == "admin":
            return payload

        return None

    except JWTError:
        return None


# =========================
# Load AI model
# =========================

if not os.path.exists(WEIGHTS):
    raise FileNotFoundError("best.pt not found in backend folder")

model = YOLO(WEIGHTS)


# =========================
# Routes
# =========================

@app.get("/")
def root():
    return {
        "message": "Car Damage Detection API is running"
    }

@app.post("/login")
def login(data: LoginRequest):
    if (
        data.username != ADMIN_USERNAME
        or data.password != ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_access_token(
        {
            "sub": data.username,
            "role": "admin"
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/detect")
async def detect_damage(
    file: UploadFile = File(...),
    user=Depends(get_optional_admin)
):
    file_ext = os.path.splitext(file.filename)[1].lower()
    image_id = str(uuid.uuid4())

    original_filename = f"{image_id}{file_ext}"
    result_filename = f"{image_id}_result.jpg"

    original_path = os.path.join(UPLOAD_DIR, original_filename)
    result_path = os.path.join(RESULT_DIR, result_filename)

    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = Image.open(original_path).convert("RGB")
    result = model(np.array(img), conf=CONF, verbose=False)[0]

    annotated_bgr = result.plot()
    cv2.imwrite(result_path, annotated_bgr)

    detections = []
    names = getattr(result, "names", {})

    if getattr(result, "boxes", None) is not None and len(result.boxes) > 0:
        xyxy = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        clses = result.boxes.cls.cpu().numpy().astype(int)

        for (x1, y1, x2, y2), conf, cls_id in zip(xyxy, confs, clses):
            damage_type = names.get(int(cls_id), str(int(cls_id)))
            bbox = [int(x1), int(y1), int(x2), int(y2)]

            detections.append(
                {
                    "damage_type": damage_type,
                    "confidence": round(float(conf), 4),
                    "bbox": bbox,
                }
            )

    best_detection = None

    if detections:
        best_detection = max(
            detections,
            key=lambda x: x["confidence"]
        )

    if user is not None:
        db = SessionLocal()

        history = DetectionHistory(
            original_image=f"/uploads/{original_filename}",
            result_image=f"/results/{result_filename}",
            damage_type=best_detection["damage_type"] if best_detection else None,
            confidence=best_detection["confidence"] if best_detection else None,
            bbox=str(best_detection["bbox"]) if best_detection else None,
            all_detections=json.dumps(detections, ensure_ascii=False),
        )

        db.add(history)
        db.commit()
        db.close()

    return {
        "original_image": f"/uploads/{original_filename}",
        "result_image": f"/results/{result_filename}",
        "predicted_damage": best_detection,
        "all_detections": detections,
        "total_detections": len(detections),
        "saved_to_history": user is not None,
    }


@app.get("/history")
def get_history(user=Depends(verify_admin_token)):
    db = SessionLocal()

    items = (
        db.query(DetectionHistory)
        .order_by(DetectionHistory.created_at.desc())
        .all()
    )

    db.close()

    return [
        {
            "id": item.id,
            "original_image": item.original_image,
            "result_image": item.result_image,
            "damage_type": item.damage_type,
            "confidence": item.confidence,
            "bbox": item.bbox,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for item in items
    ]


@app.get("/stats")
def get_stats(user=Depends(verify_admin_token)):
    db = SessionLocal()
    items = db.query(DetectionHistory).all()
    db.close()

    total = len(items)

    damage_by_type = {}
    confidence_sum = 0
    confidence_count = 0

    trend_map = {}
    damage_types = set()

    for item in items:
        damage = item.damage_type or "Unknown"
        damage_types.add(damage)

        damage_by_type[damage] = damage_by_type.get(damage, 0) + 1

        if item.confidence is not None:
            confidence_sum += item.confidence
            confidence_count += 1

        date_key = item.created_at.strftime("%Y-%m-%d")

        if date_key not in trend_map:
            trend_map[date_key] = {}

        trend_map[date_key][damage] = (
            trend_map[date_key].get(damage, 0) + 1
        )

    average_confidence = (
        round(confidence_sum / confidence_count, 4)
        if confidence_count > 0
        else 0
    )

    most_common_damage = None

    if damage_by_type:
        most_common_damage = max(
            damage_by_type,
            key=damage_by_type.get
        )

    top_damage_types = [
        {
            "name": damage,
            "count": count,
            "percentage": round((count / total) * 100, 2)
            if total > 0
            else 0
        }
        for damage, count in sorted(
            damage_by_type.items(),
            key=lambda x: x[1],
            reverse=True
        )
    ]

    damage_trend_over_time = []

    for date in sorted(trend_map.keys()):
        row = {
            "date": date
        }

        for damage in sorted(damage_types):
            row[damage] = trend_map[date].get(damage, 0)

        damage_trend_over_time.append(row)

    return {
        "total_detections": total,
        "average_confidence": average_confidence,
        "most_common_damage": most_common_damage,
        "damage_by_type": damage_by_type,
        "top_damage_types": top_damage_types,
        "damage_types": sorted(list(damage_types)),
        "damage_trend_over_time": damage_trend_over_time,
    }