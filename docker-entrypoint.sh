#!/bin/sh

# Exit on any error
set -e

echo "Starting CRM application..."

# Initialize database if it doesn't exist
if [ ! -f "/app/data/production.db" ]; then
    echo "Initializing database..."
    npx prisma db push
    echo "Database initialized successfully"
else
    echo "Database already exists, checking for migrations..."
    npx prisma db push --accept-data-loss
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Starting Next.js application..."
# Start the Next.js application
exec node server.js