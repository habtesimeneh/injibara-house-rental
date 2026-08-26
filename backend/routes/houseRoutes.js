import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { validateAmharaRegion } from "../middleware/regionMiddleware.js";
import { securityAuditLog } from "../middleware/securityMiddleware.js";
import { getPool } from "../../database/db.js";

import {
  getHouses,
  getMyHouses,
  getHouseAnalytics,
  getHouseById,
  createHouse,
  updateHouse,
  deleteHouse
} from "../controllers/houseController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Upload Configuration
|--------------------------------------------------------------------------
*/

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

const ALLOWED_RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const MIME_TO_EXT_MAP = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "application/pdf": [".pdf"]
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const allowedExtensions = MIME_TO_EXT_MAP[file.mimetype] || [".bin"];
    const safeExtension = allowedExtensions[0];

    const safeName =
      `${file.fieldname}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExtension}`;

    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const { fieldname, mimetype } = file;
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = MIME_TO_EXT_MAP[mimetype];
  if (!allowedExtensions || !allowedExtensions.includes(ext)) {
    return cb(new Error("File extension and MIME type mismatch. Only standard formats are allowed."));
  }

  if (fieldname === "image") {
    if (ALLOWED_IMAGE_TYPES.has(mimetype)) {
      return cb(null, true);
    }

    return cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image")
    );
  }

  if (fieldname === "video") {
    if (ALLOWED_VIDEO_TYPES.has(mimetype)) {
      return cb(null, true);
    }

    return cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "video")
    );
  }

  if (fieldname === "receipt") {
    if (ALLOWED_RECEIPT_TYPES.has(mimetype)) {
      return cb(null, true);
    }

    return cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "receipt")
    );
  }

  return cb(
    new multer.MulterError("LIMIT_UNEXPECTED_FILE", fieldname)
  );
};

const upload = multer({
  storage,

  limits: {
    files: 12,

    fileSize: 10 * 1024 * 1024
  },

  fileFilter
});

const cpUpload = upload.fields([
  {
    name: "image",
    maxCount: 1
  },
  {
    name: "video",
    maxCount: 1
  },
  {
    name: "receipt",
    maxCount: 1
  }
]);

const multiImageUpload = upload.array("images", 10);

const singleVideoUpload = upload.single("video");

const singleImageUpload = upload.single("image");

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get available houses
router.get("/", getHouses);

// Get single public house
router.get("/:id", getHouseById);

/*
|--------------------------------------------------------------------------
| Protected Landlord/Admin Routes
|--------------------------------------------------------------------------
*/

// My houses
router.get(
  "/my-houses",
  protect,
  authorize("Landlord", "Admin"),
  getMyHouses
);

// House analytics
router.get(
  "/analytics",
  protect,
  authorize("Landlord", "Admin"),
  getHouseAnalytics
);

// Create house
router.post(
  "/",
  protect,
  authorize("Landlord", "Admin"),
  cpUpload,
  validateAmharaRegion,
  createHouse
);

// Update house
router.put(
  "/:id",
  protect,
  authorize("Landlord", "Admin"),
  cpUpload,
  updateHouse
);

// Delete house
router.delete(
  "/:id",
  protect,
  authorize("Landlord", "Admin"),
  deleteHouse
);

/*
|--------------------------------------------------------------------------
| House Media Routes
|--------------------------------------------------------------------------
*/

// Get house images
router.get(
  "/:houseId/images",
  protect,
  authorize("Landlord", "Admin"),
  async (req, res) => {
    try {
      const pool = getPool();
      const houseId = Number(req.params.houseId);
      if (!Number.isInteger(houseId) || houseId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid house ID" });
      }
      const [images] = await pool.query(
        `SELECT image_id, house_id, image_url, caption, is_primary, display_order, created_at
         FROM house_images
         WHERE house_id = ?
         ORDER BY display_order ASC, image_id ASC`,
        [houseId]
      );
      return res.json({ success: true, data: images || [] });
    } catch (error) {
      console.error("Get house images error:", error);
      return res.status(500).json({ success: false, error: "Unable to load images" });
    }
  }
);

