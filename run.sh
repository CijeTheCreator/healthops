#!/bin/bash

# Try WiFi first, then Ethernet, then fallback
HOST_IP=$(ipconfig getifaddr en0 2>/dev/null ||
  ipconfig getifaddr en1 2>/dev/null ||
  echo "127.0.0.1")

docker run -it \
  -p 3000:3000 \
  -p 3005:3005 \
  -e HOST_IP="$HOST_IP" \
  legends22/healthops
