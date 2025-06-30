# 🗺️ Alive URL Scan - Roadmap

> **My journey building an AI-powered cybersecurity tool**

This is where I share what I've built so far in v1.0 and what I'm planning to add next. It's a personal project for my portfolio, but I hope it helps other cybersecurity folks automate their URL analysis workflows.

---

## ✅ Version 1.0 (Current MVP)

### 🎯 **AI Analysis Engine**
- ✅ **Google Gemini Integration** - LLM does the heavy lifting for threat detection
- ✅ **Automated Screenshots** - Playwright grabs visual evidence automatically
- ✅ **Smart Parsing** - Consistent JSON outputs that actually work with other tools
- ✅ **Security Prompts** - Tuned prompts that focus on finding the bad stuff

### 🔄 **Workflow Automation**
- ✅ **n8n Visual Workflows** - 5 workflows that handle the entire URL processing pipeline
- ✅ **Queue Processing** - Redis handles scaling when you throw lots of URLs at it
- ✅ **Error Handling** - Things break, but the system recovers gracefully

### 🗄️ **Data Management**
- ✅ **PostgreSQL Backend** - Solid database
- ✅ **Supabase Integration** - Real-time updates and easy API access
- ✅ **Screenshot Storage** - Organized file storage that doesn't eat your disk space
- ✅ **Export Options** - Get your data out in CSV, JSON, or plain text

### 📊 **User Interface**
- ✅ **Web Dashboard** - HTML, CSS, JS page to see the results in real-time as scans complete
- ✅ **Filtering** - Find what you need with status codes, dates, scan states
- ✅ **Search & Sort** - Actually useful search that works across all data
- ✅ **Bulk Operations** - Select multiple URLs, delete, export - the works

### 🐳 **Easy Deployment**
- ✅ **One-Command Setup** - `docker compose up -d` and you're running
- ✅ **Container Architecture** - Each service in its own container, scales independently
- ✅ **Health Checks** - Services monitor themselves and restart when needed
- ✅ **Environment Config** - Just edit a `.env` file, no complex configs

### 📥 **URL Ingestion**
- ✅ **File Upload** - Drop in .txt, .csv, .json, .html, .xml raw files
- ✅ **Smart URL Extraction** - Finds URLs even in messy file formats
- ✅ **Duplicate Detection** - Won't scan the same URL twice
- ✅ **Source Tracking** - Know where each URL came from

---

## 🚀 What I Want to Build Next

### 🧠 **Better AI Stuff**
- 🔄 **Multiple AI Models** - Add OpenAI, Claude, maybe some local models
- 🔄 **Vector Database** - Semantic search so you can find similar threats
- 🔄 **Chat Interface** - Ask questions about your scan results in plain English
- 🔄 **Custom Training** - Fine-tune models for specific types of threats

### 🔗 **More Integrations**
- 🔄 **VirusTotal** - Cross-reference with their threat database
- 🔄 **Shodan** - Check infrastructure and open ports
- 🔄 **WHOIS Data** - Domain registration and ownership info
- 🔄 **SSL Certificate Analysis** - Check cert validity and suspicious patterns
- 🔄 **Favicon Hash Lookup** - Compute favicon hashes to identify related infrastructure
- 🔄 **Tech Stack Detection** - Identify what technologies websites are using (CMS, frameworks, etc.)

### 🎯 **Automation Improvements**
- 🔄 **URL Monitoring** - Re-scan flagged URLs periodically to catch changes
- 🔄 **Scan Types** - Quick scans (status-code only) vs deep analysis modes
- 🔄 **Smart Categories** - Automatically sort URLs by threat type
- 🔄 **Domain Import** - Import domain lists and check if they're actually live websites
- 🔄 **File Size** - Consider increasing to 25-50MB for production use
- 🔄 **Screenshot Cleanup** - Delete associated image files when URLs are deleted (currently only database records are removed)

### 🔔 **Notifications**
- 🔄 **Discord Alerts** - Get pinged when high-risk URLs are found
- 🔄 **Email Reports** - Regular summaries of what's been scanned

### 📱 **Better User Experience**
- 🔄 **Next.js Frontend** - Proper modern web interface ("vibe coded")
- 🔄 **Caching** - Improve caching state management for faster UI updates
- 🔄 **Takedown Tools** - Integration with registrar APIs for abuse reporting

---

<div align="center">

**⭐ Star this repo if you find it useful!**

[💡 Suggest Features](https://github.com/brunosergi/alive-url-scan/issues) • [🤝 Contribute Code](https://github.com/brunosergi/alive-url-scan/pulls) • [💬 Discuss Ideas](https://github.com/brunosergi/alive-url-scan/discussions)

Just a guy building tools for the cybersecurity community 🛡️

</div>