// Add house images
router.post(
  "/:houseId/images",
  protect,
  authorize("Landlord", "Admin"),
  multiImageUpload,
  async (req, res) => {
    try {
      const pool = getPool();
      const houseId = Number(req.params.houseId);
      if (!Number.isInteger(houseId) || houseId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid house ID" });
      }
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ success: false, error: "No images uploaded" });
      }
      const [ownerCheck] = await pool.query(
        `SELECT owner_id FROM houses WHERE house_id = ? LIMIT 1`,
        [houseId]
      );
      if (ownerCheck.length === 0) {
        return res.status(404).json({ success: false, error: "Property not found" });
      }
      const houseOwnerId = Number(ownerCheck[0].owner_id);
      if (String(req.user.role).toLowerCase() !== "admin" && houseOwnerId !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not authorized to modify this property" });
      }
      const [existingImages] = await pool.query(
        `SELECT COUNT(*) as cnt FROM house_images WHERE house_id = ?`,
        [houseId]
      );
      const currentCount = Number(existingImages[0]?.cnt || 0);
      if (currentCount + files.length > 20) {
        return res.status(400).json({ success: false, error: "Maximum 20 images per property allowed" });
      }
      const [maxOrder] = await pool.query(
        `SELECT MAX(display_order) as max_order FROM house_images WHERE house_id = ?`,
        [houseId]
      );
      let nextOrder = Number(maxOrder[0]?.max_order || -1) + 1;
      const inserted = [];
      for (const file of files) {
        const imageUrl = `/uploads/${file.filename}`;
        const isPrimary = currentCount === 0 && inserted.length === 0 ? 1 : 0;
        const [result] = await pool.query(
          `INSERT INTO house_images (house_id, image_url, is_primary, display_order, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [houseId, imageUrl, isPrimary, nextOrder++]
        );
        inserted.push({ image_id: result.insertId, house_id: houseId, image_url: imageUrl, is_primary: isPrimary, display_order: nextOrder - 1 });
      }
      await securityAuditLog(req, "HOUSE_IMAGES_ADDED", { houseId, count: inserted.length });
      return res.status(201).json({ success: true, data: inserted });
    } catch (error) {
      console.error("Add house images error:", error);
      return res.status(500).json({ success: false, error: "Unable to upload images" });
    }
  }
);

// Update house image (reorder, set primary, caption)
router.put(
  "/images/:imageId",
  protect,
  authorize("Landlord", "Admin"),
  async (req, res) => {
    try {
      const pool = getPool();
      const imageId = Number(req.params.imageId);
      const houseId = Number(req.params.houseId || req.body.house_id);
      if (!Number.isInteger(imageId) || imageId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid image ID" });
      }
      const [imgCheck] = await pool.query(
        `SELECT hi.*, h.owner_id FROM house_images hi JOIN houses h ON hi.house_id = h.house_id WHERE hi.image_id = ? LIMIT 1`,
        [imageId]
      );
      if (imgCheck.length === 0) {
        return res.status(404).json({ success: false, error: "Image not found" });
      }
      const img = imgCheck[0];
      if (String(req.user.role).toLowerCase() !== "admin" && Number(img.owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const { is_primary, display_order, caption } = req.body;
      const updates = [];
      const params = [];
      if (is_primary !== undefined) {
        updates.push("is_primary = ?");
        params.push(is_primary ? 1 : 0);
      }
      if (display_order !== undefined) {
        updates.push("display_order = ?");
        params.push(Number(display_order));
      }
      if (caption !== undefined) {
        updates.push("caption = ?");
        params.push(String(caption).trim());
      }
      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: "No updates provided" });
      }
      params.push(imageId);
      await pool.query(
        `UPDATE house_images SET ${updates.join(", ")} WHERE image_id = ?`,
        params
      );
      await securityAuditLog(req, "HOUSE_IMAGE_UPDATED", { imageId, houseId: img.house_id });
      return res.json({ success: true, message: "Image updated" });
    } catch (error) {
      console.error("Update house image error:", error);
      return res.status(500).json({ success: false, error: "Unable to update image" });
    }
  }
);

// Delete house image
router.delete(
  "/images/:imageId",
  protect,
  authorize("Landlord", "Admin"),
  async (req, res) => {
    try {
      const pool = getPool();
      const imageId = Number(req.params.imageId);
      if (!Number.isInteger(imageId) || imageId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid image ID" });
      }
      const [imgCheck] = await pool.query(
        `SELECT hi.*, h.owner_id FROM house_images hi JOIN houses h ON hi.house_id = h.house_id WHERE hi.image_id = ? LIMIT 1`,
        [imageId]
      );
      if (imgCheck.length === 0) {
        return res.status(404).json({ success: false, error: "Image not found" });
      }
      const img = imgCheck[0];
      if (String(req.user.role).toLowerCase() !== "admin" && Number(img.owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const houseId = img.house_id;
      await pool.query(`DELETE FROM house_images WHERE image_id = ?`, [imageId]);
      const [remaining] = await pool.query(
        `SELECT COUNT(*) as cnt FROM house_images WHERE house_id = ? AND is_primary = 1`,
        [houseId]
      );
      if (Number(remaining[0]?.cnt || 0) === 0) {
        const [firstImg] = await pool.query(
          `SELECT image_id FROM house_images WHERE house_id = ? ORDER BY display_order ASC, image_id ASC LIMIT 1`,
          [houseId]
        );
        if (firstImg.length > 0) {
          await pool.query(`UPDATE house_images SET is_primary = 1 WHERE image_id = ?`, [firstImg[0].image_id]);
        }
      }
      await securityAuditLog(req, "HOUSE_IMAGE_DELETED", { imageId, houseId });
      return res.json({ success: true, message: "Image deleted" });
    } catch (error) {
      console.error("Delete house image error:", error);
      return res.status(500).json({ success: false, error: "Unable to delete image" });
    }
  }
);

// Get house videos
router.get(
  "/:houseId/videos",
  protect,
  authorize("Landlord", "Admin"),
  async (req, res) => {
    try {
      const pool = getPool();
      const houseId = Number(req.params.houseId);
      if (!Number.isInteger(houseId) || houseId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid house ID" });
      }
      const [videos] = await pool.query(
        `SELECT video_id, house_id, video_url, video_type, display_order, is_primary, created_at
         FROM house_videos
         WHERE house_id = ?
         ORDER BY display_order ASC, video_id ASC`,
        [houseId]
      );
      return res.json({ success: true, data: videos || [] });
    } catch (error) {
      console.error("Get house videos error:", error);
      return res.status(500).json({ success: false, error: "Unable to load videos" });
    }
  }
);

// Add house video
router.post(
  "/:houseId/videos",
  protect,
  authorize("Landlord", "Admin"),
  singleVideoUpload,
  async (req, res) => {
    try {
      const pool = getPool();
      const houseId = Number(req.params.houseId);
      if (!Number.isInteger(houseId) || houseId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid house ID" });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No video uploaded" });
      }
      const [ownerCheck] = await pool.query(
        `SELECT owner_id FROM houses WHERE house_id = ? LIMIT 1`,
        [houseId]
      );
      if (ownerCheck.length === 0) {
        return res.status(404).json({ success: false, error: "Property not found" });
      }
      const houseOwnerId = Number(ownerCheck[0].owner_id);
      if (String(req.user.role).toLowerCase() !== "admin" && houseOwnerId !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not authorized to modify this property" });
      }
      const videoUrl = `/uploads/${req.file.filename}`;
      const [result] = await pool.query(
        `INSERT INTO house_videos (house_id, video_url, video_type, display_order, is_primary, created_at)
         VALUES (?, ?, 'upload', 0, 1, CURRENT_TIMESTAMP)`,
        [houseId, videoUrl]
      );
      await pool.query(`UPDATE house_videos SET is_primary = 0 WHERE house_id = ? AND video_id <> ?`, [houseId, result.insertId]);
      await securityAuditLog(req, "HOUSE_VIDEO_ADDED", { houseId, videoId: result.insertId });
      const [newVideo] = await pool.query(
        `SELECT video_id, house_id, video_url, video_type, display_order, is_primary, created_at
         FROM house_videos WHERE video_id = ? LIMIT 1`,
        [result.insertId]
      );
      return res.status(201).json({ success: true, data: newVideo[0] });
    } catch (error) {
      console.error("Add house video error:", error);
      return res.status(500).json({ success: false, error: "Unable to upload video" });
    }
  }
);

// Delete house video
router.delete(
  "/videos/:videoId",
  protect,
  authorize("Landlord", "Admin"),
  async (req, res) => {
    try {
      const pool = getPool();
      const videoId = Number(req.params.videoId);
      if (!Number.isInteger(videoId) || videoId <= 0) {
        return res.status(400).json({ success: false, error: "Invalid video ID" });
      }
      const [videoCheck] = await pool.query(
        `SELECT hv.*, h.owner_id FROM house_videos hv JOIN houses h ON hv.house_id = h.house_id WHERE hv.video_id = ? LIMIT 1`,
        [videoId]
      );
      if (videoCheck.length === 0) {
        return res.status(404).json({ success: false, error: "Video not found" });
      }
      const video = videoCheck[0];
      if (String(req.user.role).toLowerCase() !== "admin" && Number(video.owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await pool.query(`DELETE FROM house_videos WHERE video_id = ?`, [videoId]);
      await securityAuditLog(req, "HOUSE_VIDEO_DELETED", { videoId, houseId: video.house_id });
      return res.json({ success: true, message: "Video deleted" });
    } catch (error) {
      console.error("Delete house video error:", error);
      return res.status(500).json({ success: false, error: "Unable to delete video" });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Multer Error Handler
|--------------------------------------------------------------------------
*/

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Uploaded file is too large. Maximum size is 10MB."
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error:
          "Invalid file type. Please upload a supported image, video or receipt."
      });
    }

    return res.status(400).json({
      success: false,
      error: "Invalid file upload."
    });
  }

  if (error) {
    console.error("House upload error:", error);

    return res.status(400).json({
      success: false,
      error: error.message || "File upload failed."
    });
  }

  next();
});

export default router;
