# Using a lightweight Node image to keep it fast and small
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code (including the 'ai' folder)
COPY . /src

# Expose the port your app runs on (usually 3000 or 8080)
EXPOSE 8080

# Command to run the app
CMD [ "node", "server.js" ] 
