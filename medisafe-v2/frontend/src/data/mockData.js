export const PATIENTS = [
  {
    id: "P001", name: "Alice Johnson", age: 34, gender: "Female", blood: "A+",
    allergies: ["Penicillin", "Sulfa"],
    conditions: ["Bacterial Infection", "Seasonal Fever"],
    medicines: ["Ibuprofen", "Cetirizine"],
    lastVisit: "2026-04-20", riskLevel: "HIGH",
    phone: "+1 (555) 201-4444", email: "alice.j@email.com",
    history: [
      { date: "2026-04-20", risk: "HIGH", medicines: ["Amoxicillin"], reason: "Allergy conflict with Penicillin" },
      { date: "2026-03-15", risk: "SAFE", medicines: ["Ibuprofen", "Cetirizine"], reason: "All clear" },
      { date: "2026-02-01", risk: "MEDIUM", medicines: ["Prednisone"], reason: "Corticosteroid caution" },
    ]
  },
  {
    id: "P002", name: "Bob Smith", age: 57, gender: "Male", blood: "O-",
    allergies: ["ACE Inhibitors"],
    conditions: ["Type 2 Diabetes", "Hypertension"],
    medicines: ["Metformin", "Lisinopril"],
    lastVisit: "2026-04-18", riskLevel: "MEDIUM",
    phone: "+1 (555) 302-5555", email: "bob.smith@email.com",
    history: [
      { date: "2026-04-18", risk: "MEDIUM", medicines: ["Lisinopril"], reason: "ACE Inhibitor caution noted" },
      { date: "2026-03-22", risk: "SAFE", medicines: ["Metformin"], reason: "All clear" },
    ]
  },
  {
    id: "P003", name: "Carol White", age: 62, gender: "Female", blood: "B+",
    allergies: ["Aspirin"],
    conditions: ["Heart Disease", "High Cholesterol"],
    medicines: ["Atorvastatin", "Warfarin"],
    lastVisit: "2026-04-22", riskLevel: "HIGH",
    phone: "+1 (555) 403-6666", email: "carol.w@email.com",
    history: [
      { date: "2026-04-22", risk: "HIGH", medicines: ["Aspirin", "Warfarin"], reason: "Aspirin allergy + high-risk anticoagulant" },
      { date: "2026-04-01", risk: "HIGH", medicines: ["Warfarin"], reason: "Bleeding risk noted" },
      { date: "2026-03-10", risk: "SAFE", medicines: ["Atorvastatin"], reason: "All clear" },
    ]
  },
  {
    id: "P004", name: "David Lee", age: 28, gender: "Male", blood: "AB+",
    allergies: ["Amoxicillin"],
    conditions: ["Allergic Rhinitis", "Sinusitis"],
    medicines: ["Cetirizine", "Fluticasone"],
    lastVisit: "2026-04-10", riskLevel: "SAFE",
    phone: "+1 (555) 504-7777", email: "david.lee@email.com",
    history: [
      { date: "2026-04-10", risk: "SAFE", medicines: ["Cetirizine"], reason: "All clear" },
      { date: "2026-02-14", risk: "SAFE", medicines: ["Fluticasone"], reason: "All clear" },
    ]
  },
  {
    id: "P005", name: "Emma Davis", age: 45, gender: "Female", blood: "A-",
    allergies: [],
    conditions: ["GERD", "Atrial Fibrillation"],
    medicines: ["Omeprazole", "Warfarin"],
    lastVisit: "2026-04-19", riskLevel: "MEDIUM",
    phone: "+1 (555) 605-8888", email: "emma.d@email.com",
    history: [
      { date: "2026-04-19", risk: "MEDIUM", medicines: ["Warfarin", "Omeprazole"], reason: "Warfarin interaction risk" },
      { date: "2026-03-05", risk: "SAFE", medicines: ["Omeprazole"], reason: "All clear" },
    ]
  },
  {
    id: "P006", name: "Frank Miller", age: 39, gender: "Male", blood: "O+",
    allergies: ["Opioids"],
    conditions: ["Chronic Back Pain", "Migraine"],
    medicines: ["Paracetamol", "Sumatriptan"],
    lastVisit: "2026-04-21", riskLevel: "HIGH",
    phone: "+1 (555) 706-9999", email: "frank.m@email.com",
    history: [
      { date: "2026-04-21", risk: "HIGH", medicines: ["Codeine"], reason: "Opioid allergy conflict" },
      { date: "2026-03-18", risk: "SAFE", medicines: ["Paracetamol"], reason: "All clear" },
    ]
  },
  {
    id: "P007", name: "Grace Wilson", age: 52, gender: "Female", blood: "B-",
    allergies: [],
    conditions: ["Type 1 Diabetes", "Hypertension"],
    medicines: ["Insulin", "Metoprolol"],
    lastVisit: "2026-04-15", riskLevel: "SAFE",
    phone: "+1 (555) 807-1111", email: "grace.w@email.com",
    history: [
      { date: "2026-04-15", risk: "SAFE", medicines: ["Insulin", "Metoprolol"], reason: "All clear" },
      { date: "2026-03-20", risk: "MEDIUM", medicines: ["Metoprolol"], reason: "Do not stop suddenly" },
    ]
  },
  {
    id: "P008", name: "Henry Brown", age: 67, gender: "Male", blood: "AB-",
    allergies: ["Penicillin"],
    conditions: ["Pneumonia", "Asthma"],
    medicines: ["Azithromycin", "Prednisone"],
    lastVisit: "2026-04-23", riskLevel: "MEDIUM",
    phone: "+1 (555) 908-2222", email: "henry.b@email.com",
    history: [
      { date: "2026-04-23", risk: "MEDIUM", medicines: ["Azithromycin", "Prednisone"], reason: "QT prolongation + immune suppression risk" },
      { date: "2026-02-28", risk: "SAFE", medicines: ["Prednisone"], reason: "All clear" },
    ]
  },
];

