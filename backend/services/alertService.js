import { getPool } from '../../database/db.js';
import { sendSMS } from './smsService.js';

/**
 * Normalize application base URL.
 *
 * Example:
 * http://localhost:5173/
 *      =>
 * http://localhost:5173
 */
const getAppBaseUrl = () => {
  const baseUrl =
    process.env.APP_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173';

  return String(baseUrl).replace(/\/+$/, '');
};

/**
 * Build the frontend property details URL.
 *
 * IMPORTANT:
 * The frontend route must be:
 * /houses/:id
 *
 * Example:
 * https://your-domain.com/houses/25
 */
const buildPropertyLink = (houseId) => {
  if (!houseId) {
    return null;
  }

  const appBaseUrl = getAppBaseUrl();

  return `${appBaseUrl}/houses/${encodeURIComponent(String(houseId))}`;
};

/**
 * Build dashboard URL.
 */
const buildDashboardLink = () => {
  return `${getAppBaseUrl()}/dashboard`;
};

/**
 * Escape user/property data before inserting it into HTML.
 *
 * This is important because this HTML is later stored in email_logs
 * and sent/rendered as HTML.
 */
const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * HTML Email Template Generator for Property Notifications
 */
export function generatePropertyEmailHTML(house, user) {
  const houseId = house?.house_id;

  if (!houseId) {
    throw new Error(
      'generatePropertyEmailHTML: house.house_id is required'
    );
  }

  const houseTitle = escapeHtml(
    house.title || 'አዲስ የሚከራይ ቤት / New House Listing'
  );

  const price = Number(house.price || 0).toLocaleString();

  const city = escapeHtml(house.city || 'Injibara');

  const subCity = escapeHtml(
    house.sub_city || house.address || 'ቀበሌ'
  );

  const rooms = Number(house.rooms || 1);

  const bathrooms = Number(house.bathrooms || 1);

  const houseType = escapeHtml(
    house.type || 'የመኖሪያ ቤት'
  );

  const houseImg =
    house.image_url ||
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80';

  const recipientName = escapeHtml(
    user?.name || 'ውድ ተከራይ (Valued Tenant)'
  );

  const propertyLink = buildPropertyLink(houseId);

  const dashboardLink = buildDashboardLink();

  return `
<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    አዲስ የሚስማማዎት ቤት ተመዝግቧል!
  </title>

  <style>
    body {
      font-family:
        'Segoe UI',
        Tahoma,
        Geneva,
        Verdana,
        sans-serif;

      background-color: #0f172a;
      color: #e2e8f0;

      margin: 0;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;

      background: #1e293b;

      border-radius: 20px;
      border: 1px solid #334155;

      overflow: hidden;

      box-shadow:
        0 20px 25px -5px
        rgba(0, 0, 0, 0.5);
    }

    .header {
      background:
        linear-gradient(
          135deg,
          #1e1b4b 0%,
          #312e81 100%
        );

      padding: 30px 24px;

      text-align: center;

      border-bottom:
        2px solid #f59e0b;
    }

    .badge {
      background-color: #f59e0b;
      color: #000;

      font-weight: 800;
      font-size: 11px;

      padding: 4px 12px;

      border-radius: 9999px;

      text-transform: uppercase;

      letter-spacing: 1px;

      display: inline-block;

      margin-bottom: 10px;
    }

    .title {
      color: #ffffff;

      font-size: 22px;

      font-weight: 800;

      margin:
        0 0 6px 0;
    }

    .subtitle {
      color: #fcd34d;

      font-size: 13px;

      font-weight: 600;

      margin: 0;
    }

    .content {
      padding: 24px;
    }

    .greeting {
      font-size: 15px;

      color: #94a3b8;

      margin-bottom: 20px;
    }

    .card {
      background-color: #0f172a;

      border-radius: 16px;

      border: 1px solid #334155;

      overflow: hidden;

      margin-bottom: 24px;
    }

    .card-img {
      width: 100%;

      height: 220px;

      object-fit: cover;

      display: block;
    }

    .card-body {
      padding: 20px;
    }

    .house-title {
      font-size: 18px;

      font-weight: 800;

      color: #ffffff;

      margin:
        0 0 10px 0;

      line-height: 1.4;
    }

    .price-tag {
      font-size: 22px;

      font-weight: 900;

      color: #f59e0b;

      margin-bottom: 16px;
    }

    .details-grid {
      display: grid;

      grid-template-columns:
        1fr 1fr;

      gap: 10px;

      background: #1e293b;

      padding: 12px;

      border-radius: 12px;

      margin-bottom: 20px;

      font-size: 13px;

      color: #cbd5e1;
    }

    .btn {
      display: block;

      width: 100%;

      box-sizing: border-box;

      text-align: center;

      background: #f59e0b;

      color: #000000;

      font-weight: 800;

      font-size: 15px;

      text-decoration: none;

      padding: 14px 20px;

      border-radius: 12px;
    }

    .footer {
      text-align: center;

      padding: 20px;

      background: #0f172a;

      font-size: 12px;

      color: #64748b;

      border-top:
        1px solid #334155;
    }

    .footer a {
      color: #f59e0b;

      text-decoration: none;
    }

    @media (max-width: 480px) {
      body {
        padding: 10px;
      }

      .content {
        padding: 16px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .card-img {
        height: 190px;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">

      <span class="badge">
        🏠 አዲስ የቤት ማሳወቂያ /
        NEW MATCHING RENTAL
      </span>

      <h1 class="title">
        እንጅባራ የቤት ኪራይና ደላላ
      </h1>

      <p class="subtitle">
        Injibara City Trusted House Rental Brokerage
      </p>

    </div>

    <div class="content">

      <p class="greeting">
        ሰላም
        <strong>${recipientName}</strong>!

        ከዚህ ቀደም ካስመዘገቡት
        የቤት ፍለጋ መስፈርት
        (Saved Search Criteria)
        ጋር የሚስማማ አዲስ ቤት
        ተመዝግቧል።
      </p>

      <div class="card">

        <img
          src="${escapeHtml(houseImg)}"
          alt="${houseTitle}"
          class="card-img"
        />

        <div class="card-body">

          <h2 class="house-title">
            ${houseTitle}
          </h2>

          <div class="price-tag">
            ETB ${price}

            <span
              style="
                font-size:12px;
                color:#94a3b8;
                font-weight:normal;
              "
            >
              / በወር
            </span>
          </div>

          <div class="details-grid">

            <div>
              📍
              <strong>ቦታ:</strong>
              ${city}, ${subCity}
            </div>

            <div>
              🏠
              <strong>አይነት:</strong>
              ${houseType}
            </div>

            <div>
              🛏️
              <strong>ክፍሎች:</strong>
              ${rooms} ክፍል
            </div>

            <div>
              🚿
              <strong>መታጠቢያ:</strong>
              ${bathrooms}
            </div>

          </div>

          <!--
            IMPORTANT:
            This link points directly to the
            frontend property details route.
          -->

          <a
            href="${propertyLink}"
            class="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            👉 ቤቱን አሁኑኑ ይመልከቱ
            (View Details)
          </a>

        </div>
      </div>

      <p
        style="
          font-size:12px;
          color:#64748b;
          text-align:center;
        "
      >
        ይህ አውቶማቲክ የኢሜይል ማሳወቂያ
        የተላከው በእንጅባራ ቤት ደላላ
        የቤት ፍለጋ አገልግሎት
        አማካይነት ነው።
      </p>

    </div>

    <div class="footer">

      <p>
        © 2026 Injibara House Rental Brokerage Platform.
        Awi Zone, Amhara Region, Ethiopia.
      </p>

      <p>
        ስልክ: ${process.env.SUPPORT_PHONE || '+251 000 000 000'} |
        ኢሜይል:
        ${process.env.SUPPORT_EMAIL || 'support@injibarahousebroker.com'}
      </p>

      <p
        style="
          font-size:10px;
          color:#475569;
          margin-top:15px;
          border-top:1px solid #1e293b;
          padding-top:15px;
        "
      >
        ይህ ማሳወቂያ የተላከው
        ፍላጎትዎን መሰረት በማድረግ ነው።

        ማሳወቂያዎችን ለማቆም

        <a
          href="${dashboardLink}"
          style="color:#f59e0b;"
        >
          ዳሽቦርድዎ ላይ Saved Alerts
        </a>

        የሚለውን በመጫን
        መሰረዝ ይችላሉ።
      </p>

    </div>

  </div>

</body>
</html>
`;
}

