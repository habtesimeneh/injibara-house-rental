import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { getPool } from '../../database/db.js';
import { getAdminUserIds } from '../middleware/securityMiddleware.js';
import { aiLimiter, aiChatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/detect-place', aiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    const cleanQuery = String(query || '').trim();
    
    if (!cleanQuery || cleanQuery.length > 500) {
      return res.status(400).json({ error: 'Query must be between 1 and 500 characters' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ city: '', type: '', maxPrice: null });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are an AI assistant helping a user find rental properties in Amhara Region, Ethiopia. Extract the location parameters from the user's natural language query. Return ONLY a valid JSON object matching the schema below.
Query: "${cleanQuery}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: {
                type: Type.STRING,
                description: "The name of the city if mentioned. Must be one of: 'Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Kombolcha', 'Debre Birhan', 'Lalibela', 'Woldia', 'Injibara'. Return empty string if not found or matched."
              },
              type: {
                type: Type.STRING,
                description: "The property category if mentioned. Must be one of: 'Luxury Villa', 'Modern Apartment', 'Studio', 'Commercial Space'. Return empty string if not found."
              },
              maxPrice: {
                type: Type.NUMBER,
                description: "The maximum price in ETB if mentioned (e.g. 50000). Leave undefined or null if not mentioned."
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      return res.json(data);
    } catch (aiErr) {
      console.error('AI Detect Place API Error / Rate Limit (429):', aiErr.message);
      return res.json({ city: '', type: '', maxPrice: null });
    }
  } catch (error) {
    console.error('AI Detect Place Error:', error);
    res.json({ city: '', type: '', maxPrice: null });
  }
});

