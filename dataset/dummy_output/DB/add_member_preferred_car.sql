-- 일반회원 가입 시 입력한 선호차량 자유 입력값을 저장합니다.
-- 기존 회원은 값이 없을 수 있으므로 NULL을 허용합니다.
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS preferred_car VARCHAR(200);
