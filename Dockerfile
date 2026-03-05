# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json first (for caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (the port your app runs on)
EXPOSE 5000

# Start the app
CMD ["node", "server.js"]