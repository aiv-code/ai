"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('api_key', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)
    op.create_index(op.f('ix_clients_api_key'), 'clients', ['api_key'], unique=True)
    
    # Create data_sources table
    op.create_table(
        'data_sources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('source_name', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('connection_config', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_sources_id'), 'data_sources', ['id'], unique=False)
    op.create_index(op.f('ix_data_sources_client_id'), 'data_sources', ['client_id'], unique=False)
    
    # Create schema_metadata table
    op.create_table(
        'schema_metadata',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data_source_id', sa.Integer(), nullable=False),
        sa.Column('schema_name', sa.String(length=255), nullable=True),
        sa.Column('table_name', sa.String(length=255), nullable=False),
        sa.Column('column_info', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('sample_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('last_refreshed', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schema_metadata_id'), 'schema_metadata', ['id'], unique=False)
    op.create_index(op.f('ix_schema_metadata_data_source_id'), 'schema_metadata', ['data_source_id'], unique=False)
    
    # Create query_history table
    op.create_table(
        'query_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('data_source_id', sa.Integer(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('query_type', sa.String(length=50), nullable=False),
        sa.Column('executed_query', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('result_count', sa.Integer(), nullable=True),
        sa.Column('execution_time_ms', sa.Float(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('result_preview', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_query_history_id'), 'query_history', ['id'], unique=False)
    op.create_index(op.f('ix_query_history_client_id'), 'query_history', ['client_id'], unique=False)
    op.create_index(op.f('ix_query_history_data_source_id'), 'query_history', ['data_source_id'], unique=False)
    op.create_index(op.f('ix_query_history_created_at'), 'query_history', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_query_history_created_at'), table_name='query_history')
    op.drop_index(op.f('ix_query_history_data_source_id'), table_name='query_history')
    op.drop_index(op.f('ix_query_history_client_id'), table_name='query_history')
    op.drop_index(op.f('ix_query_history_id'), table_name='query_history')
    op.drop_table('query_history')
    
    op.drop_index(op.f('ix_schema_metadata_data_source_id'), table_name='schema_metadata')
    op.drop_index(op.f('ix_schema_metadata_id'), table_name='schema_metadata')
    op.drop_table('schema_metadata')
    
    op.drop_index(op.f('ix_data_sources_client_id'), table_name='data_sources')
    op.drop_index(op.f('ix_data_sources_id'), table_name='data_sources')
    op.drop_table('data_sources')
    
    op.drop_index(op.f('ix_clients_api_key'), table_name='clients')
    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_index(op.f('ix_clients_id'), table_name='clients')
    op.drop_table('clients')


