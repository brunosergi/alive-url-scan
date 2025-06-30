# ⚙️ Alive URL Scan - Workflows Guide

> **How the n8n workflows actually work behind the scenes**

I built 5 different n8n workflows that handle everything from showing you the dashboard to analyzing URLs with AI. Here's what each one does and how they work together.

---

## 📊 **url_dashboard** - The Main Interface

**What it does**: Web dashboard at `http://localhost:5678/webhook/dashboard` where you see all your URL scan results and interact with the data.

### How It Works
Single-page web app built with n8n's webhook and HTML template nodes:
1. **Webhook Trigger** - Catches your browser request
2. **Database Query** - Grabs all URL scan data from Supabase 
3. **HTML Generation** - Builds webpage using CSS, JavaScript, and HTML nodes

### Dashboard Features
**Data Display**: URL, status code, AI summary, security tags, screenshot thumbnails, dates, source files

**Search & Filter**: 
- Search bar for filtering across all data
- Status filters (200s, 4xx, 5xx errors, DNS errors)
- Sort by URL, status, date, scan status

**Bulk Actions**:
- Select individual or all URLs with checkboxes
- Upload URLs (redirects to file upload)
- Scan selected URLs (triggers AI analysis)
- Delete selected URLs (bulk removal)

**Export Options**: CSV (complete data), JSON (structured), TXT (URLs only)

**Real-time Updates**: Supabase WebSocket for live scan progress and results

---

## 📥 **url_ingestion** - File Upload & URL Import

**What it does**: Upload files containing URLs, extract them with regex, and import only new ones to avoid duplicates.

### How It Works
1. **File Upload** - Form at `/form/upload` handles multiple formats (.txt, .csv, .json, .html, .xml)
2. **URL Extraction** - JavaScript regex finds URLs in any messy format
3. **Duplicate Check** - Queries Supabase to see which URLs already exist
4. **Import New URLs** - Adds only unique URLs to database
5. **Auto-redirect** - Sends you back to dashboard with new URLs ready

### Smart URL Extraction
**Finds**: https/http URLs in any format - embedded in HTML, JSON values, CSV columns, mixed with text

**Filters Out**: Duplicates, invalid URLs, non-HTTP protocols, URLs already in database

```javascript
// Duplicate detection logic
const existingUrls = await supabase
  .from('url_scan')
  .select('url')
  .in('url', extractedUrls);

const newUrls = extractedUrls.filter(url => 
  !existingUrls.some(existing => existing.url === url)
);
```

### What Gets Stored
- **URL**: Cleaned, validated URL
- **Domain & TLD**: Extracted components  
- **Source**: Filename it came from
- **Scan Status**: Initially `false` (ready for scanning)
- **Timestamps**: Created date

**Technical**: Max 5MB files, multiple upload supported, sequential processing

---

## 🗑️ **url_deletion** - Bulk Delete Operations

**What it does**: Simple webhook that receives URL IDs and bulk removes them from database.

### How It Works
1. User selects URLs on dashboard and clicks delete
2. JavaScript sends DELETE request to `/webhook/delete` with ID array
3. n8n workflow calls Supabase RPC function `bulk_delete_urls()`
4. Database removes all selected URLs in single transaction

**What Gets Deleted**: Database records and metadata (summaries, status codes, timestamps)

**Important Note**: Screenshot files in Supabase storage are NOT automatically deleted - they accumulate over time and need manual cleanup (added to roadmap).

---

## 🔍 **url_scanning** - Smart URL Analysis Orchestrator

**What it does**: Receives URLs from dashboard, does quick health checks, and routes to AI analysis or marks as failed.

### The Smart Health Check
Before spending AI tokens, does HTTP HEAD request to test if URL is reachable:

```javascript
HEAD request to URL
├── Any HTTP Response (200, 404, 500, etc.): ✅ Send to AI analysis
└── Timeout/DNS Error: ❌ Mark as failed
```

**Smart Logic**: Even 404/500 pages have content the AI can analyze (error pages, redirects, site structure)

