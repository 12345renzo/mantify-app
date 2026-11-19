-- Pruebas de integración del corte 7 (paradas, reportes e importación), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar lo esperado entre paréntesis.
do $$
declare
  v_plan uuid; a uuid; b uuid; pa_sup uuid; pa_tec uuid; pa_ger uuid; pb uuid;
  ua_sup uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ua_ger uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_sup uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid(); sa_ger uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; eq uuid; eq2 uuid; mci uuid; pm1 uuid; area uuid; p1 uuid; p2 uuid; k1 uuid := gen_random_uuid(); kc uuid := gen_random_uuid();
  v_res text := ''; v_n int; v_txt text; v_json jsonb;
  -- Horas locales (Lima) relativas a ahora.
  h5 text := to_char(now() at time zone 'America/Lima' - interval '5 hours', 'YYYY-MM-DD"T"HH24:MI');
  h4 text := to_char(now() at time zone 'America/Lima' - interval '4 hours', 'YYYY-MM-DD"T"HH24:MI');
  h3 text := to_char(now() at time zone 'America/Lima' - interval '3 hours', 'YYYY-MM-DD"T"HH24:MI');
  h1 text := to_char(now() at time zone 'America/Lima' - interval '1 hour', 'YYYY-MM-DD"T"HH24:MI');
  hoy date := (now() at time zone 'America/Lima')::date;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Pa A', '20777777791', 'pa-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Pa B', '20777777792', 'pa-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date - 1, current_date + 29, 380), (b, v_plan, current_date - 1, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sus', 'Sup') returning id into pa_sup;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Gina', 'Ger') returning id into pa_ger;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_sup, 'qs.a@x.pe'), (ua_tec, 'qt.a@x.pe'), (ua_ger, 'qg.a@x.pe'), (ub, 'qp.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_sup, ua_sup), (sa_tec, ua_tec), (sa_ger, ua_ger), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_sup, a, pa_sup, 'SUPERVISOR', 'qs.a@x.pe'), (ua_tec, a, pa_tec, 'TECNICO', 'qt.a@x.pe'),
    (ua_ger, a, pa_ger, 'GERENTE', 'qg.a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'qp.b@x.pe');
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'EQ-1', cat, 1000) returning id into eq;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'EQ-2', cat, 50) returning id into eq2;
  insert into public.motivos_parada (empresa_id, codigo, nombre) values (a, 'MCI', 'Correctivo inmediato') returning id into mci;
  insert into public.motivos_parada (empresa_id, codigo, nombre, duracion_estandar_horas) values (a, 'PM1', 'Preventivo 1', 4) returning id into pm1;
  insert into public.areas_responsables (empresa_id, nombre, tipo) values (a, 'Mecánica', 'PARADA') returning id into area;

  -- 1. El técnico inicia una parada MCI: no planificada, el equipo queda en mantenimiento; el reintento no duplica.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  p1 := public.iniciar_parada(jsonb_build_object('equipo_id', eq, 'motivo_id', mci, 'inicio', h5, 'horometro_inicio', 1010,
    'responsable_id', pa_tec), '{}', false, k1);
  if public.iniciar_parada(jsonb_build_object('equipo_id', eq), '{}', false, k1) <> p1 then raise exception '1 reintento creó otra'; end if;
  execute 'reset role';
  select codigo || ' ' || es_planificado || ' ' || estado into v_txt from public.paradas where id = p1;
  v_res := v_res || format('1 %s equipo=%s horo=%s (false ABIERTA EN_MANTENIMIENTO 1010.00); ', v_txt,
    (select estado_operativo from public.equipos where id = eq), (select horometro_actual from public.equipos where id = eq));

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  -- 2. Duplicado: mismo equipo, motivo y hora.
  begin perform public.iniciar_parada(jsonb_build_object('equipo_id', eq, 'motivo_id', mci, 'inicio', h5, 'horometro_inicio', 1010,
      'responsable_id', pa_tec), '{}', true, gen_random_uuid());
    v_res := v_res || '2 FALLO; ';
  exception when unique_violation then v_res := v_res || '2 ok; '; end;
  -- 3. Otra parada que se cruza con la abierta: se avisa; confirmada entra.
  begin perform public.iniciar_parada(jsonb_build_object('equipo_id', eq, 'motivo_id', pm1, 'inicio', h4, 'horometro_inicio', 1010,
      'responsable_externo', 'Taller X'), '{}', false, gen_random_uuid());
    v_res := v_res || '3 FALLO; ';
  exception when sqlstate 'MT005' then v_res := v_res || '3 ok cruce avisado; '; end;
  p2 := public.iniciar_parada(jsonb_build_object('equipo_id', eq, 'motivo_id', pm1, 'inicio', h4, 'horometro_inicio', 1010,
    'responsable_externo', 'Taller X'), '{}', true, gen_random_uuid());
  v_res := v_res || format('3b cruce=%s planificada=%s (true true); ', (select cruce_confirmado from public.paradas where id = p2),
    (select es_planificado from public.paradas where id = p2));

  -- 4. Cierre: salida antes, horómetro que baja y sin tarea no pasan.
  begin perform public.cerrar_parada(p1, jsonb_build_object('fin', h5, 'horometro_fin', 1020, 'descripcion', 'x'), '{}', true, gen_random_uuid());
    v_res := v_res || '4 FALLO; ';
  exception when check_violation then v_res := v_res || format('4 ok %s; ', sqlerrm); end;
  begin perform public.cerrar_parada(p1, jsonb_build_object('fin', h1, 'horometro_fin', 1000, 'descripcion', 'x'), '{}', true, gen_random_uuid());
    v_res := v_res || '4b FALLO; ';
  exception when check_violation then v_res := v_res || format('4b ok %s; ', sqlerrm); end;
  begin perform public.cerrar_parada(p1, jsonb_build_object('fin', h1, 'horometro_fin', 1020, 'descripcion', ' '), '{}', true, gen_random_uuid());
    v_res := v_res || '4c FALLO; ';
  exception when check_violation then v_res := v_res || '4c ok sin tarea; '; end;
  -- 5. Cierra con cruce (la PM1 sigue abierta): sin confirmar no; confirmado sí. Equipo sigue en mantenimiento.
  begin perform public.cerrar_parada(p1, jsonb_build_object('fin', h1, 'horometro_fin', 1020, 'descripcion', 'Cambio de manguera',
      'area_parada_id', area), '{}', false, kc);
    v_res := v_res || '5 FALLO; ';
  exception when sqlstate 'MT005' then v_res := v_res || '5 ok cruce al cerrar; '; end;
  perform public.cerrar_parada(p1, jsonb_build_object('fin', h1, 'horometro_fin', 1020, 'descripcion', 'Cambio de manguera',
    'area_parada_id', area, 'hallazgo', 'Abrazadera rota'), '{}', true, kc);
  perform public.cerrar_parada(p1, jsonb_build_object('fin', h1, 'horometro_fin', 1020, 'descripcion', 'Cambio de manguera'), '{}', true, kc);
  -- 6. El técnico no escribe directo.
  begin update public.paradas set estado = 'ABIERTA' where id = p1; get diagnostics v_n = row_count;
    v_res := v_res || format('6 %s; ', case when v_n = 0 then 'ok' else 'FALLO' end);
  exception when others then v_res := v_res || '6 ok; '; end;
  execute 'reset role';
  select estado || ' ' || duracion_horas into v_txt from public.paradas where id = p1;
  v_res := v_res || format('5b %s equipo=%s horo=%s lecturas=%s (CERRADA 4.00 EN_MANTENIMIENTO 1020.00 2); ', v_txt,
    (select estado_operativo from public.equipos where id = eq), (select horometro_actual from public.equipos where id = eq),
    (select count(*) from public.lecturas_horometro where equipo_id = eq and origen_tipo = 'PARADA'));

  -- 7. Cerrar la última abierta deja el equipo operativo.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  perform public.cerrar_parada(p2, jsonb_build_object('fin', h3, 'horometro_fin', 1015, 'descripcion', 'PM1 completo'), '{}', true, gen_random_uuid());
  -- 8. Backlog desde el hallazgo: origen PARADA; uno por parada.
  v_json := jsonb_build_object('equipo_id', eq, 'parada_id', p1, 'componente', 'Abrazadera', 'criticidad', 'ALTA',
    'descripcion', 'Abrazadera rota', 'fecha_observacion', hoy, 'fecha_programada', hoy);
  perform public.crear_backlog(v_json, '{}', p1);
  begin perform public.crear_backlog(v_json, '{}', gen_random_uuid()); v_res := v_res || '8b FALLO; ';
  exception when check_violation then v_res := v_res || '8b ok; '; end;
  execute 'reset role';
  v_res := v_res || format('7 equipo=%s (OPERATIVO); 8 %s (PARADA); ', (select estado_operativo from public.equipos where id = eq),
    (select origen from public.backlogs where parada_id = p1));

  -- 9. El gerente no registra pero sí lee el reporte del día.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  begin perform public.iniciar_parada(jsonb_build_object('equipo_id', eq2), '{}', false, gen_random_uuid()); v_res := v_res || '9 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '9 ok; '; end;
  select count(*), string_agg(backlog_codigo, ',') into v_n, v_txt from public.paradas_reporte((now() at time zone 'America/Lima' - interval '5 hours')::date, hoy);
  v_res := v_res || format('9b reporte=%s backlog=%s (2 BKL-000001); ', v_n, v_txt);
  begin perform public.paradas_reporte(hoy - 400, hoy); v_res := v_res || '9c FALLO; ';
  exception when invalid_parameter_value then v_res := v_res || '9c ok rango máximo; '; end;
  execute 'reset role';

  -- 10. Empresa B: su reporte no trae nada de A, ni pidiendo el id; no cierra ni crea backlog en A.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.paradas_reporte(hoy - 366, hoy, true);
  v_res := v_res || format('10 b ve=%s (0) por id=%s (0) tabla=%s (0); ', v_n, (select count(*) from public.paradas_reporte(null, null, false, p1)),
    (select count(*) from public.paradas where empresa_id = a));
  begin perform public.cerrar_parada(p1, '{}'::jsonb, '{}', true, gen_random_uuid()); v_res := v_res || '10b FALLO; ';
  exception when no_data_found then v_res := v_res || '10b ok; '; end;
  execute 'reset role';

  -- 11. Importar: nueva con hallazgo (crea backlog), repetida en el mismo archivo, equipo inexistente, motivo inexistente. Dos veces.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  v_json := jsonb_build_array(
    jsonb_build_object('fila', 2, 'id_importacion', 'IMP-1', 'equipo', 'eq-2', 'motivo', 'mci', 'inicio', h5, 'fin', h4,
      'horometro_inicio', 60, 'horometro_fin', 62, 'descripcion', 'Fuga', 'responsable', 'tito tec', 'area_parada', 'mecanica', 'hallazgo', 'Sello gastado'),
    jsonb_build_object('fila', 3, 'id_importacion', 'IMP-1', 'equipo', 'EQ-2', 'motivo', 'MCI', 'inicio', h3, 'fin', h1,
      'horometro_inicio', 62, 'horometro_fin', 63, 'descripcion', 'x', 'responsable', 'x'),
    jsonb_build_object('fila', 4, 'id_importacion', 'IMP-2', 'equipo', 'NO', 'motivo', 'MCI', 'inicio', h3, 'fin', h1,
      'horometro_inicio', 1, 'horometro_fin', 2, 'descripcion', 'x', 'responsable', 'x'),
    jsonb_build_object('fila', 5, 'id_importacion', 'IMP-3', 'equipo', 'EQ-2', 'motivo', 'Otro', 'inicio', h3, 'fin', h1,
      'horometro_inicio', 1, 'horometro_fin', 2, 'descripcion', 'x', 'responsable', 'x'));
  v_res := v_res || format('11 %s; ', public.importar_paradas(v_json));
  v_res := v_res || format('11b %s; ', public.importar_paradas(v_json));
  execute 'reset role';
  select count(*) into v_n from public.paradas where empresa_id = a and id_importacion is not null;
  v_res := v_res || format('11c importadas=%s responsable=%s backlog=%s horo=%s (1 true PARADA 62.00); ', v_n,
    (select responsable_id = pa_tec from public.paradas where id_importacion = 'IMP-1'),
    (select b2.origen from public.backlogs b2 join public.paradas p on p.id = b2.parada_id where p.id_importacion = 'IMP-1'),
    (select horometro_actual from public.equipos where id = eq2));

  -- 12. Una CERRADA sin fin, horómetro de fin o tarea no se guarda ni por fuera de las funciones.
  begin insert into public.paradas (empresa_id, codigo, equipo_id, motivo_id, es_planificado, inicio, horometro_inicio, responsable_externo, estado)
    values (a, 'PAR-X', eq2, mci, false, now() - interval '1 hour', 1, 'x', 'CERRADA');
    v_res := v_res || '12 FALLO; ';
  exception when check_violation then v_res := v_res || '12 ok; '; end;

  raise exception 'RESULTADOS: %', v_res;
end $$;
