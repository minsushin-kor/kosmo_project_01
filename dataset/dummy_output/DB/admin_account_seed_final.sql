-- 시연용 관리자 계정입니다. 실제 운영 환경에서는 비밀번호를 반드시 변경하세요.
BEGIN;

INSERT INTO public.members (
    email,
    password,
    name,
    phone,
    profile_image_url,
    role,
    created_at,
    updated_at
)
VALUES (
    'admin@admin.co.kr',
    '$2a$10$HxjZDQivXCiardiGjYrc0usBAw/Cc9X5AqDDoRTNVagboumQ4jx0e',
    '시연 관리자',
    '010-0000-0000',
    NULL,
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    profile_image_url = EXCLUDED.profile_image_url,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

DO $$
DECLARE
    saved_role VARCHAR(20);
BEGIN
    SELECT role
    INTO saved_role
    FROM public.members
    WHERE email = 'admin@admin.co.kr';

    IF saved_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION '관리자 계정 생성에 실패했습니다.';
    END IF;
END
$$;

COMMIT;
