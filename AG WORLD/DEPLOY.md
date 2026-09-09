# AG World deployment

## Fastest path: GitHub Pages

This is a static web application, so it can be hosted directly from the repository.

1. Open the repository Settings in GitHub.
2. Open **Pages**.
3. Select **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save.
6. GitHub will provide the Pages URL after the deployment completes.

## Google Maps setup

1. Create/reuse a Google Maps Platform project.
2. Enable the required Maps JavaScript API services.
3. Create a browser API key.
4. Restrict the key to the production web origin.
5. Put the key into `config.js` as `GOOGLE_MAPS_API_KEY`.
6. Never commit an unrestricted production key.

The application intentionally displays a setup message until a key is supplied; it does not fabricate a map when the real map service is unavailable.

## Production direction

The current repository is the front-end foundation. The next development stages should replace demonstration farm records with the real agricultural database and connect authentication, GIS services, mission/rules, AI orchestration, training, support and reporting through APIs as described in the AG World developer specification.
