-- Public Roots RPC wrappers execute as the authenticated caller, so the private
-- helpers need EXECUTE for authenticated. The private schema is not exposed as
-- a PostgREST API schema, and both helpers scope access with auth.uid().
grant execute on function private.read_my_root_pulse() to authenticated;
grant execute on function private.save_my_root_pulse(text,text) to authenticated;
