-- =============================================================================
-- SPORTS LEAGUE · 0004_fix_public_standings_scorers.sql
-- =============================================================================
-- public_standings / public_scorers colgaban de standings/scorers, que son
-- security_invoker: aunque la vista externa fuera definer, el RLS de las
-- tablas base se seguía evaluando con el rol anónimo y salían vacías.
-- Se reescriben leyendo directo de las tablas base.
-- =============================================================================

drop view if exists public.public_standings;
drop view if exists public.public_scorers;

create view public.public_standings
with (security_invoker = false) as
select
  o.slug as org_slug,
  t.organization_id,
  t.division_id,
  t.group_id,
  d.tournament_id,
  d.sport_id,
  sp.key as sport_key,
  d.branch,
  d.category_id,
  cat.name as category_name,
  g.name as group_name,
  t.id as team_id,
  t.name as team_name,
  count(m.id) filter (where m.status = 'finalizado') as jugados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and (
        (m.home_team_id = t.id and m.home_score > m.away_score)
        or (m.away_team_id = t.id and m.away_score > m.home_score)
        or (m.home_score = m.away_score and m.shootout_winner_team_id = t.id)
      )
  ) as ganados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and (
        (m.home_team_id = t.id and m.home_score < m.away_score)
        or (m.away_team_id = t.id and m.away_score < m.home_score)
        or (
          m.home_score = m.away_score
          and m.shootout_winner_team_id is not null
          and m.shootout_winner_team_id <> t.id
        )
      )
  ) as perdidos,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id is null
  ) as empatados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id = t.id
  ) as empates_ganados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id is not null
      and m.shootout_winner_team_id <> t.id
  ) as empates_perdidos,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.home_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.away_score
      else 0
    end
  ), 0) as a_favor,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.away_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.home_score
      else 0
    end
  ), 0) as en_contra,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.home_score - m.away_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.away_score - m.home_score
      else 0
    end
  ), 0) as diferencia,
  coalesce(sum(
    case
      when m.status <> 'finalizado' then 0
      when (m.home_team_id = t.id and m.home_score > m.away_score)
        or (m.away_team_id = t.id and m.away_score > m.home_score)
        then coalesce(os.points_win, sp.points_win)
      when m.home_score = m.away_score and m.shootout_winner_team_id = t.id
        then coalesce(os.points_shootout_win, sp.points_shootout_win)
      when m.home_score = m.away_score
           and m.shootout_winner_team_id is not null
           and m.shootout_winner_team_id <> t.id
        then coalesce(os.points_shootout_loss, sp.points_shootout_loss)
      when m.home_score = m.away_score
        then coalesce(os.points_draw, sp.points_draw)
      else coalesce(os.points_loss, sp.points_loss)
    end
  ), 0) as puntos
from public.teams t
join public.organizations o on o.id = t.organization_id and o.is_public = true
join public.divisions d on d.id = t.division_id
join public.sports sp on sp.id = d.sport_id
join public.categories cat on cat.id = d.category_id
left join public.groups g on g.id = t.group_id
left join public.org_sports os
  on os.sport_id = d.sport_id
 and os.organization_id = t.organization_id
left join public.matches m
  on m.division_id = t.division_id
 and (m.home_team_id = t.id or m.away_team_id = t.id)
 and (t.group_id is null or m.group_id is null or m.group_id = t.group_id)
group by
  o.slug, t.organization_id, t.division_id, t.group_id, d.tournament_id,
  d.sport_id, sp.key, d.branch, d.category_id, cat.name, g.name, t.id, t.name;

create view public.public_scorers
with (security_invoker = false) as
select
  o.slug as org_slug,
  pr.organization_id,
  m.division_id,
  m.group_id,
  sp.key as sport_key,
  d.branch,
  cat.name as category_name,
  pr.id as player_registration_id,
  p.first_names,
  p.last_names,
  t.id as team_id,
  t.name as team_name,
  sum(me.quantity) filter (where me.event_type in ('gol', 'pts', 'carrera')) as anotaciones
from public.match_events me
join public.match_sheets ms on ms.id = me.match_sheet_id
join public.matches m on m.id = ms.match_id and m.status = 'finalizado'
join public.organizations o on o.id = m.organization_id and o.is_public = true
join public.divisions d on d.id = m.division_id
join public.sports sp on sp.id = d.sport_id
join public.categories cat on cat.id = d.category_id
join public.player_registrations pr on pr.id = me.player_registration_id
join public.players p on p.id = pr.player_id
join public.teams t on t.id = pr.team_id
group by
  o.slug, pr.organization_id, m.division_id, m.group_id, sp.key, d.branch,
  cat.name, pr.id, p.first_names, p.last_names, t.id, t.name;

revoke all on public.public_standings, public.public_scorers from anon, authenticated;
grant select on public.public_standings, public.public_scorers to anon, authenticated;