### Processing Flow
1. **Receive Batch** - Gets URL IDs from dashboard via `/webhook/scan`
2. **Split & Loop** - Processes each URL individually to avoid rate limits
3. **Health Check** - Quick HEAD request (1-2 seconds each)
4. **Smart Routing**:
   - **Reachable URLs** → Trigger `url_scanning_playwright` for AI analysis
   - **Unreachable URLs** → Update database with error status immediately

**Database Updates**: Unreachable URLs get marked as scanned with error message. Reachable URLs stay `scan_status: false` until Playwright workflow completes.

---

## 🤖 **url_scanning_playwright** - AI-Powered Deep Analysis

**What it does**: The main feature - AI agent with browser superpowers that analyzes URLs and generates summaries, tags, and screenshots.

### How the AI Agent Works
1. **Browser Navigation** - Uses Playwright MCP to open URL in headless browser
2. **Page Analysis** - AI reads accessibility tree to understand page content
3. **Content Generation** - Creates summary, security assessment, and threat tags
4. **Screenshot Capture** - Takes high-quality screenshot
5. **Storage & Database** - Uploads screenshot to Supabase, saves all results

### What AI Analyzes
**Content Understanding**:
- Page purpose (e-commerce, blog, phishing, etc.)
- Content quality (professional vs suspicious)
- Visual elements (layout, branding, forms)
- Text analysis (language, grammar, suspicious phrases)

**Security Assessment**:
- Phishing indicators (fake login pages, impersonation)
- Malicious patterns (suspicious redirects, hidden content)
- Brand impersonation (fake banking, social media sites)
- Content red flags (urgent language, suspicious offers)

**Generated Tags**: `legitimate`, `suspicious`, `phishing`, `malware`, `scam`, `parked`, etc

### AI Model & Configuration
**Current Setup**: Google Gemini 2.0 Flash (free tier)
**Performance**: 20-60 seconds per URL, ~100-300 URLs per day
**Processing**: Sequential to respect API rate limits

**Alternative Models**: Can easily switch to OpenAI GPT-4o, Anthropic Claude, or self-hosted Ollama

### Technical Architecture
**Playwright MCP**: Isolated Docker container at `playwright-mcp:8831` with headless Chromium

**Screenshot Management**:
- JPEG format with compression
- 500KB max file size
- Stored in Supabase bucket with RLS policies
- Naming: `{url-id}-{url-parsed}.jpg`

**Database Updates**:
```javascript
// Successful analysis result
{
  agent_summary: "AI-generated description...",
  screenshot_name: "http://host.docker.internal:8000/storage/v1/object/screenshots/url_scan/86056c91-aeaf-413b-86ac-bccc132cb022-example-com.jpeg",
  page_assessment: ["legitimate", "search", "global", "shopify", "low-risk", "e-commerce"]
}
```

---

## ⚠️ **Key Limitations & Important Notes**

### Google Gemini Free Tier Limitations
- **Daily Limits**: Can hit quota with large batches (100+ URLs)
- **Rate Limits**: Sequential processing required to avoid overwhelming API
- **Solutions**: Create multiple API keys, upgrade to paid tier, or switch to alternative models
- **Error Handling**: Graceful handling of quota exceeded situations

### Performance Considerations
- **Speed**: Each URL takes 20-60 seconds for complete analysis
- **Throughput**: ~100-300 URLs per day on free tier
- **Scaling**: Consider paid APIs or self-hosted models for higher volume

### Storage Management
- **Screenshot Accumulation**: Files are NOT auto-deleted when URLs are removed
- **Manual Cleanup**: Currently requires manual intervention
- **Roadmap**: Automatic screenshot cleanup when URLs are deleted

---

<div align="center">

[🐛 Report Issues](https://github.com/brunosergi/alive-url-scan/issues) • [💡 Suggest Improvements](https://github.com/brunosergi/alive-url-scan/discussions)

Just a guy documenting his automation workflows 🛠️

</div>