# 🥛 பால்வண்டி (PaalVandi) - Pure Farm-Direct Milk Delivery Platform
> **நேரடி பண்ணைப்பால் மேலாண்மை & மாதாந்திர கணக்கு தளம்**  
> Direct Farm-to-Home Milk Delivery Operations, Route Optimization & Automated WhatsApp / UPI Billing Engine.

---

## 🎯 1. Real Core Problems Solved (அப்பா & வாடிக்கையாளர் சந்திக்கும் நிஜ பிரச்சனைகள்)

1. **போன வாரம் 2 நாள் பால் வாங்கலையே! (Leave & Vacation Disputes)**:
   - வாடிக்கையாளர் ஊருக்கு போகும்போது வாய்வழியாக "நாளைக்கு பால் வேண்டாம்" என்பார்கள். அதிகாலை அவசரத்தில் அப்பா அதை குறிக்க மறந்துவிடுவார்.
   - மாத கடைசியில் 30 நாளுக்கும் பில் போடும்போது தேவையில்லாத வாக்குவாதம் வரும்.
   - **தீர்வு**: வாடிக்கையாளர் மொபைலில் இருந்தே 1-கிளிக்கில் **"லீவு பதிவு"** செய்யலாம். அப்பாவுக்கும் டெலிவரி ஆப்பிலும் தானாகவே அந்த நாளில் விநியோகம் நிறுத்தப்பட்டு, பில்லிலும் பணம் கழிக்கப்படும்!
2. **டைரி நனைஞ்சு போச்சு / தொலைஞ்சு போச்சு (Water Drops & Diary Damage)**:
   - அதிகாலை 5:00 மணிக்கு பனி, பால் பாத்திரத்தின் ஈரம், மழை போன்றவற்றால் நோட்டுப் புத்தகம் பாழாகிவிடும்.
   - **தீர்வு**: ஆஃப்லைன் வசதியுடன் கூடிய மொபைல்-முதல் வடிவமைப்பு (Mobile-First Web App).
3. **காலை 1L, மாலை 0.5L + விருந்தினர் பால் (Shift & Extra Milk Variance)**:
   - ஒவ்வொரு வீட்டுக்கும் காலை மற்றும் மாலை வழக்கமான அளவுடன், திடீரென விருந்தினர் வந்தால் **+0.5L, +1L** சேர்க்க தனி வசதி.
