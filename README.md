# CreateYourNextFour

AI-powered college opportunity finder for Texas universities.

## Project structure

```
createyournextfour/
├── public/
│   └── index.html       ← the full frontend
├── api/
│   └── recommend.js     ← Vercel serverless function (keeps API key server-side)
├── vercel.json          ← routing config
├── package.json
└── README.md
```

## Deploy to Vercel (15 minutes)

### 1. Get an Anthropic API key
- Go to https://console.anthropic.com
- Create an account and generate an API key
- Copy it — you'll need it in step 4

### 2. Push to GitHub
- Create a new repo at https://github.com/new
- Upload this entire folder, or run:
  ```
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/createyournextfour.git
  git push -u origin main
  ```

### 3. Connect to Vercel
- Go to https://vercel.com and sign in with GitHub
- Click "Add New Project"
- Import your repository
- Click Deploy (no build settings needed)

### 4. Add your API key
- In your Vercel project dashboard, go to Settings → Environment Variables
- Add a new variable:
  - Name:  ANTHROPIC_API_KEY
  - Value: your key from step 1
- Click Save, then go to Deployments and click "Redeploy"

That's it — your site is live.

## Running locally

```bash
npm install -g vercel
vercel dev
```

Then open http://localhost:3000. You'll need a `.env.local` file:
```
ANTHROPIC_API_KEY=your_key_here
```

## How it works

The frontend (`public/index.html`) collects the student's university, major, and interests, then POSTs to `/api/recommend`. The serverless function (`api/recommend.js`) calls the Anthropic API with your secret key — which never touches the browser. Results are returned as JSON and rendered as opportunity cards.
# create-your-next-four
