-- Pruebas de integración del corte 10 (dashboard, bandeja y exportaciones), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar lo esperado entre paréntesis.
do $$
declare
  v_plan uuid; a uuid; b uuid; pa_plan uuid; pa_tec uuid; pa_otro uuid; pa_ger uuid; pb uuid;
  ua_plan uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ua_ger uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_plan uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid(); sa_ger uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; cat_b uuid; e1 uuid; e2 uuid; eb uuid; np uuid; pp uuid; mci uuid; mci_b uuid;
  b2 uuid; b3 uuid; b4 uuid; o1 uuid; o2 uuid; o3 uuid; p1 uuid;
  hoy date := (now() at time zone 'America/Lima')::date;
  desde date := date_trunc('month', (now() at time zone 'America/Lima'))::date;
  hasta date := (date_trunc('month', (now() at time zone 'America/Lima')) + interval '1 month - 1 day')::date;
  ua_sa uuid := gen_random_uuid(); sa_sa uuid := gen_random_uuid();
  v_res text := ''; v_j jsonb; v_n int; v_m int; v_txt text;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Rp A', '20666666661', 'rp-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Rp B', '20666666662', 'rp-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date - 1, current_date + 29, 380), (b, v_plan, current_date - 1, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Otro', 'Tec') returning id into pa_otro;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Gina', 'Ger') returning id into pa_ger;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_plan, 'rp.a@x.pe'), (ua_tec, 'rt.a@x.pe'), (ua_ger, 'rg.a@x.pe'), (ub, 'rp.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_plan, ua_plan), (sa_tec, ua_tec), (sa_ger, ua_ger), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'rp.a@x.pe'), (ua_tec, a, pa_tec, 'TECNICO', 'rt.a@x.pe'),
    (ua_ger, a, pa_ger, 'GERENTE', 'rg.a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'rp.b@x.pe');

  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat;
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (b, 'Camión', 'HORAS') returning id into cat_b;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual, estado_movilizacion, estado_operativo)
    values (a, 'RP-1', cat, 1000, 'MOVILIZADO', 'OPERATIVO') returning id into e1;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual, estado_movilizacion, estado_operativo)
    values (a, 'RP-2', cat, 500, 'DESMOVILIZADO', 'EN_MANTENIMIENTO') returning id into e2;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (b, 'RP-B', cat_b, 10) returning id into eb;

  -- Backlogs de A: pendiente; en proceso devuelto (OT de Tito); en proceso (OT de Otro); completado (OT cerrada hoy).
  insert into public.backlogs (empresa_id, codigo, equipo_id, componente, criticidad, descripcion, fecha_observacion, fecha_programada)
    values (a, 'RB-1', e1, 'Bomba', 'ALTA', 'x', hoy, hoy + 3);
  insert into public.backlogs (empresa_id, codigo, equipo_id, componente, criticidad, descripcion, fecha_observacion, fecha_programada)
    values (a, 'RB-2', e1, 'Freno', 'MEDIA', 'x', hoy - 10, hoy - 2) returning id into b2;
  insert into public.backlogs (empresa_id, codigo, equipo_id, componente, criticidad, descripcion, fecha_observacion, fecha_programada)
    values (a, 'RB-3', e2, 'Luz', 'BAJA', 'x', hoy, hoy + 5) returning id into b3;
  insert into public.backlogs (empresa_id, codigo, equipo_id, componente, criticidad, descripcion, fecha_observacion, fecha_programada)
    values (a, 'RB-4', e2, 'Filtro', 'ALTA', 'x', hoy - 3, hoy - 1) returning id into b4;
  insert into public.ordenes_trabajo (empresa_id, codigo, backlog_id, responsable_id, creado_por) values (a, 'RO-1', b2, pa_tec, ua_plan) returning id into o1;
  insert into public.ordenes_trabajo (empresa_id, codigo, backlog_id, responsable_id, creado_por) values (a, 'RO-2', b3, pa_otro, ua_plan) returning id into o2;
  insert into public.ordenes_trabajo (empresa_id, codigo, backlog_id, responsable_id, creado_por, estado) values (a, 'RO-3', b4, pa_otro, ua_plan, 'CERRADA') returning id into o3;
  update public.backlogs set estado = 'EN_PROCESO', orden_trabajo_id = o1, devuelto_en = now(), devuelto_por = ua_plan where id = b2;
  update public.backlogs set estado = 'EN_PROCESO', orden_trabajo_id = o2 where id = b3;
  update public.backlogs set estado = 'COMPLETADO', orden_trabajo_id = o3, cerrado_por = ua_plan, validado_por = ua_plan, validado_en = now() where id = b4;
  -- Un backlog de B, que A nunca debe ver.
  insert into public.backlogs (empresa_id, codigo, equipo_id, componente, criticidad, descripcion, fecha_observacion, fecha_programada)
    values (b, 'RB-B', eb, 'Motor', 'ALTA', 'x', hoy, hoy);

  -- Preventivos de A: vencido (reprogramado hoy), por vencer de Tito, completado este mes.
  insert into public.nombres_plan_preventivo (empresa_id, nombre) values (a, '250 h') returning id into np;
  insert into public.planes_preventivos (empresa_id, equipo_id, nombre_plan_id) values (a, e1, np) returning id into pp;
  insert into public.preventivos (empresa_id, codigo, plan_id, equipo_id, tipo, fecha_programada, tercero)
    values (a, 'RPM-1', pp, e1, 'PM1', hoy - 5, 'Taller') returning id into p1;
  insert into public.preventivos (empresa_id, codigo, plan_id, equipo_id, tipo, fecha_programada, responsable_id)
    values (a, 'RPM-2', pp, e1, 'PM1', hoy + 3, pa_tec);
  insert into public.preventivos (empresa_id, codigo, plan_id, equipo_id, tipo, fecha_programada, tercero, estado,
      ejecutado_por, fecha_ejecucion, hora_inicio, hora_fin, duracion_horas, turno)
    values (a, 'RPM-3', pp, e1, 'PM1', hoy - 1, 'Taller', 'COMPLETADO', ua_plan, hoy, '08:00', '10:00', 2, 'DIA');
  insert into public.preventivo_historial_estados (empresa_id, preventivo_id, evento, estado_nuevo) values (a, p1, 'REPROGRAMAR', 'PROGRAMADO');

  -- Paradas: una abierta de Tito y una cerrada hoy (3 h) en A; una abierta en B.
  insert into public.motivos_parada (empresa_id, codigo, nombre) values (a, 'MCI', 'Correctivo') returning id into mci;
  insert into public.motivos_parada (empresa_id, codigo, nombre) values (b, 'MCI', 'Correctivo') returning id into mci_b;
  insert into public.paradas (empresa_id, codigo, equipo_id, motivo_id, es_planificado, inicio, horometro_inicio, responsable_id)
    values (a, 'RS-1', e2, mci, false, now() - interval '2 hours', 500, pa_tec);
  insert into public.paradas (empresa_id, codigo, equipo_id, motivo_id, es_planificado, inicio, horometro_inicio, responsable_externo,
      estado, fin, horometro_fin, descripcion, cerrado_por, cerrado_en)
    values (a, 'RS-2', e1, mci, false, now() - interval '4 hours', 990, 'Contratista', 'CERRADA', now() - interval '1 hour', 993, 'Cambio', ua_plan, now());
  insert into public.paradas (empresa_id, codigo, equipo_id, motivo_id, es_planificado, inicio, horometro_inicio, responsable_externo)
    values (b, 'RS-B', eb, mci_b, false, now() - interval '1 hour', 10, 'Externo B');

  -- 1. Planificador A: cada lista coincide con la consulta directa al módulo.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  v_j := public.dashboard_datos(desde, hasta);
  execute 'reset role';
  select count(*) into v_n from public.backlogs where empresa_id = a and estado <> 'COMPLETADO' and eliminado_en is null;
  v_res := v_res || format('1 backlogs %s (esperado %s); ', jsonb_array_length(v_j->'backlogs'), v_n);
  select count(*) into v_n from public.ordenes_trabajo where empresa_id = a and (estado = 'ABIERTA' or (actualizado_en at time zone 'America/Lima')::date between desde and hasta);
  v_res := v_res || format('1b ots %s (esperado %s); ', jsonb_array_length(v_j->'ots'), v_n);
  select count(*) into v_n from public.preventivos where empresa_id = a and (estado in ('PROGRAMADO','DEVUELTO','COMPLETADO') or fecha_ejecucion between desde and hasta);
  v_res := v_res || format('1c preventivos %s (esperado %s), reprogramados %s (esperado 1); ', jsonb_array_length(v_j->'preventivos'), v_n, v_j->>'reprogramados');
  select count(*) into v_n from public.equipos where empresa_id = a and eliminado_en is null;
  v_res := v_res || format('1d equipos %s (esperado %s); ', jsonb_array_length(v_j->'equipos'), v_n);
  select count(*) into v_n from public.paradas where empresa_id = a and estado = 'ABIERTA';
  select count(*) into v_m from public.paradas where empresa_id = a and estado = 'CERRADA' and (fin at time zone 'America/Lima')::date between desde and hasta;
  v_res := v_res || format('1e paradas abiertas %s (esperado %s), cerradas %s (esperado %s) de %s h (esperado 3); ',
    jsonb_array_length(v_j->'paradas_abiertas'), v_n, jsonb_array_length(v_j->'paradas_cerradas'), v_m, v_j->'paradas_cerradas'->0->>'duracion_horas');
  v_res := v_res || format('1f RB-2 devuelto=%s de %s (esperado true de Tito Tec); ',
    (select x->>'devuelto' from jsonb_array_elements(v_j->'backlogs') x where x->>'codigo' = 'RB-2'),
    (select x->>'tecnico' from jsonb_array_elements(v_j->'backlogs') x where x->>'codigo' = 'RB-2'));

  -- 2. Aislamiento: nada de B en lo que ve A.
  v_res := v_res || case when v_j::text like '%RB-B%' or v_j::text like '%RS-B%' or v_j::text like '%RP-B%'
    then '2 FALLO aparece B; ' else '2 ok nada de B; ' end;

  -- 3. Técnico: solo lo suyo; sin flota, sin horas, sin reprogramados.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  v_j := public.dashboard_datos(desde, hasta);
  execute 'reset role';
  v_res := v_res || format('3 técnico: backlogs %s, ots %s, preventivos %s, paradas %s (esperado 1,1,1,1); equipos %s, cerradas %s, reprog %s (esperado 0,0,0); ',
    jsonb_array_length(v_j->'backlogs'), jsonb_array_length(v_j->'ots'), jsonb_array_length(v_j->'preventivos'),
    jsonb_array_length(v_j->'paradas_abiertas'), jsonb_array_length(v_j->'equipos'), jsonb_array_length(v_j->'paradas_cerradas'), v_j->>'reprogramados');

  -- 4. Gerente lee; el superadmin y un rango absurdo no.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  v_j := public.dashboard_datos(desde, hasta);
  v_res := v_res || format('4 gerente equipos %s (esperado 2); ', jsonb_array_length(v_j->'equipos'));
  begin
    perform public.dashboard_datos(desde, desde + 400);
    v_res := v_res || '4b FALLO aceptó rango de 400 días; ';
  exception when sqlstate '22023' then v_res := v_res || '4b ok rango largo rechazado; ';
  end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","app_metadata":{"rol":"SUPERADMIN"}}', gen_random_uuid()), true);
  begin
    perform public.dashboard_datos(desde, hasta);
    v_res := v_res || '4c FALLO el superadmin leyó; ';
  exception when insufficient_privilege then v_res := v_res || '4c ok superadmin sin dashboard; ';
  end;

  -- 5. JSON de la empresa (T5): el planificador descarga la suya, sin facturación ni nada de B.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  v_j := public.exportar_empresa(a, false);
  execute 'reset role';
  select count(*) into v_n from public.backlogs where empresa_id = a;
  v_res := v_res || format('5 json backlogs %s (esperado %s), personas %s (esperado 4), sin pagos=%s; ',
    jsonb_array_length(v_j->'tablas'->'backlogs'), v_n, jsonb_array_length(v_j->'tablas'->'personas'), not (v_j->'tablas' ? 'pagos'));
  v_res := v_res || case when v_j::text like '%' || b || '%' or v_j::text like '%RB-B%' or v_j::text like '%encrypted_password%'
    then '5b FALLO aparece B o un secreto; ' else '5b ok nada de B ni secretos; ' end;
  execute 'set local role authenticated';
  begin perform public.exportar_empresa(b, false); v_res := v_res || '5c FALLO exportó B; ';
  exception when insufficient_privilege then v_res := v_res || '5c ok no exporta B; '; end;
  begin perform public.exportar_empresa(a, true); v_res := v_res || '5d FALLO respaldo completo; ';
  exception when insufficient_privilege then v_res := v_res || '5d ok sin respaldo completo; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.exportar_empresa(a, false); v_res := v_res || '5e FALLO el técnico exportó; ';
  exception when insufficient_privilege then v_res := v_res || '5e ok técnico no exporta; '; end;
  execute 'reset role';

  -- 6. Toda tabla con empresa_id está decidida en el respaldo (y no sobra ninguna).
  select string_agg(x, ',') into v_txt from (
    (select c.table_name::text x from information_schema.columns c join information_schema.tables t
       on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public' and c.column_name = 'empresa_id' and t.table_type = 'BASE TABLE'
     except select tabla from public._tablas_respaldo())
    union all
    (select tabla from public._tablas_respaldo()
     except select c.table_name::text from information_schema.columns c where c.table_schema = 'public' and c.column_name = 'empresa_id')) d;
  v_res := v_res || format('6 tablas sin decidir: %s (esperado ninguna); ', coalesce(v_txt, 'ninguna'));

  -- 7. Superadmin (T6): respaldo completo de A, con facturación y la empresa, sin B y con su registro de auditoría.
  insert into auth.users (id, email) values (ua_sa, 'sa@x.pe');
  insert into auth.sessions (id, user_id) values (sa_sa, ua_sa);
  insert into public.usuarios (id, empresa_id, rol, correo) values (ua_sa, null, 'SUPERADMIN', 'sa@x.pe');
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s","app_metadata":{"rol":"SUPERADMIN"}}', ua_sa, sa_sa), true);
  execute 'set local role authenticated';
  v_j := public.exportar_empresa(a, true);
  execute 'reset role';
  select count(*) into v_n from public.eventos_auditoria where empresa_id = a and accion = 'RESPALDO' and usuario_id = ua_sa;
  v_res := v_res || format('7 respaldo: membresías %s (esperado 1), empresa %s, auditoría %s (esperado 1); ',
    jsonb_array_length(v_j->'tablas'->'membresias'), v_j->'tablas'->'empresas'->0->>'ruc', v_n);
  v_res := v_res || case when v_j::text like '%' || b || '%' then '7b FALLO aparece B; ' else '7b ok nada de B; ' end;

  raise exception 'RESULTADOS (todo revertido): %', v_res;
end $$;
