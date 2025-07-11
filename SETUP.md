# 🚀 Alive URL Scan - Setup Guide

Complete deployment guide from git clone to scanning URLs with AI.

## Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git** for cloning the repository
- **Google Gemini API Key** (free from [Google AI Studio](https://aistudio.google.com/))

---

## 🎯 Quick Deployment

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/alive-url-scan.git
cd alive-url-scan
cp .env.example .env
```

### 2. Edit Environment Variables

Open `.env` and configure these essential variables:

```bash
# Security Keys (generate strong random strings)
N8N_ENCRYPTION_KEY=your-32-character-encryption-key-here
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=
SERVICE_ROLE_KEY=
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated
VAULT_ENC_KEY=your-encryption-key-32-chars-min
```

- Use "[https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys)" for `JWT_SECRET`, `SERVICE_ROLE_KEY` and `ANON_KEY`.


### 3. Launch Platform

```bash
docker compose up -d
```

This automatically:
- Sets up PostgreSQL database with schemas
- Configures Supabase storage bucket
- Imports n8n workflows
- Launches all services

### 4. Verify Services Running

```bash
docker compose ps
```

All services should show "healthy" status.

---

## 🔧 n8n Configuration

### Access n8n Editor

1. Open **http://localhost:5678**
2. Create your admin account
3. Configure credentials (this is the only manual step required)

### Add Supabase Credentials

**Settings** → **Credentials** → **Add New**

**Supabase API Credential:**
- **Name**: `Supabase Local`
- **URL**: `http://host.docker.internal:8000`
- **Service Role Key**: Use `SERVICE_ROLE_KEY` from your `.env` file

### Add Google Gemini Credentials

**Add Google PaLM API Credential:**
- **Name**: `Gemini API`
- **API Key**: Your Google Gemini API key from `.env`

### Update Workflow Credentials

**Important**: Even if nodes don't show errors, manually verify credentials in these workflows:

**url_ingestion:**
- "Add New URLs to Supabase" node
- "Supabase RPC Check Existing URLs" node

**url_dashboard:**
- "Get Supabase Data to Create Table Rows" node

**url_deletion:**
- "Supabase RPC Bulk Delete URLs" node

**url_scanning:**
- "Update as Scan Error" node
- "Update as Status Code Scan Success" node

**url_scanning_playwright:**
- "Google Gemini Chat Model" node (add Gemini credential)
- "Add Screenshot File to Supabase Bucket" node
- "Update as AI Scan Error" node
- "Update as AI Scan Success" node

### Activate Workflows

1. Go to **Workflows** in n8n
2. Click **Activate** toggle for all 5 workflows

---

## 🎉 Start Using the Platform

Access the main interface: **http://localhost:5678/webhook/dashboard**

**Basic Workflow:**
1. **Upload URLs** - Click "Upload URLs" and drop files containing URLs
2. **Select URLs** - Check boxes for URLs you want to analyze  
3. **Watch Live** - Open http://localhost:6080 in another tab to see the browser automation
4. **Scan** - Click "Scan Selected" to trigger AI analysis
5. **Review Results** - See summaries, tags, and screenshots appear in real-time

---

## ☁️ Cloud Supabase Option (Recommended for Production)

The project uses self-hosted Supabase which can consume significant resources. For better performance, use cloud Supabase:

### Setup Cloud Supabase

1. **Create Project**: Sign up at [supabase.com](https://supabase.com)
2. **Get Credentials**: Note your Project URL and anon/service_role keys
3. **Create Database Table**: Run this SQL in Supabase SQL editor:

```sql
-- Copy the table schema from supabase/volumes/db/init/01-init.sql
CREATE TABLE public.url_scan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text UNIQUE NOT NULL,
  domain text,
  tld text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scan_status boolean DEFAULT false,
  status_code integer,
  agent_summary text,
  screenshot_url text,
  source_filename text
);

-- Add the RPC function for bulk operations
CREATE OR REPLACE FUNCTION public.bulk_delete_urls(url_ids uuid[])
RETURNS void AS $$
BEGIN
  DELETE FROM public.url_scan WHERE id = ANY(url_ids);
END;
$$ LANGUAGE plpgsql;
```

4. **Create Storage Bucket**: 
   - Go to Storage → Create bucket → Name: `screenshots`
   - Make it public for screenshot access

### Update Configuration

**In your `.env` file:**
```bash
# Replace with your cloud Supabase values
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**In n8n Supabase credential:**
- **URL**: `https://your-project.supabase.co`
- **Service Role Key**: Your cloud service role key

**Benefits of Cloud Supabase:**
- No local resource usage
- Better performance and reliability
- Automatic backups and scaling
- Real-time dashboard and analytics

---

## 🔄 Changing AI Models

### Switch from Gemini to Other Models

**In url_scanning_playwright workflow:**

**For OpenAI:**
1. Add OpenAI credential in n8n
2. Replace "Google Gemini Chat Model" node with "OpenAI Chat Model"
3. Update credential reference

You can do the same with any other LLM provider like Claude Anthropic, Ollama, DeepSeek, etc.

---

## 🛠️ Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Main Dashboard** | http://localhost:5678/webhook/dashboard | URL analysis interface |
| **n8n Editor** | http://localhost:5678 | Workflow management |
| **Supabase Studio** | http://localhost:3000 | Database management |
| **Playwright MCP** | http://localhost:8831/sse | Web automation service |
| **VNC Browser View** | http://localhost:6080 | Watch browser automation in real-time |
| **VNC Direct** | localhost:5900 | VNC client connection |

---

## 🔧 Troubleshooting

### Common Issues

**Services not starting:**
```bash
docker compose logs -f [service-name]
docker compose restart [service-name]
```

**n8n credential errors:**
- Verify all credentials are saved in n8n UI
- Check service URLs and API keys
- Ensure Supabase bucket exists

**AI analysis failures:**
- Check Google Gemini API quota
- Verify Playwright MCP is accessible
- Test with simple URLs first

### Reset Everything

```bash
# Complete reset (removes all data)
docker compose down -v --remove-orphans
docker compose up -d
```

---

🎉 **You're Ready!** Access **http://localhost:5678/webhook/dashboard** and start analyzing URLs with AI.