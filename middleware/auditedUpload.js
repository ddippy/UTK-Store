const ActivityLog = require("../models/activityLog.model");
const fs = require("fs/promises");
const path = require("path");

const imageTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
};

const detectImageType = async (filePath) => {
    const file = await fs.open(filePath, "r");
    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
        if (bytesRead >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            return "image/jpeg";
        }
        if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
            return "image/png";
        }
        if (
            bytesRead >= 12 &&
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
        ) {
            return "image/webp";
        }
        return null;
    } finally {
        await file.close();
    }
};

const uploadErrorMessage = (error) => {
    if (error.code === "LIMIT_FILE_SIZE") return "ไฟล์มีขนาดเกิน 2 MB";
    return "อัปโหลดไม่สำเร็จ กรุณาใช้ไฟล์ JPG, PNG หรือ WEBP";
};

module.exports = (upload, fieldName, resourceType) => (req, res, next) => {
    upload.single(fieldName)(req, res, async (error) => {
        if (error) {
            await ActivityLog.record(req, {
                eventType: "file.upload",
                resourceType,
                resourceId: req.params.id || null,
                outcome: "denied",
                details: { reason: error.code || "unsupported_file_type" },
            });
            return res.status(400).send(uploadErrorMessage(error));
        }

        if (!req.file) return next();

        let detectedType = null;
        try {
            detectedType = await detectImageType(req.file.path);
        } catch {
            // The file must be readable before it can be trusted or linked to a record.
        }

        const extension = path.extname(req.file.originalname).toLowerCase();
        const typeMatches = detectedType && imageTypes[detectedType]?.includes(extension);
        if (typeMatches) {
            req.file.detectedMimeType = detectedType;
            req.fileMetadataSaved = false;
            res.once("finish", async () => {
                if (res.statusCode < 400 || req.fileMetadataSaved || req.fileDiscarded) return;

                try {
                    await fs.unlink(req.file.path);
                    req.fileDiscarded = true;
                    await ActivityLog.record(req, {
                        eventType: "file.delete",
                        resourceType,
                        resourceId: req.file.filename,
                        details: { reason: "upload_operation_failed_cleanup" },
                    });
                } catch (cleanupError) {
                    if (cleanupError.code === "ENOENT") return;
                    await ActivityLog.record(req, {
                        eventType: "file.delete",
                        resourceType,
                        resourceId: req.file.filename,
                        outcome: "failure",
                        details: { reason: "upload_operation_failed_cleanup" },
                    });
                }
            });
            return next();
        }

        await ActivityLog.record(req, {
            eventType: "file.upload",
            resourceType,
            resourceId: req.params.id || null,
            outcome: "denied",
            details: {
                reason: "file_content_does_not_match_allowed_type",
                claimedMimeType: req.file.mimetype,
                detectedMimeType: detectedType,
                originalFilename: req.file.originalname.replace(/[\\/]/g, "_").slice(0, 255),
            },
        });

        try {
            await fs.unlink(req.file.path);
            req.fileDiscarded = true;
            await ActivityLog.record(req, {
                eventType: "file.delete",
                resourceType,
                resourceId: req.params.id || req.file.filename,
                details: { reason: "rejected_upload_cleanup" },
            });
        } catch {
            await ActivityLog.record(req, {
                eventType: "file.delete",
                resourceType,
                resourceId: req.params.id || req.file.filename,
                outcome: "failure",
                details: { reason: "rejected_upload_cleanup_failed" },
            });
        }

        return res.status(400).send("ไฟล์ไม่ตรงกับชนิด JPG, PNG หรือ WEBP ที่อนุญาต");
    });
};
