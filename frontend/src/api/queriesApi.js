import { apiClient } from './apiClient';

export const queriesApi = {
  execute: (prompt, dataSourceIds = null, maxRows = 1000) =>
    apiClient.post('/api/v1/queries', {
      prompt,
      data_source_ids: dataSourceIds,
      max_rows: maxRows,
    }),
};


