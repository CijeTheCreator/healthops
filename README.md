# HealthOps

**Private health intelligence for your household.**

Your family generates health data every day — steps, sleep stages, resting heart rate, blood oxygen — but the dots rarely get connected until something goes wrong. HealthOps fixes that. It pulls data from every family member's Android phone via HealthConnect, syncs it to a home server over local WiFi, and uses an on-device AI model to turn raw signals into structured observations and plain-language health narratives. Everything stays in the house.

---

## How it works

Android phones already aggregate health data from every installed fitness app through [Android HealthConnect](https://health.google/health-connect-android/). HealthOps polls each family member's phone every 15 minutes, syncing delta records to a home server and building a per-person time-series health picture.

The AI pipeline has three stages:

**Signal processing** — Raw HealthConnect records are converted into structured observations (`{signal, observation, time}`), interpreted across a rolling window of the last 30 data points rather than record by record.

**Q&A agent** — Any family member can ask natural-language questions about the data: _"How has Dad's resting heart rate trended this month?"_ or _"Did anyone sleep poorly this week?"_

**Weekly digest** — A report agent assembles a plain-language health narrative for each family member every week.

---

## AI model

HealthOps supports two configurations:

| Mode                    | Model                            | When to use                                                       |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------- |
| Fully private (default) | Gemma 4 E4B (local via Ollama)   | Runs on any laptop from the last 3–4 years. No internet required. |
| Cloud-assisted          | Gemma 4 27B A4B (via Gemini API) | Better quality digests and Q&A. Requires a Gemini API key.        |

You choose at first startup.

---

## Stack

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Android app   | Flutter (HealthConnect API)          |
| Backend       | Node.js + Express, LangChain, LibSQL |
| Web UI        | Next.js 15, Tailwind CSS, shadcn/ui  |
| AI runtime    | Ollama (local) or Google Gemini API  |
| Orchestration | Docker + Supervisor                  |

---

## Getting started

### Server (any computer on your home WiFi)

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/youruser/healthops-mono/main/run.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/youruser/healthops-mono/main/run.ps1 | iex
```

On first run, a setup wizard will ask whether you want fully private local mode or want to provide a Gemini API key. Once running, the server address will be printed in the terminal — you'll need this for the phone app.

The web dashboard is accessible from any device on your network at that address.

### Android app

Download and install the [APK](https://github.com/your-repo/releases). Open it and enter three things:

1. Your name
2. Your WiFi network name
3. The server address from the terminal

The phone will start syncing automatically. Repeat for each family member.

---

## Repository structure

```
backend/          # Node.js API server
native-app/       # Flutter Android app
ui/               # Next.js web dashboard
entrypoint.sh     # Container entrypoint
setup_wizard.py   # First-run configuration
supervisord.conf  # Process manager config
run.sh / run.ps1  # One-line start scripts
Dockerfile
```

---

## Requirements

- Docker (server)
- Android phone with HealthConnect support (Android 14+ recommended)
- For local AI: ~8 GB RAM free on the server machine
- For cloud AI: a [Gemini API key](https://aistudio.google.com/)
