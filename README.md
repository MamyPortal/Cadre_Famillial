# Cadre familial V3

Version pensée pour une tablette 11" en mode portrait et paysage.

## Fichiers

- `index.html`
- `styles.css`
- `app.js`
- `config.json`
- `manifest.json`
- `sw.js`
- `photos/`
- `icons/`

## Utilisation

1. Copiez le dossier sur un serveur web local ou un hébergement HTTPS.
2. Ouvrez `index.html` dans Chrome.
3. Modifiez `config.json` pour changer le message, la météo, les liens et les photos.

## Remarques

- Le service worker fonctionne uniquement en HTTP(S), pas en `file://`.
- Les photos d'exemple sont des SVG de démonstration à remplacer par vos propres images.
- Pour une tablette fixée au mur, le mode paysage est optimisé pour supprimer le défilement.