/**
 * Triggers automated email notifications
 * and system notifications for tenants
 * matching a new property.
 */
export async function triggerPropertyAlerts(houseId) {
  try {
    const pool = getPool();

    if (!houseId) {
      console.warn(
        '[ALERT SERVICE] Invalid houseId:',
        houseId
      );

      return {
        sentCount: 0,
      };
    }

    /**
     * Fetch newly created house details.
     */
    const [houses] = await pool.query(
      `
        SELECT
          h.*,
          u.name AS owner_name,
          u.phone AS owner_phone
        FROM houses h
        JOIN users u
          ON h.owner_id = u.user_id
        WHERE h.house_id = ?
      `,
      [houseId]
    );

    if (!houses || houses.length === 0) {
      console.log(
        '[ALERT SERVICE] House not found:',
        houseId
      );

      return {
        sentCount: 0,
      };
    }

    const house = houses[0];

    /**
     * Make sure the property has a valid ID.
     */
    if (!house.house_id) {
      console.error(
        '[ALERT SERVICE] House has no house_id'
      );

      return {
        sentCount: 0,
      };
    }

    /**
     * Fetch all active property alerts.
     */
    const [alerts] = await pool.query(
      `
        SELECT
          a.*,
          u.name AS user_name,
          u.email AS user_email,
          u.phone AS user_phone
        FROM property_alerts a
        JOIN users u
          ON a.user_id = u.user_id
        WHERE a.is_active = 1
      `
    );

    let sentCount = 0;

    for (const alert of alerts) {

      /**
       * 1. Price match
       */
      const hPrice = Number(house.price);

      const aMinPrice =
        Number(alert.min_price || 0);

      const aMaxPrice =
        Number(alert.max_price || 0);

      if (!Number.isFinite(hPrice)) {
        continue;
      }

      if (hPrice < aMinPrice) {
        continue;
      }

      if (
        aMaxPrice > 0 &&
        hPrice > aMaxPrice
      ) {
        continue;
      }

      /**
       * 2. House type match
       */
      if (
        alert.house_type &&
        alert.house_type !== 'All'
      ) {
        const alertType =
          String(alert.house_type)
            .toLowerCase()
            .trim();

        const houseType =
          String(house.type || '')
            .toLowerCase()
            .trim();

        if (alertType !== houseType) {
          continue;
        }
      }

      /**
       * 3. Minimum rooms match
       */
      if (
        alert.min_rooms &&
        Number(alert.min_rooms) > 0 &&
        Number(house.rooms) <
          Number(alert.min_rooms)
      ) {
        continue;
      }

      /**
       * 4. Location keyword match
       */
      if (
        alert.location_keyword &&
        alert.location_keyword.trim() !== ''
      ) {
        const kw =
          alert.location_keyword
            .toLowerCase()
            .trim();

        const searchFields = [
          house.title,
          house.city,
          house.sub_city,
          house.address,
          house.description,
          house.type,
        ]
          .filter(Boolean)
          .map((value) =>
            String(value).toLowerCase()
          );

        const isMatch =
          searchFields.some((field) =>
            field.includes(kw)
          );

        if (!isMatch) {
          continue;
        }
      }

      /**
       * MATCH FOUND
       */
      const recipientEmail =
        alert.notification_email ||
        alert.user_email;

      if (!recipientEmail) {
        console.warn(
          `[ALERT SERVICE] No email for alert #${alert.id}`
        );

        continue;
      }

      const subject =
        `[እንጅባራ ቤት ኪራይ] ` +
        `አዲስ የሚስማማዎት ቤት ` +
        `ተመዝግቧል! - ${house.title}`;

      /**
       * Generate HTML with the CORRECT house ID.
       */
      const emailHtml =
        generatePropertyEmailHTML(
          house,
          {
            name: alert.user_name,
            email: recipientEmail,
          }
        );

      /**
       * 1. Insert system notification
       */
      const notifTitle =
        'አዲስ የሚስማማዎት ቤት ተፖስቷል! 🏠';

      const notifMsg =
        `ከእርስዎ የፍለጋ መስፈርት ጋር ` +
        `የሚስማማ አዲስ ቤት ተመዝግቧል፡ ` +
        `"${house.title}" ` +
        `(ETB ${Number(
          house.price
        ).toLocaleString()}/ወር)`;

      await pool.query(
        `
          INSERT INTO notifications
          (
            user_id,
            title,
            message
          )
          VALUES (?, ?, ?)
        `,
        [
          alert.user_id,
          notifTitle,
          notifMsg,
        ]
      );

      /**
       * 2. Store email in email_logs.
       */
      await pool.query(
        `
          INSERT INTO email_logs
          (
            user_id,
            recipient_email,
            subject,
            body_html,
            house_id,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          alert.user_id,
          recipientEmail,
          subject,
          emailHtml,
          house.house_id,
          'Delivered',
        ]
      );

      /**
       * 3. Send SMS notification.
       */
      if (alert.user_phone) {

        const cleanPhone =
          String(alert.user_phone).trim();

        if (cleanPhone) {

          const smsMsg =
            `Selam ${
              alert.user_name || 'Tenant'
            }! ` +
            `A new matching rental is available: ` +
            `"${house.title}" in ${
              house.city
            } for ETB ${
              Number(
                house.price
              ).toLocaleString()
            }/month. ` +
            `- Amhara House Rentals`;

          try {

            await sendSMS(
              cleanPhone,
              smsMsg
            );

          } catch (smsErr) {

            console.warn(
              `[ALERT SERVICE] SMS sending failed ` +
              `to ${cleanPhone}:`,
              smsErr.message
            );
          }
        }
      }

      sentCount++;
    }

    console.log(
      `[ALERT SERVICE] Processed new house #${houseId}. ` +
      `Automated notifications sent to ` +
      `${sentCount} matching tenants.`
    );

    return {
      sentCount,
    };

  } catch (err) {

    console.error(
      '[ALERT SERVICE] Error triggering property alerts:',
      err
    );

    return {
      sentCount: 0,
      error: err.message,
    };
  }
}

