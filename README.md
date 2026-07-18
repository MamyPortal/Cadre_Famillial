# Cadre Familial V4

Interface de cadre photo familiale pensée pour une tablette 11" (Redmi Pad 2) et un usage en plein écran.

## Fichiers
- `index.html` : écran principal
- `settings.html` : page de paramètres
- `css/styles.css` : styles de l'écran principal
- `css/settings.css` : styles de la page paramètres
- `js/app.js` : logique de l'écran principal
- `js/settings.js` : logique des paramètres
- `js/storage.js` : sauvegarde locale
- `js/weather.js` : météo Open-Meteo
- `js/slideshow.js` : diaporama
- `manifest.json` / `sw.js` : PWA
- `config.json` : configuration par défaut

## Utilisation
1. Ouvrir `index.html` dans Chrome.
2. Ouvrir `settings.html` pour personnaliser.
3. Remplacer les photos dans `photos/` par vos propres fichiers.

## Remarques
- La météo utilise Open-Meteo.
- Les réglages sont sauvegardés dans `localStorage`.
- Le bouton `Plein écran` essaie de lancer le mode plein écran.
