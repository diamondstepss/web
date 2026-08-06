-- Grant admin to the shop's own account.
--
-- 0003 granted it to the developer account that set the project up. This adds
-- the shop's account, so the owner can run their own store without borrowing
-- someone else's login.
--
-- Recorded as a migration rather than left as a one-off dashboard edit: a
-- rebuild from migrations would otherwise come up with an admin list that does
-- not match production, and the difference would only surface when someone
-- could not get in.
--
-- Still deliberately not the demo account — its password ships in client JS.

update public.profiles
   set is_admin = true
 where id = (select id from auth.users where email = 'diamondstepsweb@gmail.com');
