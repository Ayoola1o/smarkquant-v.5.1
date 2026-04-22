# Frontend Setup

## Environment Variables

The `.env.local` file is gitignored for security reasons and should **never be committed** to git.

### Setting Up Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Getting Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy the **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
5. Copy the **Anon/Public Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Troubleshooting

If your `.env.local` file keeps getting deleted:

1. **Check if it's committed to git:**
   ```bash
   git status
   ```
   If `.env.local` shows up here, remove it:
   ```bash
   git rm --cached .env.local
   ```

2. **Ignore any formatter/linter that might delete it:**
   - Disable any Prettier/ESLint formatting for `.env.local`
   - Check VS Code settings don't have any `files.exclude` rules that remove it

3. **Recreate it:**
   ```bash
   cp .env.local.example .env.local
   # Add your actual keys to .env.local
   ```

### Security Note

- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is **safe to share** - it's the public anonymous key
- ❌ `SUPABASE_SERVICE_ROLE_KEY` should **never** be exposed in frontend code
- ⚠️ **Never commit** `.env.local` to version control

## Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`
