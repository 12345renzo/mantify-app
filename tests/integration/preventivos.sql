-- Pruebas de integración del corte 6 (preventivos), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar lo esperado entre paréntesis.
do $$
declare
  v_plan uuid; a uuid; b uuid;
  pa_plan uuid; pa_sup uuid; pa_tec uuid; pa_otro uuid; pb uuid;
  ua_plan uuid := gen_random_uuid(); ua_sup uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_plan uuid := gen_random_uuid(); sa_sup uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; cat2 uuid; eq uuid; eq_b uuid; np uuid; np_b uuid; pv uuid; pv2 uuid; bk uuid; act_obs uuid;
  k1 uuid := gen_random_uuid(); k_ej uuid := gen_random_uuid();
  v_res text := ''; v_n int; v_txt text; v_json jsonb; f_tec text; f_sup text; v_acts jsonb;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Pv A', '20777777781', 'pv-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Pv B', '20777777782', 'pv-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sus', 'Sup') returning id into pa_sup;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Otro', 'Tec') returning id into pa_otro;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_plan, 'pp.a@x.pe'), (ua_sup, 'ps.a@x.pe'), (ua_tec, 'pt.a@x.pe'), (ub, 'pp.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_plan, ua_plan), (sa_sup, ua_sup), (sa_tec, ua_tec), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'pp.a@x.pe'), (ua_sup, a, pa_sup, 'SUPERVISOR', 'ps.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 'pt.a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'pp.b@x.pe');
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat;
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Grúa', 'HORAS') returning id into cat2;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'EQ-1', cat, 1500) returning id into eq;
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (b, 'Camión', 'HORAS') returning id into v_plan;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (b, 'EQ-B', v_plan, 10) returning id into eq_b;
  insert into public.nombres_plan_preventivo (empresa_id, nombre) values (a, '250 h') returning id into np;
  insert into public.nombres_plan_preventivo (empresa_id, nombre) values (b, '250 h') returning id into np_b;
  -- Plantilla: general PM1, de su categoría sin tipo, de otra categoría y de otro tipo (estas dos no se copian).
  insert into public.plantillas_actividades (empresa_id, categoria_id, plan, descripcion, orden) values
    (a, null, 'PM1', 'Cambiar aceite', 1), (a, cat, null, 'Revisar frenos', 2), (a, cat2, 'PM1', 'Pluma', 3), (a, null, 'PM2', 'Filtros', 4);
  f_tec := a || '/firmas/' || gen_random_uuid() || '.png';
  f_sup := a || '/firmas/' || gen_random_uuid() || '.png';
  insert into storage.objects (bucket_id, name, owner_id, metadata) values
    ('archivos', f_tec, ua_tec::text, '{"mimetype":"image/png","size":1200}'),
    ('archivos', f_sup, ua_sup::text, '{"mimetype":"image/png","size":1200}');

  -- 1. El planificador programa PM1: actividades de la plantilla (2), historial; reintento con la misma clave no duplica.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  pv := public.programar_preventivo(jsonb_build_object('equipo_id', eq, 'nombre_plan_id', np, 'tipo', 'PM1',
    'fecha_programada', current_date + 7, 'horometro_programado', 1750, 'responsable_id', pa_tec, 'cada_dias', 30), k1);
  if public.programar_preventivo(jsonb_build_object('equipo_id', eq), k1) <> pv then raise exception '1 reintento creó otro'; end if;
  select codigo || ' ' || estado into v_txt from public.preventivos where id = pv;
  v_res := v_res || format('1 %s acts=%s prev=%s (PROGRAMADO, Cambiar aceite, Revisar frenos, 1); ', v_txt,
    (select string_agg(descripcion, ', ' order by orden) from public.preventivo_actividades where preventivo_id = pv),
    (select count(*) from public.preventivos where empresa_id = a));

  -- 2. Mismo equipo, plan y fecha: no entra.
  begin perform public.programar_preventivo(jsonb_build_object('equipo_id', eq, 'nombre_plan_id', np, 'tipo', 'PM1',
      'fecha_programada', current_date + 7, 'tercero', 'Taller X'), gen_random_uuid());
    v_res := v_res || '2 FALLO; ';
  exception when unique_violation then v_res := v_res || '2 ok; '; end;
  -- 3. Responsable o tercero, nunca los dos ni ninguno.
  begin perform public.programar_preventivo(jsonb_build_object('equipo_id', eq, 'nombre_plan_id', np, 'tipo', 'PM1',
      'fecha_programada', current_date + 9), gen_random_uuid());
    v_res := v_res || '3 FALLO; ';
  exception when check_violation then v_res := v_res || '3 ok; '; end;

  -- 4. Importar: nueva, duplicada (la del punto 1), equipo inexistente, plan inexistente. Dos veces: no duplica.
  v_json := jsonb_build_array(
    jsonb_build_object('fila', 2, 'equipo', 'eq-1', 'plan', '250 H', 'tipo', 'PM2', 'fecha', current_date + 30, 'responsable', 'tito tec'),
    jsonb_build_object('fila', 3, 'equipo', 'EQ-1', 'plan', '250 h', 'tipo', 'PM1', 'fecha', current_date + 7, 'responsable', 'Taller X'),
    jsonb_build_object('fila', 4, 'equipo', 'NO-EXISTE', 'plan', '250 h', 'tipo', 'PM1', 'fecha', current_date, 'responsable', 'Taller X'),
    jsonb_build_object('fila', 5, 'equipo', 'EQ-1', 'plan', 'Mensual', 'tipo', 'PM1', 'fecha', current_date, 'responsable', 'Taller X'));
  v_txt := public.importar_preventivos(v_json)::text;
  v_res := v_res || format('4 %s; ', v_txt);
  v_txt := public.importar_preventivos(v_json)::text;
  select count(*) into v_n from public.preventivos where empresa_id = a;
  v_res := v_res || format('4b %s total=%s (2 OMITIDO, total 2); ', v_txt, v_n);
  v_res := v_res || format('4c responsable resuelto=%s (true); ',
    (select responsable_id = pa_tec from public.preventivos where empresa_id = a and tipo = 'PM2'));
  execute 'reset role';

  -- 5. Empresa B: no ve los preventivos de A; no usa el plan de A con su equipo ni su plan con el equipo de A.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.preventivos where empresa_id = a;
  begin perform public.programar_preventivo(jsonb_build_object('equipo_id', eq_b, 'nombre_plan_id', np, 'tipo', 'PM1',
      'fecha_programada', current_date, 'tercero', 'Taller'), gen_random_uuid());
    v_res := v_res || '5 FALLO plan de A; ';
  exception when foreign_key_violation then v_res := v_res || format('5 ok %s (ve %s); ', sqlerrm, v_n); end;
  begin perform public.programar_preventivo(jsonb_build_object('equipo_id', eq, 'nombre_plan_id', np_b, 'tipo', 'PM1',
      'fecha_programada', current_date, 'tercero', 'Taller'), gen_random_uuid());
    v_res := v_res || '5b FALLO equipo de A; ';
  exception when foreign_key_violation then v_res := v_res || format('5b ok %s; ', sqlerrm); end;
  begin perform public.ejecutar_preventivo(pv, '{}'::jsonb, '{}', gen_random_uuid()); v_res := v_res || '5c FALLO; ';
  exception when no_data_found then v_res := v_res || '5c ok; '; end;
  execute 'reset role';

  -- 6. El técnico no programa ni escribe directo en preventivos.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.programar_preventivo(jsonb_build_object('equipo_id', eq), gen_random_uuid()); v_res := v_res || '6 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '6 ok; '; end;
  begin update public.preventivos set estado = 'VALIDADO' where id = pv; get diagnostics v_n = row_count;
    v_res := v_res || format('6b %s; ', case when v_n = 0 then 'ok' else 'FALLO' end);
  exception when others then v_res := v_res || '6b ok; '; end;

  -- 7. Ejecutar: sin todas las actividades no; OBSERVADO sin observación no; sin firma no.
  select jsonb_agg(jsonb_build_object('id', id, 'resultado', 'OK') order by orden) into v_acts from public.preventivo_actividades where preventivo_id = pv;
  begin perform public.ejecutar_preventivo(pv, jsonb_build_object('fecha_ejecucion', current_date, 'hora_inicio', '22:00', 'hora_fin', '02:00',
      'turno', 'NOCHE', 'actividades', v_acts - 1), '{}', gen_random_uuid());
    v_res := v_res || '7 FALLO; ';
  exception when check_violation then v_res := v_res || format('7 ok %s; ', sqlerrm); end;
  select id into act_obs from public.preventivo_actividades where preventivo_id = pv and descripcion = 'Revisar frenos';
  select jsonb_agg(case when x->>'id' = act_obs::text then jsonb_build_object('id', act_obs, 'resultado', 'OBSERVADO', 'observacion', '') else x end)
    into v_acts from jsonb_array_elements(v_acts) x;
  begin perform public.ejecutar_preventivo(pv, jsonb_build_object('fecha_ejecucion', current_date, 'hora_inicio', '22:00', 'hora_fin', '02:00',
      'turno', 'NOCHE', 'actividades', v_acts), '{}', gen_random_uuid());
    v_res := v_res || '7b FALLO; ';
  exception when check_violation then v_res := v_res || '7b ok observado exige observación; '; end;
  select jsonb_agg(case when x->>'id' = act_obs::text then jsonb_build_object('id', act_obs, 'resultado', 'OBSERVADO', 'observacion', 'Pastillas gastadas') else x end)
    into v_acts from jsonb_array_elements(v_acts) x;
  begin perform public.ejecutar_preventivo(pv, jsonb_build_object('fecha_ejecucion', current_date, 'hora_inicio', '22:00', 'hora_fin', '02:00',
      'turno', 'NOCHE', 'actividades', v_acts), '{}', gen_random_uuid());
    v_res := v_res || '7c FALLO; ';
  exception when check_violation then v_res := v_res || format('7c ok %s; ', sqlerrm); end;

  -- 8. Con firma: cruce de medianoche 22:00 → 02:00 = 4 h, COMPLETADO, firma, horómetro 1500 → 1760 (lectura PREVENTIVO). Reintento no repite.
  perform public.guardar_mi_firma(f_tec);
  v_json := jsonb_build_object('fecha_ejecucion', current_date, 'hora_inicio', '22:00', 'hora_fin', '02:00', 'turno', 'NOCHE',
    'horometro_ejecucion', 1760, 'actividades', v_acts, 'repuestos', jsonb_build_array(jsonb_build_object('descripcion', 'Aceite 15W40', 'cantidad', 4, 'unidad', 'gal')),
    'personal', jsonb_build_array(pa_otro));
  perform public.ejecutar_preventivo(pv, v_json, '{}', k_ej);
  perform public.ejecutar_preventivo(pv, v_json, '{}', k_ej);
  execute 'reset role';
  select estado || ' ' || duracion_horas || ' ' || turno into v_txt from public.preventivos where id = pv;
  v_res := v_res || format('8 %s firmas=%s horo=%s lecturas=%s rep=%s pers=%s (COMPLETADO 4.00 NOCHE 1 1760.00 1 1 1); ', v_txt,
    (select count(*) from public.preventivo_firmas where preventivo_id = pv and vigente),
    (select horometro_actual from public.equipos where id = eq),
    (select count(*) from public.lecturas_horometro where equipo_id = eq and origen_tipo = 'PREVENTIVO'),
    (select count(*) from public.preventivo_repuestos where preventivo_id = pv and not anulado),
    (select count(*) from public.preventivo_personal where preventivo_id = pv and not anulado));

  -- 9. Backlog desde la actividad observada: origen PREVENTIVO con preventivo_id; la misma actividad no genera otro.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  bk := public.crear_backlog(jsonb_build_object('equipo_id', eq, 'componente', 'Revisar frenos', 'criticidad', 'MEDIA',
    'descripcion', 'Pastillas gastadas', 'fecha_observacion', current_date, 'fecha_programada', current_date, 'actividad_id', act_obs), '{}', act_obs);
  begin perform public.crear_backlog(jsonb_build_object('equipo_id', eq, 'componente', 'x', 'criticidad', 'MEDIA', 'descripcion', 'x',
      'fecha_observacion', current_date, 'fecha_programada', current_date, 'actividad_id', act_obs), '{}', gen_random_uuid());
    v_res := v_res || '9b FALLO; ';
  exception when check_violation then v_res := v_res || '9b ok; '; end;
  execute 'reset role';
  select origen || ' ' || (preventivo_id = pv) || ' ' || estado into v_txt from public.backlogs where id = bk;
  v_res := v_res || format('9 %s enlazada=%s (PREVENTIVO true PENDIENTE true); ', v_txt,
    (select backlog_id = bk from public.preventivo_actividades where id = act_obs));

  -- 10. COMPLETADO exige validación: el técnico no valida; validar un PROGRAMADO no entra.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.validar_preventivo(pv, true, null, gen_random_uuid()); v_res := v_res || '10 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '10 ok; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  select id into pv2 from public.preventivos where empresa_id = a and tipo = 'PM2';
  begin perform public.validar_preventivo(pv2, true, null, gen_random_uuid()); v_res := v_res || '10b FALLO; ';
  exception when sqlstate 'MT004' then v_res := v_res || '10b ok; '; end;

  -- 11. El supervisor devuelve (exige nota): DEVUELTO, firma deja de valer; el técnico re-ejecuta; el supervisor aprueba con firma.
  begin perform public.validar_preventivo(pv, false, '', gen_random_uuid()); v_res := v_res || '11 FALLO; ';
  exception when check_violation then v_res := v_res || '11 ok sin nota; '; end;
  perform public.validar_preventivo(pv, false, 'Falta detallar el filtro', gen_random_uuid());
  select estado into v_txt from public.preventivos where id = pv;
  v_res := v_res || format('11b %s vigentes=%s (DEVUELTO 0); ', v_txt, (select count(*) from public.preventivo_firmas where preventivo_id = pv and vigente));
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  perform public.ejecutar_preventivo(pv, v_json || jsonb_build_object('notas', 'Filtro Fleetguard'), '{}', gen_random_uuid());
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  begin perform public.validar_preventivo(pv, true, null, gen_random_uuid()); v_res := v_res || '11c FALLO sin firma; ';
  exception when check_violation then v_res := v_res || '11c ok validador sin firma; '; end;
  perform public.guardar_mi_firma(f_sup);
  perform public.validar_preventivo(pv, true, null, gen_random_uuid());
  select estado into v_txt from public.preventivos where id = pv;
  v_res := v_res || format('11d %s vigentes=%s rep=%s hist=%s (VALIDADO 2 1 5); ', v_txt,
    (select count(*) from public.preventivo_firmas where preventivo_id = pv and vigente),
    (select count(*) from public.preventivo_repuestos where preventivo_id = pv and not anulado),
    (select count(*) from public.preventivo_historial_estados where preventivo_id = pv));

  -- 12. Reprogramar: solo PROGRAMADO y no a una fecha pasada.
  begin perform public.reprogramar_preventivo(pv2, current_date - 1, gen_random_uuid()); v_res := v_res || '12 FALLO; ';
  exception when check_violation then v_res := v_res || '12 ok; '; end;
  perform public.reprogramar_preventivo(pv2, current_date + 37, gen_random_uuid());
  begin perform public.reprogramar_preventivo(pv, current_date + 7, gen_random_uuid()); v_res := v_res || '12b FALLO; ';
  exception when sqlstate 'MT004' then v_res := v_res || '12b ok; '; end;
  v_res := v_res || format('12c %s (+37 días); ', (select fecha_programada - current_date from public.preventivos where id = pv2));
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;
