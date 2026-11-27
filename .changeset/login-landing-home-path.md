---
'@vben/playground': patch
---

fix: land on the `homePath` sent by `/auth/login` and `/user/info` after login, so the default home entry (`/dashboard`) no longer wins over it when entering through `/`, on refresh, or when the login page carries a `redirect` back to the default home.
