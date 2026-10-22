/**
 * NetTools BR - Local History Manager
 */

const HISTORY_KEY = 'nettools_br_history';
const MAX_HISTORY_ITEMS = 30;

export const HistoryManager = {
  getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load history', e);
      return [];
    }
  },

  add(toolId, toolTitle, query) {
    if (!query) return;
    try {
      let history = this.getHistory();
      // Remove duplicate if same query & tool
      history = history.filter(item => !(item.toolId === toolId && item.query.toLowerCase() === query.toLowerCase()));

      const newItem = {
        id: Date.now(),
        toolId,
        toolTitle,
        query,
        timestamp: new Date().toISOString()
      };

      history.unshift(newItem);
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  },

  clear() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear history', e);
    }
  }
};
