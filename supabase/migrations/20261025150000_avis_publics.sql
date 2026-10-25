-- Avis clients sur l'accueil : les commentaires laissés après une commande
-- servie (étape 5) s'affichent publiquement, avec le prénom et l'initiale du
-- nom seulement. Le gérant et l'admin peuvent masquer un avis de l'accueil.

alter table public.orders
  add column review_hidden boolean not null default false;

drop index public.orders_commented_at_idx;
create index orders_public_reviews_idx on public.orders (commented_at desc)
  where commented_at is not null and not review_hidden;

-- ---------------------------------------------------------------------------
-- Avis visibles sur l'accueil, lisibles sans connexion. Ne renvoie ni la
-- commande, ni le client : seulement le texte, la date et « Prénom N. ».
-- ---------------------------------------------------------------------------
create function public.public_reviews(p_limit integer default 6)
returns table (author text, comment text, commented_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  -- Même forme de nom que le classement des clients.
  select
    split_part(trim(p.full_name), ' ', 1)
      || coalesce(' ' || nullif(left(split_part(trim(p.full_name), ' ', 2), 1), '') || '.', ''),
    o.customer_comment,
    o.commented_at
  from public.orders o
  join public.profiles p on p.id = o.customer_id
  where o.commented_at is not null
    and o.customer_comment is not null
    and not o.review_hidden
    and p.is_active
  order by o.commented_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

-- ---------------------------------------------------------------------------
-- Masquer ou remettre un avis sur l'accueil : gérant et admin seulement.
-- ---------------------------------------------------------------------------
create function public.set_review_hidden(p_order_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_manager() then
    raise exception 'Seuls le gérant et l''administrateur gèrent les avis' using errcode = '42501';
  end if;

  update public.orders
  set review_hidden = coalesce(p_hidden, true)
  where id = p_order_id and commented_at is not null;
  if not found then
    raise exception 'Avis introuvable' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function
  public.public_reviews(integer),
  public.set_review_hidden(uuid, boolean)
from public, anon;
grant execute on function public.public_reviews(integer) to anon, authenticated;
grant execute on function public.set_review_hidden(uuid, boolean) to authenticated;
