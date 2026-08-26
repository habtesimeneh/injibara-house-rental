# 🔧 የተሟላ የዌብሳይት ማስተካከያ እና ጥገና መመሪያ (Comprehensive Maintenance & Editing Guide)

ይህ ዶክመንት ዌብሳይትዎን በቀላሉ ለማስተካከል (Edit) እና ለማደስ (Maintain) የሚረዳ ዝርዝር መመሪያ ነው። ይህንን ዶክመንት በመከተል የትኛውንም የዌብሳይቱን ክፍል የት ገብተው ማስተካከል እንደሚችሉ ማወቅ ይችላሉ።

---

## 1. ዌብሳይቱ እንዴት ነው የተሰራው? (Project Structure)

ዌብሳይቱ በሶስት ዋና ዋና ክፍሎች የተከፈለ ነው፦
* **Frontend (Client):** ተጠቃሚዎች የሚያዩት ክፍል ሲሆን React, Tailwind CSS በመጠቀም የተሰራ ነው። ሁሉም የዚህ ክፍል ፋይሎች በ `./client` ፎልደር ውስጥ ይገኛሉ።
* **Backend (Server):** ከዳታቤዝ ጋር የሚገናኘው እና መረጃዎችን የሚያመላልሰው ክፍል ነው። Node.js እና Express የተሰራ ሲሆን ፋይሎቹ በ `./backend` ፎልደር ውስጥ ይገኛሉ።
* **Database:** የዳታቤዝ ኮኔክሽን እና ሴቲንግ በ `./database` ፎልደር ውስጥ ይገኛሉ።

---

## 2. የፊት ገፅ (Frontend / UI) ፋይሎችን ለማስተካከል

የተለያዩ የዌብሳይቱን ገፆች እና ክፍሎች (Components) ለማስተካከል ከስር ያሉትን ፋይሎች ይጠቀሙ፦

### 🏠 ሆምፔጅ ለማስተካከል (Homepage)
* **ፋይል:** `/client/src/pages/Home.jsx`
* **ምን ማስተካከል ይቻላል?** 
  * ከላይ የሚታየውን Hero Section (ፅሁፍ እና ምስል)
  * ፅሁፎችን (ለምሳሌ Amharic እና English ትርጉሞችን)
  * Ticker (እየተንሸራተተ የሚሄደውን ፅሁፍ)

### 📊 ዳሽቦርድ ለማስተካከል (Dashboard)
* **ለአድሚን (Admin Dashboard):** `/client/src/pages/AdminDashboard.jsx` 
  * የአድሚን መቆጣጠሪያ፣ ተጠቃሚዎችን እና ቤቶችን ማስተዳደሪያ ገፅ ነው።
* **ለተጠቃሚ/አከራይ (User Dashboard):** `/client/src/pages/Dashboard.jsx`
  * ተጠቃሚዎች ያከራዩትን ቤት ወይም ያስገቡትን መረጃ የሚያዩበት ገፅ።

### 💳 የክፍያ (Payment) ክፍሎችን ለማስተካከል
ክፍያዎችን እና የክፍያ ፎርሞችን ለማስተካከል እነዚህን ፋይሎች ይጠቀሙ፦
* `/client/src/components/HousePaymentModal.jsx` (ለቤት ክፍያዎች)
* `/client/src/components/TenantPaymentModal.jsx` (ለተከራይ ክፍያዎች)
* `/client/src/components/AdPaymentModal.jsx` (ለማስታወቂያ ክፍያዎች)
* `/backend/routes/paymentRoutes.js` (የክፍያ Backend Logic ለማስተካከል)

### 🏷️ የቤቶች ዝርዝር እና ካርድ ለማስተካከል (Product Card)
* **የካርዱ ዲዛይን (House Card/Grid):** `/client/src/components/HouseGrid.jsx`
  * እዚህ ውስጥ የቤቱ ፎቶ፣ ዋጋ፣ እና መግለጫ እንዴት እንደሚታይ ማስተካከል ይችላሉ።
* **የቤቱ ዝርዝር መረጃ (Property Detail):** `/client/src/components/PropertyDetailModal.jsx`

