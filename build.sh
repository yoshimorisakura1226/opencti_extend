#!/bin/bash

# 定義變數，方便未來修改版本號或名稱
IMAGE_NAME="opencti-extend-tool"
TAG="latest"
FILE_NAME="${IMAGE_NAME}.tar"

if [ -f "$FILE_NAME" ]; then
    echo "🧹 清除舊的 tar 檔..."
    sudo rm "$FILE_NAME"
fi

echo "🚀 開始打包 Docker 映像檔: ${IMAGE_NAME}:${TAG}..."
sudo docker build -t ${IMAGE_NAME}:${TAG} .

echo "📦 正在匯出成 ${FILE_NAME}..."
sudo docker save ${IMAGE_NAME}:${TAG} -o ${FILE_NAME}

sudo chmod 644 ${FILE_NAME}

echo "✅ 完成！檔案已儲存為: ${FILE_NAME}"

echo "🧽 清理無用的暫存映像檔..."
sudo docker image prune -f