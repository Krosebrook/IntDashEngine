
import { KPI, AIInsight, FeedbackSubmission } from '../types';

const DB_NAME = 'int_dashboard_db';
const DB_VERSION = 1;

interface CachedInsight {
  hash: string;
  insights: AIInsight[];
  timestamp: number;
}

export const db = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        // Store KPIs per department
        if (!database.objectStoreNames.contains('kpis')) {
          database.createObjectStore('kpis', { keyPath: 'deptId' });
        }
        // Cache AI insights by hash
        if (!database.objectStoreNames.contains('insights')) {
          database.createObjectStore('insights', { keyPath: 'hash' });
        }
        // Offline Feedback Queue
        if (!database.objectStoreNames.contains('feedback')) {
          database.createObjectStore('feedback', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getKPIs(deptId: string): Promise<KPI[] | null> {
    try {
      const database = await this.open();
      return new Promise((resolve) => {
        const transaction = database.transaction(['kpis'], 'readonly');
        const store = transaction.objectStore('kpis');
        const request = store.get(deptId);
        request.onsuccess = () => resolve(request.result?.kpis || null);
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error("DB Get Error", e);
      return null;
    }
  },

  async saveKPIs(deptId: string, kpis: KPI[]): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(['kpis'], 'readwrite');
    const store = transaction.objectStore('kpis');
    store.put({ deptId, kpis, timestamp: Date.now() });
  },

  async getInsight(hash: string): Promise<AIInsight[] | null> {
    try {
      const database = await this.open();
      return new Promise((resolve) => {
        const transaction = database.transaction(['insights'], 'readonly');
        const store = transaction.objectStore('insights');
        const request = store.get(hash);
        request.onsuccess = () => {
          const result = request.result as CachedInsight;
          // Cache validity: 1 hour
          if (result && (Date.now() - result.timestamp < 1000 * 60 * 60)) { 
            resolve(result.insights);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  async saveInsight(hash: string, insights: AIInsight[]): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(['insights'], 'readwrite');
    const store = transaction.objectStore('insights');
    store.put({ hash, insights, timestamp: Date.now() });
  },

  async saveFeedback(submission: FeedbackSubmission): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(['feedback'], 'readwrite');
    transaction.objectStore('feedback').put(submission);
  }
};