### 🧭 ናቭባር እና ፉተር ለማስተካከል (Navbar & Footer)
* **የላይኛው ሜኑ (Navbar):** `/client/src/components/Navbar.jsx`
  * አዳዲስ ሊንኮችን ለመጨመር፣ ሎጎ ለመቀየር፣ ወዘተ።
* **ሞባይል ሜኑ (Mobile Sidebar):** `/client/src/components/MobileSidebar.jsx`
* **የታችኛው ክፍል (Footer):** `/client/src/components/Footer.jsx`
  * ስልክ ቁጥር፣ አድራሻ፣ እና ሌሎች የግርጌ መረጃዎችን ለመቀየር።

---

## 3. የጀርባ (Backend & API) ፋይሎችን ለማስተካከል

መረጃዎች እንዴት እንደሚቀመጡ እና እንደሚመጡ (API Logic) ለማስተካከል፦

* **Routes (የ API መንገዶች):** በ `/backend/routes/` ውስጥ ይገኛሉ።
  * ለምሳሌ የቤቶችን API ለማስተካከል `/backend/routes/houseRoutes.js` ን ያግኙ።
* **Controllers (የ API ስራዎች):** በ `/backend/controllers/` ውስጥ ይገኛሉ።
  * እዚህ ውስጥ መረጃው ከዳታቤዝ እንዴት እንደሚመጣ የ SQL ኮድ ይፃፋል። 
  * ለምሳሌ `/backend/controllers/houseController.js` የቤቶችን ዳታ የሚያመጣበት እና የሚያስገባበት ፋይል ነው።

---

## 4. ፋይሎችን በ AI ለማስተካከል የደረጃ-በ-ደረጃ መመሪያ (Step-by-Step Guide)

ዌብሳይቱን በ AI ለማስተካከል ሲፈልጉ እነዚህን ቅደም-ተከተሎች ይጠቀሙ፦

1. **መጀመሪያ ፋይሉን እንዲያነብ ይዘዙት (Read the File):**
   * *ምሳሌ:* "Please view the content of `/client/src/pages/Home.jsx`" ይበሉት።
   * **ማስጠንቀቂያ:** AI-ው ሳያነብ ዝምብሎ እንዲያስተካክል በፍፁም አይዘዙት። ሁልጊዜ መጀመሪያ እንዲያነበው ያድርጉ።

2. **ምን ማስተካከል እንደሚፈልጉ በግልፅ ይንገሩት (Specify the change):**
   * *ምሳሌ:* "Home.jsx ፋይል ውስጥ ያለውን 'Browse Categories' የሚለውን ፅሁፍ ወደ 'Our Services' ቀይርልኝ እና ቀለሙን ሰማያዊ አድርግልኝ" ብለው ያዙት።

3. **ኤዲት ካደረገ በኋላ እንዲያረጋግጥ ያድርጉ (Verify/Compile):**
   * AI-ው ስራውን ከጨረሰ በኋላ፣ ዌብሳይቱ በትክክል መስራቱን ለማረጋገጥ "Compile and verify the applet" ብለው ይዘዙት።

---

## 5. ተደጋጋሚ ችግሮች እና መፍትሄዎቻቸው (Troubleshooting)

* **Request failed with status code 429:** 
  * ይህ ማለት በአንድ ጊዜ ብዙ ጥያቄዎች (Requests) ወደ ዳታቤዙ እየተላኩ ነው ማለት ነው። መፍትሄው፣ በ Client በኩል (ለምሳሌ `Home.jsx` ላይ) `useEffect` ውስጥ የሚደረጉ ጥሪዎችን መቀነስ ወይንም Backend ላይ የ Rate Limiting ማስተካከል ነው።
* **Target content not found:**
  * AI-ው ማስተካከል የፈለገውን ፅሁፍ ካላገኘው የሚመጣ ኤረር ነው። ለ AI-ው ፋይሉን በድጋሚ እንዲያነበው ይንገሩት።

## 6. የዳታቤዝ ግንኙነት (Database Structure)
የዳታቤዝ ሴቲንጎች በ `/database/db.js` ውስጥ ናቸው። ቴብሎችን ወይም ዳታቤዙን ለማስተካከል እባክዎ ጥንቃቄ ያድርጉ (Backup መውሰድዎን አይርሱ)።
