ALTER TABLE public.profiles
ADD CONSTRAINT profiles_username_length CHECK (char_length(username) <= 80);