export const MEDICINES_DB = [
  { name: "Amoxicillin", category: "Antibiotic", risk: "LOW", uses: "Bacterial infections", interactions: "Penicillin allergy risk", alternatives: ["Azithromycin", "Doxycycline", "Clarithromycin"] },
  { name: "Ibuprofen", category: "NSAID", risk: "LOW", uses: "Pain and inflammation", interactions: "Avoid with blood thinners", alternatives: ["Paracetamol", "Naproxen", "Celecoxib"] },
  { name: "Metformin", category: "Antidiabetic", risk: "LOW", uses: "Type 2 Diabetes", interactions: "Kidney function monitoring", alternatives: ["Sitagliptin", "Glipizide", "Empagliflozin"] },
  { name: "Lisinopril", category: "ACE Inhibitor", risk: "MEDIUM", uses: "Hypertension", interactions: "Avoid in pregnancy", alternatives: ["Amlodipine", "Losartan", "Valsartan"] },
  { name: "Aspirin", category: "NSAID", risk: "LOW", uses: "Pain/Heart protection", interactions: "Bleeding risk", alternatives: ["Clopidogrel", "Ticagrelor", "Dipyridamole"] },
  { name: "Atorvastatin", category: "Statin", risk: "LOW", uses: "High cholesterol", interactions: "Liver monitoring needed", alternatives: ["Rosuvastatin", "Simvastatin", "Pravastatin"] },
  { name: "Cetirizine", category: "Antihistamine", risk: "LOW", uses: "Allergies", interactions: "May cause drowsiness", alternatives: ["Loratadine", "Fexofenadine", "Bilastine"] },
  { name: "Omeprazole", category: "PPI", risk: "LOW", uses: "Acid reflux", interactions: "Long-term use risks", alternatives: ["Pantoprazole", "Esomeprazole", "Famotidine"] },
  { name: "Warfarin", category: "Anticoagulant", risk: "HIGH", uses: "Blood clots", interactions: "Many drug interactions", alternatives: ["Apixaban", "Rivaroxaban", "Dabigatran"] },
  { name: "Paracetamol", category: "Analgesic", risk: "LOW", uses: "Pain and fever", interactions: "Liver damage in overdose", alternatives: ["Ibuprofen", "Aspirin", "Naproxen"] },
  { name: "Codeine", category: "Opioid", risk: "HIGH", uses: "Pain relief", interactions: "Addiction risk", alternatives: ["Tramadol", "Gabapentin", "Duloxetine"] },
  { name: "Insulin", category: "Hormone", risk: "MEDIUM", uses: "Diabetes", interactions: "Hypoglycemia risk", alternatives: ["Metformin", "Empagliflozin", "Liraglutide"] },
  { name: "Metoprolol", category: "Beta Blocker", risk: "MEDIUM", uses: "Hypertension", interactions: "Do not stop suddenly", alternatives: ["Bisoprolol", "Carvedilol", "Atenolol"] },
  { name: "Azithromycin", category: "Antibiotic", risk: "LOW", uses: "Bacterial infections", interactions: "QT prolongation risk", alternatives: ["Doxycycline", "Clarithromycin", "Amoxicillin"] },
  { name: "Prednisone", category: "Corticosteroid", risk: "MEDIUM", uses: "Inflammation", interactions: "Immune suppression", alternatives: ["Budesonide", "Methylprednisolone", "Dexamethasone"] },
  { name: "Digoxin", category: "Cardiac Glycoside", risk: "HIGH", uses: "Heart failure", interactions: "Narrow therapeutic index", alternatives: ["Bisoprolol", "Carvedilol", "Sacubitril"] },
  { name: "Morphine", category: "Opioid", risk: "HIGH", uses: "Severe pain", interactions: "Addiction and respiratory risk", alternatives: ["Hydromorphone", "Oxycodone", "Fentanyl patch"] },
  { name: "Diazepam", category: "Benzodiazepine", risk: "HIGH", uses: "Anxiety/Seizures", interactions: "Dependence risk", alternatives: ["Buspirone", "Sertraline", "Pregabalin"] },
  { name: "Clopidogrel", category: "Antiplatelet", risk: "MEDIUM", uses: "Blood clots", interactions: "Bleeding risk", alternatives: ["Ticagrelor", "Prasugrel", "Aspirin"] },
  { name: "Doxycycline", category: "Antibiotic", risk: "LOW", uses: "Bacterial infections", interactions: "Avoid with dairy", alternatives: ["Azithromycin", "Amoxicillin", "Clarithromycin"] },
];