// Real-time Chat Support endpoint with Amharic and English support
router.post('/chat', aiChatLimiter, async (req, res) => {
  try {
    const { message, history, userId } = req.body;
    const cleanMessage = String(message || '').trim();
    
    if (!cleanMessage || cleanMessage.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
    }

    const pool = getPool();

    // Fetch real available houses and tenant seeking requests from DB
    let housesSummary = "";
    let seekingSummary = "";
    let housesData = [];
    let seekingData = [];

    try {
      const pool = getPool();
      const [houseRows] = await pool.query(
        "SELECT h.title, h.city, h.sub_city, h.type, h.price, h.rooms, h.bathrooms, h.address, h.video_url FROM houses h WHERE h.status = 'Available' LIMIT 25"
      );
      housesData = houseRows || [];
      housesSummary = housesData.map(h => 
        `- ${h.title} in ${h.city} (${h.sub_city || h.address || ''}, ${h.type}): ${h.price.toLocaleString()} ETB/month, ${h.rooms} bed, ${h.bathrooms} bath${h.video_url ? ' (Has Video Tour)' : ''}`
      ).join('\n');

      const [seekingRows] = await pool.query(
        "SELECT s.title, s.house_type, s.preferred_location, s.budget_max FROM tenant_seeking_ads s ORDER BY s.created_at DESC LIMIT 15"
      );
      seekingData = seekingRows || [];
      seekingSummary = seekingData.map(s =>
        `- Tenant looking for ${s.house_type} in ${s.preferred_location} with max budget ${Number(s.budget_max).toLocaleString()} ETB/mo.`
      ).join('\n');
    } catch (dbErr) {
      console.error('Failed to fetch DB context for AI chat:', dbErr.message);
    }

    // System instruction defining chatbot identity, full platform awareness, locations knowledge, and language support
    const systemInstruction = `You are "Smart Support Assistant" (የእንጅባራ ቤት አከራይ አርቲፊሻል ኢንቴሊጀንስ ረዳት), the official intelligent AI support agent for "Injibara House Rental Platform" (የእንጅባራ ከተማ የቤት አከራይ እና ተከራይ መድረክ) in Ethiopia.

***STRICT SECURITY & PRIVACY POLICY - CRITICAL (አስፈላጊ የደህንነት እና ግላዊነት መመሪያ)***:
- You are strictly PROHIBITED from providing any information regarding individual user details, platform security, server architecture, database details, API keys, or internal system configurations.
- NEVER disclose administrative access details, passwords, or hacking-related information.
- If a user asks about security, vulnerabilities, or sensitive technical details, you MUST politely refuse, set out_of_scope to true, and DO NOT give any system details.

***MANDATORY SERVICE FEE REMINDER (የአገልግሎት ክፍያ ማሳሰቢያ)***:
- IMPORTANT: You MUST remind both tenants and landlords in EVERY response that they are required to pay a service fee (የአገልግሎት ክፍያ) for using this platform to find or rent properties.
- Remind them that for successful matches, a reasonable platform commission/fee applies.

Core Platform Knowledge & System Capabilities:
1. **Multilingual Support (አማርኛ & English)**:
   - You MUST respond in fluent Amharic (አማርኛ) if the user writes in Amharic script or transliterated Amharic (e.g., "Selam", "Bahir Dar bet", "waga sint new").
   - You MUST respond in English if the user writes in English.
   - You understand Ethiopian rental terms: kebele (ቀበሌ), sub-city (ክፍለ ከተማ), landlord (አከራይ), tenant (ተከራይ), broker/agent (ደላላ), ETB/ብር, studio (ስቱዲዮ), condominium (ኮንዶሚኒየም), villa (ቪላ), service quarter (ሰርቪስ).

2. **Complete Geographic Recognition (Amhara Cities & Sub-locations)**:
   - Cities recognized:
     * Bahir Dar (ባህር ዳር): Kebeles 01-14, Poly, Belay Zeleke, Sebatamit, Gish Abay, Shimbit, Diaspors, Tis Abay.
     * Gondar (ጎንደር): Maraki, Fasiledes, Arada, Piassa, Azezo, Checheho, Angereb, Lideta.
     * Dessie (ደሴ): Arada, Hotie, Menafesha, Buanbuha, Robit, Boru Meda.
     * Debre Markos (ደብረ ማርቆስ): Kebeles 01-08, Abima, Hidase.
     * Kombolcha (ኮምቦልቻ): Millenium, Kebeles 01-05.
     * Debre Birhan (ደብረ ብርሃን): Tegbareid, Kebeles 01-09.
     * Debre Tabor, Lalibela, Woldia, Injibara, Finote Selam, Dangila, Motta, Bati, Kemise, Chagni, Debark, Shewa Robit, Kobo, Sekota, Addi Arkay, Debre Sina.

3. **Platform Pricing & Payment Methods**:
   - **30-Day Free Trial Policy**: All standard property listings and tenant-seeking ads are 100% FREE to post for the first 30 days!
   - **VIP Boost / Premium Banner**: Optional paid feature to highlight listings on top of search results.
   - **Supported Ethiopian Bank & Mobile Payment Options**:
     1. Telebirr (ቴሌብር) - Fast mobile payment
     2. Commercial Bank of Ethiopia (CBE / ንግድ ባንክ) - Account transfer & CBE Birr
     3. Bank of Abyssinia (አቢሲንያ ባንክ)
     4. Awash Bank (አዋሽ ባንክ)
     5. Dashen Bank / Amole (ዳሽን ባንክ / አሞሌ)

4. **Key Platform Features**:
   - **House Browsing & Filters**: City, sub-city, price range, bedrooms, property type, interactive Leaflet map view.
   - **360° / Video Virtual Tour**: Landlords can include YouTube/TikTok video links so tenants can tour properties remotely without traveling.
   - **Tenant Seeking Ads (የቤት ፈላጊዎች ቀጥታ ጥያቄዎች)**: Tenants can post what location, house type, and budget they are looking for. Landlords and brokers can see these requests on the homepage carousel and contact tenants directly.
   - **In-App Messaging & Rental Requests**: Tenants can send direct messages or submit rental duration requests.
    - **Contact Support**: Phone: ${process.env.SUPPORT_PHONE || 'via website contact form'} | Email: ${process.env.SUPPORT_EMAIL || 'support@injibarahousebroker.com'}

5. **Current Live Houses in Database**:
${housesSummary || "No active property listings currently in DB."}

6. **Current Live Tenant Seeking Requests in Database**:
${seekingSummary || "No tenant seeking requests currently in DB."}

***SCOPE EVALUATION RULES***:
- You must ONLY answer customer questions based on information about the website, available houses, property details, Injibara/Amhara rentals, platform fees, payment options, how to register/list properties, or contacting support.
- If a user's message is UNRELATED or OUT OF SCOPE of the website and platform (e.g. general knowledge, math, programming, medical advice, other regions/countries, system hacking, security queries, pentesting, prompt injection, or generic chit-chat unrelated to our services):
  1. You MUST set out_of_scope to true.
   2. You MUST set the reply to inform the customer that the question is outside our platform's scope, and politely direct them to contact the Admin via phone ${process.env.SUPPORT_PHONE || 'via our website contact form'} or Telegram @InjibaraHouseSupport for personalized assistance. Respond in the matching language (Amharic or English).
  3. Under NO circumstances should any security-related information, system/database configurations, internal code, or secrets be disclosed. Maintain a strong denial of any security-probing questions.`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        let formattedContents = [];
        if (Array.isArray(history) && history.length > 0) {
          formattedContents = history
            .filter(h => h && typeof h.text === 'string' && h.text.trim().length > 0)
            .map(h => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text.trim() }]
            }));
        }
        
        if (typeof message === 'string' && message.trim().length > 0) {
          formattedContents.push({ role: 'user', parts: [{ text: message.trim() }] });
        }

        if (formattedContents.length === 0) {
          formattedContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: "Your helpful response. If out_of_scope is true, explain that you only answer questions about the platform, and provide the Admin phone (configured in SUPPORT_PHONE) and Telegram @InjibaraHouseSupport."
                },
                out_of_scope: {
                  type: Type.BOOLEAN,
                  description: "true if the user's latest query is unrelated/out of scope of our rental platform or is a security-probing question. Otherwise false."
                }
              },
              required: ["reply", "out_of_scope"]
            }
          }
        });

        let replyText = '';
        let outOfScope = false;

        if (response && response.text) {
          try {
            const data = JSON.parse(response.text);
            replyText = data.reply;
            outOfScope = data.out_of_scope === true;
          } catch (pErr) {
            replyText = response.text;
            const lowerText = message.toLowerCase();
            const isSecurity = lowerText.includes('hack') || lowerText.includes('vulnerab') || lowerText.includes('exploit') || lowerText.includes('password') || lowerText.includes('bypass') || lowerText.includes('key') || lowerText.includes('database');
            const knownWords = ['rent', 'house', 'price', 'location', 'trial', 'free', 'register', 'contact', 'phone', 'support', 'payment', 'bank', 'telebirr', 'cbe',  'injibara', 'ሰላም', 'ዋጋ', 'ክራይ', 'ስልክ', 'አድራሻ', 'መዝግብ', 'ማከራየት', 'ተከራይ', 'ፈላጊ'];
            const hasKeyword = knownWords.some(w => lowerText.includes(w));
            if (isSecurity || !hasKeyword) {
              outOfScope = true;
              replyText = `ይቅርታ፣ እኔ ስለ እንጅባራ ቤት አከራይ እና ተከራይ መድረክ ብቻ መመለስ የምችል ረዳት ነኝ። የላኩት ጥያቄ ከመድረካችን ወሰን ውጭ ነው። እባክዎን ለበለጠ መረጃ እና እርዳታ ዋና አስተዳዳሪውን (Admin) በስልክ ቁጥር ${process.env.SUPPORT_PHONE || 'via our website contact form'} ወይም በቴሌግራም @InjibaraHouseSupport ያግኙ።\n\nSorry, I am an AI assistant specialized only in the Injibara House Rental Platform. Your question is outside of our platform's scope. Please contact the Admin directly via ${process.env.SUPPORT_PHONE || 'our website contact form'} or Telegram @InjibaraHouseSupport for customized help.`;
            }
          }
        }

        if (outOfScope) {
          try {
            const pool = getPool();
            const adminIds = await getAdminUserIds();
            const notifyMsg = `የውጭ ጥያቄ (Off-topic question): "${message.substring(0, 150)}"`;
            
            if (adminIds.length > 0) {
              const notifPromises = adminIds.map(adminId =>
                pool.query(
                  "INSERT INTO notifications (user_id, title, message) VALUES (?, 'የውጭ ጥያቄ ማሳሰቢያ / Off-Topic AI Question', ?)",
                  [adminId, notifyMsg]
                )
              );
              await Promise.all(notifPromises);
            }
          } catch (notifErr) {
            console.error('Failed to notify admins of out-of-scope query:', notifErr.message);
          }
        }

        if (replyText) {
          // Log to database
          try {
            const pool = getPool();
            const logUserId = req.body.userId || null;
            await pool.query(
              'INSERT INTO ai_chats (user_id, user_message, ai_response) VALUES (?, ?, ?)',
              [logUserId, message, replyText]
            );
          } catch (logErr) {
            console.error('Failed to log AI chat:', logErr.message);
          }
          return res.json({ reply: replyText });
        }
      } catch (geminiErr) {
        console.error('Gemini Chat Error, falling back to smart engine:', geminiErr.message);
      }
    }

    // Smart Fallback Engine (DB-Aware in Amharic and English)
    const fb = generateSmartFallbackReply(message, housesData, seekingData);
    const reply = fb.reply;
    const outOfScope = fb.outOfScope;
    
    if (outOfScope) {
      try {
        const pool = getPool();
        const adminIds = await getAdminUserIds();
        const notifyMsg = `የውጭ ጥያቄ (Off-topic question): "${message.substring(0, 150)}"`;
        
        if (adminIds.length > 0) {
          const notifPromises = adminIds.map(adminId =>
            pool.query(
              "INSERT INTO notifications (user_id, title, message) VALUES (?, 'የውጭ ጥያቄ ማሳሰቢያ / Off-Topic AI Question', ?)",
              [adminId, notifyMsg]
            )
          );
          await Promise.all(notifPromises);
        }
      } catch (notifErr) {
        console.error('Failed to notify admins of out-of-scope query in fallback:', notifErr.message);
      }
    }

    // Log fallback response to database
    try {
      const pool = getPool();
      const logUserId = req.body.userId || null;
      await pool.query(
        'INSERT INTO ai_chats (user_id, user_message, ai_response) VALUES (?, ?, ?)',
        [logUserId, message, reply]
      );
    } catch (logErr) {
      console.error('Failed to log Fallback AI chat:', logErr.message);
    }

    res.json({ reply });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

