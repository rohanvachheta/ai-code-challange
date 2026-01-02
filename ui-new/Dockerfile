# Use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start the development server
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
