# ExamReady — Deploy Guide
## No coding needed! Follow these steps exactly.

---

## STEP 1 — Create a GitHub Account (free)
1. Go to https://github.com
2. Click "Sign up" and create a free account
3. Verify your email

---

## STEP 2 — Upload the App to GitHub
1. Go to https://github.com/new
2. Repository name: `examready`
3. Set to **Private**
4. Click "Create repository"
5. On the next page, click "uploading an existing file"
6. Drag and drop ALL the files from this zip (keep folder structure)
7. Click "Commit changes"

---

## STEP 3 — Create a Vercel Account (free)
1. Go to https://vercel.com
2. Click "Sign up" → choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub

---

## STEP 4 — Deploy the App
1. On Vercel dashboard, click "Add New Project"
2. Find and select your `examready` repository
3. Click "Import"
4. Leave all settings as default
5. Click "Deploy"
6. Wait ~2 minutes for it to build

---

## STEP 5 — Add Your API Key (IMPORTANT)
Without this step the app will not work.

1. On Vercel, go to your project dashboard
2. Click "Settings" (top menu)
3. Click "Environment Variables" (left sidebar)
4. Click "Add New"
5. Name: `ANTHROPIC_API_KEY`
6. Value: paste your API key (starts with sk-ant-)
7. Click "Save"
8. Go back to "Deployments" tab
9. Click the three dots on latest deployment → "Redeploy"
10. Wait ~1 minute

---

## STEP 6 — Share with Your Colleague
1. Go to your Vercel project dashboard
2. Copy the URL shown (e.g. examready.vercel.app)
3. Share that URL — it works on any device, anywhere in the world!

---

## HOW TO USE THE APP

### Upload Tab
- Enter a subject name (e.g. "Home Science")
- Upload textbook PDFs
- Upload past question paper PDFs
- Click "Analyse" — takes 30-90 seconds
- You'll be taken to the Summaries tab automatically

### Summaries Tab
- Left sidebar shows all uploaded subjects
- Click a subject to view chapter summaries
- Toggle between "Chapter Summaries" and "Answer Key" tabs
- Click "Download Answer Key" to save as text file
- Click "Study with Bot" to go to chatbot

### Study Bot Tab
1. Select a subject
2. Choose mode:
   - 💬 Chat — ask questions, get explanations
   - 🎯 Quiz — bot asks you questions, tracks score
   - ✍️ Evaluate — write answers, bot marks them
3. Select specific chapters or leave all selected
4. Click "Start Study Session"

---

## TROUBLESHOOTING

**"Analysis failed"** → Check your API key is set correctly in Vercel environment variables

**"Something went wrong" in chat** → Same as above, or the PDF may be too large

**App not loading** → Try redeploying from Vercel dashboard

**Need help?** Contact your developer

---

## COSTS
- Vercel hosting: FREE
- GitHub: FREE  
- Anthropic API: ~$0.10–$0.50 per subject analysis, ~$0.01 per chat message
- Your $50 credits will last many months of demo usage
