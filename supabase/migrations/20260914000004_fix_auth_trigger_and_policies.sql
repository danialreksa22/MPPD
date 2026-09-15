-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Migration 04: Fix Auth Trigger & RLS Insert Policies
-- Mengizinkan pendaftaran akun otomatis dan trigger handle_new_user di Supabase Auth
-- ==============================================================================

-- 1. Berikan Policy INSERT pada tabel profiles agar trigger dan registrasi akun diizinkan
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated, anon, service_role
    WITH CHECK (true);

-- 2. Berikan Policy INSERT pada tabel user_roles
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
CREATE POLICY "user_roles_insert_policy" ON public.user_roles
    FOR INSERT TO authenticated, anon, service_role
    WITH CHECK (true);

-- 3. Perbarui trigger handle_new_user dengan search_path aman dan penanganan default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    v_role user_role_type;
    v_inst_id uuid;
BEGIN
    -- Masukkan profil pengguna baru
    INSERT INTO public.profiles (id, full_name, email, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

    -- Tentukan peran pengguna
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            v_role := (NEW.raw_user_meta_data->>'role')::user_role_type;
            
            IF NEW.raw_user_meta_data->>'institution_id' IS NOT NULL THEN
                v_inst_id := (NEW.raw_user_meta_data->>'institution_id')::uuid;
            END IF;

            INSERT INTO public.user_roles (user_id, role, institution_id)
            VALUES (NEW.id, v_role, v_inst_id)
            ON CONFLICT DO NOTHING;
        EXCEPTION
            WHEN OTHERS THEN
                INSERT INTO public.user_roles (user_id, role)
                VALUES (NEW.id, 'admin_diklat')
                ON CONFLICT DO NOTHING;
        END;
    ELSE
        -- Default role jika tidak dikirim dalam metadata
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin_diklat')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Pasang ulang trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
