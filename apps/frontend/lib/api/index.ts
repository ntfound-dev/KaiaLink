import * as realApi from './real';
import * as mockApi from './mock';

const isMockMode = process.env.NEXT_PUBLIC_API_MODE === 'mock';

const api = isMockMode ? mockApi : realApi;

export default api;