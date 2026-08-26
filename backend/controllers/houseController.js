import NodeCache from "node-cache";

import { getPool } from "../../database/db.js";
import { triggerPropertyAlerts } from "../services/alertService.js";
import { securityAuditLog } from "../middleware/securityMiddleware.js";

/*
|--------------------------------------------------------------------------
| Cache
|--------------------------------------------------------------------------
*/

const houseCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: true
});

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const toPositiveNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
};

const toPositiveInteger = (value, fallback = 0) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return fallback;
  }

  return number;
};

const isAdmin = (req) => {
  return (
    String(req.user?.role || "")
      .trim()
      .toLowerCase() === "admin"
  );
};

const isLandlord = (req) => {
  return (
    String(req.user?.role || "")
      .trim()
      .toLowerCase() === "landlord"
  );
};

const getFileUrl = (file) => {
  if (!file) {
    return "";
  }

  return `/uploads/${file.filename}`;
};

const clearHouseCache = () => {
  houseCache.flushAll();
};

export { clearHouseCache };

const validateOwner = async (pool, ownerId) => {
  if (!ownerId) return false;
  const [owners] = await pool.query(
    `SELECT user_id, role FROM users WHERE user_id = ? LIMIT 1`,
    [ownerId]
  );
  return owners.length > 0 && String(owners[0].role).trim().toLowerCase() === 'landlord';
};

/*
|--------------------------------------------------------------------------
| GET HOUSES
| Public
|--------------------------------------------------------------------------
*/

