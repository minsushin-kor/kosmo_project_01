-- 일반 구매자 차량 추천 시연 데이터: 딜러 차량 100대 + 개인 판매 차량 10대
-- 기존 companies, dealers, dealer_churn, company_churn 데이터는 수정하지 않습니다.
-- 차량 이미지는 이번 범위에서 생성하지 않습니다.
-- 금액은 Spring Boot 거래·수수료 계산 기준에 맞춰 원(KRW) 단위로 저장하고 10,000원 단위로 반올림했습니다.
-- 딜러 차량 100대는 일반회원 대상 일반 판매이며, 일반회원 차량 10대는 딜러 대상 ACTIVE 경매입니다.
-- 딜러 차량은 이탈 확률 40% 미만인 Safe·Low 딜러에게만 배정하고 등록·수정 시점은 마지막 활동일보다 늦지 않게 구성했습니다.

BEGIN;

DO $$
BEGIN
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
END
$$;

WITH expected_dealers(login_id) AS (
    VALUES
        ('demo_dealer_1000'),
        ('demo_dealer_1001'),
        ('demo_dealer_1002'),
        ('demo_dealer_1003'),
        ('demo_dealer_1004'),
        ('demo_dealer_1005'),
        ('demo_dealer_1006'),
        ('demo_dealer_1007'),
        ('demo_dealer_1008'),
        ('demo_dealer_1009'),
        ('demo_dealer_1010'),
        ('demo_dealer_1011'),
        ('demo_dealer_1012'),
        ('demo_dealer_1013'),
        ('demo_dealer_1014'),
        ('demo_dealer_1015'),
        ('demo_dealer_1016'),
        ('demo_dealer_1017'),
        ('demo_dealer_1018'),
        ('demo_dealer_1019'),
        ('demo_dealer_1020'),
        ('demo_dealer_1021'),
        ('demo_dealer_1022'),
        ('demo_dealer_1023'),
        ('demo_dealer_1024'),
        ('demo_dealer_1025'),
        ('demo_dealer_1026'),
        ('demo_dealer_1027'),
        ('demo_dealer_1028'),
        ('demo_dealer_1029'),
        ('demo_dealer_1030'),
        ('demo_dealer_1031'),
        ('demo_dealer_1032'),
        ('demo_dealer_1033'),
        ('demo_dealer_1034'),
        ('demo_dealer_1035'),
        ('demo_dealer_1036'),
        ('demo_dealer_1037'),
        ('demo_dealer_1038'),
        ('demo_dealer_1039'),
        ('demo_dealer_1040'),
        ('demo_dealer_1041'),
        ('demo_dealer_1042'),
        ('demo_dealer_1043'),
        ('demo_dealer_1044'),
        ('demo_dealer_1045'),
        ('demo_dealer_1046'),
        ('demo_dealer_1047'),
        ('demo_dealer_1048'),
        ('demo_dealer_1049'),
        ('demo_dealer_1050'),
        ('demo_dealer_1051'),
        ('demo_dealer_1052'),
        ('demo_dealer_1053'),
        ('demo_dealer_1054'),
        ('demo_dealer_1055'),
        ('demo_dealer_1056'),
        ('demo_dealer_1057'),
        ('demo_dealer_1058'),
        ('demo_dealer_1059'),
        ('demo_dealer_1060'),
        ('demo_dealer_1061'),
        ('demo_dealer_1062'),
        ('demo_dealer_1063'),
        ('demo_dealer_1064'),
        ('demo_dealer_1065'),
        ('demo_dealer_1066'),
        ('demo_dealer_1067'),
        ('demo_dealer_1068'),
        ('demo_dealer_1069'),
        ('demo_dealer_1070'),
        ('demo_dealer_1071'),
        ('demo_dealer_1072'),
        ('demo_dealer_1073'),
        ('demo_dealer_1074'),
        ('demo_dealer_1075'),
        ('demo_dealer_1076'),
        ('demo_dealer_1077'),
        ('demo_dealer_1078'),
        ('demo_dealer_1079'),
        ('demo_dealer_1080'),
        ('demo_dealer_1081'),
        ('demo_dealer_1082'),
        ('demo_dealer_1083'),
        ('demo_dealer_1084'),
        ('demo_dealer_1085'),
        ('demo_dealer_1086'),
        ('demo_dealer_1087'),
        ('demo_dealer_1088'),
        ('demo_dealer_1089'),
        ('demo_dealer_1090'),
        ('demo_dealer_1091'),
        ('demo_dealer_1092'),
        ('demo_dealer_1093'),
        ('demo_dealer_1094'),
        ('demo_dealer_1095'),
        ('demo_dealer_1096'),
        ('demo_dealer_1097'),
        ('demo_dealer_1098'),
        ('demo_dealer_1099')
)
SELECT CASE
    WHEN COUNT(d.dealer_id) = 100 THEN 1
    ELSE (1 / 0)
END AS all_100_dealers_exist
FROM expected_dealers e
LEFT JOIN public.dealers d ON d.login_id = e.login_id;

