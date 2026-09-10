create or replace function public.record_ticket_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.tickets where id = new.ticket_id;
  update public.tickets
  set
    updated_at = now(),
    status = case
      when public.is_staff(new.author_id) then 'waiting_for_customer'::public.ticket_status
      else 'open'::public.ticket_status
    end
  where id = new.ticket_id;
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (owner_id, new.author_id, 'ticket.replied', 'ticket', new.ticket_id::text);
  return new;
end; $$;
