-- 차량 추천 시연 데이터 통합 시드
-- 입력 기준:
--   1) vehicle_seller_member_db_dummy_final.csv : 일반 회원 10명
--   2) vehicle_recommendation_db_dummy_final.csv : 딜러 차량 30대 + 회원 차량 10대
-- 회원 및 차량 사진은 삽입하지 않습니다.
-- 전체가 하나의 DO 문으로 원자적으로 실행되며, 재실행 시 중복 생성하지 않습니다.

DO $vehicle_seed$
DECLARE
    dealer_vehicle_count INTEGER;
    member_vehicle_count INTEGER;
    auction_vehicle_count INTEGER;
    missing_dealers TEXT;
    newly_inserted_vehicle_count INTEGER;
    saved_member_count INTEGER;
    saved_vehicle_count INTEGER;
    saved_auction_count INTEGER;
BEGIN
    -- SQL 실행기가 문장별로 커밋했던 경우의 잔여 임시 테이블을 정리합니다.
    DROP TABLE IF EXISTS tmp_vehicle_seed_vehicles;
    DROP TABLE IF EXISTS tmp_vehicle_seed_members;

    IF to_regclass('public.members') IS NULL THEN
        RAISE EXCEPTION 'public.members 테이블이 없습니다.';
    END IF;
    IF to_regclass('public.dealers') IS NULL THEN
        RAISE EXCEPTION 'public.dealers 테이블이 없습니다.';
    END IF;
    IF to_regclass('public.cars') IS NULL THEN
        RAISE EXCEPTION 'public.cars 테이블이 없습니다.';
    END IF;
    IF to_regclass('public.auctions') IS NULL THEN
        RAISE EXCEPTION 'public.auctions 테이블이 없습니다.';
    END IF;
