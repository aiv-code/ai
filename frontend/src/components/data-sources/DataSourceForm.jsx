import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { dataSourcesApi } from '../../api/dataSourcesApi';

const SOURCE_TYPES = {
  POSTGRES: 'postgres',
  EXCEL: 'excel',
  PARQUET: 'parquet',
  TIMESCALE: 'timescale',
  TRINO: 'trino',
  DUCKDB: 'duckdb',
  MOTHERDUCK: 'motherduck',
  DATABRICKS: 'databricks',
  CUBE: 'cube',
  SNOWFLAKE: 'snowflake',
  REDSHIFT: 'redshift',
  BUCKET_PARQUET: 'bucket_parquet',
};

export function DataSourceForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    source_name: '',
    source_type: SOURCE_TYPES.POSTGRES,
    connection_config: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfigChange = (key, value) => {
    setFormData({
      ...formData,
      connection_config: {
        ...formData.connection_config,
        [key]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await dataSourcesApi.create(formData);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create data source');
    } finally {
      setSubmitting(false);
    }
  };

  const renderConfigFields = () => {
    switch (formData.source_type) {
      case SOURCE_TYPES.POSTGRES:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                value={formData.connection_config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="localhost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.connection_config.port || 5432}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  placeholder="5432"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  value={formData.connection_config.database || ''}
                  onChange={(e) => handleConfigChange('database', e.target.value)}
                  placeholder="mydb"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.connection_config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="postgres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.connection_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema (optional)
              </label>
              <input
                type="text"
                value={formData.connection_config.schema || ''}
                onChange={(e) => handleConfigChange('schema', e.target.value)}
                placeholder="public"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.EXCEL:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <FileUpload
                acceptedTypes=".xlsx,.xls,.csv"
                onUploadComplete={(fileInfo) => {
                  handleConfigChange('file_path', fileInfo.file_path);
                  handleConfigChange('hasHeaders', true);
                }}
              />
            </div>
            <div className="text-center text-gray-500 text-sm">OR</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Path (if already on server)
              </label>
              <input
                type="text"
                value={formData.connection_config.file_path || formData.connection_config.filePath || ''}
                onChange={(e) => handleConfigChange('file_path', e.target.value)}
                placeholder="/data/uploads/file.xlsx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sheet Name (optional, for Excel files)
              </label>
              <input
                type="text"
                value={formData.connection_config.sheet_name || ''}
                onChange={(e) => handleConfigChange('sheet_name', e.target.value)}
                placeholder="Sheet1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.PARQUET:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <FileUpload
                acceptedTypes=".parquet"
                onUploadComplete={(fileInfo) => {
                  handleConfigChange('file_path', fileInfo.file_path);
                }}
              />
            </div>
            <div className="text-center text-gray-500 text-sm">OR</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Path (if already on server)
              </label>
              <input
                type="text"
                value={formData.connection_config.file_path || formData.connection_config.filePath || ''}
                onChange={(e) => handleConfigChange('file_path', e.target.value)}
                placeholder="/data/uploads/file.parquet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.TIMESCALE:
        // TimescaleDB uses same config as PostgreSQL
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                value={formData.connection_config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="localhost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.connection_config.port || 5432}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  placeholder="5432"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  value={formData.connection_config.database || ''}
                  onChange={(e) => handleConfigChange('database', e.target.value)}
                  placeholder="mydb"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.connection_config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="postgres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.connection_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema (optional)
              </label>
              <input
                type="text"
                value={formData.connection_config.schema || ''}
                onChange={(e) => handleConfigChange('schema', e.target.value)}
                placeholder="public"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.TRINO:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                value={formData.connection_config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="localhost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.connection_config.port || 8080}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  placeholder="8080"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catalog
                </label>
                <input
                  type="text"
                  value={formData.connection_config.catalog || 'system'}
                  onChange={(e) => handleConfigChange('catalog', e.target.value)}
                  placeholder="system"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema
                </label>
                <input
                  type="text"
                  value={formData.connection_config.schema || 'default'}
                  onChange={(e) => handleConfigChange('schema', e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Scheme
                </label>
                <select
                  value={formData.connection_config.http_scheme || 'http'}
                  onChange={(e) => handleConfigChange('http_scheme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.connection_config.username || 'admin'}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (optional)
              </label>
              <input
                type="password"
                value={formData.connection_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.DUCKDB:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Path
              </label>
              <input
                type="text"
                value={formData.connection_config.database || ':memory:'}
                onChange={(e) => handleConfigChange('database', e.target.value)}
                placeholder=":memory: or /path/to/database.db"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Use :memory: for in-memory database or provide file path</p>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.connection_config.read_only || false}
                  onChange={(e) => handleConfigChange('read_only', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Read-only mode</span>
              </label>
            </div>
          </div>
        );

      case SOURCE_TYPES.MOTHERDUCK:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token
              </label>
              <input
                type="password"
                value={formData.connection_config.token || ''}
                onChange={(e) => handleConfigChange('token', e.target.value)}
                placeholder="Your MotherDuck token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Get your token from <a href="https://motherduck.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">motherduck.com</a></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database (optional)
              </label>
              <input
                type="text"
                value={formData.connection_config.database || ''}
                onChange={(e) => handleConfigChange('database', e.target.value)}
                placeholder="database_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.DATABRICKS:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server Hostname
              </label>
              <input
                type="text"
                value={formData.connection_config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="your-workspace.cloud.databricks.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTTP Path
              </label>
              <input
                type="text"
                value={formData.connection_config.http_path || ''}
                onChange={(e) => handleConfigChange('http_path', e.target.value)}
                placeholder="/sql/1.0/warehouses/xxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={formData.connection_config.token || formData.connection_config.access_token || ''}
                onChange={(e) => {
                  handleConfigChange('token', e.target.value);
                  handleConfigChange('access_token', e.target.value);
                }}
                placeholder="dapi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.CUBE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL
              </label>
              <input
                type="text"
                value={formData.connection_config.base_url || 'http://localhost:4000'}
                onChange={(e) => handleConfigChange('base_url', e.target.value)}
                placeholder="http://localhost:4000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token (optional)
              </label>
              <input
                type="password"
                value={formData.connection_config.token || formData.connection_config.api_key || ''}
                onChange={(e) => {
                  handleConfigChange('token', e.target.value);
                  handleConfigChange('api_key', e.target.value);
                }}
                placeholder="Bearer token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.SNOWFLAKE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <input
                type="text"
                value={formData.connection_config.account || ''}
                onChange={(e) => handleConfigChange('account', e.target.value)}
                placeholder="xy12345.us-east-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.connection_config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.connection_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse (optional)
                </label>
                <input
                  type="text"
                  value={formData.connection_config.warehouse || ''}
                  onChange={(e) => handleConfigChange('warehouse', e.target.value)}
                  placeholder="COMPUTE_WH"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database (optional)
                </label>
                <input
                  type="text"
                  value={formData.connection_config.database || ''}
                  onChange={(e) => handleConfigChange('database', e.target.value)}
                  placeholder="SNOWFLAKE_SAMPLE_DATA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schema (optional)
                </label>
                <input
                  type="text"
                  value={formData.connection_config.schema || 'PUBLIC'}
                  onChange={(e) => handleConfigChange('schema', e.target.value)}
                  placeholder="PUBLIC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role (optional)
                </label>
                <input
                  type="text"
                  value={formData.connection_config.role || ''}
                  onChange={(e) => handleConfigChange('role', e.target.value)}
                  placeholder="ACCOUNTADMIN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        );

      case SOURCE_TYPES.REDSHIFT:
        // Redshift uses same config as PostgreSQL
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                value={formData.connection_config.host || ''}
                onChange={(e) => handleConfigChange('host', e.target.value)}
                placeholder="your-cluster.xxxxx.us-east-1.redshift.amazonaws.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.connection_config.port || 5439}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  placeholder="5439"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database
                </label>
                <input
                  type="text"
                  value={formData.connection_config.database || ''}
                  onChange={(e) => handleConfigChange('database', e.target.value)}
                  placeholder="dev"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.connection_config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                placeholder="awsuser"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.connection_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        );

      case SOURCE_TYPES.BUCKET_PARQUET:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={formData.connection_config.provider || 's3'}
                onChange={(e) => handleConfigChange('provider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="s3">AWS S3</option>
                <option value="gcs">Google Cloud Storage</option>
                <option value="azure">Azure Blob Storage</option>
                <option value="r2">Cloudflare R2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bucket Name
              </label>
              <input
                type="text"
                value={formData.connection_config.bucket_name || ''}
                onChange={(e) => handleConfigChange('bucket_name', e.target.value)}
                placeholder="my-bucket"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefix (optional)
              </label>
              <input
                type="text"
                value={formData.connection_config.prefix || ''}
                onChange={(e) => handleConfigChange('prefix', e.target.value)}
                placeholder="path/to/parquet/files/"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {(formData.connection_config.provider === 's3' || formData.connection_config.provider === 'r2') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Key ID
                  </label>
                  <input
                    type="text"
                    value={formData.connection_config.access_key_id || ''}
                    onChange={(e) => handleConfigChange('access_key_id', e.target.value)}
                    placeholder="AKIA..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Access Key
                  </label>
                  <input
                    type="password"
                    value={formData.connection_config.secret_access_key || ''}
                    onChange={(e) => handleConfigChange('secret_access_key', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {formData.connection_config.provider === 's3' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={formData.connection_config.region || 'us-east-1'}
                      onChange={(e) => handleConfigChange('region', e.target.value)}
                      placeholder="us-east-1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                {formData.connection_config.provider === 'r2' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={formData.connection_config.endpoint_url || ''}
                      onChange={(e) => handleConfigChange('endpoint_url', e.target.value)}
                      placeholder="https://xxxxx.r2.cloudflarestorage.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                )}
              </>
            )}
            {formData.connection_config.provider === 'gcs' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials JSON (optional - will use default if not provided)
                </label>
                <textarea
                  value={formData.connection_config.credentials_json || ''}
                  onChange={(e) => handleConfigChange('credentials_json', e.target.value)}
                  placeholder='{"type": "service_account", ...}'
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Or provide credentials_path if file is on server</p>
              </div>
            )}
            {formData.connection_config.provider === 'azure' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.connection_config.account_name || ''}
                    onChange={(e) => handleConfigChange('account_name', e.target.value)}
                    placeholder="mystorageaccount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Key
                  </label>
                  <input
                    type="password"
                    value={formData.connection_config.account_key || ''}
                    onChange={(e) => handleConfigChange('account_key', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Source Name
        </label>
        <input
          type="text"
          value={formData.source_name}
          onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
          placeholder="My Data Source"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Source Type
        </label>
        <select
          value={formData.source_type}
          onChange={(e) => {
            setFormData({
              ...formData,
              source_type: e.target.value,
              connection_config: {},
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value={SOURCE_TYPES.POSTGRES}>PostgreSQL</option>
          <option value={SOURCE_TYPES.TIMESCALE}>TimescaleDB</option>
          <option value={SOURCE_TYPES.EXCEL}>Excel/CSV</option>
          <option value={SOURCE_TYPES.PARQUET}>Parquet (Local)</option>
          <option value={SOURCE_TYPES.BUCKET_PARQUET}>Parquet (Cloud Bucket)</option>
          <option value={SOURCE_TYPES.TRINO}>Trino</option>
          <option value={SOURCE_TYPES.DUCKDB}>DuckDB</option>
          <option value={SOURCE_TYPES.MOTHERDUCK}>MotherDuck</option>
          <option value={SOURCE_TYPES.DATABRICKS}>Databricks</option>
          <option value={SOURCE_TYPES.SNOWFLAKE}>Snowflake</option>
          <option value={SOURCE_TYPES.REDSHIFT}>Amazon Redshift</option>
          <option value={SOURCE_TYPES.CUBE}>Cube.js</option>
        </select>
      </div>

      <div>{renderConfigFields()}</div>

      <div className="flex space-x-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Data Source'}
        </button>
      </div>
    </form>
  );
}

