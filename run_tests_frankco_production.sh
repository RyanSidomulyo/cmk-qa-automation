#!/bin/bash

cd /Users/ryansidomulyo/CMK/regress
mkdir -p logs

TANGGAL=$(date "+%A, %d %B %Y")
WAKTU=$(date "+%H.%M.%S")
LOG_FILE="logs/playwright_production_$(date +%Y-%m-%d).log"

echo "=============================" >> "$LOG_FILE"
echo "Environment : PRODUCTION" >> "$LOG_FILE"
echo "Waktu run   : $TANGGAL $WAKTU" >> "$LOG_FILE"
echo "=============================" >> "$LOG_FILE"

TEST_ENV=production npx playwright test --project=frankco >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  SUBJECT="[CMK QA PRODUCTION] ✅ Test Passed - Frank & Co - $TANGGAL $WAKTU"
else
  SUBJECT="[CMK QA PRODUCTION] ❌ Test Failed - Frank & Co - $TANGGAL $WAKTU"
fi

cat > /tmp/qa_prod_email.txt << EMAILEOF
From: sidomulyo784@gmail.com
To: sidomulyo784@gmail.com
Subject: $SUBJECT
Content-Type: text/plain; charset=UTF-8

$(cat /tmp/qa_email_body.txt 2>/dev/null || echo "Report tidak tersedia")
EMAILEOF

msmtp sidomulyo784@gmail.com < /tmp/qa_prod_email.txt
echo "Email terkirim — $WAKTU" >> "$LOG_FILE"
