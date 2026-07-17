function gracefulShutdown(server) {
    const shutdown = () => {
        console.log(
            "\nGracefully shutting down..."
        );

        server.close(() => {
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

module.exports = gracefulShutdown;