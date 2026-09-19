// Environnement de production (VPS OxaHost + nginx)
// Le frontend et l'API sont sur le même domaine (village-1800.com).
// nginx sert le site et redirige /api vers le backend Node (localhost:3000).
// URL relative → aucune configuration d'IP/domaine à changer, pas de CORS.
export const environment = {
  production: true,
  apiUrl: '/api',
};
