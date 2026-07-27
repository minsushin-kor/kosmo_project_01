BEGIN;

CREATE TABLE IF NOT EXISTS public.dealer_churn (
    dealer_churn_id BIGSERIAL PRIMARY KEY,
    dealer_id BIGINT NOT NULL,
    last_activity_days BIGINT NOT NULL,
    recent_60d_trade_count BIGINT NOT NULL,
    previous_trade_count BIGINT NOT NULL,
    site_usage_rate DOUBLE PRECISION NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dealer_churn_dealer
        FOREIGN KEY (dealer_id)
        REFERENCES public.dealers(dealer_id)
);

CREATE TABLE IF NOT EXISTS public.company_churn (
    company_churn_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    dealer_count BIGINT NOT NULL,
    active_dealer_ratio DOUBLE PRECISION NOT NULL,
    recent_trade_count BIGINT NOT NULL,
    previous_trade_count BIGINT NOT NULL,
    site_usage_rate_avg DOUBLE PRECISION NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_churn_company
        FOREIGN KEY (company_id)
        REFERENCES public.companies(company_id)
);

COMMIT;
