const required = [
    "DATABASE_URL",
    "JWT_SECRET",
];

const missing = required.filter(
    (key) => !process.env[key]
);

if (missing.length) {
    console.error(
        "Missing environment variables:"
    );

    missing.forEach((key) =>
        console.error(` - ${key}`)
    );

    process.exit(1);
}