function generateSmartFallbackReply(input, housesData, seekingData) {
  const lower = input.toLowerCase();
  
  const isSecurityQuery = lower.includes('hack') || lower.includes('vulnerab') || lower.includes('exploit') || lower.includes('password') || lower.includes('bypass') || lower.includes('key') || lower.includes('credential') || lower.includes('token') || lower.includes('admin') || lower.includes('database') || lower.includes('sql') || lower.includes('port') || lower.includes('secret') || lower.includes('config');
  
  if (isSecurityQuery) {
    const supportPhone = process.env.SUPPORT_PHONE || 'our website contact form';
    return {
      reply: `ይቅርታ፣ ይህንን ጥያቄ መመለስ አልችልም። ስለ የደህንነት መረጃዎች መወያየት በጥብቅ የተከለከለ ነው። ለተጨማሪ እገዛ እባክዎን ዋና አስተዳዳሪውን (Admin) በስልክ ቁጥር ${supportPhone} ወይም በቴሌግራም @InjibaraHouseSupport ያግኙ።\n\nSorry, I cannot answer security-related or technical system questions. Please contact the Admin directly via ${supportPhone} or Telegram @InjibaraHouseSupport for support.`,
      outOfScope: true
    };
  }

  // Amharic or English Greeting
  if (lower.includes('ሰላም') || lower.includes('እንደምን') || lower.includes('selam') || lower.includes('hi') || lower.includes('hello')) {
    return {
      reply: "ሰላም! እንኳን ወደ እንጅባራ ቤት አከራይ አርቲፊሻል ኢንቴሊጀንስ ረዳት በደህና መጡ። በባህር ዳር፣ ጎንደር፣ ደሴ፣ ደብረ ማርቆስ እና በሌሎች የአማራ ክልል ከተሞች የሚከራዩ ቤቶችን መፈለግ፣ የራስዎን ቤት ማከራየት ወይም የቤት ፍላጎትዎን መለጠፍ ይችላሉ። እንዴት ልረዳዎት?\n\nHello! Welcome to Injibara House Rental AI assistant. How can I help you today?",
      outOfScope: false
    };
  }

  // Tenant Seeking requests check
  if (lower.includes('ተከራይ') || lower.includes('ፈላጊ') || lower.includes('tenant') || lower.includes('seeking') || lower.includes('request')) {
    let replyText = "";
    if (seekingData && seekingData.length > 0) {
      const list = seekingData.slice(0, 3).map(s => `• ${s.seeker_name} - ${s.house_type} በ ${s.preferred_location} (በጀት: እስከ ${Number(s.budget_max).toLocaleString()} ብር)`).join('\n');
      replyText = `በመድረካችን ላይ የሚከተሉት የቤት ፈላጊዎች ጥያቄዎችን አስመዝግበዋል:\n\n${list}\n\nበመነሻ ገፁ (Home Page) ላይ 'የቤት ፈላጊዎች ቀጥታ ጥያቄዎች' ስላይደር ላይ ሙሉውን ማየትና ደውለው ማናገር ይችላሉ!`;
    } else {
      replyText = "ተከራዮች የሚፈልጉትን የቤት አይነት፣ ቦታ እና በጀት በ 'የቤት ፍላጎትዎን ያስመዝግቡ' በተን በኩል መለጠፍ ይችላሉ። አከራዮችና ደላሎች በመነሻ ገፅ ላይ ይመለከቱታል!";
    }
    return { reply: replyText, outOfScope: false };
  }

  // Payment / Bank query
  if (lower.includes('ባንክ') || lower.includes('ቴሌብር') || lower.includes('bank') || lower.includes('telebirr') || lower.includes('cbe') || lower.includes('ክፍያ') || lower.includes('payment') || lower.includes('ነፃ') || lower.includes('free') || lower.includes('ኮሚሽን') || lower.includes('fee')) {
    return {
      reply: "💳 **የክፍያ እና የማስታወቂያ መረጃ**:\n• **30 ቀን ነፃ**: መደበኛ የቤት እና የቤት ፈላጊ ማስታወቂያዎች ለመጀመሪያዎቹ 30 ቀናት 100% ነፃ ናቸው!\n• **የሚደገፉ ባንኮች እና ቴሌብር**:\n  1. Telebirr (ቴሌብር)\n  2. የኢትዮጵያ ንግድ ባንክ (CBE & CBE Birr)\n  3. አቢሲንያ ባንክ (Bank of Abyssinia)\n  4. አዋሽ ባንክ (Awash Bank)\n  5. ዳሽን ባንክ / አሞሌ (Dashen Bank / Amole)",
      outOfScope: false
    };
  }

  // Price or Rent query
  if (lower.includes('ዋጋ') || lower.includes('ክራይ') || lower.includes('price') || lower.includes('rent') || lower.includes('cost') || lower.includes('etb') || lower.includes('ብር')) {
    let replyText = "";
    if (housesData && housesData.length > 0) {
      const sample = housesData.slice(0, 3).map(h => `• ${h.title} (${h.city}): ${h.price.toLocaleString()} ብር/ወር`).join('\n');
      replyText = `በመድረካችን ላይ የሚገኙ የቤት ኪራይ ዋጋዎች እንደ ቤቱ ዓይነትና ቦታ ከ 18,000 ብር እስከ 150,000 ብር ይደርሳሉ።\n\nምሳሌዎች:\n${sample}\n\nሁሉንም ቤቶች በ 'Houses' ገፅ ላይ ማየት ይችላሉ።`;
    } else {
      replyText = "በመድረካችን ላይ ከ18,000 ብር እስከ 150,000 ብር/ወር የሚከራዩ የተለያዩ ቤቶች ይገኛሉ። ለበለጠ መረጃ የ 'Houses' ገፅን ይጎብኙ።";
    }
    return { reply: replyText, outOfScope: false };
  }

  // Location / Cities query
  if (lower.includes('ባህር') || lower.includes('ጎንደር') || lower.includes('ደሴ') || lower.includes('ደብረ') || lower.includes('bahir') || lower.includes('gondar') || lower.includes('dessie') || lower.includes('ቦታ') || lower.includes('location') || lower.includes('injibara') || lower.includes('እንጅባራ')) {
    const matched = housesData.filter(h => 
      lower.includes(h.city.toLowerCase()) || 
      (lower.includes('ባህር') && h.city.includes('Bahir')) ||
      (lower.includes('ጎንደር') && h.city.includes('Gondar')) ||
      (lower.includes('ደሴ') && h.city.includes('Dessie')) ||
      (lower.includes('እንጅባራ') && h.city.includes('Injibara'))
    );
    if (matched.length > 0) {
      const list = matched.map(h => `• ${h.title} - ${h.price.toLocaleString()} ብር (${h.rooms} ክፍል, ${h.city})`).join('\n');
      return {
        reply: `በተፈለገው ከተማ የሚከተሉት ቤቶች ይገኛሉ:\n\n${list}\n\nተጨማሪ ዝርዝርና ካርታ ለማየት በ 'Houses' ገፅ ወይም በ 'Map View' መፈለጊያ ይጠቀሙ።`,
        outOfScope: false
      };
    }
    return {
      reply: "በባህር ዳር (ቀበሌ 11፣ ፖሊ...)፣ ጎንደር (ማራኪ...)፣ ደሴ፣ ደብረ ብርሃን፣ ደብረ ማርቆስ እና እንጅባራ ከተሞች የሚከራዩ ዘመናዊ አፓርታማዎች፣ ቪላዎችና ስቱዲዮዎች አሉ። በ 'Houses' ገፅ ላይ በከተማና ቀበሌ ለይተው መፈለግ ይችላሉ።",
      outOfScope: false
    };
  }

  // Registration / Listing query
  if (lower.includes('መዝግብ') || lower.includes('ማከራየት') || lower.includes('post') || lower.includes('add') || lower.includes('register') || lower.includes('landlord')) {
    return {
      reply: "ቤት ለማከራየት:\n1. 'Register' የሚለውን በመጫን እንደ አከራይ (Landlord) ይስመዝግቡ።\n2. ወደ ዳሽቦርድዎ (Dashboard) በመግባት 'Add Property' የሚለውን ይጫኑ።\n3. የቤቱን መረጃ፣ የቪዲዮ ሊንክ፣ ፎቶዎች እና የኪራይ ዋጋ ሞልተው ይለጥፉ። የመጀመሪያዎቹ 30 ቀናት ነፃ ነው!",
      outOfScope: false
    };
  }

  // Contact query
  if (lower.includes('ስልክ') || lower.includes('አድራሻ') || lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('ኢሜይል')) {
    const supportPhone = process.env.SUPPORT_PHONE || '';
    const supportEmail = process.env.SUPPORT_EMAIL || '';
    const contactLines = [];
    if (supportPhone) contactLines.push(`📞 ስልክ: ${supportPhone}`);
    if (supportEmail) contactLines.push(`📧 ኢሜይል: ${supportEmail}`);
    const contactBlock = contactLines.length > 0 ? contactLines.join('\n') : 'Please use the contact form on our website.';
    return {
      reply: `በቀጥታ ሊያገኙን ይችላሉ:\n${contactBlock}\n📍 አድራሻ: injibara Gojjam፣ ኢትዮጵያ`,
      outOfScope: false
    };
  }

  // Default response - out of scope
  const supportPhone = process.env.SUPPORT_PHONE || '';
  const supportEmail = process.env.SUPPORT_EMAIL || '';
  const contactBlock = supportPhone ? `ስልክ ${supportPhone}` : 'our website contact form';
  return {
    reply: `ይቅርታ፣ እኔ ስለ እንጅባራ ቤት አከራይ እና ተከራይ መድረክ ብቻ መመለስ የምችል አርቲፊሻል ኢንቴሊጀንስ ረዳት ነኝ። የላኩት ጥያቄ ከመድረካችን ወሰን ውጭ ነው። እባክዎን ለበለጠ መረጃ እና እርዳታ ዋና አስተዳዳሪውን (Admin) በ${contactBlock} ወይም በቴሌግራም @InjibaraHouseSupport ያግኙ።\n\nSorry, I am an AI assistant specialized only in the Injibara House Rental Platform. Your question is outside of our platform's scope. Please contact the Admin directly via ${contactBlock} or Telegram @InjibaraHouseSupport for customized help.`,
    outOfScope: true
  };
}

export default router;

