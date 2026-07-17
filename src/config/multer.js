const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const storage = multer.diskStorage({
    destination(req, file, cb) {
        const folder =
            req.uploadFolder || "repairs";
        const uploadDir = path.join(
            __dirname,
            "..",
            "uploads",
            folder
        );

        fs.mkdirSync(uploadDir, {
            recursive: true,
        });

        cb(
            null,
            uploadDir
        );
    },

    filename(req, file, cb) {
        const extension =
            path.extname(file.originalname);

        cb(
            null,
            `${uuid()}${extension}`
        );
    },
});

const allowed = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
];

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
    },

    fileFilter(req, file, cb) {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        if (!allowed.includes(extension)) {
            return cb(
                new Error(
                    "Unsupported file type."
                )
            );
        }

        cb(null, true);
    },
});

module.exports = upload;