CREATE TEMP TABLE tmp_vehicle_seed_members (
    email VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500),
    role VARCHAR(20) NOT NULL,
    has_car BOOLEAN,
    owned_car_make VARCHAR(50),
    owned_car_model VARCHAR(100),
    owned_car_odometer DOUBLE PRECISION,
    owned_car_year INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_vehicle_seed_members (
    email, password, name, phone, profile_image_url, role,
    has_car, owned_car_make, owned_car_model, owned_car_odometer,
    owned_car_year, created_at, updated_at
)
VALUES
    ('testuser1@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '김하늘', '010-8100-0001', NULL, 'MEMBER', TRUE, 'Hyundai', 'Sonata', 19422, 2024, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser2@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '이도현', '010-8100-0002', NULL, 'MEMBER', TRUE, 'Kia', 'Sorento', 11782, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser3@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '박서연', '010-8100-0003', NULL, 'MEMBER', TRUE, 'Toyota', 'Camry', 4952, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser4@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '최민재', '010-8100-0004', NULL, 'MEMBER', TRUE, 'Honda', 'Accord', 29964, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser5@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '정지우', '010-8100-0005', NULL, 'MEMBER', TRUE, 'BMW', '3 Series', 68392, 2018, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser6@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '강현우', '010-8100-0006', NULL, 'MEMBER', TRUE, 'Mercedes-Benz', 'C-Class', 20014, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser7@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '조수빈', '010-8100-0007', NULL, 'MEMBER', TRUE, 'Volkswagen', 'Passat', 34957, 2024, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser8@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '윤서준', '010-8100-0008', NULL, 'MEMBER', TRUE, 'Nissan', 'Rogue', 31705, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser9@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '장예린', '010-8100-0009', NULL, 'MEMBER', TRUE, 'Chevrolet', 'Cruze', 70449, 2022, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('testuser10@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '임도윤', '010-8100-0010', NULL, 'MEMBER', TRUE, 'Ford', 'Escape', 101795, 2018, ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'));

CREATE TEMP TABLE tmp_vehicle_seed_vehicles (
    vehicle_id VARCHAR(50) PRIMARY KEY,
    owner_type VARCHAR(20) NOT NULL,
    sale_type VARCHAR(20) NOT NULL,
    seller_type VARCHAR(20) NOT NULL,
    price_unit VARCHAR(10) NOT NULL,
    source_dealer_id BIGINT,
    dealer_login_id VARCHAR(50),
    member_email VARCHAR(100),
    year INTEGER,
    make VARCHAR(50),
    model VARCHAR(100),
    option_text VARCHAR(100),
    body VARCHAR(50),
    transmission VARCHAR(20),
    state VARCHAR(50),
    vehicle_condition DOUBLE PRECISION,
    odometer DOUBLE PRECISION,
    color VARCHAR(30),
    interior VARCHAR(30),
    mmr DOUBLE PRECISION,
    sellingprice BIGINT,
    status VARCHAR(20),
    auction_key VARCHAR(50),
    auction_status VARCHAR(20),
    auction_start_time TIMESTAMP,
    auction_end_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_vehicle_seed_vehicles (
    vehicle_id, owner_type, sale_type, seller_type, price_unit,
    source_dealer_id, dealer_login_id, member_email,
    year, make, model, option_text, body, transmission, state,
    vehicle_condition, odometer, color, interior, mmr, sellingprice,
    status, auction_key, auction_status, auction_start_time,
    auction_end_time, created_at, updated_at
)
VALUES
    ('DEMO-DEALER-CAR-007', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1098, 'demo_dealer_1098', NULL, 2019, 'Chrysler', 'PT Cruiser', '차체자세제어장치(ESC), 통풍시트, 썬루프', '해치백', '자동', '광주광역시', 2.8468, 77358, '갈색', '회색', 5014124.42, 4710000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-23T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-23T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-010', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1086, 'demo_dealer_1086', NULL, 2007, 'Infiniti', 'QX4', '차체자세제어장치(ESC)', 'SUV', '자동', '경상남도', 2.1387, 168353, '흰색', '베이지', 674391.48, 680000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-011', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1098, 'demo_dealer_1098', NULL, 2016, 'Chevrolet', 'Silverado 1500', '네비게이션, 통풍시트, 차체자세제어장치(ESC), 열선시트, 썬루프', '픽업트럭', '자동', '서울특별시', 2.7162, 113957, '은색', '회색', 9197968.6, 9470000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-05-14T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-16T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-012', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1089, 'demo_dealer_1089', NULL, 2022, 'Honda', 'Accord', NULL, '세단', '자동', '경기도', 3.2272, 82196, '회색', '갈색', 10978718.45, 11640000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-02T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-02T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-013', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1084, 'demo_dealer_1084', NULL, 2021, 'GMC', 'Acadia', '네비게이션, 통풍시트', 'SUV', '자동', '인천광역시', 3.8376, 62595, '파랑', '검정', 18884815.35, 17750000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-016', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1083, 'demo_dealer_1083', NULL, 2013, 'Toyota', 'Corolla', '차체자세제어장치(ESC), 네비게이션, 통풍시트, 열선시트', '세단', '자동', '대구광역시', 2.2197, 258959, '진주색', '갈색', 1657138.1, 1670000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-017', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1085, 'demo_dealer_1085', NULL, 2022, 'BMW', 'X5', '통풍시트', 'SUV', '자동', '광주광역시', 3.8906, 53764, '검정', '검정', 32242340.63, 33210000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-018', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1090, 'demo_dealer_1090', NULL, 2025, 'Cadillac', 'XTS', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트', '세단', '자동', '울산광역시', 3.696, 14426, '흰색', '베이지', 33603729.36, 35620000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-07-06T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-06T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-020', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1095, 'demo_dealer_1095', NULL, 2017, 'Ford', 'Explorer Sport Trac', '차체자세제어장치(ESC), 통풍시트, 썬루프', '픽업트럭', '자동', '경상남도', 3.2171, 90091, '회색', '갈색', 10111879.21, 9810000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-021', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1082, 'demo_dealer_1082', NULL, 2021, 'Mazda', 'CX-9', '열선시트, 통풍시트, 네비게이션, 썬루프', 'SUV', '자동', '서울특별시', 3.5086, 33348, '파랑', '검정', 17873464.71, 17690000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-14T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-14T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-022', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1087, 'demo_dealer_1087', NULL, 2022, 'Kia', 'Sorento', '차체자세제어장치(ESC)', 'SUV', '자동', '경기도', 4.2017, 13582, '빨강', '베이지', 17200186.34, 17370000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-026', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1082, 'demo_dealer_1082', NULL, 2018, 'Honda', 'Civic', NULL, '세단', '자동', '대구광역시', 2.6413, 128504, '흰색', '베이지', 5460465.33, 5300000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-20T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-08T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-027', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1087, 'demo_dealer_1087', NULL, 2021, 'Mazda', 'Mazda3', NULL, '해치백', '자동', '광주광역시', 3.4142, 33960, '은색', '회색', 10244560.97, 10140000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-27T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-028', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1092, 'demo_dealer_1092', NULL, 2024, 'Mercedes-Benz', 'CLA-Class', '썬루프, 통풍시트, 열선시트', '세단', '자동', '울산광역시', 4.2591, 13039, '회색', '갈색', 31453495.56, 31770000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-029', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1097, 'demo_dealer_1097', NULL, 2013, 'Honda', 'CR-V', '열선시트', 'SUV', '자동', '충청남도', 2.6701, 185473, '파랑', '검정', 2779523.11, 2860000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-07-11T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-11T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-030', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1085, 'demo_dealer_1085', NULL, 2021, 'Infiniti', 'G Sedan', NULL, '세단', '자동', '경상남도', 3.783, 28411, '빨강', '베이지', 18994045.79, 20130000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-23T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-11T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-032', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1080, 'demo_dealer_1080', NULL, 2023, 'Ford', 'Taurus', '네비게이션, 통풍시트', '세단', '자동', '경기도', 3.5899, 67923, '진주색', '갈색', 12537202.99, 12160000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-23T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-23T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-036', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1091, 'demo_dealer_1091', NULL, 2012, 'Jaguar', 'XJ-Series', '열선시트, 차체자세제어장치(ESC), 네비게이션, 썬루프, 통풍시트', '세단', '자동', '대구광역시', 2.4517, 144720, '회색', '갈색', 2466519.24, 2610000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-042', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1080, 'demo_dealer_1080', NULL, 2021, 'Mitsubishi', 'Lancer', NULL, '해치백', '자동', '경기도', 3.219, 45812, '흰색', '베이지', 8889447.72, 9420000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-05-14T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-17T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-054', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1093, 'demo_dealer_1093', NULL, 2018, 'BMW', '3 Series', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트, 썬루프', '세단', '자동', '부산광역시', 3.2737, 64792, '빨강', '베이지', 12195861.82, 12930000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-055', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1084, 'demo_dealer_1084', NULL, 2015, 'Nissan', 'Altima', '통풍시트', '세단', '자동', '대전광역시', 2.2468, 154985, '갈색', '회색', 2868943.68, 2700000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-29T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-10T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-056', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1093, 'demo_dealer_1093', NULL, 2022, 'Jaguar', 'XJ', '네비게이션, 열선시트, 차체자세제어장치(ESC), 썬루프, 통풍시트', '세단', '자동', '대구광역시', 3.7291, 56149, '진주색', '갈색', 35808781.04, 34730000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-03T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-059', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1094, 'demo_dealer_1094', NULL, 2016, 'Honda', 'S2000', '열선시트, 통풍시트', '쿠페', '수동', '충청남도', 3.0406, 72524, '은색', '회색', 14749451.49, 15190000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-28T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-28T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-073', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1096, 'demo_dealer_1096', NULL, 2022, 'Mazda', 'CX-9', '열선시트', 'SUV', '자동', '인천광역시', 3.5839, 36685, '검정', '검정', 18014506.92, 16930000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-075', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1088, 'demo_dealer_1088', NULL, 2024, 'Cadillac', 'CTS', '차체자세제어장치(ESC)', '세단', '자동', '대전광역시', 4.4239, 9419, '은색', '회색', 32563888.57, 32240000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-076', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1081, 'demo_dealer_1081', NULL, 2022, 'Mercedes-Benz', 'C-Class', '차체자세제어장치(ESC)', '세단', '자동', '대구광역시', 3.6376, 23614, '회색', '갈색', 22125624.19, 22350000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-22T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-081', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1086, 'demo_dealer_1086', NULL, 2023, 'Hyundai', 'Elantra', '차체자세제어장치(ESC), 썬루프, 네비게이션', '해치백', '자동', '서울특별시', 3.7117, 27764, '검정', '검정', 11848992.63, 11730000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-04-28T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-10T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-083', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1081, 'demo_dealer_1081', NULL, 2020, 'Ford', 'F-150', '차체자세제어장치(ESC), 네비게이션, 열선시트, 통풍시트, 썬루프', '픽업트럭', '자동', '인천광역시', 3.2624, 125182, '은색', '회색', 14046319.72, 14470000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-05-03T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-15T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-093', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1099, 'demo_dealer_1099', NULL, 2022, 'MINI', 'Cooper Countryman', '네비게이션, 썬루프, 열선시트', 'SUV', '자동', '인천광역시', 4.0194, 38420, '파랑', '검정', 17131576.49, 16960000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-21T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-DEALER-CAR-097', 'DEALER', 'NORMAL', '회사딜러', 'KRW', 1083, 'demo_dealer_1083', NULL, 2021, 'BMW', '3 Series', '네비게이션, 썬루프, 열선시트, 차체자세제어장치(ESC)', '세단', '자동', '광주광역시', 3.8046, 37196, '검정', '검정', 20416222.17, 19190000, 'REGISTERED', NULL, NULL, NULL, NULL, ('2026-05-19T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-06-16T12:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-001', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser1@naver.com', 2024, 'Hyundai', 'Sonata', '네비게이션, 차체자세제어장치(ESC), 통풍시트, 후방카메라', '세단', '자동', '부산광역시', 3.6864, 19422, '회색', '베이지', 15013082.01, 12760000, 'REGISTERED', 'DEMO-AUCTION-001', 'ACTIVE', ('2026-07-27T09:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-002', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser2@naver.com', 2022, 'Kia', 'Sorento', '차체자세제어장치(ESC), 스마트키', 'SUV', '자동', '대전광역시', 4.2312, 11782, '파랑', '회색', 17210405.32, 14970000, 'REGISTERED', 'DEMO-AUCTION-002', 'ACTIVE', ('2026-07-27T09:10:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:10:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-003', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser3@naver.com', 2022, 'Toyota', 'Camry', '차체자세제어장치(ESC), 통풍시트, 후방카메라', '세단', '자동', '대구광역시', 4.1198, 4952, '빨강', '갈색', 15512457.92, 13650000, 'REGISTERED', 'DEMO-AUCTION-003', 'ACTIVE', ('2026-07-27T09:20:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:20:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-004', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser4@naver.com', 2022, 'Honda', 'Accord', '썬루프, 통풍시트, 차체자세제어장치(ESC), 스마트키', '세단', '자동', '광주광역시', 3.4924, 29964, '갈색', '검정', 13848457.61, 12330000, 'REGISTERED', 'DEMO-AUCTION-004', 'ACTIVE', ('2026-07-27T09:30:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:30:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-005', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser5@naver.com', 2018, 'BMW', '3 Series', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트, 썬루프', '세단', '자동', '울산광역시', 3.2505, 68392, '진주색', '베이지', 12226170.01, 11000000, 'REGISTERED', 'DEMO-AUCTION-005', 'ACTIVE', ('2026-07-27T09:40:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:40:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-006', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser6@naver.com', 2022, 'Mercedes-Benz', 'C-Class', '차체자세제어장치(ESC), 스마트키', '세단', '자동', '충청남도', 3.6627, 20014, '검정', '회색', 22929014.08, 20870000, 'REGISTERED', 'DEMO-AUCTION-006', 'ACTIVE', ('2026-07-27T09:50:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T09:50:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-007', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser7@naver.com', 2024, 'Volkswagen', 'Passat', '썬루프, 열선시트, 차체자세제어장치(ESC), 후방카메라', '세단', '자동', '경상남도', 3.8027, 34957, '흰색', '갈색', 14293579.91, 13150000, 'REGISTERED', 'DEMO-AUCTION-007', 'ACTIVE', ('2026-07-27T10:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T10:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-008', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser8@naver.com', 2022, 'Nissan', 'Rogue', '차체자세제어장치(ESC), 스마트키', 'SUV', '자동', '서울특별시', 3.8124, 31705, '은색', '검정', 15183705.53, 14120000, 'REGISTERED', 'DEMO-AUCTION-008', 'ACTIVE', ('2026-07-27T10:10:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T10:10:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-009', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser9@naver.com', 2022, 'Chevrolet', 'Cruze', '썬루프, 열선시트, 통풍시트, 네비게이션, 차체자세제어장치(ESC)', '세단', '자동', '경기도', 3.2632, 70449, '회색', '베이지', 8357815.11, 7190000, 'REGISTERED', 'DEMO-AUCTION-009', 'ACTIVE', ('2026-07-27T10:20:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T10:20:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul')),
    ('DEMO-MEMBER-CAR-010', 'MEMBER', 'AUCTION', '일반회원', 'KRW', NULL, NULL, 'testuser10@naver.com', 2018, 'Ford', 'Escape', '네비게이션, 통풍시트, 썬루프, 열선시트, 차체자세제어장치(ESC)', 'SUV', '자동', '인천광역시', 3.0838, 101795, '파랑', '회색', 6253811.18, 5570000, 'REGISTERED', 'DEMO-AUCTION-010', 'ACTIVE', ('2026-07-27T10:30:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-30T10:30:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'), ('2026-07-24T13:00:00+09:00'::timestamptz AT TIME ZONE 'Asia/Seoul'));

    SELECT
        COUNT(*) FILTER (WHERE owner_type = 'DEALER'),
        COUNT(*) FILTER (WHERE owner_type = 'MEMBER'),
        COUNT(*) FILTER (WHERE auction_key IS NOT NULL)
    INTO dealer_vehicle_count, member_vehicle_count, auction_vehicle_count
    FROM tmp_vehicle_seed_vehicles;

    IF dealer_vehicle_count <> 30
       OR member_vehicle_count <> 10
       OR auction_vehicle_count <> 10 THEN
        RAISE EXCEPTION
            '원본 차량 건수 오류: 딜러 %, 회원 %, 경매 %',
            dealer_vehicle_count, member_vehicle_count, auction_vehicle_count;
    END IF;

    IF (SELECT COUNT(*) FROM tmp_vehicle_seed_members) <> 10 THEN
        RAISE EXCEPTION '원본 회원 건수가 10명이 아닙니다.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_vehicle_seed_members
        WHERE NULLIF(BTRIM(profile_image_url), '') IS NOT NULL
    ) THEN
        RAISE EXCEPTION '회원 profile_image_url은 모두 빈칸이어야 합니다.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_vehicle_seed_vehicles
        WHERE (owner_type = 'DEALER' AND (
                   dealer_login_id IS NULL OR member_email IS NOT NULL
              ))
           OR (owner_type = 'MEMBER' AND (
                   member_email IS NULL OR dealer_login_id IS NOT NULL
              ))
           OR owner_type NOT IN ('DEALER', 'MEMBER')
    ) THEN
        RAISE EXCEPTION '차량 판매자 구분과 참조 키가 일치하지 않습니다.';
    END IF;

    SELECT string_agg(source.dealer_login_id, ', ' ORDER BY source.dealer_login_id)
    INTO missing_dealers
    FROM (
        SELECT DISTINCT dealer_login_id
        FROM tmp_vehicle_seed_vehicles
        WHERE owner_type = 'DEALER'
    ) source
    LEFT JOIN public.dealers d ON d.login_id = source.dealer_login_id
    WHERE d.dealer_id IS NULL;

    IF missing_dealers IS NOT NULL THEN
        RAISE EXCEPTION '차량 판매 딜러가 DB에 없습니다: %', missing_dealers;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tmp_vehicle_seed_vehicles v
        LEFT JOIN tmp_vehicle_seed_members m ON m.email = v.member_email
        WHERE v.owner_type = 'MEMBER' AND m.email IS NULL
    ) THEN
        RAISE EXCEPTION '회원 차량의 member_email이 회원 CSV에 없습니다.';
    END IF;
INSERT INTO public.members (
    email, password, name, phone, profile_image_url, role, created_at, updated_at
)
SELECT
    email, password, name, phone, NULL, role, created_at, updated_at
FROM tmp_vehicle_seed_members
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    profile_image_url = NULL,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Member.java의 보유 차량 컬럼이 DB에 있을 때만 값을 동기화합니다.
    IF (
        SELECT COUNT(*) = 5
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'members'
          AND column_name IN (
              'has_car', 'owned_car_make', 'owned_car_model',
              'owned_car_odometer', 'owned_car_year'
          )
    ) THEN
        EXECUTE $member_update$
            UPDATE public.members m
            SET has_car = source.has_car,
                owned_car_make = source.owned_car_make,
                owned_car_model = source.owned_car_model,
                owned_car_odometer = source.owned_car_odometer,
                owned_car_year = source.owned_car_year
            FROM pg_temp.tmp_vehicle_seed_members source
            WHERE m.email = source.email
        $member_update$;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'members'
          AND column_name = 'owned_car_image_url'
    ) THEN
        EXECUTE $member_image_update$
            UPDATE public.members m
            SET owned_car_image_url = NULL
            FROM pg_temp.tmp_vehicle_seed_members source
            WHERE m.email = source.email
        $member_image_update$;
    END IF;
WITH resolved_vehicle AS (
    SELECT
        source.*,
        CASE WHEN source.owner_type = 'MEMBER' THEN m.member_id END AS member_id,
        CASE WHEN source.owner_type = 'DEALER' THEN d.dealer_id END AS dealer_id
    FROM tmp_vehicle_seed_vehicles source
    LEFT JOIN public.members m
      ON source.owner_type = 'MEMBER'
     AND m.email = source.member_email
    LEFT JOIN public.dealers d
      ON source.owner_type = 'DEALER'
     AND d.login_id = source.dealer_login_id
), inserted_vehicle AS (
    INSERT INTO public.cars (
        member_id, dealer_id, year, make, model, option, body,
        transmission, state, condition, odometer, color, interior,
        mmr, sellingprice, status, created_at, updated_at
    )
    SELECT
        source.member_id, source.dealer_id, source.year, source.make,
        source.model, source.option_text, source.body, source.transmission,
        source.state, source.vehicle_condition, source.odometer, source.color,
        source.interior, source.mmr, source.sellingprice, source.status,
        source.created_at, source.updated_at
    FROM resolved_vehicle source
    WHERE (
        (source.owner_type = 'DEALER' AND source.dealer_id IS NOT NULL)
        OR (source.owner_type = 'MEMBER' AND source.member_id IS NOT NULL)
    )
      AND NOT EXISTS (
          SELECT 1
          FROM public.cars car
          WHERE car.year = source.year
            AND car.make = source.make
            AND car.model = source.model
            AND car.odometer = source.odometer
            AND car.sellingprice = source.sellingprice
            AND car.created_at = source.created_at
            AND (
                (source.owner_type = 'DEALER' AND car.dealer_id = source.dealer_id)
                OR (source.owner_type = 'MEMBER' AND car.member_id = source.member_id)
            )
      )
    RETURNING car_id
)
SELECT COUNT(*)
INTO newly_inserted_vehicle_count
FROM inserted_vehicle;

    RAISE NOTICE '새로 저장된 차량: %대', newly_inserted_vehicle_count;

WITH resolved_auction AS (
    SELECT
        source.vehicle_id,
        source.auction_key,
        source.auction_start_time,
        source.auction_end_time,
        source.auction_status,
        car.car_id
    FROM tmp_vehicle_seed_vehicles source
    JOIN public.members m ON m.email = source.member_email
    JOIN public.cars car
      ON car.member_id = m.member_id
     AND car.year = source.year
     AND car.make = source.make
     AND car.model = source.model
     AND car.odometer = source.odometer
     AND car.sellingprice = source.sellingprice
     AND car.created_at = source.created_at
    WHERE source.owner_type = 'MEMBER'
      AND source.auction_key IS NOT NULL
)
INSERT INTO public.auctions (
    car_id, start_time, end_time, status, created_at
)
SELECT
    car_id,
    auction_start_time,
    auction_end_time,
    auction_status,
    auction_start_time
FROM resolved_auction
ON CONFLICT (car_id) DO UPDATE
SET start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    status = EXCLUDED.status;

    SELECT COUNT(*)
    INTO saved_member_count
    FROM tmp_vehicle_seed_members source
    WHERE EXISTS (
        SELECT 1
        FROM public.members m
        WHERE m.email = source.email
    );

    SELECT COUNT(*)
    INTO saved_vehicle_count
    FROM tmp_vehicle_seed_vehicles source
    WHERE EXISTS (
        SELECT 1
        FROM public.cars car
        LEFT JOIN public.members m ON m.member_id = car.member_id
        LEFT JOIN public.dealers d ON d.dealer_id = car.dealer_id
        WHERE car.year = source.year
          AND car.make = source.make
          AND car.model = source.model
          AND car.odometer = source.odometer
          AND car.sellingprice = source.sellingprice
          AND car.created_at = source.created_at
          AND (
              (source.owner_type = 'MEMBER' AND m.email = source.member_email)
              OR
              (source.owner_type = 'DEALER' AND d.login_id = source.dealer_login_id)
          )
    );

    SELECT COUNT(*)
    INTO saved_auction_count
    FROM tmp_vehicle_seed_vehicles source
    WHERE source.owner_type = 'MEMBER'
      AND source.auction_key IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM public.members m
          JOIN public.cars car ON car.member_id = m.member_id
          JOIN public.auctions auction ON auction.car_id = car.car_id
          WHERE m.email = source.member_email
            AND car.year = source.year
            AND car.make = source.make
            AND car.model = source.model
            AND car.odometer = source.odometer
            AND car.sellingprice = source.sellingprice
            AND car.created_at = source.created_at
            AND auction.start_time = source.auction_start_time
            AND auction.end_time = source.auction_end_time
            AND auction.status = source.auction_status
      );

    IF saved_member_count <> 10 THEN
        RAISE EXCEPTION '회원 저장 건수 오류: 예상 10명, 확인 %명', saved_member_count;
    END IF;
    IF saved_vehicle_count <> 40 THEN
        RAISE EXCEPTION '차량 저장 건수 오류: 예상 40대, 확인 %대', saved_vehicle_count;
    END IF;
    IF saved_auction_count <> 10 THEN
        RAISE EXCEPTION '경매 저장 건수 오류: 예상 10건, 확인 %건', saved_auction_count;
    END IF;

    RAISE NOTICE '차량 추천 시드 저장 완료: 회원 %, 차량 %, 경매 %',
        saved_member_count, saved_vehicle_count, saved_auction_count;
END
$vehicle_seed$;
