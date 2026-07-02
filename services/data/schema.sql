-- PostgreSQL-oriented schema for FinahuntV2 MVP. Local runtime uses JSON seed for offline acceptance; these tables define the structured repository contract.
create table sources (id text primary key, name text not null, type text not null, url text not null, enabled boolean not null);
create table crawl_runs (id text primary key, source_id text references sources(id), status text not null, inserted_count integer default 0, duplicate_count integer default 0);
create table raw_news (id text primary key, source_id text references sources(id), title text not null, source_url text not null, publish_time timestamptz, source_hash text not null, dedupe_hash text not null);
create table normalized_news (id text primary key, raw_id text references raw_news(id), title text not null, category text not null, summary text not null, status text not null);
create table themes (id text primary key, name text not null, summary text not null, logic text not null, heat_score numeric not null);
create table theme_tags (id text primary key, name text unique not null, enabled boolean not null default true);
create table theme_rankings (theme_id text references themes(id), rank integer not null, heat_score numeric not null, primary key(theme_id, rank));
create table research_cards (id text primary key, theme_id text references themes(id), status text not null, review_status text not null, event_summary text, theme_logic text);
create table theme_chain_nodes (id text primary key, theme_id text references themes(id), name text not null, description text, sort_order integer);
create table theme_chain_edges (id text primary key, theme_id text references themes(id), from_node text, to_node text, relation text);
create table companies (id text primary key, name text not null, code text, industry text);
create table theme_company_matches (id text primary key, theme_id text references themes(id), company_id text references companies(id), chain_node text, evidence_strength text, verification_status text);
create table evidences (id text primary key, theme_id text references themes(id), title text not null, source_name text not null, source_url text not null, strength text not null);
create table risk_notes (id text primary key, theme_id text references themes(id), level text not null, text text not null);
create table observations (id text primary key, theme_id text references themes(id), title text not null, text text not null);
create table publish_items (id text primary key, target text not null, theme_id text, news_id text, status text not null, sort_order integer);
create table ai_analysis_runs (id text primary key, provider text not null, status text not null, trace_id text not null);
create table compliance_logs (id text primary key, status text not null, blocked_terms jsonb not null default '[]');

create table expectation_gap_sources (
  id text primary key,
  source_name text not null,
  source_type text not null,
  url text not null,
  note text,
  priority integer not null default 100,
  enabled boolean not null default true
);

create table expectation_gap_cards (
  id text primary key,
  theme_name text not null,
  theme_id text,
  title text not null,
  summary text not null,
  status text not null,
  prediction_types jsonb not null default '[]',
  expectation_gap_score numeric not null,
  confidence text not null,
  score_breakdown jsonb not null,
  inference_chain jsonb not null default '[]',
  conclusion text not null,
  market_not_fully_priced_evidence jsonb not null default '[]',
  source_item_ids jsonb not null default '[]'
);

create table leading_signals (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  type text not null,
  signal text not null,
  evidence_quote text not null,
  why_early text not null,
  source_name text not null,
  source_url text not null,
  publish_time text,
  status text not null
);

create table industry_variables (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  variable_type text not null,
  direction text not null,
  description text not null,
  evidence_quote text not null,
  confidence text not null
);

create table company_transmissions (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  company_name text not null,
  stock_code text,
  role text not null,
  rank integer not null,
  chain_position text not null,
  revenue_transmission text not null,
  profit_elasticity text not null,
  evidence_tier text not null,
  evidence_strength text not null,
  next_catalyst text not null,
  falsification_signal text not null,
  peer_reason text not null,
  verification_needed text not null,
  include_status text not null
);

create table catalyst_calendar (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  date_window text not null,
  catalyst text not null,
  evidence_needed text not null,
  status text not null
);

create table exclusion_reasons (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  company_name text not null,
  reason text not null,
  evidence_needed text not null
);

create table falsification_signals (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  signal text not null,
  severity text not null
);

create table evidence_matrix (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  claim text not null,
  raw_evidence text not null,
  source_name text not null,
  source_url text,
  evidence_type text not null,
  evidence_level text not null,
  inference text not null,
  inference_risk text not null,
  missing_evidence text not null,
  confidence_impact text not null
);

create table score_evidence (
  id text primary key,
  card_id text references expectation_gap_cards(id),
  dimension text not null,
  score numeric not null,
  weight numeric default 1,
  evidence_ids jsonb default '[]',
  reason text,
  missing_data_penalty numeric default 0
);