export const getHouses = async (req, res) => {
  try {
    const {
      region,
      city,
      maxPrice,
      minPrice,
      type,
      rooms,
      sub_city,
      q
    } = req.query;

    const normalizedQuery = {
      region: cleanString(region),
      city: cleanString(city),
      maxPrice: cleanString(maxPrice),
      minPrice: cleanString(minPrice),
      type: cleanString(type),
      rooms: cleanString(rooms),
      sub_city: cleanString(sub_city),
      q: cleanString(q)
    };

    const cacheKey = `houses:${JSON.stringify(normalizedQuery)}`;

    const cachedData = houseCache.get(cacheKey);

    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const pool = getPool();

    let query = `
      SELECT
        h.house_id,
        h.title,
        h.description,
        h.type,
        h.region,
        h.city,
        h.sub_city,
        h.address,
        h.price,
        h.rooms,
        h.bathrooms,
        h.square_meter,
        h.image_url,
        h.video_url,
        h.status,
        h.created_at,
        h.rented_at,
        u.user_id AS owner_id,
        u.name AS owner_name
      FROM houses h
      INNER JOIN users u
        ON h.owner_id = u.user_id
      WHERE h.status = 'Available'
    `;

    const params = [];

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    if (normalizedQuery.region) {
      query += " AND h.region = ?";
      params.push(normalizedQuery.region);
    }

    if (normalizedQuery.city) {
      query += " AND h.city = ?";
      params.push(normalizedQuery.city);
    }

    if (normalizedQuery.type) {
      query += " AND h.type = ?";
      params.push(normalizedQuery.type);
    }

    if (normalizedQuery.maxPrice) {
      const max = toPositiveNumber(normalizedQuery.maxPrice);

      if (max !== null) {
        query += " AND h.price <= ?";
        params.push(max);
      }
    }

    if (normalizedQuery.minPrice) {
      const min = toPositiveNumber(normalizedQuery.minPrice);

      if (min !== null) {
        query += " AND h.price >= ?";
        params.push(min);
      }
    }

    if (normalizedQuery.rooms) {
      const roomCount = toPositiveInteger(
        normalizedQuery.rooms
      );

      query += " AND h.rooms >= ?";
      params.push(roomCount);
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const searchTerm =
      normalizedQuery.sub_city ||
      normalizedQuery.q;

    if (searchTerm) {
      const pattern = `%${searchTerm}%`;

      query += `
        AND (
          h.sub_city LIKE ?
          OR h.address LIKE ?
          OR h.city LIKE ?
          OR h.title LIKE ?
        )
      `;

      params.push(
        pattern,
        pattern,
        pattern,
        pattern
      );
    }

    query += `
      ORDER BY h.created_at DESC
    `;

    const [houses] = await pool.query(
      query,
      params
    );

    houseCache.set(
      cacheKey,
      houses
    );

    return res.json({
      success: true,
      data: houses,
      cached: false
    });

  } catch (error) {
    console.error(
      "Get houses error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to load properties right now. Please try again."
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET MY HOUSES
|--------------------------------------------------------------------------
*/

export const getMyHouses = async (
  req,
  res
) => {
  try {
    const pool = getPool();

    let query;
    let params = [];

    if (isAdmin(req)) {
      query = `
        SELECT
          house_id,
          owner_id,
          title,
          description,
          type,
          region,
          city,
          sub_city,
          address,
          price,
          rooms,
          bathrooms,
          square_meter,
          image_url,
          video_url,
          status,
          rented_at,
          created_at
        FROM houses
        ORDER BY created_at DESC
      `;
    } else {
      query = `
        SELECT
          house_id,
          owner_id,
          title,
          description,
          type,
          region,
          city,
          sub_city,
          address,
          price,
          rooms,
          bathrooms,
          square_meter,
          image_url,
          video_url,
          status,
          rented_at,
          created_at
        FROM houses
        WHERE owner_id = ?
        ORDER BY created_at DESC
      `;

      params = [req.user.id];
    }

    const [houses] =
      await pool.query(
        query,
        params
      );

    return res.json({
      success: true,
      data: houses
    });

  } catch (error) {
    console.error(
      "Get my houses error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to load your properties."
    });
  }
};

/*
|--------------------------------------------------------------------------
| HOUSE ANALYTICS
|--------------------------------------------------------------------------
*/

export const getHouseAnalytics = async (
  req,
  res
) => {
  try {
    const pool = getPool();

    const ownerId =
      isAdmin(req)
        ? null
        : req.user.id;

    const monthFunc =
      pool.activeEngine === "mysql"
        ? "DATE_FORMAT(created_at, '%Y-%m')"
        : "strftime('%Y-%m', created_at)";

    const rentedMonthFunc =
      pool.activeEngine === "mysql"
        ? "DATE_FORMAT(rented_at, '%Y-%m')"
        : "strftime('%Y-%m', rented_at)";

    let postedQuery = `
      SELECT
        ${monthFunc} AS month,
        COUNT(*) AS count
      FROM houses
    `;

    let rentedQuery = `
      SELECT
        ${rentedMonthFunc} AS month,
        COUNT(*) AS count
      FROM houses
      WHERE status = 'Rented'
        AND rented_at IS NOT NULL
    `;

    const postedParams = [];
    const rentedParams = [];

    if (ownerId) {
      postedQuery += `
        WHERE owner_id = ?
      `;

      rentedQuery += `
        AND owner_id = ?
      `;

      postedParams.push(ownerId);
      rentedParams.push(ownerId);
    }

    postedQuery += `
      GROUP BY month
      ORDER BY month ASC
    `;

    rentedQuery += `
      GROUP BY month
      ORDER BY month ASC
    `;

    const [
      [postedStats],
      [rentedStats]
    ] = await Promise.all([
      pool.query(
        postedQuery,
        postedParams
      ),
      pool.query(
        rentedQuery,
        rentedParams
      )
    ]);

    const allMonths = Array.from(
      new Set([
        ...postedStats.map(
          (item) => item.month
        ),
        ...rentedStats.map(
          (item) => item.month
        )
      ])
    ).sort();

    const performanceData =
      allMonths.map((month) => ({
        month,
        posted:
          Number(
            postedStats.find(
              (item) =>
                item.month === month
            )?.count || 0
          ),

        rented:
          Number(
            rentedStats.find(
              (item) =>
                item.month === month
            )?.count || 0
          )
      }));

    let summaryQuery = `
      SELECT
        status,
        COUNT(*) AS count
      FROM houses
    `;

    const summaryParams = [];

    if (ownerId) {
      summaryQuery += `
        WHERE owner_id = ?
      `;

      summaryParams.push(ownerId);
    }

    summaryQuery += `
      GROUP BY status
    `;

    const [summaryStats] =
      await pool.query(
        summaryQuery,
        summaryParams
      );

    const summary = {
      Available: 0,
      Rented: 0,
      "Pending Approval": 0,
      Rejected: 0
    };

    for (const item of summaryStats) {
      summary[item.status] =
        Number(item.count);
    }

    return res.json({
      success: true,
      data: {
        performanceData,
        summary
      }
    });

  } catch (error) {
    console.error(
      "House analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to load property analytics."
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET HOUSE BY ID
| Public
|--------------------------------------------------------------------------
*/

export const getHouseById = async (
  req,
  res
) => {
  try {
    const houseId =
      Number(req.params.id);

    if (
      !Number.isInteger(houseId) ||
      houseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID."
      });
    }

    const pool = getPool();

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | Do NOT expose landlord phone/email publicly.
    |--------------------------------------------------------------------------
    */

    const [houses] =
      await pool.query(
        `
        SELECT
          h.house_id,
          h.title,
          h.description,
          h.type,
          h.region,
          h.city,
          h.sub_city,
          h.address,
          h.price,
          h.rooms,
          h.bathrooms,
          h.square_meter,
          h.image_url,
          h.video_url,
          h.status,
          h.created_at,
          h.rented_at,
          u.user_id AS owner_id,
          u.name AS owner_name
        FROM houses h
        INNER JOIN users u
          ON h.owner_id = u.user_id
        WHERE h.house_id = ?
        LIMIT 1
        `,
        [houseId]
      );

    if (
      !houses ||
      houses.length === 0
    ) {
      return res.status(404).json({
        success: false,
        error: "Property not found."
      });
    }

    return res.json({
      success: true,
      data: houses[0]
    });

  } catch (error) {
    console.error(
      "Get house by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to load property details."
    });
  }
};

/*
|--------------------------------------------------------------------------
| CREATE HOUSE
|--------------------------------------------------------------------------
*/

export const createHouse = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      type,
      region,
      city,
      sub_city,
      address,
      price,
      rooms,
      bathrooms,
      square_meter,
      payment_method,
      transaction_ref
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate required fields
    |--------------------------------------------------------------------------
    */

    const cleanTitle =
      cleanString(title);

    const cleanDescription =
      cleanString(description);

    const cleanType =
      cleanString(type);

    const cleanRegion =
      cleanString(region);

    const cleanCity =
      cleanString(city);

    const cleanSubCity =
      cleanString(sub_city);

    const cleanAddress =
      cleanString(address);

    const propertyPrice =
      toPositiveNumber(price);

    if (
      !cleanTitle ||
      !cleanDescription ||
      !cleanType ||
      !cleanRegion ||
      !cleanCity
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide all required property information."
      });
    }

    if (
      propertyPrice === null ||
      propertyPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Property price must be greater than zero."
      });
    }

    const roomCount =
      toPositiveInteger(
        rooms,
        1
      );

    const bathroomCount =
      toPositiveInteger(
        bathrooms,
        1
      );

    const squareMeter =
      toPositiveNumber(
        square_meter
      );

    /*
    |--------------------------------------------------------------------------
    | Files
    |--------------------------------------------------------------------------
    */

    let imageUrl = "";
    let videoUrl = "";
    let receiptUrl = "";

    if (req.files?.image?.[0]) {
      imageUrl =
        getFileUrl(
          req.files.image[0]
        );
    }

    if (req.files?.video?.[0]) {
      videoUrl =
        getFileUrl(
          req.files.video[0]
        );
    }

    if (req.files?.receipt?.[0]) {
      receiptUrl =
        getFileUrl(
          req.files.receipt[0]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Multiple Images
    |--------------------------------------------------------------------------
    */

    const additionalImageUrls = [];
    if (req.files?.images && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        additionalImageUrls.push(getFileUrl(file));
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Owner
    |--------------------------------------------------------------------------
    |
    | SECURITY:
    | Landlord can ONLY create property for himself.
    | Admin may specify owner through authenticated backend logic.
    |--------------------------------------------------------------------------
    */

    let ownerId =
      req.user.id;

    if (isAdmin(req)) {
      const requestedOwnerId =
        Number(req.body.owner_id);

      if (
        Number.isInteger(
          requestedOwnerId
        ) &&
        requestedOwnerId > 0
      ) {
        const isValidOwner = await validateOwner(pool, requestedOwnerId);
        if (!isValidOwner) {
          return res.status(400).json({
            success: false,
            error: "Assigned owner must be a valid Landlord account"
          });
        }
        ownerId =
          requestedOwnerId;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Landlord payment requirement
    |--------------------------------------------------------------------------
    */

    if (isLandlord(req)) {
      const method =
        cleanString(
          payment_method
        );

      const reference =
        cleanString(
          transaction_ref
        );

      if (
        !method ||
        !reference
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Advertisement payment method and transaction reference are required."
        });
      }
    }

    const pool = getPool();

    /*
    |--------------------------------------------------------------------------
    | Property status
    |--------------------------------------------------------------------------
    */

    const propertyStatus =
      isLandlord(req)
        ? "Pending Approval"
        : "Available";

    /*
    |--------------------------------------------------------------------------
    | Insert property
    |--------------------------------------------------------------------------
    */

    const [result] =
      await pool.query(
        `
        INSERT INTO houses
        (
          owner_id,
          title,
          description,
          type,
          region,
          city,
          sub_city,
          address,
          price,
          rooms,
          bathrooms,
          square_meter,
          image_url,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ownerId,
          escapeHtml(cleanTitle),
          escapeHtml(cleanDescription),
          escapeHtml(cleanType),
          escapeHtml(cleanRegion),
          escapeHtml(cleanCity),
          escapeHtml(cleanSubCity),
          escapeHtml(cleanAddress),
          propertyPrice,
          roomCount,
          bathroomCount,
          squareMeter || 0,
          imageUrl,
          propertyStatus
        ]
      );

    if (additionalImageUrls.length > 0) {
      const imageInserts = additionalImageUrls.map((imgUrl, idx) => [
        result.insertId,
        imgUrl,
        idx === 0 && !imageUrl ? 1 : 0,
        idx
      ]);
      for (const [hid, iurl, isPrim, disp] of imageInserts) {
        await pool.query(
          `INSERT INTO house_images (house_id, image_url, is_primary, display_order, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [hid, iurl, isPrim, disp]
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Advertisement payment
    |--------------------------------------------------------------------------
    */

    if (
      isLandlord(req) ||
      (
        cleanString(
          payment_method
        ) &&
        cleanString(
          transaction_ref
        )
      )
    ) {
      const [feeRows] =
        await pool.query(
          `
          SELECT value
          FROM website_settings
          WHERE key_name = 'ad_fee_featured_house'
          LIMIT 1
          `
        );

      const adFee =
        feeRows?.[0]
          ? Number(feeRows[0].value)
          : 500;

      await pool.query(
        `
        INSERT INTO ad_payments
        (
          user_id,
          user_role,
          ad_type,
          house_id,
          amount,
          payment_method,
          transaction_ref,
          receipt_url,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          req.user.id,
          req.user.role,
          "Landlord House Ad",
          result.insertId,
          adFee,
          cleanString(
            payment_method
          ),
          cleanString(
            transaction_ref
          ),
          receiptUrl,
          "Pending"
        ]
      );

      /*
      |--------------------------------------------------------------------------
      | Admin notification
      |--------------------------------------------------------------------------
      |
      | Do NOT assume admin user ID = 1.
      |--------------------------------------------------------------------------
      */

      const [admins] =
        await pool.query(
          `
          SELECT user_id
          FROM users
          WHERE LOWER(role) = 'admin'
          `
        );

      for (const admin of admins) {
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
            admin.user_id,
            "New House Listing Payment",
            `Landlord ${req.user.name} submitted "${cleanTitle}" with payment of ${adFee} ETB via ${cleanString(payment_method)}.`
          ]
        );
      }
    }

    clearHouseCache();

    try {
      await securityAuditLog(req, 'HOUSE_CREATED', {
        houseId: result.insertId,
        ownerId,
        status: propertyStatus
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    /*
    |--------------------------------------------------------------------------
    | Property Alerts
    |--------------------------------------------------------------------------
    */

    if (
      propertyStatus === "Available"
    ) {
      try {
        await triggerPropertyAlerts(
          result.insertId
        );
      } catch (alertError) {
        console.error(
          "Property alert error:",
          alertError
        );
      }
    }

    return res.status(201).json({
      success: true,
      message:
        isLandlord(req)
          ? "Property submitted successfully. It will become visible after admin approval."
          : "Property created successfully.",
      house_id:
        result.insertId,
      status:
        propertyStatus
    });

  } catch (error) {
    console.error(
      "Create house error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to create property. Please try again."
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE HOUSE
|--------------------------------------------------------------------------
*/

export const updateHouse = async (
  req,
  res
) => {
  try {
    const houseId =
      Number(req.params.id);

    if (
      !Number.isInteger(houseId) ||
      houseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID."
      });
    }

    const pool = getPool();

    const [
      existingRows
    ] = await pool.query(
      `
      SELECT
        house_id,
        owner_id,
        title,
        description,
        type,
        region,
        city,
        sub_city,
        address,
        price,
        rooms,
        bathrooms,
        square_meter,
        image_url,
        video_url,
        status,
        rented_at
      FROM houses
      WHERE house_id = ?
      LIMIT 1
      `,
      [houseId]
    );

    if (
      existingRows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        error: "Property not found."
      });
    }

    const existing =
      existingRows[0];

    /*
    |--------------------------------------------------------------------------
    | Ownership
    |--------------------------------------------------------------------------
    */

    if (
      !isAdmin(req) &&
      Number(existing.owner_id) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "You are not authorized to update this property."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Basic fields - partial update support
    |--------------------------------------------------------------------------
    */

    const title = req.body.hasOwnProperty('title') && String(req.body.title).trim()
      ? cleanString(req.body.title)
      : existing.title;

    const description = req.body.hasOwnProperty('description') && String(req.body.description).trim()
      ? cleanString(req.body.description)
      : existing.description;

    const type = req.body.hasOwnProperty('type') && String(req.body.type).trim()
      ? cleanString(req.body.type)
      : existing.type;

    const region = req.body.hasOwnProperty('region') && String(req.body.region).trim()
      ? cleanString(req.body.region)
      : existing.region;

    const city = req.body.hasOwnProperty('city') && String(req.body.city).trim()
      ? cleanString(req.body.city)
      : existing.city;

    const subCity = req.body.hasOwnProperty('sub_city') && String(req.body.sub_city).trim()
      ? cleanString(req.body.sub_city)
      : existing.sub_city;

    const address = req.body.hasOwnProperty('address') && String(req.body.address).trim()
      ? cleanString(req.body.address)
      : existing.address;

    const price = req.body.hasOwnProperty('price') && String(req.body.price).trim()
      ? toPositiveNumber(req.body.price)
      : existing.price;

    const rooms = req.body.hasOwnProperty('rooms') && String(req.body.rooms).trim()
      ? toPositiveInteger(req.body.rooms, 1)
      : existing.rooms;

    const bathrooms = req.body.hasOwnProperty('bathrooms') && String(req.body.bathrooms).trim()
      ? toPositiveInteger(req.body.bathrooms, 1)
      : existing.bathrooms;

    const squareMeter = req.body.hasOwnProperty('square_meter') && String(req.body.square_meter).trim()
      ? toPositiveNumber(req.body.square_meter) || 0
      : existing.square_meter;

    /*
    |--------------------------------------------------------------------------
    | Validate only fields that are being updated with non-empty values
    |--------------------------------------------------------------------------
    */

    const requiredFields = [];
    if (req.body.hasOwnProperty('title') && String(req.body.title).trim() && !title) requiredFields.push('title');
    if (req.body.hasOwnProperty('description') && String(req.body.description).trim() && !description) requiredFields.push('description');
    if (req.body.hasOwnProperty('type') && String(req.body.type).trim() && !type) requiredFields.push('type');
    if (req.body.hasOwnProperty('region') && String(req.body.region).trim() && !region) requiredFields.push('region');
    if (req.body.hasOwnProperty('city') && String(req.body.city).trim() && !city) requiredFields.push('city');

    if (requiredFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Please provide: ${requiredFields.join(', ')}`
      });
    }

    if (req.body.hasOwnProperty('price') && String(req.body.price).trim() && (price === null || price <= 0)) {
      return res.status(400).json({
        success: false,
        error: "Property price must be greater than zero."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | File updates
    |--------------------------------------------------------------------------
    */

    let imageUrl =
      existing.image_url || "";

    let videoUrl =
      existing.video_url || "";

    if (req.files?.image?.[0]) {
      imageUrl =
        getFileUrl(
          req.files.image[0]
        );
    }

    if (req.files?.video?.[0]) {
      videoUrl =
        getFileUrl(
          req.files.video[0]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Multiple Images
    |--------------------------------------------------------------------------
    */

    const additionalImageUrls = [];
    if (req.files?.images && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        additionalImageUrls.push(getFileUrl(file));
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Owner
    |--------------------------------------------------------------------------
    |
    | Only Admin can change owner.
    |--------------------------------------------------------------------------
    */

    let ownerId =
      existing.owner_id;

    if (isAdmin(req)) {
      const requestedOwner =
        Number(
          req.body.owner_id
        );

      if (
        Number.isInteger(
          requestedOwner
        ) &&
        requestedOwner > 0
      ) {
        const isValidOwner = await validateOwner(pool, requestedOwner);
        if (!isValidOwner) {
          return res.status(400).json({
            success: false,
            error: "Assigned owner must be a valid Landlord account"
          });
        }
        ownerId =
          requestedOwner;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    |
    | SECURITY:
    | Landlord cannot approve his own property or mark it Available.
    |--------------------------------------------------------------------------
    */

    let status =
      existing.status;

    if (isAdmin(req)) {
      const requestedStatus =
        cleanString(
          req.body.status
        );

      const allowedStatuses = [
        "Available",
        "Rented",
        "Pending Approval",
        "Rejected"
      ];

      if (
        requestedStatus &&
        allowedStatuses.includes(
          requestedStatus
        )
      ) {
        status =
          requestedStatus;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | rented_at
    |--------------------------------------------------------------------------
    */

    let rentedAt =
      existing.rented_at;

    if (
      status === "Rented" &&
      existing.status !== "Rented"
    ) {
      rentedAt =
        new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
    }

    if (
      status !== "Rented"
    ) {
      rentedAt = null;
    }

    await pool.query(
      `
      UPDATE houses
      SET
        owner_id = ?,
        title = ?,
        description = ?,
        type = ?,
        region = ?,
        city = ?,
        sub_city = ?,
        address = ?,
        price = ?,
        rooms = ?,
        bathrooms = ?,
        square_meter = ?,
        image_url = ?,
        status = ?,
        rented_at = ?
      WHERE house_id = ?
      `,
      [
        ownerId,
        escapeHtml(title),
        escapeHtml(description),
        escapeHtml(type),
        escapeHtml(region),
        escapeHtml(city),
        escapeHtml(subCity),
        escapeHtml(address),
        price,
        rooms,
        bathrooms,
        squareMeter,
        imageUrl,
        status,
        rentedAt,
        houseId
      ]
    );

    if (additionalImageUrls.length > 0) {
      const [maxOrder] = await pool.query(
        `SELECT MAX(display_order) as max_order FROM house_images WHERE house_id = ?`,
        [houseId]
      );
      let nextOrder = Number(maxOrder[0]?.max_order || -1) + 1;
      for (const imgUrl of additionalImageUrls) {
        await pool.query(
          `INSERT INTO house_images (house_id, image_url, is_primary, display_order, created_at)
           VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP)`,
          [houseId, imgUrl, nextOrder++]
        );
      }
    }

    clearHouseCache();

    try {
      await securityAuditLog(req, 'HOUSE_UPDATED', {
        houseId,
        ownerId,
        status
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    /*
    |--------------------------------------------------------------------------
    | Alert only when Admin makes property Available
    |--------------------------------------------------------------------------
    */

    if (
      status === "Available" &&
      existing.status !== "Available"
    ) {
      try {
        await triggerPropertyAlerts(
          houseId
        );
      } catch (alertError) {
        console.error(
          "Property alert error:",
          alertError
        );
      }
    }

    try {
      await securityAuditLog(req, 'HOUSE_UPDATED', {
        houseId,
        ownerId,
        status
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return res.json({
      success: true,
      message:
        "Property updated successfully."
    });

  } catch (error) {
    console.error(
      "Update house error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to update property."
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE HOUSE
|--------------------------------------------------------------------------
*/

export const deleteHouse = async (
  req,
  res
) => {
  try {
    const houseId =
      Number(req.params.id);

    if (
      !Number.isInteger(houseId) ||
      houseId <= 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID."
      });
    }

    const pool = getPool();

    const [
      houses
    ] = await pool.query(
      `
      SELECT
        house_id,
        owner_id,
        status
      FROM houses
      WHERE house_id = ?
      LIMIT 1
      `,
      [houseId]
    );

    if (
      houses.length === 0
    ) {
      return res.status(404).json({
        success: false,
        error:
          "Property not found."
      });
    }

    const house =
      houses[0];

    /*
    |--------------------------------------------------------------------------
    | Ownership
    |--------------------------------------------------------------------------
    */

    if (
      !isAdmin(req) &&
      Number(house.owner_id) !==
        Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "You are not authorized to delete this property."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent dangerous deletion
    |--------------------------------------------------------------------------
    |
    | If rented, only Admin can remove it.
    |--------------------------------------------------------------------------
    */

    if (
      house.status === "Rented" &&
      !isAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "A rented property cannot be deleted by a landlord."
      });
    }

    await pool.query(
      `
      DELETE FROM houses
      WHERE house_id = ?
      `,
      [houseId]
    );

    clearHouseCache();

    try {
      await securityAuditLog(req, 'HOUSE_DELETED', {
        houseId
      });
    } catch (auditError) {
      console.error('Security audit log failed:', auditError);
    }

    return res.json({
      success: true,
      message:
        "Property deleted successfully."
    });

  } catch (error) {
    console.error(
      "Delete house error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to delete property."
    });
  }
};