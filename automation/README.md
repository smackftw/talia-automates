# Instagram publisher

The publisher uses Meta's Instagram API with Instagram Login. It publishes the
four queued assets from public GitHub Pages URLs. Carousel source images are
1080x1350 (4:5); no cropping step is performed by the script.

Required GitHub Actions secrets:

- `INSTAGRAM_ACCESS_TOKEN`

`INSTAGRAM_USER_ID` is optional: when it is absent, the publisher resolves the
account ID securely from the token through the `/me` endpoint.

Optional repository variable:

- `INSTAGRAM_API_VERSION` (defaults to `v23.0`)

The scheduled workflow remains disabled until repository variable
`IG_AUTOPUBLISH_ENABLED` is set to `true`. Run a manual dry run before enabling
it. Never commit an Instagram access token to this repository.

The workflow attempts publication several times after 19:00 Asia/Nicosia. The
publisher records successful media IDs and also checks recent Instagram captions,
so backup attempts repair state or exit without creating duplicate posts. A failed
scheduled publication is retried once automatically before an alert is opened.

Local public-file validation:

```powershell
node automation/publish-instagram.mjs --content=reel-03 --dry-run
```

Token-only validation without publishing:

```powershell
node automation/publish-instagram.mjs --content=reel-03 --verify-token
```
