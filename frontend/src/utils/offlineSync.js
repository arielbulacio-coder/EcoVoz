import localforage from 'localforage';
import api from './api';

export const saveDraft = async (observation) => {
  const drafts = (await localforage.getItem('observaciones_borrador')) || [];
  drafts.push(observation);
  await localforage.setItem('observaciones_borrador', drafts);
};

export const syncDrafts = async () => {
  if (!navigator.onLine) return;

  const drafts = (await localforage.getItem('observaciones_borrador')) || [];
  if (drafts.length === 0) return;

  const remainingDrafts = [];

  for (const draft of drafts) {
    try {
      await api.post('/observaciones', draft);
    } catch (error) {
      console.error('Error syncing draft', draft, error);
      // Si el error no es de red, quizás falló la validación. Lo dejamos para revisión.
      remainingDrafts.push(draft);
    }
  }

  await localforage.setItem('observaciones_borrador', remainingDrafts);
};

// Sincronizar automáticamente cuando vuelve la conexión
window.addEventListener('online', syncDrafts);
