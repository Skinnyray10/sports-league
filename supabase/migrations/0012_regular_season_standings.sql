-- =============================================================================
-- SPORTS LEAGUE · 0012_regular_season_standings.sql
-- =============================================================================
-- 1) La tabla de posiciones sólo cuenta partidos de fase regular; los de
--    liguilla (cuartos, semifinal, tercer lugar, final) ya no suman puntos.
-- 2) Nueva fase 'tercer_lugar' para el partido por el tercer puesto.
-- =============================================================================

alter table public.matches drop constraint chk_matches_stage;
alter table public.matches add constraint chk_matches_stage check (
  stage in ('regular', 'cuartos', 'semifinal', 'tercer_lugar', 'final')
);

create or replace view public.standings
with (security_invoker = true) as
select
  t.organization_id,
  t.division_id,
  t.group_id,
  d.tournament_id,
  d.sport_id,
  d.branch,
  d.category_id,
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
        then coalesce(os.points_win, s.points_win)
      when m.home_score = m.away_score and m.shootout_winner_team_id = t.id
        then coalesce(os.points_shootout_win, s.points_shootout_win)
      when m.home_score = m.away_score
           and m.shootout_winner_team_id is not null
           and m.shootout_winner_team_id <> t.id
        then coalesce(os.points_shootout_loss, s.points_shootout_loss)
      when m.home_score = m.away_score
        then coalesce(os.points_draw, s.points_draw)
      else coalesce(os.points_loss, s.points_loss)
    end
  ), 0) as puntos
from public.teams t
join public.divisions d on d.id = t.division_id
join public.sports s on s.id = d.sport_id
left join public.org_sports os
  on os.sport_id = d.sport_id
 and os.organization_id = t.organization_id
left join public.matches m
  on m.division_id = t.division_id
 and (m.home_team_id = t.id or m.away_team_id = t.id)
 and (t.group_id is null or m.group_id is null or m.group_id = t.group_id)
 and m.stage = 'regular'
group by
  t.organization_id, t.division_id, t.group_id, d.tournament_id,
  d.sport_id, d.branch, d.category_id, t.id, t.name;

create or replace view public.public_standings
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
 and m.stage = 'regular'
group by
  o.slug, t.organization_id, t.division_id, t.group_id, d.tournament_id,
  d.sport_id, sp.key, d.branch, d.category_id, cat.name, g.name, t.id, t.name;