INSERT INTO public.members (
    email, password, name, phone, profile_image_url, role, created_at, updated_at
)
VALUES
    ('testuser1@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '김하늘', '010-8100-0001', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser2@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '이도현', '010-8100-0002', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser3@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '박서연', '010-8100-0003', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser4@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '최민재', '010-8100-0004', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser5@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '정지우', '010-8100-0005', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser6@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '강현우', '010-8100-0006', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser7@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '조수빈', '010-8100-0007', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser8@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '윤서준', '010-8100-0008', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser9@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '장예린', '010-8100-0009', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
    ('testuser10@naver.com', '$2a$10$26YWGxXYqYIW8EF0RJ/De.K1aOUO2cH0AiKJWiWufog0V5vRSrBvC', '임도윤', '010-8100-0010', NULL, 'MEMBER', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp)
ON CONFLICT (email) DO NOTHING;

-- Member.java의 보유 차량 컬럼이 실제 DB에도 있을 때만 값을 채웁니다.
-- schema.sql로 생성한 테이블처럼 해당 컬럼이 없으면 이 단계는 안전하게 건너뜁니다.
DO $$
BEGIN
    IF (
        SELECT COUNT(*) = 6
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'members'
          AND column_name IN (
              'has_car', 'owned_car_make', 'owned_car_model',
              'owned_car_odometer', 'owned_car_year', 'email'
          )
    ) THEN
        EXECUTE $member_update$
            WITH personal_source (
                email, has_car, owned_car_make, owned_car_model,
                owned_car_odometer, owned_car_year
            ) AS (
                VALUES
        ('testuser1@naver.com', TRUE, 'Hyundai', 'Sonata', 19422, 2024),
        ('testuser2@naver.com', TRUE, 'Kia', 'Sorento', 11782, 2022),
        ('testuser3@naver.com', TRUE, 'Toyota', 'Camry', 4952, 2022),
        ('testuser4@naver.com', TRUE, 'Honda', 'Accord', 29964, 2022),
        ('testuser5@naver.com', TRUE, 'BMW', '3 Series', 68392, 2018),
        ('testuser6@naver.com', TRUE, 'Mercedes-Benz', 'C-Class', 20014, 2022),
        ('testuser7@naver.com', TRUE, 'Volkswagen', 'Passat', 34957, 2024),
        ('testuser8@naver.com', TRUE, 'Nissan', 'Rogue', 31705, 2022),
        ('testuser9@naver.com', TRUE, 'Chevrolet', 'Cruze', 70449, 2022),
        ('testuser10@naver.com', TRUE, 'Ford', 'Escape', 101795, 2018)
            )
            UPDATE public.members m
            SET has_car = s.has_car,
                owned_car_make = s.owned_car_make,
                owned_car_model = s.owned_car_model,
                owned_car_odometer = s.owned_car_odometer,
                owned_car_year = s.owned_car_year
            FROM personal_source s
            WHERE m.email = s.email
        $member_update$;
    END IF;
END
$$;

WITH vehicle_source (
    vehicle_key, owner_type, owner_key, year, make, model, option_text,
    body, transmission, state, condition, odometer, color, interior,
    mmr, sellingprice, status, created_at, updated_at
) AS (
    VALUES
        ('DEMO-DEALER-CAR-001', 'DEALER', 'demo_dealer_1072', 2022, 'MINI', 'Cooper', '', '해치백', '수동', '서울특별시', 4.0723, 14514, '검정', '검정', 14861568.5, 13970000, 'REGISTERED', '2026-01-23T12:00:00'::timestamp, '2026-01-23T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-002', 'DEALER', 'demo_dealer_1074', 2022, 'Honda', 'Accord', '썬루프, 통풍시트, 차체자세제어장치(ESC)', '세단', '자동', '경기도', 3.4937, 28164, '흰색', '베이지', 14030963.32, 13610000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp, '2026-02-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-003', 'DEALER', 'demo_dealer_1058', 2023, 'Dodge', 'Charger', '네비게이션, 열선시트, 차체자세제어장치(ESC), 썬루프, 통풍시트', '세단', '자동', '인천광역시', 3.9214, 19276, '은색', '회색', 18947201, 18760000, 'REGISTERED', '2026-06-02T12:00:00'::timestamp, '2026-06-02T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-004', 'DEALER', 'demo_dealer_1075', 2022, 'Chrysler', '200', '', '세단', '자동', '부산광역시', 3.6729, 32018, '회색', '갈색', 11144316.34, 11260000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp, '2026-02-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-005', 'DEALER', 'demo_dealer_1056', 2022, 'Ford', 'Focus', '썬루프, 차체자세제어장치(ESC), 네비게이션', '해치백', '자동', '대전광역시', 3.4327, 63976, '파랑', '검정', 8438785.19, 8690000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp, '2026-05-30T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-006', 'DEALER', 'demo_dealer_1055', 2022, 'Scion', 'tC', '네비게이션, 열선시트, 썬루프, 차체자세제어장치(ESC), 통풍시트', '쿠페', '자동', '대구광역시', 3.3395, 49454, '빨강', '베이지', 11110575.67, 11780000, 'REGISTERED', '2026-06-06T12:00:00'::timestamp, '2026-06-06T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-007', 'DEALER', 'demo_dealer_1098', 2019, 'Chrysler', 'PT Cruiser', '차체자세제어장치(ESC), 통풍시트, 썬루프', '해치백', '자동', '광주광역시', 2.8468, 77358, '갈색', '회색', 5014124.42, 4710000, 'REGISTERED', '2026-06-23T12:00:00'::timestamp, '2026-06-23T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-008', 'DEALER', 'demo_dealer_1068', 2022, 'Toyota', 'Camry', '차체자세제어장치(ESC), 통풍시트', '세단', '자동', '울산광역시', 4.1198, 4952, '진주색', '갈색', 15512457.92, 15050000, 'REGISTERED', '2026-02-08T12:00:00'::timestamp, '2026-02-08T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-009', 'DEALER', 'demo_dealer_1053', 2016, 'Chevrolet', 'Impala', '', '세단', '자동', '충청남도', 2.4252, 129179, '검정', '검정', 3432965.83, 3400000, 'REGISTERED', '2026-05-26T12:00:00'::timestamp, '2026-05-26T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-010', 'DEALER', 'demo_dealer_1086', 2007, 'Infiniti', 'QX4', '차체자세제어장치(ESC)', 'SUV', '자동', '경상남도', 2.1387, 168353, '흰색', '베이지', 674391.48, 680000, 'REGISTERED', '2026-06-15T12:00:00'::timestamp, '2026-06-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-011', 'DEALER', 'demo_dealer_1098', 2016, 'Chevrolet', 'Silverado 1500', '네비게이션, 통풍시트, 차체자세제어장치(ESC), 열선시트, 썬루프', '픽업트럭', '자동', '서울특별시', 2.7162, 113957, '은색', '회색', 9197968.6, 9470000, 'REGISTERED', '2026-05-14T12:00:00'::timestamp, '2026-06-16T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-012', 'DEALER', 'demo_dealer_1089', 2022, 'Honda', 'Accord', '', '세단', '자동', '경기도', 3.2272, 82196, '회색', '갈색', 10978718.45, 11640000, 'REGISTERED', '2026-06-02T12:00:00'::timestamp, '2026-06-02T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-013', 'DEALER', 'demo_dealer_1084', 2021, 'GMC', 'Acadia', '네비게이션, 통풍시트', 'SUV', '자동', '인천광역시', 3.8376, 62595, '파랑', '검정', 18884815.35, 17750000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp, '2026-06-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-014', 'DEALER', 'demo_dealer_1056', 2019, 'Chrysler', '300', '통풍시트', '세단', '자동', '부산광역시', 3.3424, 61245, '빨강', '베이지', 10721995.44, 10400000, 'REGISTERED', '2026-04-17T12:00:00'::timestamp, '2026-05-20T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-015', 'DEALER', 'demo_dealer_1064', 2023, 'Honda', 'Pilot', '', 'SUV', '자동', '대전광역시', 3.965, 39329, '갈색', '회색', 24058434.21, 23820000, 'REGISTERED', '2026-03-13T12:00:00'::timestamp, '2026-03-13T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-016', 'DEALER', 'demo_dealer_1083', 2013, 'Toyota', 'Corolla', '차체자세제어장치(ESC), 네비게이션, 통풍시트, 열선시트', '세단', '자동', '대구광역시', 2.2197, 258959, '진주색', '갈색', 1657138.1, 1670000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp, '2026-06-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-017', 'DEALER', 'demo_dealer_1085', 2022, 'BMW', 'X5', '통풍시트', 'SUV', '자동', '광주광역시', 3.8906, 53764, '검정', '검정', 32242340.63, 33210000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp, '2026-06-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-018', 'DEALER', 'demo_dealer_1090', 2025, 'Cadillac', 'XTS', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트', '세단', '자동', '울산광역시', 3.696, 14426, '흰색', '베이지', 33603729.36, 35620000, 'REGISTERED', '2026-07-06T12:00:00'::timestamp, '2026-07-06T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-019', 'DEALER', 'demo_dealer_1073', 2015, 'Chevrolet', 'Monte Carlo', '통풍시트, 썬루프, 차체자세제어장치(ESC), 네비게이션, 열선시트', '쿠페', '자동', '충청남도', 2.5265, 98087, '은색', '회색', 3449238.93, 3240000, 'REGISTERED', '2026-02-02T12:00:00'::timestamp, '2026-02-02T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-020', 'DEALER', 'demo_dealer_1095', 2017, 'Ford', 'Explorer Sport Trac', '차체자세제어장치(ESC), 통풍시트, 썬루프', '픽업트럭', '자동', '경상남도', 3.2171, 90091, '회색', '갈색', 10111879.21, 9810000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-021', 'DEALER', 'demo_dealer_1082', 2021, 'Mazda', 'CX-9', '열선시트, 통풍시트, 네비게이션, 썬루프', 'SUV', '자동', '서울특별시', 3.5086, 33348, '파랑', '검정', 17873464.71, 17690000, 'REGISTERED', '2026-06-14T12:00:00'::timestamp, '2026-06-14T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-022', 'DEALER', 'demo_dealer_1087', 2022, 'Kia', 'Sorento', '차체자세제어장치(ESC)', 'SUV', '자동', '경기도', 4.2017, 13582, '빨강', '베이지', 17200186.34, 17370000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-023', 'DEALER', 'demo_dealer_1095', 2017, 'Chevrolet', 'Equinox', '열선시트, 네비게이션, 썬루프, 차체자세제어장치(ESC), 통풍시트', 'SUV', '자동', '인천광역시', 3.1661, 69412, '갈색', '회색', 8151160.75, 8400000, 'REGISTERED', '2026-05-01T12:00:00'::timestamp, '2026-06-11T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-024', 'DEALER', 'demo_dealer_1062', 2021, 'Hyundai', 'Accent', '썬루프, 열선시트, 네비게이션, 차체자세제어장치(ESC), 통풍시트', '해치백', '자동', '부산광역시', 3.3869, 22692, '진주색', '갈색', 8327865.1, 8830000, 'REGISTERED', '2026-02-01T12:00:00'::timestamp, '2026-02-01T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-025', 'DEALER', 'demo_dealer_1071', 2020, 'Cadillac', 'CTS', '차체자세제어장치(ESC), 통풍시트, 네비게이션, 열선시트, 썬루프', '세단', '자동', '대전광역시', 3.7072, 52871, '검정', '검정', 15616601.16, 14680000, 'REGISTERED', '2026-01-24T12:00:00'::timestamp, '2026-01-24T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-026', 'DEALER', 'demo_dealer_1082', 2018, 'Honda', 'Civic', '', '세단', '자동', '대구광역시', 2.6413, 128504, '흰색', '베이지', 5460465.33, 5300000, 'REGISTERED', '2026-04-20T12:00:00'::timestamp, '2026-06-08T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-027', 'DEALER', 'demo_dealer_1087', 2021, 'Mazda', 'Mazda3', '', '해치백', '자동', '광주광역시', 3.4142, 33960, '은색', '회색', 10244560.97, 10140000, 'REGISTERED', '2026-04-27T12:00:00'::timestamp, '2026-06-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-028', 'DEALER', 'demo_dealer_1092', 2024, 'Mercedes-Benz', 'CLA-Class', '썬루프, 통풍시트, 열선시트', '세단', '자동', '울산광역시', 4.2591, 13039, '회색', '갈색', 31453495.56, 31770000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-029', 'DEALER', 'demo_dealer_1097', 2013, 'Honda', 'CR-V', '열선시트', 'SUV', '자동', '충청남도', 2.6701, 185473, '파랑', '검정', 2779523.11, 2860000, 'REGISTERED', '2026-07-11T12:00:00'::timestamp, '2026-07-11T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-030', 'DEALER', 'demo_dealer_1085', 2021, 'Infiniti', 'G Sedan', '', '세단', '자동', '경상남도', 3.783, 28411, '빨강', '베이지', 18994045.79, 20130000, 'REGISTERED', '2026-04-23T12:00:00'::timestamp, '2026-06-11T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-031', 'DEALER', 'demo_dealer_1095', 2017, 'Ford', 'Explorer', '썬루프, 네비게이션, 열선시트, 차체자세제어장치(ESC), 통풍시트', 'SUV', '자동', '서울특별시', 2.7304, 177743, '갈색', '회색', 3729998.02, 3510000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp, '2026-05-28T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-032', 'DEALER', 'demo_dealer_1080', 2023, 'Ford', 'Taurus', '네비게이션, 통풍시트', '세단', '자동', '경기도', 3.5899, 67923, '진주색', '갈색', 12537202.99, 12160000, 'REGISTERED', '2026-06-23T12:00:00'::timestamp, '2026-06-23T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-033', 'DEALER', 'demo_dealer_1097', 2024, 'Toyota', 'Camry', '열선시트, 차체자세제어장치(ESC), 통풍시트, 썬루프, 네비게이션', '세단', '자동', '인천광역시', 4.0762, 10815, '검정', '검정', 16555992.65, 16390000, 'REGISTERED', '2026-06-10T12:00:00'::timestamp, '2026-07-06T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-034', 'DEALER', 'demo_dealer_1075', 2020, 'Dodge', 'Journey', '', 'SUV', '자동', '부산광역시', 3.1426, 99979, '흰색', '베이지', 7981136.45, 8060000, 'REGISTERED', '2026-01-14T12:00:00'::timestamp, '2026-02-09T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-035', 'DEALER', 'demo_dealer_1054', 2024, 'Nissan', 'Armada', '열선시트, 통풍시트, 썬루프, 네비게이션, 차체자세제어장치(ESC)', 'SUV', '자동', '대전광역시', 4.0128, 15393, '은색', '회색', 26450904.57, 27240000, 'REGISTERED', '2026-05-29T12:00:00'::timestamp, '2026-05-29T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-036', 'DEALER', 'demo_dealer_1091', 2012, 'Jaguar', 'XJ-Series', '열선시트, 차체자세제어장치(ESC), 네비게이션, 썬루프, 통풍시트', '세단', '자동', '대구광역시', 2.4517, 144720, '회색', '갈색', 2466519.24, 2610000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-037', 'DEALER', 'demo_dealer_1069', 2022, 'Nissan', 'Rogue', '차체자세제어장치(ESC)', 'SUV', '자동', '광주광역시', 3.8124, 31705, '파랑', '검정', 15183705.53, 14270000, 'REGISTERED', '2026-01-17T12:00:00'::timestamp, '2026-01-17T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-038', 'DEALER', 'demo_dealer_1089', 2022, 'Chrysler', 'Town and Country', '네비게이션, 통풍시트, 차체자세제어장치(ESC), 열선시트, 썬루프', '밴', '자동', '울산광역시', 3.7088, 44265, '빨강', '베이지', 15927900.22, 15450000, 'REGISTERED', '2026-04-27T12:00:00'::timestamp, '2026-05-23T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-039', 'DEALER', 'demo_dealer_1090', 2019, 'Infiniti', 'M35', '차체자세제어장치(ESC), 네비게이션, 열선시트, 썬루프', '세단', '자동', '충청남도', 3.1592, 101658, '갈색', '회색', 11792381.54, 11670000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp, '2026-06-25T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-040', 'DEALER', 'demo_dealer_1098', 2018, 'Chevrolet', 'Aveo', '통풍시트, 차체자세제어장치(ESC), 네비게이션', '해치백', '자동', '경상남도', 2.622, 72387, '진주색', '갈색', 5253552.36, 5310000, 'REGISTERED', '2026-02-14T12:00:00'::timestamp, '2026-05-20T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-041', 'DEALER', 'demo_dealer_1069', 2023, 'Dodge', 'Avenger', '네비게이션, 썬루프, 열선시트, 차체자세제어장치(ESC), 통풍시트', '세단', '자동', '서울특별시', 3.5829, 31394, '검정', '검정', 10904763.11, 11230000, 'REGISTERED', '2025-12-09T12:00:00'::timestamp, '2026-01-12T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-042', 'DEALER', 'demo_dealer_1080', 2021, 'Mitsubishi', 'Lancer', '', '해치백', '자동', '경기도', 3.219, 45812, '흰색', '베이지', 8889447.72, 9420000, 'REGISTERED', '2026-05-14T12:00:00'::timestamp, '2026-06-17T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-043', 'DEALER', 'demo_dealer_1085', 2010, 'Mercedes-Benz', 'E-Class', '네비게이션', '세단', '자동', '인천광역시', 2.4679, 128442, '은색', '회색', 2388342.49, 2250000, 'REGISTERED', '2026-02-09T12:00:00'::timestamp, '2026-06-04T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-044', 'DEALER', 'demo_dealer_1052', 2022, 'BMW', 'X5', '차체자세제어장치(ESC), 썬루프', 'SUV', '자동', '부산광역시', 4.0096, 36157, '회색', '갈색', 35070940.58, 34020000, 'REGISTERED', '2026-06-06T12:00:00'::timestamp, '2026-06-06T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-045', 'DEALER', 'demo_dealer_1092', 2017, 'GMC', 'Sierra 1500 Classic', '차체자세제어장치(ESC)', '픽업트럭', '자동', '대전광역시', 2.909, 194385, '파랑', '검정', 8526480.9, 8440000, 'REGISTERED', '2026-05-10T12:00:00'::timestamp, '2026-06-13T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-046', 'DEALER', 'demo_dealer_1052', 2018, 'Chevrolet', 'Express Cargo', '네비게이션, 차체자세제어장치(ESC), 통풍시트', '밴', '자동', '대구광역시', 2.3942, 171733, '빨강', '베이지', 5021003.25, 5070000, 'REGISTERED', '2026-04-23T12:00:00'::timestamp, '2026-05-27T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-047', 'DEALER', 'demo_dealer_1077', 2023, 'Chrysler', '200', '차체자세제어장치(ESC), 썬루프, 열선시트, 통풍시트, 네비게이션', '세단', '자동', '광주광역시', 4.0054, 12882, '갈색', '회색', 13214301.91, 13610000, 'REGISTERED', '2026-03-07T12:00:00'::timestamp, '2026-03-07T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-048', 'DEALER', 'demo_dealer_1089', 2022, 'Chevrolet', 'Cruze', '썬루프, 열선시트, 통풍시트, 네비게이션, 차체자세제어장치(ESC)', '세단', '자동', '울산광역시', 3.2444, 68649, '진주색', '갈색', 8525962.98, 9040000, 'REGISTERED', '2026-01-16T12:00:00'::timestamp, '2026-05-11T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-049', 'DEALER', 'demo_dealer_1051', 2022, 'Nissan', 'Altima', '썬루프', '세단', '자동', '충청남도', 3.7944, 18735, '검정', '검정', 13236842.27, 12440000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp, '2026-05-30T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-050', 'DEALER', 'demo_dealer_1066', 2011, 'BMW', '7 Series', '차체자세제어장치(ESC)', '세단', '자동', '경상남도', 2.6036, 102789, '흰색', '베이지', 3890234.87, 3770000, 'REGISTERED', '2026-02-20T12:00:00'::timestamp, '2026-02-20T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-051', 'DEALER', 'demo_dealer_1050', 2015, 'Buick', 'LaCrosse', '통풍시트, 열선시트, 차체자세제어장치(ESC), 네비게이션', '세단', '자동', '서울특별시', 3.0388, 80369, '은색', '회색', 4962722.39, 4910000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp, '2026-05-30T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-052', 'DEALER', 'demo_dealer_1065', 2011, 'Honda', 'Odyssey', '', '밴', '자동', '경기도', 2.1838, 236980, '회색', '갈색', 1175803.64, 1190000, 'REGISTERED', '2026-03-07T12:00:00'::timestamp, '2026-03-07T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-053', 'DEALER', 'demo_dealer_1067', 2017, 'Toyota', 'Yaris', '네비게이션, 열선시트, 썬루프, 통풍시트, 차체자세제어장치(ESC)', '해치백', '자동', '인천광역시', 2.7555, 116173, '파랑', '검정', 4912856.05, 5060000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp, '2026-02-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-054', 'DEALER', 'demo_dealer_1093', 2018, 'BMW', '3 Series', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트, 썬루프', '세단', '자동', '부산광역시', 3.2737, 64792, '빨강', '베이지', 12195861.82, 12930000, 'REGISTERED', '2026-06-15T12:00:00'::timestamp, '2026-06-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-055', 'DEALER', 'demo_dealer_1084', 2015, 'Nissan', 'Altima', '통풍시트', '세단', '자동', '대전광역시', 2.2468, 154985, '갈색', '회색', 2868943.68, 2700000, 'REGISTERED', '2026-04-29T12:00:00'::timestamp, '2026-06-10T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-056', 'DEALER', 'demo_dealer_1093', 2022, 'Jaguar', 'XJ', '네비게이션, 열선시트, 차체자세제어장치(ESC), 썬루프, 통풍시트', '세단', '자동', '대구광역시', 3.7291, 56149, '진주색', '갈색', 35808781.04, 34730000, 'REGISTERED', '2026-04-22T12:00:00'::timestamp, '2026-06-03T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-057', 'DEALER', 'demo_dealer_1097', 2011, 'Nissan', 'Pathfinder', '', 'SUV', '자동', '광주광역시', 2.3489, 138007, '검정', '검정', 2344894.39, 2320000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp, '2026-06-10T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-058', 'DEALER', 'demo_dealer_1059', 2024, 'Mitsubishi', 'Mirage', '네비게이션, 썬루프, 열선시트, 통풍시트, 차체자세제어장치(ESC)', '해치백', '자동', '울산광역시', 3.8352, 22945, '흰색', '베이지', 9388146.4, 9480000, 'REGISTERED', '2026-06-01T12:00:00'::timestamp, '2026-06-01T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-059', 'DEALER', 'demo_dealer_1094', 2016, 'Honda', 'S2000', '열선시트, 통풍시트', '쿠페', '수동', '충청남도', 3.0406, 72524, '은색', '회색', 14749451.49, 15190000, 'REGISTERED', '2026-06-28T12:00:00'::timestamp, '2026-06-28T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-060', 'DEALER', 'demo_dealer_1078', 2023, 'Infiniti', 'G Sedan', '차체자세제어장치(ESC), 썬루프, 네비게이션', '세단', '자동', '경상남도', 4.0005, 27290, '회색', '갈색', 21421465.3, 22710000, 'REGISTERED', '2026-03-06T12:00:00'::timestamp, '2026-03-06T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-061', 'DEALER', 'demo_dealer_1063', 2021, 'Lexus', 'ES 350', '통풍시트, 차체자세제어장치(ESC)', '세단', '자동', '서울특별시', 3.5746, 41768, '파랑', '검정', 18742446.96, 17620000, 'REGISTERED', '2026-01-24T12:00:00'::timestamp, '2026-01-24T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-062', 'DEALER', 'demo_dealer_1064', 2024, 'Lexus', 'ES 350', '', '세단', '자동', '경기도', 4.1276, 20875, '빨강', '베이지', 29309837.46, 28430000, 'REGISTERED', '2026-01-12T12:00:00'::timestamp, '2026-03-03T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-063', 'DEALER', 'demo_dealer_1073', 2021, 'Chrysler', 'Town and Country', '차체자세제어장치(ESC)', '밴', '자동', '인천광역시', 3.4819, 55656, '갈색', '회색', 13190197.17, 13060000, 'REGISTERED', '2026-01-03T12:00:00'::timestamp, '2026-01-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-064', 'DEALER', 'demo_dealer_1065', 2020, 'Jeep', 'Liberty', '열선시트, 네비게이션, 썬루프, 통풍시트, 차체자세제어장치(ESC)', 'SUV', '자동', '부산광역시', 3.4055, 121872, '진주색', '갈색', 8007773.56, 8090000, 'REGISTERED', '2026-02-04T12:00:00'::timestamp, '2026-02-23T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-065', 'DEALER', 'demo_dealer_1061', 2021, 'Honda', 'CR-V', '통풍시트, 썬루프', 'SUV', '자동', '대전광역시', 3.676, 73154, '검정', '검정', 14544406.41, 14980000, 'REGISTERED', '2026-05-05T12:00:00'::timestamp, '2026-05-05T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-066', 'DEALER', 'demo_dealer_1059', 2024, 'Volkswagen', 'Passat', '썬루프, 열선시트, 차체자세제어장치(ESC)', '세단', '자동', '대구광역시', 3.8289, 36757, '흰색', '베이지', 14242975.09, 15100000, 'REGISTERED', '2026-04-29T12:00:00'::timestamp, '2026-05-26T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-067', 'DEALER', 'demo_dealer_1066', 2023, 'Toyota', 'Corolla', '열선시트, 차체자세제어장치(ESC), 통풍시트', '세단', '자동', '광주광역시', 3.4982, 38020, '은색', '회색', 11931725, 11220000, 'REGISTERED', '2026-01-17T12:00:00'::timestamp, '2026-02-13T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-068', 'DEALER', 'demo_dealer_1079', 2021, 'Toyota', 'RAV4', '열선시트, 네비게이션, 차체자세제어장치(ESC), 통풍시트, 썬루프', 'SUV', '자동', '울산광역시', 3.7125, 47033, '회색', '갈색', 15025150.15, 14570000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp, '2026-02-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-069', 'DEALER', 'demo_dealer_1052', 2023, 'Toyota', 'Yaris', '차체자세제어장치(ESC), 통풍시트, 썬루프, 열선시트', '해치백', '자동', '충청남도', 3.7283, 13314, '파랑', '검정', 11095351.69, 10980000, 'REGISTERED', '2026-03-01T12:00:00'::timestamp, '2026-05-14T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-070', 'DEALER', 'demo_dealer_1077', 2024, 'Acura', 'RDX', '네비게이션, 차체자세제어장치(ESC), 썬루프, 통풍시트, 열선시트', 'SUV', '자동', '경상남도', 4.2859, 14888, '빨강', '베이지', 27505584.96, 27780000, 'REGISTERED', '2026-01-29T12:00:00'::timestamp, '2026-02-25T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-071', 'DEALER', 'demo_dealer_1087', 2022, 'Toyota', 'Highlander', '통풍시트, 차체자세제어장치(ESC), 네비게이션, 썬루프, 열선시트', 'SUV', '자동', '서울특별시', 3.8958, 40228, '갈색', '회색', 23588114.62, 24300000, 'REGISTERED', '2026-03-15T12:00:00'::timestamp, '2026-05-28T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-072', 'DEALER', 'demo_dealer_1092', 2020, 'Hyundai', 'Elantra', '통풍시트, 차체자세제어장치(ESC), 네비게이션', '해치백', '자동', '경기도', 3.4234, 29510, '진주색', '갈색', 8566468.64, 9080000, 'REGISTERED', '2026-03-14T12:00:00'::timestamp, '2026-05-27T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-073', 'DEALER', 'demo_dealer_1096', 2022, 'Mazda', 'CX-9', '열선시트', 'SUV', '자동', '인천광역시', 3.5839, 36685, '검정', '검정', 18014506.92, 16930000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-074', 'DEALER', 'demo_dealer_1065', 2019, 'Dodge', 'Journey', '네비게이션, 통풍시트, 썬루프, 차체자세제어장치(ESC)', 'SUV', '자동', '부산광역시', 3.4371, 40838, '흰색', '베이지', 11262113.09, 10920000, 'REGISTERED', '2025-11-25T12:00:00'::timestamp, '2026-02-07T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-075', 'DEALER', 'demo_dealer_1088', 2024, 'Cadillac', 'CTS', '차체자세제어장치(ESC)', '세단', '자동', '대전광역시', 4.4239, 9419, '은색', '회색', 32563888.57, 32240000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-076', 'DEALER', 'demo_dealer_1081', 2022, 'Mercedes-Benz', 'C-Class', '차체자세제어장치(ESC)', '세단', '자동', '대구광역시', 3.6376, 23614, '회색', '갈색', 22125624.19, 22350000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-077', 'DEALER', 'demo_dealer_1060', 2023, 'Audi', 'A6', '네비게이션, 통풍시트, 썬루프, 차체자세제어장치(ESC)', '세단', '자동', '광주광역시', 3.8321, 47699, '파랑', '검정', 28218293.46, 29060000, 'REGISTERED', '2026-03-02T12:00:00'::timestamp, '2026-03-02T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-078', 'DEALER', 'demo_dealer_1051', 2022, 'Mazda', 'Mazda6', '통풍시트, 썬루프', '세단', '자동', '울산광역시', 3.291, 62347, '빨강', '베이지', 9775019.69, 10360000, 'REGISTERED', '2026-04-15T12:00:00'::timestamp, '2026-05-20T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-079', 'DEALER', 'demo_dealer_1062', 2024, 'Hyundai', 'Azera', '', '세단', '자동', '충청남도', 4.4162, 11614, '갈색', '회색', 23650698.78, 22230000, 'REGISTERED', '2025-12-17T12:00:00'::timestamp, '2026-01-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-080', 'DEALER', 'demo_dealer_1096', 2022, 'Mercedes-Benz', 'C-Class', '통풍시트, 열선시트, 썬루프, 네비게이션', '세단', '자동', '경상남도', 3.6567, 42097, '진주색', '갈색', 20636927.24, 20020000, 'REGISTERED', '2026-05-06T12:00:00'::timestamp, '2026-06-10T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-081', 'DEALER', 'demo_dealer_1086', 2023, 'Hyundai', 'Elantra', '차체자세제어장치(ESC), 썬루프, 네비게이션', '해치백', '자동', '서울특별시', 3.7117, 27764, '검정', '검정', 11848992.63, 11730000, 'REGISTERED', '2026-04-28T12:00:00'::timestamp, '2026-06-10T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-082', 'DEALER', 'demo_dealer_1079', 2023, 'Dodge', 'Dart', '열선시트, 차체자세제어장치(ESC), 네비게이션, 썬루프, 통풍시트', '세단', '자동', '경기도', 4.3423, 6223, '흰색', '베이지', 12200271.02, 12320000, 'REGISTERED', '2026-01-04T12:00:00'::timestamp, '2026-02-16T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-083', 'DEALER', 'demo_dealer_1081', 2020, 'Ford', 'F-150', '차체자세제어장치(ESC), 네비게이션, 열선시트, 통풍시트, 썬루프', '픽업트럭', '자동', '인천광역시', 3.2624, 125182, '은색', '회색', 14046319.72, 14470000, 'REGISTERED', '2026-05-03T12:00:00'::timestamp, '2026-06-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-084', 'DEALER', 'demo_dealer_1073', 2018, 'Ford', 'Edge', '썬루프, 열선시트, 네비게이션', 'SUV', '자동', '부산광역시', 3.1726, 107269, '회색', '갈색', 8201673.24, 8690000, 'REGISTERED', '2025-10-13T12:00:00'::timestamp, '2026-01-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-085', 'DEALER', 'demo_dealer_1055', 2010, 'Ford', 'Explorer', '네비게이션, 썬루프, 통풍시트', 'SUV', '자동', '대전광역시', 2.2937, 140411, '파랑', '검정', 1412548.71, 1330000, 'REGISTERED', '2026-04-15T12:00:00'::timestamp, '2026-05-28T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-086', 'DEALER', 'demo_dealer_1063', 2018, 'Mercedes-Benz', 'E-Class', '통풍시트, 열선시트, 썬루프', '세단', '자동', '대구광역시', 3.4233, 75588, '빨강', '베이지', 14059459.32, 13640000, 'REGISTERED', '2025-12-02T12:00:00'::timestamp, '2026-01-14T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-087', 'DEALER', 'demo_dealer_1086', 2018, 'Ford', 'Escape', '네비게이션, 통풍시트, 썬루프, 열선시트, 차체자세제어장치(ESC)', 'SUV', '자동', '광주광역시', 3.0972, 98195, '갈색', '회색', 6436923.84, 6370000, 'REGISTERED', '2026-02-20T12:00:00'::timestamp, '2026-05-25T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-088', 'DEALER', 'demo_dealer_1079', 2012, 'Chevrolet', 'TrailBlazer', '네비게이션, 열선시트, 통풍시트', 'SUV', '자동', '울산광역시', 2.4763, 128221, '진주색', '갈색', 1867583.47, 1890000, 'REGISTERED', '2025-10-29T12:00:00'::timestamp, '2026-01-31T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-089', 'DEALER', 'demo_dealer_1060', 2018, 'Jeep', 'Liberty', '썬루프, 네비게이션, 통풍시트, 차체자세제어장치(ESC), 열선시트', 'SUV', '자동', '충청남도', 3.037, 167705, '검정', '검정', 4643775.02, 4780000, 'REGISTERED', '2026-01-05T12:00:00'::timestamp, '2026-02-25T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-090', 'DEALER', 'demo_dealer_1076', 2024, 'GMC', 'Savana Cargo', '열선시트', '밴', '자동', '경상남도', 4.2618, 9536, '흰색', '베이지', 21535317.88, 22830000, 'REGISTERED', '2026-05-25T12:00:00'::timestamp, '2026-05-25T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-091', 'DEALER', 'demo_dealer_1093', 2023, 'Nissan', 'Murano', '통풍시트', 'SUV', '자동', '서울특별시', 4.1118, 22260, '은색', '회색', 22045584.15, 20720000, 'REGISTERED', '2026-02-16T12:00:00'::timestamp, '2026-05-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-092', 'DEALER', 'demo_dealer_1064', 2022, 'Hyundai', 'Genesis', '네비게이션', '세단', '자동', '경기도', 3.9092, 24216, '회색', '갈색', 19359860.99, 18780000, 'REGISTERED', '2025-11-13T12:00:00'::timestamp, '2026-02-15T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-093', 'DEALER', 'demo_dealer_1099', 2022, 'MINI', 'Cooper Countryman', '네비게이션, 썬루프, 열선시트', 'SUV', '자동', '인천광역시', 4.0194, 38420, '파랑', '검정', 17131576.49, 16960000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp, '2026-06-21T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-094', 'DEALER', 'demo_dealer_1070', 2024, 'Nissan', 'Versa Note', '썬루프', '해치백', '자동', '부산광역시', 4.023, 12313, '빨강', '베이지', 10747879.84, 10860000, 'REGISTERED', '2026-03-02T12:00:00'::timestamp, '2026-03-02T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-095', 'DEALER', 'demo_dealer_1057', 2008, 'BMW', '5 Series', '썬루프, 통풍시트, 열선시트', '세단', '자동', '대전광역시', 2.8371, 61210, '갈색', '회색', 3911615.97, 4030000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp, '2026-06-22T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-096', 'DEALER', 'demo_dealer_1072', 2023, 'Kia', 'Sportage', '차체자세제어장치(ESC)', 'SUV', '자동', '대구광역시', 3.8327, 41297, '진주색', '갈색', 13694312.05, 14520000, 'REGISTERED', '2025-12-22T12:00:00'::timestamp, '2026-01-11T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-097', 'DEALER', 'demo_dealer_1083', 2021, 'BMW', '3 Series', '네비게이션, 썬루프, 열선시트, 차체자세제어장치(ESC)', '세단', '자동', '광주광역시', 3.8046, 37196, '검정', '검정', 20416222.17, 19190000, 'REGISTERED', '2026-05-19T12:00:00'::timestamp, '2026-06-16T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-098', 'DEALER', 'demo_dealer_1070', 2014, 'Nissan', 'Murano', '썬루프, 통풍시트, 차체자세제어장치(ESC)', 'SUV', '자동', '울산광역시', 2.568, 155702, '흰색', '베이지', 4198443.25, 4070000, 'REGISTERED', '2026-01-27T12:00:00'::timestamp, '2026-02-24T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-099', 'DEALER', 'demo_dealer_1099', 2021, 'BMW', '5 Series', '차체자세제어장치(ESC), 네비게이션, 통풍시트, 썬루프', '세단', '자동', '충청남도', 4.0373, 26328, '은색', '회색', 27458693.31, 27180000, 'REGISTERED', '2026-05-17T12:00:00'::timestamp, '2026-06-14T12:00:00'::timestamp),
        ('DEMO-DEALER-CAR-100', 'DEALER', 'demo_dealer_1082', 2024, 'Hyundai', 'Sonata', '네비게이션, 차체자세제어장치(ESC), 통풍시트', '세단', '자동', '경상남도', 3.5342, 23022, '회색', '갈색', 14694263.65, 14840000, 'REGISTERED', '2026-02-06T12:00:00'::timestamp, '2026-05-11T12:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-001', 'MEMBER', 'testuser1@naver.com', 2024, 'Hyundai', 'Sonata', '네비게이션, 차체자세제어장치(ESC), 통풍시트, 후방카메라', '세단', '자동', '부산광역시', 3.6864, 19422, '회색', '베이지', 15013082.01, 12760000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-002', 'MEMBER', 'testuser2@naver.com', 2022, 'Kia', 'Sorento', '차체자세제어장치(ESC), 스마트키', 'SUV', '자동', '대전광역시', 4.2312, 11782, '파랑', '회색', 17210405.32, 14970000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-003', 'MEMBER', 'testuser3@naver.com', 2022, 'Toyota', 'Camry', '차체자세제어장치(ESC), 통풍시트, 후방카메라', '세단', '자동', '대구광역시', 4.1198, 4952, '빨강', '갈색', 15512457.92, 13650000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-004', 'MEMBER', 'testuser4@naver.com', 2022, 'Honda', 'Accord', '썬루프, 통풍시트, 차체자세제어장치(ESC), 스마트키', '세단', '자동', '광주광역시', 3.4924, 29964, '갈색', '검정', 13848457.61, 12330000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-005', 'MEMBER', 'testuser5@naver.com', 2018, 'BMW', '3 Series', '네비게이션, 차체자세제어장치(ESC), 열선시트, 통풍시트, 썬루프', '세단', '자동', '울산광역시', 3.2505, 68392, '진주색', '베이지', 12226170.01, 11000000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-006', 'MEMBER', 'testuser6@naver.com', 2022, 'Mercedes-Benz', 'C-Class', '차체자세제어장치(ESC), 스마트키', '세단', '자동', '충청남도', 3.6627, 20014, '검정', '회색', 22929014.08, 20870000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-007', 'MEMBER', 'testuser7@naver.com', 2024, 'Volkswagen', 'Passat', '썬루프, 열선시트, 차체자세제어장치(ESC), 후방카메라', '세단', '자동', '경상남도', 3.8027, 34957, '흰색', '갈색', 14293579.91, 13150000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-008', 'MEMBER', 'testuser8@naver.com', 2022, 'Nissan', 'Rogue', '차체자세제어장치(ESC), 스마트키', 'SUV', '자동', '서울특별시', 3.8124, 31705, '은색', '검정', 15183705.53, 14120000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-009', 'MEMBER', 'testuser9@naver.com', 2022, 'Chevrolet', 'Cruze', '썬루프, 열선시트, 통풍시트, 네비게이션, 차체자세제어장치(ESC)', '세단', '자동', '경기도', 3.2632, 70449, '회색', '베이지', 8357815.11, 7190000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp),
        ('DEMO-MEMBER-CAR-010', 'MEMBER', 'testuser10@naver.com', 2018, 'Ford', 'Escape', '네비게이션, 통풍시트, 썬루프, 열선시트, 차체자세제어장치(ESC)', 'SUV', '자동', '인천광역시', 3.0838, 101795, '파랑', '회색', 6253811.18, 5570000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp, '2026-07-24T13:00:00'::timestamp)
), resolved_vehicle AS (
    SELECT
        v.*,
        CASE WHEN v.owner_type = 'MEMBER' THEN m.member_id END AS member_id,
        CASE WHEN v.owner_type = 'DEALER' THEN d.dealer_id END AS dealer_id
    FROM vehicle_source v
    LEFT JOIN public.members m
        ON v.owner_type = 'MEMBER' AND m.email = v.owner_key
    LEFT JOIN public.dealers d
        ON v.owner_type = 'DEALER' AND d.login_id = v.owner_key
), inserted AS (
    INSERT INTO public.cars (
        member_id, dealer_id, year, make, model, option, body,
        transmission, state, condition, odometer, color, interior,
        mmr, sellingprice, status, created_at, updated_at
    )
    SELECT
        r.member_id, r.dealer_id, r.year, r.make, r.model, r.option_text,
        r.body, r.transmission, r.state, r.condition, r.odometer,
        r.color, r.interior, r.mmr, r.sellingprice, r.status,
        r.created_at, r.updated_at
    FROM resolved_vehicle r
    WHERE (
        (r.owner_type = 'DEALER' AND r.dealer_id IS NOT NULL)
        OR (r.owner_type = 'MEMBER' AND r.member_id IS NOT NULL)
    )
    AND NOT EXISTS (
        SELECT 1
        FROM public.cars c
        WHERE c.created_at = r.created_at
          AND c.make = r.make
          AND c.model = r.model
          AND c.odometer = r.odometer
          AND (
              (r.owner_type = 'DEALER' AND c.dealer_id = r.dealer_id)
              OR (r.owner_type = 'MEMBER' AND c.member_id = r.member_id)
          )
    )
    RETURNING car_id
)
SELECT COUNT(*) AS newly_inserted_vehicle_count FROM inserted;

WITH auction_source (
    auction_key, member_email, make, model, odometer, car_created_at,
    start_time, end_time, status, created_at
) AS (
    VALUES
        ('DEMO-AUCTION-001', 'testuser1@naver.com', 'Hyundai', 'Sonata', 19422, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:00:00'::timestamp, '2026-07-30T09:00:00'::timestamp, 'ACTIVE', '2026-07-27T09:00:00'::timestamp),
        ('DEMO-AUCTION-002', 'testuser2@naver.com', 'Kia', 'Sorento', 11782, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:10:00'::timestamp, '2026-07-30T09:10:00'::timestamp, 'ACTIVE', '2026-07-27T09:10:00'::timestamp),
        ('DEMO-AUCTION-003', 'testuser3@naver.com', 'Toyota', 'Camry', 4952, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:20:00'::timestamp, '2026-07-30T09:20:00'::timestamp, 'ACTIVE', '2026-07-27T09:20:00'::timestamp),
        ('DEMO-AUCTION-004', 'testuser4@naver.com', 'Honda', 'Accord', 29964, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:30:00'::timestamp, '2026-07-30T09:30:00'::timestamp, 'ACTIVE', '2026-07-27T09:30:00'::timestamp),
        ('DEMO-AUCTION-005', 'testuser5@naver.com', 'BMW', '3 Series', 68392, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:40:00'::timestamp, '2026-07-30T09:40:00'::timestamp, 'ACTIVE', '2026-07-27T09:40:00'::timestamp),
        ('DEMO-AUCTION-006', 'testuser6@naver.com', 'Mercedes-Benz', 'C-Class', 20014, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:50:00'::timestamp, '2026-07-30T09:50:00'::timestamp, 'ACTIVE', '2026-07-27T09:50:00'::timestamp),
        ('DEMO-AUCTION-007', 'testuser7@naver.com', 'Volkswagen', 'Passat', 34957, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:00:00'::timestamp, '2026-07-30T10:00:00'::timestamp, 'ACTIVE', '2026-07-27T10:00:00'::timestamp),
        ('DEMO-AUCTION-008', 'testuser8@naver.com', 'Nissan', 'Rogue', 31705, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:10:00'::timestamp, '2026-07-30T10:10:00'::timestamp, 'ACTIVE', '2026-07-27T10:10:00'::timestamp),
        ('DEMO-AUCTION-009', 'testuser9@naver.com', 'Chevrolet', 'Cruze', 70449, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:20:00'::timestamp, '2026-07-30T10:20:00'::timestamp, 'ACTIVE', '2026-07-27T10:20:00'::timestamp),
        ('DEMO-AUCTION-010', 'testuser10@naver.com', 'Ford', 'Escape', 101795, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:30:00'::timestamp, '2026-07-30T10:30:00'::timestamp, 'ACTIVE', '2026-07-27T10:30:00'::timestamp)
), resolved_auction AS (
    SELECT s.*, c.car_id
    FROM auction_source s
    JOIN public.members m ON m.email = s.member_email
    JOIN public.cars c
      ON c.member_id = m.member_id
     AND c.make = s.make
     AND c.model = s.model
     AND c.odometer = s.odometer
     AND c.created_at = s.car_created_at
)
INSERT INTO public.auctions (
    car_id, start_time, end_time, status, created_at
)
SELECT
    r.car_id, r.start_time, r.end_time, r.status, r.created_at
FROM resolved_auction r
ON CONFLICT (car_id) DO NOTHING;

WITH expected_vehicle (
    owner_type, owner_key, make, model, odometer, sellingprice, status, created_at
) AS (
    VALUES
        ('DEALER', 'demo_dealer_1072', 'MINI', 'Cooper', 14514, 13970000, 'REGISTERED', '2026-01-23T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1074', 'Honda', 'Accord', 28164, 13610000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1058', 'Dodge', 'Charger', 19276, 18760000, 'REGISTERED', '2026-06-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1075', 'Chrysler', '200', 32018, 11260000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1056', 'Ford', 'Focus', 63976, 8690000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1055', 'Scion', 'tC', 49454, 11780000, 'REGISTERED', '2026-06-06T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1098', 'Chrysler', 'PT Cruiser', 77358, 4710000, 'REGISTERED', '2026-06-23T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1068', 'Toyota', 'Camry', 4952, 15050000, 'REGISTERED', '2026-02-08T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1053', 'Chevrolet', 'Impala', 129179, 3400000, 'REGISTERED', '2026-05-26T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1086', 'Infiniti', 'QX4', 168353, 680000, 'REGISTERED', '2026-06-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1098', 'Chevrolet', 'Silverado 1500', 113957, 9470000, 'REGISTERED', '2026-05-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1089', 'Honda', 'Accord', 82196, 11640000, 'REGISTERED', '2026-06-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1084', 'GMC', 'Acadia', 62595, 17750000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1056', 'Chrysler', '300', 61245, 10400000, 'REGISTERED', '2026-04-17T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1064', 'Honda', 'Pilot', 39329, 23820000, 'REGISTERED', '2026-03-13T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1083', 'Toyota', 'Corolla', 258959, 1670000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1085', 'BMW', 'X5', 53764, 33210000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1090', 'Cadillac', 'XTS', 14426, 35620000, 'REGISTERED', '2026-07-06T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1073', 'Chevrolet', 'Monte Carlo', 98087, 3240000, 'REGISTERED', '2026-02-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1095', 'Ford', 'Explorer Sport Trac', 90091, 9810000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1082', 'Mazda', 'CX-9', 33348, 17690000, 'REGISTERED', '2026-06-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1087', 'Kia', 'Sorento', 13582, 17370000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1095', 'Chevrolet', 'Equinox', 69412, 8400000, 'REGISTERED', '2026-05-01T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1062', 'Hyundai', 'Accent', 22692, 8830000, 'REGISTERED', '2026-02-01T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1071', 'Cadillac', 'CTS', 52871, 14680000, 'REGISTERED', '2026-01-24T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1082', 'Honda', 'Civic', 128504, 5300000, 'REGISTERED', '2026-04-20T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1087', 'Mazda', 'Mazda3', 33960, 10140000, 'REGISTERED', '2026-04-27T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1092', 'Mercedes-Benz', 'CLA-Class', 13039, 31770000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1097', 'Honda', 'CR-V', 185473, 2860000, 'REGISTERED', '2026-07-11T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1085', 'Infiniti', 'G Sedan', 28411, 20130000, 'REGISTERED', '2026-04-23T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1095', 'Ford', 'Explorer', 177743, 3510000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1080', 'Ford', 'Taurus', 67923, 12160000, 'REGISTERED', '2026-06-23T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1097', 'Toyota', 'Camry', 10815, 16390000, 'REGISTERED', '2026-06-10T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1075', 'Dodge', 'Journey', 99979, 8060000, 'REGISTERED', '2026-01-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1054', 'Nissan', 'Armada', 15393, 27240000, 'REGISTERED', '2026-05-29T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1091', 'Jaguar', 'XJ-Series', 144720, 2610000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1069', 'Nissan', 'Rogue', 31705, 14270000, 'REGISTERED', '2026-01-17T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1089', 'Chrysler', 'Town and Country', 44265, 15450000, 'REGISTERED', '2026-04-27T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1090', 'Infiniti', 'M35', 101658, 11670000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1098', 'Chevrolet', 'Aveo', 72387, 5310000, 'REGISTERED', '2026-02-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1069', 'Dodge', 'Avenger', 31394, 11230000, 'REGISTERED', '2025-12-09T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1080', 'Mitsubishi', 'Lancer', 45812, 9420000, 'REGISTERED', '2026-05-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1085', 'Mercedes-Benz', 'E-Class', 128442, 2250000, 'REGISTERED', '2026-02-09T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1052', 'BMW', 'X5', 36157, 34020000, 'REGISTERED', '2026-06-06T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1092', 'GMC', 'Sierra 1500 Classic', 194385, 8440000, 'REGISTERED', '2026-05-10T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1052', 'Chevrolet', 'Express Cargo', 171733, 5070000, 'REGISTERED', '2026-04-23T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1077', 'Chrysler', '200', 12882, 13610000, 'REGISTERED', '2026-03-07T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1089', 'Chevrolet', 'Cruze', 68649, 9040000, 'REGISTERED', '2026-01-16T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1051', 'Nissan', 'Altima', 18735, 12440000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1066', 'BMW', '7 Series', 102789, 3770000, 'REGISTERED', '2026-02-20T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1050', 'Buick', 'LaCrosse', 80369, 4910000, 'REGISTERED', '2026-05-30T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1065', 'Honda', 'Odyssey', 236980, 1190000, 'REGISTERED', '2026-03-07T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1067', 'Toyota', 'Yaris', 116173, 5060000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1093', 'BMW', '3 Series', 64792, 12930000, 'REGISTERED', '2026-06-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1084', 'Nissan', 'Altima', 154985, 2700000, 'REGISTERED', '2026-04-29T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1093', 'Jaguar', 'XJ', 56149, 34730000, 'REGISTERED', '2026-04-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1097', 'Nissan', 'Pathfinder', 138007, 2320000, 'REGISTERED', '2026-02-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1059', 'Mitsubishi', 'Mirage', 22945, 9480000, 'REGISTERED', '2026-06-01T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1094', 'Honda', 'S2000', 72524, 15190000, 'REGISTERED', '2026-06-28T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1078', 'Infiniti', 'G Sedan', 27290, 22710000, 'REGISTERED', '2026-03-06T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1063', 'Lexus', 'ES 350', 41768, 17620000, 'REGISTERED', '2026-01-24T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1064', 'Lexus', 'ES 350', 20875, 28430000, 'REGISTERED', '2026-01-12T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1073', 'Chrysler', 'Town and Country', 55656, 13060000, 'REGISTERED', '2026-01-03T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1065', 'Jeep', 'Liberty', 121872, 8090000, 'REGISTERED', '2026-02-04T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1061', 'Honda', 'CR-V', 73154, 14980000, 'REGISTERED', '2026-05-05T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1059', 'Volkswagen', 'Passat', 36757, 15100000, 'REGISTERED', '2026-04-29T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1066', 'Toyota', 'Corolla', 38020, 11220000, 'REGISTERED', '2026-01-17T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1079', 'Toyota', 'RAV4', 47033, 14570000, 'REGISTERED', '2026-02-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1052', 'Toyota', 'Yaris', 13314, 10980000, 'REGISTERED', '2026-03-01T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1077', 'Acura', 'RDX', 14888, 27780000, 'REGISTERED', '2026-01-29T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1087', 'Toyota', 'Highlander', 40228, 24300000, 'REGISTERED', '2026-03-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1092', 'Hyundai', 'Elantra', 29510, 9080000, 'REGISTERED', '2026-03-14T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1096', 'Mazda', 'CX-9', 36685, 16930000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1065', 'Dodge', 'Journey', 40838, 10920000, 'REGISTERED', '2025-11-25T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1088', 'Cadillac', 'CTS', 9419, 32240000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1081', 'Mercedes-Benz', 'C-Class', 23614, 22350000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1060', 'Audi', 'A6', 47699, 29060000, 'REGISTERED', '2026-03-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1051', 'Mazda', 'Mazda6', 62347, 10360000, 'REGISTERED', '2026-04-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1062', 'Hyundai', 'Azera', 11614, 22230000, 'REGISTERED', '2025-12-17T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1096', 'Mercedes-Benz', 'C-Class', 42097, 20020000, 'REGISTERED', '2026-05-06T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1086', 'Hyundai', 'Elantra', 27764, 11730000, 'REGISTERED', '2026-04-28T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1079', 'Dodge', 'Dart', 6223, 12320000, 'REGISTERED', '2026-01-04T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1081', 'Ford', 'F-150', 125182, 14470000, 'REGISTERED', '2026-05-03T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1073', 'Ford', 'Edge', 107269, 8690000, 'REGISTERED', '2025-10-13T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1055', 'Ford', 'Explorer', 140411, 1330000, 'REGISTERED', '2026-04-15T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1063', 'Mercedes-Benz', 'E-Class', 75588, 13640000, 'REGISTERED', '2025-12-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1086', 'Ford', 'Escape', 98195, 6370000, 'REGISTERED', '2026-02-20T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1079', 'Chevrolet', 'TrailBlazer', 128221, 1890000, 'REGISTERED', '2025-10-29T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1060', 'Jeep', 'Liberty', 167705, 4780000, 'REGISTERED', '2026-01-05T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1076', 'GMC', 'Savana Cargo', 9536, 22830000, 'REGISTERED', '2026-05-25T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1093', 'Nissan', 'Murano', 22260, 20720000, 'REGISTERED', '2026-02-16T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1064', 'Hyundai', 'Genesis', 24216, 18780000, 'REGISTERED', '2025-11-13T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1099', 'MINI', 'Cooper Countryman', 38420, 16960000, 'REGISTERED', '2026-06-21T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1070', 'Nissan', 'Versa Note', 12313, 10860000, 'REGISTERED', '2026-03-02T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1057', 'BMW', '5 Series', 61210, 4030000, 'REGISTERED', '2026-06-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1072', 'Kia', 'Sportage', 41297, 14520000, 'REGISTERED', '2025-12-22T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1083', 'BMW', '3 Series', 37196, 19190000, 'REGISTERED', '2026-05-19T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1070', 'Nissan', 'Murano', 155702, 4070000, 'REGISTERED', '2026-01-27T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1099', 'BMW', '5 Series', 26328, 27180000, 'REGISTERED', '2026-05-17T12:00:00'::timestamp),
        ('DEALER', 'demo_dealer_1082', 'Hyundai', 'Sonata', 23022, 14840000, 'REGISTERED', '2026-02-06T12:00:00'::timestamp),
        ('MEMBER', 'testuser1@naver.com', 'Hyundai', 'Sonata', 19422, 12760000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser2@naver.com', 'Kia', 'Sorento', 11782, 14970000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser3@naver.com', 'Toyota', 'Camry', 4952, 13650000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser4@naver.com', 'Honda', 'Accord', 29964, 12330000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser5@naver.com', 'BMW', '3 Series', 68392, 11000000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser6@naver.com', 'Mercedes-Benz', 'C-Class', 20014, 20870000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser7@naver.com', 'Volkswagen', 'Passat', 34957, 13150000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser8@naver.com', 'Nissan', 'Rogue', 31705, 14120000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser9@naver.com', 'Chevrolet', 'Cruze', 70449, 7190000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp),
        ('MEMBER', 'testuser10@naver.com', 'Ford', 'Escape', 101795, 5570000, 'REGISTERED', '2026-07-24T13:00:00'::timestamp)
), resolved_expected AS (
    SELECT
        e.*,
        CASE WHEN e.owner_type = 'MEMBER' THEN m.member_id END AS member_id,
        CASE WHEN e.owner_type = 'DEALER' THEN d.dealer_id END AS dealer_id
    FROM expected_vehicle e
    LEFT JOIN public.members m
        ON e.owner_type = 'MEMBER' AND m.email = e.owner_key
    LEFT JOIN public.dealers d
        ON e.owner_type = 'DEALER' AND d.login_id = e.owner_key
), matched_vehicle AS (
    SELECT DISTINCT
        e.owner_type, e.owner_key, e.make, e.model, e.odometer,
        e.sellingprice, e.status, e.created_at
    FROM resolved_expected e
    JOIN public.cars c
      ON c.make = e.make
     AND c.model = e.model
     AND c.odometer = e.odometer
     AND c.sellingprice = e.sellingprice
     AND c.status = e.status
     AND c.created_at = e.created_at
     AND (
         (e.owner_type = 'DEALER' AND c.dealer_id = e.dealer_id)
         OR (e.owner_type = 'MEMBER' AND c.member_id = e.member_id)
     )
)
SELECT CASE
    WHEN COUNT(*) = 110 THEN 1
    ELSE (1 / 0)
END AS all_110_demo_vehicles_exist
FROM matched_vehicle;

WITH expected_auction (
    member_email, make, model, odometer, car_created_at,
    start_time, end_time, status
) AS (
    VALUES
        ('testuser1@naver.com', 'Hyundai', 'Sonata', 19422, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:00:00'::timestamp, '2026-07-30T09:00:00'::timestamp, 'ACTIVE'),
        ('testuser2@naver.com', 'Kia', 'Sorento', 11782, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:10:00'::timestamp, '2026-07-30T09:10:00'::timestamp, 'ACTIVE'),
        ('testuser3@naver.com', 'Toyota', 'Camry', 4952, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:20:00'::timestamp, '2026-07-30T09:20:00'::timestamp, 'ACTIVE'),
        ('testuser4@naver.com', 'Honda', 'Accord', 29964, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:30:00'::timestamp, '2026-07-30T09:30:00'::timestamp, 'ACTIVE'),
        ('testuser5@naver.com', 'BMW', '3 Series', 68392, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:40:00'::timestamp, '2026-07-30T09:40:00'::timestamp, 'ACTIVE'),
        ('testuser6@naver.com', 'Mercedes-Benz', 'C-Class', 20014, '2026-07-24T13:00:00'::timestamp, '2026-07-27T09:50:00'::timestamp, '2026-07-30T09:50:00'::timestamp, 'ACTIVE'),
        ('testuser7@naver.com', 'Volkswagen', 'Passat', 34957, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:00:00'::timestamp, '2026-07-30T10:00:00'::timestamp, 'ACTIVE'),
        ('testuser8@naver.com', 'Nissan', 'Rogue', 31705, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:10:00'::timestamp, '2026-07-30T10:10:00'::timestamp, 'ACTIVE'),
        ('testuser9@naver.com', 'Chevrolet', 'Cruze', 70449, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:20:00'::timestamp, '2026-07-30T10:20:00'::timestamp, 'ACTIVE'),
        ('testuser10@naver.com', 'Ford', 'Escape', 101795, '2026-07-24T13:00:00'::timestamp, '2026-07-27T10:30:00'::timestamp, '2026-07-30T10:30:00'::timestamp, 'ACTIVE')
), matched_auction AS (
    SELECT DISTINCT a.auction_id
    FROM expected_auction e
    JOIN public.members m ON m.email = e.member_email
    JOIN public.cars c
      ON c.member_id = m.member_id
     AND c.make = e.make
     AND c.model = e.model
     AND c.odometer = e.odometer
     AND c.created_at = e.car_created_at
    JOIN public.auctions a
      ON a.car_id = c.car_id
     AND a.start_time = e.start_time
     AND a.end_time = e.end_time
     AND a.status = e.status
)
SELECT CASE
    WHEN COUNT(*) = 10 THEN 1
    ELSE (1 / 0)
END AS all_10_member_auctions_exist
FROM matched_auction;

DO $$
DECLARE
    demo_member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO demo_member_count
    FROM public.members
    WHERE email ~ '^testuser([1-9]|10)@naver\.com$';

    IF demo_member_count <> 10 THEN
        RAISE EXCEPTION '개인 판매 회원 수 오류: %', demo_member_count;
    END IF;
END
$$;

COMMIT;
