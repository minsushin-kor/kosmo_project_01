-- Supabase PostgreSQL용 더미 계정 로그인 정보 일괄 반영 SQL
-- 대상:
--   companies 20개: login_id = demo_company_01 ~ demo_company_20
--   members   10명: login_id = demo_member_01 ~ demo_member_10
--   dealers  100명: email = demo_dealer_1000@kosmo.local ~ demo_dealer_1099@kosmo.local
--
-- password 컬럼은 조회·수정하지 않습니다.
-- 모든 작업은 하나의 트랜잭션으로 실행되며 검증 실패 시 전체가 롤백됩니다.

BEGIN;

-- 기존 서비스 데이터가 있어도 컬럼 추가 단계가 재실행될 수 있도록 IF NOT EXISTS를 사용합니다.
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS login_id VARCHAR(50);

ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS login_id VARCHAR(50);

ALTER TABLE public.dealers
    ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 안정적인 기존 계정 값을 기준으로 회사 로그인 ID를 생성합니다.
UPDATE public.companies
SET login_id = regexp_replace(master_email, '@kosmo[.]local$', '')
WHERE master_email ~ '^demo_company_(0[1-9]|1[0-9]|20)@kosmo[.]local$';

-- testuser1 ~ testuser10을 demo_member_01 ~ demo_member_10으로 변환합니다.
UPDATE public.members
SET login_id = 'demo_member_'
    || lpad(
        substring(email FROM '^testuser([0-9]+)@naver[.]com$'),
        2,
        '0'
    )
WHERE email ~ '^testuser([1-9]|10)@naver[.]com$';

-- 기존 딜러 로그인 ID를 이용해 고유 이메일을 생성합니다.
UPDATE public.dealers
SET email = login_id || '@kosmo.local'
WHERE login_id ~ '^demo_dealer_10[0-9]{2}$';

-- 전체 테이블에서 NULL이 아닌 새 식별자의 중복을 방지합니다.
-- 기존 일반 데이터가 아직 새 컬럼 값을 갖지 않아도 적용할 수 있도록 부분 인덱스를 사용합니다.
CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_login_id_not_null
    ON public.companies (login_id)
    WHERE login_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_login_id_not_null
    ON public.members (login_id)
    WHERE login_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dealers_email_not_null
    ON public.dealers (email)
    WHERE email IS NOT NULL;

-- 요청한 더미데이터가 모두 반영됐는지 확인합니다.
DO $validation$
DECLARE
    company_count INTEGER;
    member_count INTEGER;
    dealer_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO company_count
    FROM public.companies
    WHERE master_email ~ '^demo_company_(0[1-9]|1[0-9]|20)@kosmo[.]local$'
      AND login_id = regexp_replace(master_email, '@kosmo[.]local$', '');

    SELECT COUNT(*)
    INTO member_count
    FROM public.members
    WHERE email ~ '^testuser([1-9]|10)@naver[.]com$'
      AND login_id = 'demo_member_'
          || lpad(
              substring(email FROM '^testuser([0-9]+)@naver[.]com$'),
              2,
              '0'
          );

    SELECT COUNT(*)
    INTO dealer_count
    FROM public.dealers
    WHERE login_id ~ '^demo_dealer_10[0-9]{2}$'
      AND email = login_id || '@kosmo.local';

    IF company_count <> 20 THEN
        RAISE EXCEPTION
            '회사 login_id 반영 건수 오류: 예상 20건, 실제 %건',
            company_count;
    END IF;

    IF member_count <> 10 THEN
        RAISE EXCEPTION
            '일반회원 login_id 반영 건수 오류: 예상 10건, 실제 %건',
            member_count;
    END IF;

    IF dealer_count <> 100 THEN
        RAISE EXCEPTION
            '딜러 email 반영 건수 오류: 예상 100건, 실제 %건',
            dealer_count;
    END IF;

    RAISE NOTICE
        '더미 로그인 정보 반영 완료: 회사 %건, 일반회원 %건, 딜러 %건',
        company_count,
        member_count,
        dealer_count;
END
$validation$;

COMMIT;

-- Supabase SQL Editor 결과 화면에서 최종 반영 건수를 확인합니다.
SELECT
    'companies.login_id' AS target,
    COUNT(*) AS applied_count
FROM public.companies
WHERE master_email ~ '^demo_company_(0[1-9]|1[0-9]|20)@kosmo[.]local$'
  AND login_id = regexp_replace(master_email, '@kosmo[.]local$', '')

UNION ALL

SELECT
    'members.login_id' AS target,
    COUNT(*) AS applied_count
FROM public.members
WHERE email ~ '^testuser([1-9]|10)@naver[.]com$'
  AND login_id = 'demo_member_'
      || lpad(
          substring(email FROM '^testuser([0-9]+)@naver[.]com$'),
          2,
          '0'
      )

UNION ALL

SELECT
    'dealers.email' AS target,
    COUNT(*) AS applied_count
FROM public.dealers
WHERE login_id ~ '^demo_dealer_10[0-9]{2}$'
  AND email = login_id || '@kosmo.local';
