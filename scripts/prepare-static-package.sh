#!/usr/bin/env sh
set -eu

BUILD_DIR="./build"

cat > "$BUILD_DIR/START-LOCAL.command" <<'EOF'
#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
PORT=4173
URL="http://localhost:$PORT"
if command -v open >/dev/null 2>&1; then
	open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
	xdg-open "$URL"
fi
python3 -m http.server "$PORT"
EOF
chmod +x "$BUILD_DIR/START-LOCAL.command"

cat > "$BUILD_DIR/start-local.bat" <<'EOF'
@echo off
set PORT=4173
start http://localhost:%PORT%
py -m http.server %PORT%
EOF

cat > "$BUILD_DIR/HOW-TO-RUN.txt" <<'EOF'
This package must be served over HTTP for full interactivity (sliders, filters, etc.).

macOS/Linux:
- Double-click START-LOCAL.command

Windows:
- Double-click start-local.bat

Or manually run inside this folder:
- python3 -m http.server 4173
Then open:
- http://localhost:4173
EOF