export const RISK_HISTORY = [
  { date: "Apr 23", high: 2, medium: 3, safe: 5 },
  { date: "Apr 22", high: 1, medium: 4, safe: 6 },
  { date: "Apr 21", high: 3, medium: 2, safe: 4 },
  { date: "Apr 20", high: 2, medium: 5, safe: 7 },
  { date: "Apr 19", high: 4, medium: 3, safe: 5 },
  { date: "Apr 18", high: 1, medium: 2, safe: 8 },
  { date: "Apr 17", high: 2, medium: 4, safe: 6 },
];

export const CHATBOT_RULES = [
  { patterns: ["hello", "hi", "hey", "greetings"], response: "Hello! I'm MediSafe AI Assistant. I can help you look up medicines, check allergies, or explain risk levels. What would you like to know?" },
  { patterns: ["what is amoxicillin", "amoxicillin"], response: "**Amoxicillin** is a broad-spectrum antibiotic used to treat bacterial infections. ⚠️ Patients with Penicillin allergies should NOT take it. Alternatives include Azithromycin or Doxycycline. Risk level: LOW." },
  { patterns: ["what is warfarin", "warfarin"], response: "**Warfarin** is an anticoagulant (blood thinner) used to prevent clots. 🔴 It is HIGH RISK due to many drug interactions and bleeding risk. Regular INR monitoring is essential. Alternatives: Apixaban, Rivaroxaban." },
  { patterns: ["what is ibuprofen", "ibuprofen"], response: "**Ibuprofen** is an NSAID used for pain and inflammation. Risk level: LOW. ⚠️ Avoid with blood thinners. Safer alternatives include Paracetamol for patients on anticoagulants." },
  { patterns: ["what is paracetamol", "paracetamol", "acetaminophen"], response: "**Paracetamol** (Acetaminophen) is a safe analgesic for pain and fever. Risk level: LOW. ⚠️ Overdose causes serious liver damage — never exceed recommended dose. It's generally the first-choice pain reliever." },
  { patterns: ["what is metformin", "metformin"], response: "**Metformin** is the first-line treatment for Type 2 Diabetes. Risk level: LOW. Requires kidney function monitoring. It does not cause hypoglycemia on its own." },
  { patterns: ["what is codeine", "codeine"], response: "**Codeine** is an opioid analgesic. 🔴 HIGH RISK — addiction potential, respiratory depression. Patients with Opioid allergies must NOT use it. Safer alternatives: Tramadol, Gabapentin." },
  { patterns: ["high risk", "what is high risk"], response: "**HIGH RISK** means the prescription has either: (1) a medicine that conflicts with a patient's known allergy, or (2) an inherently dangerous medicine like Warfarin, Morphine, Codeine, or Digoxin. Always consult a physician." },
  { patterns: ["medium risk", "what is medium risk", "caution"], response: "**MEDIUM RISK / CAUTION** means the medicine is generally safe but requires monitoring — like Metoprolol (do not stop suddenly) or Prednisone (immune suppression). Review with the prescribing doctor." },
  { patterns: ["safe", "what is safe"], response: "**SAFE** means no allergy conflicts were detected and the medicines are classified as LOW risk. This doesn't replace professional medical judgment." },
  { patterns: ["allergy", "allergies", "allergic"], response: "Allergy checking compares each detected medicine against the patient's recorded allergies using fuzzy matching. A conflict is flagged when similarity ≥ 80%. Always verify with the patient directly." },
  { patterns: ["penicillin", "penicillin allergy"], response: "Penicillin allergy is one of the most common drug allergies. Patients allergic to Penicillin should also avoid Amoxicillin and Ampicillin (same drug class). Safe alternatives: Azithromycin, Doxycycline, Clarithromycin." },
  { patterns: ["ocr", "how does ocr work", "text extraction"], response: "OCR (Optical Character Recognition) extracts text from prescription images using **Tesseract**. The image is first preprocessed: grayscale → denoise → adaptive threshold → sharpen. Then medicine names are detected using fuzzy matching." },
  { patterns: ["alternative", "alternatives", "substitute"], response: "Alternative medicines are suggested when a conflict is detected. For example, if Amoxicillin conflicts with a Penicillin allergy, MediSafe suggests Azithromycin or Doxycycline. Always confirm alternatives with a licensed pharmacist." },
  { patterns: ["help", "what can you do", "features"], response: "I can help you with:\n• 💊 Medicine information and risk levels\n• ⚠️ Allergy conflict explanations\n• 🔄 Alternative medicine suggestions\n• 📊 Understanding risk levels (HIGH/MEDIUM/SAFE)\n• 🔬 How OCR and analysis works\n\nJust ask me about any medicine or topic!" },
  { patterns: ["thank", "thanks", "thank you"], response: "You're welcome! Stay safe and always double-check prescriptions with a qualified healthcare professional. 🩺" },
];
