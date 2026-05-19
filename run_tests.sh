#!/bin/bash

cd /Users/ryansidomulyo/CMK/regress
mkdir -p logs

TANGGAL=$(date +%Y-%m-%d)
WAKTU=$(date +%H:%M:%S)
LOG_FILE="logs/playwright_${TANGGAL}.log"

echo "Test dimulai: $TANGGAL $WAKTU" >> "$LOG_FILE"

npx playwright test --project=frankco >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  SUBJECT="[CMK QA] ✅ Test Passed - Frank & Co - $TANGGAL"
else
  SUBJECT="[CMK QA] ❌ Test Failed - Frank & Co - $TANGGAL"
fi

cat > /tmp/qa_email.txt << EMAILEOF
From: sidomulyo784@gmail.com
To: sidomulyo784@gmail.com
Subject: $SUBJECT
Content-Type: text/plain; charset=UTF-8

$(cat /tmp/qa_email_body.txt)
EMAILEOF

msmtp sidomulyo784@gmail.com < /tmp/qa_email.txt
echo "Email terkirim" >> "$LOG_FILE"
