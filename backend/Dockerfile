# 1. Use Node.js LTS as base
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json first (better caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --legacy-peer-deps

# 5. Copy the rest of the code
COPY . .

# 6. Build TypeScript
RUN npm run build

# 7. Expose backend port
EXPOSE 5050

# 8. Start the app
CMD ["node", "dist/index.js"]
