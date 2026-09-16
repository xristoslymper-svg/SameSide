-- SECURITY DEFINER functions are denied by default; expose only the intended authenticated RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_relationship_member(uuid) from public, anon, authenticated;
revoke execute on function public.create_solo_relationship() from public, anon, authenticated;
revoke execute on function public.create_relationship_invite(integer) from public, anon, authenticated;
revoke execute on function public.accept_relationship_invite(text) from public, anon, authenticated;
revoke execute on function public.complete_assignment(uuid,text) from public, anon, authenticated;
revoke execute on function public.refresh_shared_root_insights(uuid,integer) from public, anon, authenticated;

grant execute on function public.create_solo_relationship() to authenticated;
grant execute on function public.create_relationship_invite(integer) to authenticated;
grant execute on function public.accept_relationship_invite(text) to authenticated;
grant execute on function public.complete_assignment(uuid,text) to authenticated;
grant execute on function public.refresh_shared_root_insights(uuid,integer) to authenticated;

-- Avoid exposing the membership helper as a directly callable API while still allowing RLS policies to use it.
-- Table mutation remains restricted: clients cannot directly create memberships, invites, assignments, garden events or shared insights.
