# 階段 1: 建立前端
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 階段 2: 建立後端
FROM node:20-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
# 執行 TypeScript 編譯 (已修正語法，移除註解干擾)
RUN npx tsc src/index.ts --outDir dist --target esnext --module nodenext --esModuleInterop --skipLibCheck --allowJs --checkJs false --noImplicitAny false

# 階段 3: 最終運行環境
FROM node:20-slim
WORKDIR /app/backend

# 複製編譯後的檔案
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/dist ./dist/frontend

# 關鍵點：建立一個軟連結，讓程式找不到時會自動連到這
RUN mkdir -p /app/frontend && ln -s /app/backend/dist/frontend /app/frontend/dist

EXPOSE 8081
CMD ["node", "dist/index.js"]