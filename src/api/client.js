import axios from 'axios';
import { API_CONFIG } from './config';
import { getSession } from '../utils/session';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    Authorization: API_CONFIG.HEADERS.AUTHORIZATION,
    'Http-App-Name': API_CONFIG.HEADERS.HTTP_APP_NAME,
    'Http-App-Type': API_CONFIG.HEADERS.HTTP_APP_TYPE,
  },
});

apiClient.interceptors.request.use(
  async config => {
    try {
      const session = await getSession();

      if (session) {
        console.log('📝 [client.js] Attaching Session Headers');

        // Helper to safely stringify and avoid nulls
        const safeHeader = value => (value ? String(value) : '');

        // Standard session headers expected by the backend
        config.headers['Logged-User-Id'] = safeHeader(session.logged_user_id);
        config.headers['Logged-User-Type'] = safeHeader(
          session.logged_user_type,
        );
        config.headers['Logged-User-Level'] = safeHeader(
          session.logged_user_level,
        );
        config.headers['Logged-Company-Id'] = safeHeader(
          session.logged_company_id,
        );
        config.headers['Logged-Location-Id'] = safeHeader(
          session.logged_location_id,
        );
        config.headers['Logged-Queue-Id'] = safeHeader(session.logged_queue_id);
        config.headers['Logged-User-Group'] = safeHeader(
          session.logged_user_group,
        );
        config.headers['Logged-Mobile'] = safeHeader(session.logged_mobile);
        config.headers['User-Master-Id'] = safeHeader(session.user_master_id);

        // Ensure App Type is Vendor
        config.headers['Http-App-Type'] = API_CONFIG.HEADERS.HTTP_APP_TYPE;
      }

      console.log(`🚀 [Request] ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('❌ [client.js] Error attaching headers:', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => {
    console.log(`✅ [Response] ${response.status} from ${response.config.url}`);

    // Clean up responses that have PHP warnings prepended to the JSON
    if (typeof response.data === 'string') {
      try {
        const str = response.data;
        // Find the first occurrence of '{' or '[' that looks like the start of a valid JSON object/array
        const match = str.match(/(\{|\[)[\s\S]*(\}|\])/);
        if (match) {
          // We might have grabbed HTML at the end, so let's try to parse
          // Or simpler: match starting brace until the last corresponding brace.
          // Since JSON is at the end of the string, it usually ends with } or ]
          // Let's use lastIndexOf for the *same* closing character as the starting match.
          const startIndex = match.index;
          const startChar = str[startIndex];
          const endChar = startChar === '{' ? '}' : ']';
          const endIndex = str.lastIndexOf(endChar);

          if (endIndex > startIndex) {
            const jsonStr = str.substring(startIndex, endIndex + 1);
            response.data = JSON.parse(jsonStr);
          }
        }
      } catch (e) {
        // Ignore parsing errors and keep response.data as is
      }
    }

    return response;
  },
  error => {
    console.error(
      `❌ [Response Error] ${error.response?.status} - ${error.message}`,
    );
    return Promise.reject(error);
  },
);

export default apiClient;