4. **அதிகாலை 5:00 மணி ரூட் குழப்பம் (Street & House Sequence)**:
   - அப்பாவுக்கு உடம்பு சரியில்லாமல் வேறு ஒருவர் டெலிவரிக்கு சென்றாலும், தெரு வாரியாக கதவு எண் வரிசையில் (#1, #2, #3, ...) ரூட் காட்டும்.
5. **மாதாந்திர வசூல் & சில்லறை பிரச்சனை (WhatsApp Bill & Dynamic UPI QR)**:
   - 1-கிளிக்கில் வாடிக்கையாளரின் வாட்ஸ்அப்பிற்கு exact கணக்கு செய்தி அனுப்பலாம்.
   - Google Pay / PhonePe / Paytm மூலம் ஸ்கேன் செய்து உடனடியாக பணம் செலுத்த டைனமிக் UPI QR குறியீடு.
6. **கரந்த பால் vs போட்ட பால் கணக்கு (Milking Yield vs Delivered Balance)**:
   - காலையில் மாட்டில் கரந்த பால் அளவு (எ.கா. 35L) - வாடிக்கையாளர்களுக்கு போட்ட பால் (எ.கா. 32L) = மீதமுள்ள 3L தயிர், நெய் அல்லது வீட்டு பயன்பாட்டிற்கு கணக்கு காட்டும்.

---

## 🏗️ 2. தொழில்நுட்ப கட்டமைப்பு (Tech Stack)

- **Frontend**: Vite + React 18, Tailwind CSS, Lucide Icons, Bilingual i18n (தமிழ் / English).
- **Backend**: Java 21 LTS REST API, Route Optimization & Monthly Billing Engine.
- **Database / Cloud**: Firebase Firestore Sync with Instant Offline Local-Storage Fallback.
- **Payments**: Real NPCI Dynamic UPI Deep-link & QR Code Generation (PhonePe, GPay, Paytm).

---

## 📂 3. திட்ட கோப்பு கட்டமைப்பு (Project Structure)

```
d:\milkdelivery/
├── frontend/                          # Vite + React 18 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top bar (Morning/Evening shift, Tamil/EN switch, Role select)
│   │   │   ├── DeliveryRunner.jsx     # 5:00 AM Fast Route Checklist (Delivered, Skip, Extra Milk)
│   │   │   ├── CustomerDirectory.jsx  # Customer management, Route ordering, Custom rates
│   │   │   ├── BillingLedger.jsx      # Monthly Ledger, 1-Click WhatsApp Invoicing, UPI Modal
│   │   │   ├── CustomerPortal.jsx     # Customer Self-Service (Passbook, Pause milk, Extra request)
│   │   │   ├── MilkYieldTracker.jsx   # Milking yield vs delivery stock reconciliation
│   │   │   └── UPIPaymentModal.jsx    # Real Dynamic UPI QR Code generator for PhonePe/GPay
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx        # Role-based access (Appa Admin vs Customer view)
│   │   │   └── LanguageContext.jsx    # Tamil & English translations dictionary
│   │   ├── services/
│   │   │   └── dairyService.js        # High-resilience Firestore & local persistence engine
│   │   ├── config/
│   │   │   └── firebase.js            # Firebase SDK configuration
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── backend-java/                      # Java 21 Enterprise Engine
│   ├── src/main/java/com/milkdelivery/
│   │   ├── MilkDeliveryServer.java    # Standalone REST API Server (port 8080)
│   │   ├── model/                     # Customer, DeliveryRecord, MonthlyBill, MilkingYield
│   │   └── service/                   # BillingEngineService, RouteOptimizerService, InvoiceFormatterService
│   ├── pom.xml                        # Maven configuration for Spring Boot & Firebase Admin
│   └── bin/                           # Precompiled Java 21 bytecode
│
├── start-all.bat                      # 1-Click launcher for both Backend & Frontend
├── run-frontend.bat                   # Runs Vite dev server on http://localhost:3000
├── run-backend.bat                    # Compiles & runs Java 21 server on http://localhost:8080
└── README.md
```

---

## 🚀 4. How to Run (இயக்குவது எப்படி?)

### 1-கிளிக் தொடக்கம் (Easiest Method):
இரட்டை கிளிக் செய்யவும்:
👉 `start-all.bat`

அல்லது தனித்தனியாக இயக்க:
1. **Frontend**:
   ```powershell
   .\run-frontend.bat
   ```
   உலாவியில் திறக்கவும்: [http://localhost:3000](http://localhost:3000)

2. **Java Backend**:
   ```powershell
   .\run-backend.bat
   ```
   API முகவரி: [http://localhost:8080/api/health](http://localhost:8080/api/health)

---

## 📱 5. முக்கிய அம்சங்களின் பார்வை (Key Walkthrough)

1. **👨‍🌾 பண்ணை நிர்வாகி (அப்பா மோட்)**:
   - **ரூட் டெலிவரி**: அதிகாலை 5 மணிக்கு தெரு வாரியாக 1-தட்டலில் "போட்டாச்சு ✅" அல்லது "லீவு ⏸️" என பதிவு செய்யலாம்.
   - **வாடிக்கையாளர்கள்**: புதிய வீடுகளை சேர்க்கலாம், லிட்டர் விலை நிர்ணயிக்கலாம் (எ.கா. ₹56), கதவு எண் வரிசைப்படுத்தலாம்.
   - **மாதாந்திர பில்**: மாதம் முடிந்ததும் வாட்ஸ்அப் ரசீது அனுப்பலாம், பணம் செலுத்தியதை பதிவு செய்யலாம்.
   - **கரவை கணக்கு**: காலையில் கறந்த மொத்த பாலையும் போட்ட பாலையும் ஒப்பிட்டு நஷ்டத்தை தவிர்க்கலாம்.

2. **🏡 வாடிக்கையாளர் மோட் (Customer Portal)**:
   - மேலே உள்ள தேர்வில் **"வாடிக்கையாளர்"** என்பதை தேர்வு செய்து பார்க்கலாம்.
   - இன்றைய பால் விநியோகம் செய்யப்பட்ட நேரம் தெரியும்.
   - கேலெண்டர் பாஸ்புக்கில் எத்தனை நாட்கள் பால் வாங்கப்பட்டது, எத்தனை நாட்கள் லீவு என்பது வெளிப்படையாக தெரியும்.
   - ஊருக்கு செல்லும் போது முன்கூட்டியே **"லீவு பதிவு"** செய்யலாம்.
   - **UPI QR** மூலம் Google Pay / PhonePe-ல் 1 நொடியில் பில் தொகையை செலுத்தலாம்.
