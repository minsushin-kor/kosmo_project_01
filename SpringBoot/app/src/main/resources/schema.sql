-- Drop tables in reverse dependency order to prevent foreign key constraint violations
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS car_images CASCADE;
DROP TABLE IF EXISTS membership_history CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- 1. members (일반 회원)
CREATE TABLE members (
    member_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500), -- 프로필 사진 이미지 URL (단일)
    role VARCHAR(20) DEFAULT 'MEMBER', -- 회원 권한 ('MEMBER', 'ADMIN')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. companies (상사)
CREATE TABLE companies (
    company_id BIGSERIAL PRIMARY KEY,
    business_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    master_email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    profile_image_url VARCHAR(500), -- 상사 대표 이미지 또는 로고 이미지 URL (단일)
    membership_status BOOLEAN DEFAULT FALSE,
    tier VARCHAR(20) DEFAULT 'NORMAL',
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. dealers (딜러)
CREATE TABLE dealers (
    dealer_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500), -- 딜러 프로필 사진 이미지 URL (단일)
    status VARCHAR(20) DEFAULT 'ACTIVE',
    tier VARCHAR(20) DEFAULT 'NORMAL',
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dealers_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- 4. cars (중고차 매물)
CREATE TABLE cars (
    car_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT,
    dealer_id BIGINT,
    year INT,
    make VARCHAR(50),
    model VARCHAR(100),
    option VARCHAR(100),
    body VARCHAR(50),
    transmission VARCHAR(20),
    state VARCHAR(50),
    condition DOUBLE PRECISION,
    odometer DOUBLE PRECISION,
    color VARCHAR(30),
    interior VARCHAR(30),
    mmr DOUBLE PRECISION,
    sellingprice BIGINT,
    status VARCHAR(20) DEFAULT 'REGISTERED', -- 'REGISTERED', 'AUCTION_ACTIVE', 'SOLD', 'WITHDRAWN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cars_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_cars_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    CONSTRAINT chk_cars_owner CHECK ((member_id IS NOT NULL AND dealer_id IS NULL) OR (member_id IS NULL AND dealer_id IS NOT NULL))
);

-- 4-1. car_images (차량 사진 - 1:N 관계)
CREATE TABLE car_images (
    car_image_id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL, -- 사진 파일 저장 URL
    is_main BOOLEAN DEFAULT FALSE, -- 대표 사진 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_car_images_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE
);

-- 5. auctions (경매)
CREATE TABLE auctions (
    auction_id BIGSERIAL PRIMARY KEY,
    car_id BIGINT UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auctions_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE
);

-- 6. bids (블라인드 경매 입찰)
CREATE TABLE bids (
    bid_id BIGSERIAL PRIMARY KEY,
    auction_id BIGINT NOT NULL,
    dealer_id BIGINT NOT NULL,
    bid_amount BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bids_auction FOREIGN KEY (auction_id) REFERENCES auctions(auction_id) ON DELETE CASCADE,
    CONSTRAINT fk_bids_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    CONSTRAINT uq_auction_dealer UNIQUE (auction_id, dealer_id) -- 딜러당 1회 입찰 제한
);

-- 7. transactions (거래 및 수수료 정산)
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL,
    buyer_type VARCHAR(20) NOT NULL, -- 'MEMBER' or 'DEALER'
    buyer_id BIGINT NOT NULL,
    seller_type VARCHAR(20) NOT NULL, -- 'MEMBER' or 'DEALER'
    seller_id BIGINT NOT NULL,
    deal_price BIGINT NOT NULL,
    commission_rate NUMERIC(5,4) DEFAULT 0.0030, -- 기본 0.3%, 50% 감면시 0.15%
    commission_amount BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transactions_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE
);

-- 8. membership_history (상사 멤버십 가입 이력)
CREATE TABLE membership_history (
    membership_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    payment_amount BIGINT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_membership_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- 9. wishlists (관심 매물)
CREATE TABLE wishlists (
    wishlist_id BIGSERIAL PRIMARY KEY,
    member_id BIGINT,
    dealer_id BIGINT,
    car_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlists_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE,
    CONSTRAINT chk_wishlists_user CHECK ((member_id IS NOT NULL AND dealer_id IS NULL) OR (member_id IS NULL AND dealer_id IS NOT NULL))
);

-- 중복 찜 방지 조건부 유니크 인덱스
CREATE UNIQUE INDEX uq_wishlist_member_car ON wishlists (member_id, car_id) WHERE member_id IS NOT NULL;
CREATE UNIQUE INDEX uq_wishlist_dealer_car ON wishlists (dealer_id, car_id) WHERE dealer_id IS NOT NULL;
