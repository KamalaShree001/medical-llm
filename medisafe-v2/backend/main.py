import csv
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fuzzywuzzy import fuzz, process

app = FastAPI(title="MediSafe API v2", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

MEDICINES_DB = {}
PATIENTS_DB  = {}
ALTERNATIVES = {
    "amoxicillin":  ["Azithromycin","Doxycycline","Clarithromycin"],
    "warfarin":     ["Apixaban","Rivaroxaban","Dabigatran"],
    "codeine":      ["Tramadol","Gabapentin","Duloxetine"],
    "lisinopril":   ["Amlodipine","Losartan","Valsartan"],
    "aspirin":      ["Clopidogrel","Ticagrelor","Dipyridamole"],
    "morphine":     ["Hydromorphone","Oxycodone","Tapentadol"],
    "diazepam":     ["Buspirone","Sertraline","Pregabalin"],
    "digoxin":      ["Bisoprolol","Carvedilol","Sacubitril"],
    "ibuprofen":    ["Paracetamol","Naproxen","Celecoxib"],
    "prednisone":   ["Budesonide","Methylprednisolone","Dexamethasone"],
}

def load_data():
    global MEDICINES_DB, PATIENTS_DB
    try:
        with open(DATA_DIR / "medicines.csv", newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                MEDICINES_DB[row["medicine"].strip().lower()] = {
                    "name": row["medicine"].strip(), "category": row["category"],
                    "common_uses": row["common_uses"], "risk_level": row["risk_level"],
                    "interactions": row["interactions"],
                    "alternatives": ALTERNATIVES.get(row["medicine"].strip().lower(), [])
                }
    except FileNotFoundError:
        print("WARNING: medicines.csv not found")
    try:
        with open(DATA_DIR / "patients.csv", newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                pid = row["patient_id"].strip()
                if pid not in PATIENTS_DB:
                    PATIENTS_DB[pid] = {"name": row["name"].strip(), "allergies": [], "medicines": [], "diseases": []}
                if row["allergy"].strip():
                    PATIENTS_DB[pid]["allergies"].append(row["allergy"].strip().lower())
                if row["medicine"].strip():
                    PATIENTS_DB[pid]["medicines"].append(row["medicine"].strip().lower())
                if row["disease"].strip():
                    PATIENTS_DB[pid]["diseases"].append(row["disease"].strip())
    except FileNotFoundError:
        print("WARNING: patients.csv not found")

load_data()
MEDICINE_NAMES = list(MEDICINES_DB.keys())


def preprocess(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot decode image.")
    gray     = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh   = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    kernel   = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    return cv2.filter2D(thresh, -1, kernel)


def run_ocr(img):
    return pytesseract.image_to_string(Image.fromarray(img), config=r"--oem 3 --psm 6").strip()


def detect_medicines(text, threshold=60):
    detected, seen = [], set()
    words = text.replace("\n"," ").split()
    candidates = words + [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
    for c in candidates:
        cl = c.strip().lower()
        if len(cl) < 4: continue
        m, score = process.extractOne(cl, MEDICINE_NAMES, scorer=fuzz.token_set_ratio)
        if score >= threshold and m not in seen:
            seen.add(m)
            info = MEDICINES_DB[m].copy()
            info["match_score"] = score
            detected.append(info)
    return sorted(detected, key=lambda x: -x["match_score"])


def check_conflict(med_name, allergies):
    for a in allergies:
        if fuzz.token_set_ratio(med_name.lower(), a.lower()) >= 80:
            return True, f"Conflicts with allergy to {a.title()}"
    return False, ""


def analyze_risk(medicines, allergies, patient_id=None):
    reasons, risk = [], "SAFE"
    for med in medicines:
        conflict, reason = check_conflict(med["name"], allergies)
        if conflict:
            risk = "HIGH"
            reasons.append(f"ALLERGY CONFLICT: {med['name']} — {reason}.")
    for med in medicines:
        if med["risk_level"] == "HIGH":
            risk = "HIGH"
            reasons.append(f"HIGH-RISK MEDICINE: {med['name']} ({med['category']}) — {med['interactions']}.")
        elif med["risk_level"] == "MEDIUM" and risk == "SAFE":
            risk = "MEDIUM"
            reasons.append(f"CAUTION: {med['name']} ({med['category']}) — {med['interactions']}.")
    if not medicines:
        reasons.append("No known medicines detected.")
    elif risk == "SAFE":
        reasons.append("All detected medicines appear safe for this patient profile.")
    med_names = ", ".join(m["name"] for m in medicines) or "none"
    pid_note  = f" for patient {patient_id}" if patient_id else ""
    prefix    = {"HIGH": f"HIGH RISK detected{pid_note}.", "MEDIUM": f"Moderate caution advised{pid_note}.", "SAFE": f"Prescription appears SAFE{pid_note}."}
    summary   = f"{prefix[risk]} Medicines: {med_names}. " + " ".join(reasons)
    return {"risk": risk, "reasons": reasons, "summary": summary}


@app.get("/")
def root(): return {"message": "MediSafe API v2 running.", "version": "2.0.0"}

@app.get("/patients")
def list_patients():
    return [{"patient_id": pid, "name": d["name"]} for pid, d in PATIENTS_DB.items()]

@app.get("/patient/{patient_id}")
def get_patient(patient_id: str):
    if patient_id not in PATIENTS_DB:
        raise HTTPException(404, "Patient not found")
    p = PATIENTS_DB[patient_id]
    return {"id": patient_id, "name": p["name"], "allergies": [a.title() for a in p["allergies"]], "diseases": p["diseases"]}

@app.get("/search-medicine")
def search_medicine(q: str = Query(..., min_length=2), patient_id: Optional[str] = Query(None)):
    allergies = PATIENTS_DB.get(patient_id, {}).get("allergies", []) if patient_id else []
    matches   = process.extract(q.lower().strip(), MEDICINE_NAMES, scorer=fuzz.token_set_ratio, limit=6)
    results   = []
    for name, score in matches:
        if score < 40: continue
        med = MEDICINES_DB[name].copy()
        med["match_score"] = score
        conflict, reason = check_conflict(med["name"], allergies)
        med["conflict"] = conflict
        med["conflict_reason"] = reason if conflict else ""
        results.append(med)
    results.sort(key=lambda x: (-x["conflict"], -x["match_score"]))
    return {"query": q, "patient_id": patient_id, "results": results}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), patient_id: Optional[str] = Form(None)):
    if file.content_type not in ("image/jpeg","image/png","image/jpg"):
        raise HTTPException(400, "Only JPG/PNG supported.")
    data = await file.read()
    if len(data) > 10*1024*1024:
        raise HTTPException(400, "File too large (max 10MB).")
    try:
        img = preprocess(data)
    except ValueError as e:
        raise HTTPException(422, str(e))
    text      = run_ocr(img) or "(No text detected)"
    medicines = detect_medicines(text)
    allergies = PATIENTS_DB.get(patient_id, {}).get("allergies", []) if patient_id else []
    patient   = PATIENTS_DB.get(patient_id) if patient_id else None
    result    = analyze_risk(medicines, allergies, patient_id)
    return JSONResponse({
        "text": text, "medicines": medicines,
        "risk": result["risk"], "reasons": result["reasons"], "reason": result["summary"],
        "patient": {"id": patient_id, "name": patient["name"] if patient else None,
                    "known_allergies": [a.title() for a in allergies],
                    "known_diseases": patient["diseases"] if patient else []} if patient_id else None
    })

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg","image/png","image/jpg"):
        raise HTTPException(400, "Only JPG/PNG supported.")
    data = await file.read()
    try: img = preprocess(data)
    except ValueError as e: raise HTTPException(422, str(e))
    return {"text": run_ocr(img) or "(No text detected)"}
