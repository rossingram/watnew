# Fix Package Lock File Issue

If you're getting this error during Railway deployment:

```
npm error Invalid: lock file's typescript@5.9.3 does not satisfy typescript@4.9.5
```

## Solution

Regenerate the `package-lock.json` file:

```bash
cd client
rm -f package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

This will create a fresh `package-lock.json` that's in sync with your `package.json`.

## Alternative: Use npm install instead of npm ci

If you can't regenerate the lock file, Railway will automatically use `npm install` instead of `npm ci` when it detects the `nixpacks.toml` file (which has been created in the client directory).

The `nixpacks.toml` file tells Railway to:
- Use `npm install` instead of `npm ci`
- This is less strict but will work even with minor lock file issues
