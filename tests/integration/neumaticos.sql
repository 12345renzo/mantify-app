-- Pruebas de integración del corte 9 (neumáticos), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
do $$
declare
  v_plan uuid; a uuid; b uuid; pp uuid; ps uuid; pt uuid; pg uuid; pb uuid;
  up uuid := gen_random_uuid(); us uuid := gen_random_uuid(); ut uuid := gen_random_uuid(); ug uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sp uuid := gen_random_uuid(); ss uuid := gen_random_uuid(); st uuid := gen_random_uuid(); sg uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; eq uuid; mot uuid; n1 uuid; n2 uuid; pdi uuid; pdd uuid; pp1 uuid;
  k1 uuid := gen_random_uuid(); k2 uuid := gen_random_uuid(); km uuid := gen_random_uuid();
  v_res text := ''; v_n int; v_txt text; hoy date := (now() at time zone 'America/Lima')::date;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Neu A', '20777777761', 'neu-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Neu B', '20777777762', 'neu-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values
    (a, v_plan, current_date - 1, current_date + 29, 380), (b, v_plan, current_date - 1, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'P', 'P') returning id into pp;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'S', 'S') returning id into ps;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'T', 'T') returning id into pt;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'G', 'G') returning id into pg;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'B', 'B') returning id into pb;
  insert into auth.users (id, email) values (up, 'np@x.pe'), (us, 'ns@x.pe'), (ut, 'nt@x.pe'), (ug, 'ng@x.pe'), (ub, 'nb@x.pe');
  insert into auth.sessions (id, user_id) values (sp, up), (ss, us), (st, ut), (sg, ug), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values (up, a, pp, 'PLANIFICADOR', 'np@x.pe'),
    (us, a, ps, 'SUPERVISOR', 'ns@x.pe'), (ut, a, pt, 'TECNICO', 'nt@x.pe'), (ug, a, pg, 'GERENTE', 'ng@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'nb@x.pe');
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Volquete', 'HORAS') returning id into cat;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'VOL-1', cat, 1000) returning id into eq;
  insert into public.motivos_retiro_neumatico (empresa_id, nombre) values (a, 'Desgaste') returning id into mot;

  -- 1. Nadie escribe directo; neumaticos no se lee directo (tiene costos).
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', up, sp), true);
  execute 'set local role authenticated';
  begin insert into public.neumaticos (empresa_id, codigo, marca, medida, cocada_nueva) values (a, 'X', 'X', 'X', 10); v_res := v_res || '1 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '1 ok; '; end;
  begin perform count(*) from public.neumaticos; v_res := v_res || '1b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '1b ok; '; end;
  execute 'reset role';

  -- 2. Cargar: técnico no; supervisor sí; reintento no duplica; código repetido y costo negativo no.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  begin perform public.guardar_neumatico(null, '{"codigo":"C-9","marca":"M","medida":"12R22.5","cocada_nueva":18}', gen_random_uuid()); v_res := v_res || '2 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '2 ok tecnico no carga; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  n1 := public.guardar_neumatico(null, '{"codigo":"c-001","marca":"Michelin","medida":"12R22.5","cocada_nueva":18,"costo":1200}', k1);
  if public.guardar_neumatico(null, '{"codigo":"c-001","marca":"Michelin","medida":"12R22.5","cocada_nueva":18,"costo":1200}', k1) <> n1 then v_res := v_res || '2b FALLO; '; end if;
  n2 := public.guardar_neumatico(null, '{"codigo":"C-002","marca":"Bridgestone","medida":"12R22.5","cocada_nueva":18,"costo":1000}', k2);
  begin perform public.guardar_neumatico(null, '{"codigo":"C-001","marca":"X","medida":"X","cocada_nueva":18}', gen_random_uuid()); v_res := v_res || '2c FALLO; ';
  exception when unique_violation then v_res := v_res || '2c ok codigo repetido; '; end;
  begin perform public.guardar_neumatico(null, '{"codigo":"C-003","marca":"X","medida":"X","cocada_nueva":18,"costo":-1}', gen_random_uuid()); v_res := v_res || '2d FALLO; ';
  exception when check_violation then v_res := v_res || '2d ok costo negativo; '; end;
  execute 'reset role';
  v_res := v_res || format('2e cargadas=%s codigo=%s (2 C-001); ', (select count(*) from public.neumaticos where empresa_id = a), (select codigo from public.neumaticos where id = n1));

  -- 3. Costos: el técnico no los ve; el gerente sí; B no ve nada.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  select coalesce(costo::text, 'null') into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('3 tecnico costo=%s (null); ', v_txt);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ug, sg), true);
  execute 'set local role authenticated';
  select costo::text into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('3b gerente costo=%s (1200.00); ', v_txt);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.neumaticos_listado();
  v_res := v_res || format('3c B ve=%s (0); ', v_n);
  select count(*) into v_n from public.neumaticos_equipos();
  v_res := v_res || format('3d B equipos=%s (0); ', v_n);
  execute 'reset role';

  -- 4. Posiciones: técnico no; supervisor sí.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  begin perform public.definir_posiciones(eq, '[{"codigo":"X","eje":1}]'); v_res := v_res || '4 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '4 ok tecnico no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  perform public.definir_posiciones(eq, '[{"codigo":"del-i","eje":1},{"codigo":"DEL-D","eje":1},{"codigo":"P1","eje":2}]');
  begin perform public.definir_posiciones(eq, '[{"codigo":"A","eje":1},{"codigo":"a","eje":1}]'); v_res := v_res || '4b FALLO; ';
  exception when check_violation then v_res := v_res || '4b ok repetidas; '; end;
  execute 'reset role';
  select id into pdi from public.posiciones_neumatico where equipo_id = eq and codigo = 'DEL-I' and activo;
  select id into pdd from public.posiciones_neumatico where equipo_id = eq and codigo = 'DEL-D' and activo;
  select id into pp1 from public.posiciones_neumatico where equipo_id = eq and codigo = 'P1' and activo;
  v_res := v_res || format('4c posiciones=%s (3); ', (select count(*) from public.posiciones_neumatico where equipo_id = eq and activo));

  -- 5. Umbrales: solo el planificador; alerta debe ser mayor que la mínima; quitar el del equipo.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  begin perform public.guardar_umbrales(cat, null, '{"cocada_minima":3,"cocada_alerta":6,"dias_sin_medir":30,"diferencia_maxima":3}'); v_res := v_res || '5 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '5 ok supervisor no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', up, sp), true);
  execute 'set local role authenticated';
  perform public.guardar_umbrales(cat, null, '{"cocada_minima":3,"cocada_alerta":6,"dias_sin_medir":30,"diferencia_maxima":3}');
  perform public.guardar_umbrales(cat, null, '{"cocada_minima":3,"cocada_alerta":7,"dias_sin_medir":30,"diferencia_maxima":3}');
  begin perform public.guardar_umbrales(null, eq, '{"cocada_minima":6,"cocada_alerta":6,"dias_sin_medir":30,"diferencia_maxima":3}'); v_res := v_res || '5b FALLO; ';
  exception when check_violation then v_res := v_res || '5b ok alerta>minima; '; end;
  perform public.guardar_umbrales(null, eq, '{"cocada_minima":5,"cocada_alerta":8,"dias_sin_medir":15,"diferencia_maxima":2}');
  perform public.guardar_umbrales(null, eq, null);
  execute 'reset role';
  v_res := v_res || format('5c cat activos=%s alerta=%s equipo activos=%s (1 7.00 0); ',
    (select count(*) from public.parametros_neumatico where categoria_id = cat and activo),
    (select cocada_alerta from public.parametros_neumatico where categoria_id = cat and activo),
    (select count(*) from public.parametros_neumatico where equipo_id = eq and activo));

  -- 6. Montar (técnico): sube el horómetro; reintento no duplica; posición ocupada y cubierta montada no.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  perform public.montar_neumatico(n1, pdi, jsonb_build_object('fecha', hoy, 'horometro', 1010, 'cocada', 18), km);
  perform public.montar_neumatico(n1, pdi, jsonb_build_object('fecha', hoy, 'horometro', 1010, 'cocada', 18), km);
  begin perform public.montar_neumatico(n2, pdi, jsonb_build_object('fecha', hoy, 'horometro', 1010, 'cocada', 18), gen_random_uuid()); v_res := v_res || '6 FALLO; ';
  exception when check_violation then v_res := v_res || format('6 ok %s; ', sqlerrm); end;
  begin perform public.montar_neumatico(n1, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1010, 'cocada', 18), gen_random_uuid()); v_res := v_res || '6b FALLO; ';
  exception when check_violation then v_res := v_res || format('6b ok %s; ', sqlerrm); end;
  begin perform public.montar_neumatico(n2, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1010, 'cocada', 24), gen_random_uuid()); v_res := v_res || '6c FALLO; ';
  exception when check_violation then v_res := v_res || format('6c ok %s; ', sqlerrm); end;
  begin insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 5000, hoy, 'NEUMATICO'); v_res := v_res || '6d FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '6d ok lectura directa no; '; end;
  execute 'reset role';
  v_res := v_res || format('6e instalaciones=%s horo=%s lectura=%s estado=%s (1 1010.00 1 MONTADO); ',
    (select count(*) from public.instalaciones_neumatico where neumatico_id = n1), (select horometro_actual from public.equipos where id = eq),
    (select count(*) from public.lecturas_horometro where equipo_id = eq and origen_tipo = 'NEUMATICO'), (select estado from public.neumaticos where id = n1));
  -- 6f. La base lo impide aunque se salte la función.
  begin insert into public.instalaciones_neumatico (empresa_id, neumatico_id, posicion_id, equipo_id, montado_en, horometro_montaje, cocada_montaje)
    values (a, n2, pdi, eq, hoy, 1010, 18); v_res := v_res || '6f FALLO; ';
  exception when unique_violation then v_res := v_res || '6f ok posicion unica; '; end;
  begin insert into public.instalaciones_neumatico (empresa_id, neumatico_id, posicion_id, equipo_id, montado_en, horometro_montaje, cocada_montaje)
    values (a, n1, pdd, eq, hoy, 1010, 18); v_res := v_res || '6g FALLO; ';
  exception when unique_violation then v_res := v_res || '6g ok cubierta unica; '; end;

  -- 7. Medir (técnico): tres puntos; fuera de rango y no montada no.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  perform public.medir_neumaticos(eq, jsonb_build_object('fecha', hoy, 'horometro', 1020, 'mediciones',
    jsonb_build_array(jsonb_build_object('neumatico_id', n1, 'interno', 8, 'centro', 5, 'externo', 9, 'presion', 110))), gen_random_uuid());
  begin perform public.medir_neumaticos(eq, jsonb_build_object('fecha', hoy, 'horometro', 1020, 'mediciones',
    jsonb_build_array(jsonb_build_object('neumatico_id', n1, 'interno', 30, 'centro', 5, 'externo', 9))), gen_random_uuid()); v_res := v_res || '7 FALLO; ';
  exception when check_violation then v_res := v_res || format('7 ok %s; ', sqlerrm); end;
  begin perform public.medir_neumaticos(eq, jsonb_build_object('fecha', hoy, 'horometro', 1020, 'mediciones',
    jsonb_build_array(jsonb_build_object('neumatico_id', n2, 'interno', 8, 'centro', 8, 'externo', 8))), gen_random_uuid()); v_res := v_res || '7b FALLO; ';
  exception when check_violation then v_res := v_res || format('7b ok %s; ', sqlerrm); end;
  select format('%s/%s/%s', interno, centro, externo) into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('7c medicion=%s (8.00/5.00/9.00); ', v_txt);

  -- 8. Rotar: con destino ocupado intercambia; con destino libre mueve.
  perform public.montar_neumatico(n2, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1020, 'cocada', 18), gen_random_uuid());
  perform public.rotar_neumaticos(pdi, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1030), gen_random_uuid());
  select posicion_codigo || '/' || cocada_montaje into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('8 n1=%s n2=%s (DEL-D/5.00 DEL-I); ', v_txt, (select posicion_codigo from public.neumaticos_listado(n2)));
  perform public.rotar_neumaticos(pdd, pp1, jsonb_build_object('fecha', hoy, 'horometro', 1040), gen_random_uuid());
  v_res := v_res || format('8b n1=%s vacia_DEL-D=%s horas=%s (P1 true 30.00); ', (select posicion_codigo from public.neumaticos_listado(n1)),
    not exists (select 1 from public.instalaciones_neumatico where posicion_id = pdd and desmontado_en is null),
    (select horas_acumuladas from public.neumaticos_listado(n1)));
  -- 8c. Una posición con cubierta no se quita.
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  begin perform public.definir_posiciones(eq, '[{"codigo":"DEL-D","eje":1}]'); v_res := v_res || '8c FALLO; ';
  exception when check_violation then v_res := v_res || format('8c ok %s; ', sqlerrm); end;
  execute 'reset role';

  -- 9. Desmontar a recapado y recapar: técnico no recapa; supervisor sí.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  begin perform public.desmontar_neumatico(n1, jsonb_build_object('fecha', hoy, 'horometro', 1000, 'motivo_id', mot, 'destino', 'RECAPADO'), gen_random_uuid()); v_res := v_res || '9 FALLO; ';
  exception when check_violation then v_res := v_res || format('9 ok %s; ', sqlerrm); end;
  perform public.desmontar_neumatico(n1, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'motivo_id', mot, 'destino', 'RECAPADO'), gen_random_uuid());
  begin perform public.recapar_neumatico(n1, '{"costo":300,"cocada_nueva":16}', gen_random_uuid()); v_res := v_res || '9b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '9b ok tecnico no recapa; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  perform public.recapar_neumatico(n1, '{"costo":300,"cocada_nueva":16}', gen_random_uuid());
  begin perform public.recapar_neumatico(n1, '{"costo":300,"cocada_nueva":16}', gen_random_uuid()); v_res := v_res || '9c FALLO; ';
  exception when check_violation then v_res := v_res || format('9c ok %s; ', sqlerrm); end;
  select format('%s %s %s %s %s', estado, recapados, costo_recapados, cocada_nueva, horas_acumuladas) into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('9d %s (STOCK 1 300.00 16.00 90.00); ', v_txt);
  select coalesce(medicion_fecha::text, 'sin medicion') into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('9e ciclo nuevo=%s (sin medicion); ', v_txt);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  select coalesce(costo_recapados::text, 'null') into v_txt from public.neumaticos_listado(n1);
  v_res := v_res || format('9f tecnico costo recapado=%s (null); ', v_txt);
  execute 'reset role';

  -- 10. B no opera sobre A; sin sesión no; gerente no opera.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  begin perform public.montar_neumatico(n1, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'cocada', 16), gen_random_uuid()); v_res := v_res || '10 FALLO; ';
  exception when sqlstate 'P0002' then v_res := v_res || '10 ok B no; '; end;
  select count(*) into v_n from public.posiciones_neumatico;
  v_res := v_res || format('10b B ve posiciones=%s (0); ', v_n);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ug, sg), true);
  execute 'set local role authenticated';
  begin perform public.montar_neumatico(n1, pdd, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'cocada', 16), gen_random_uuid()); v_res := v_res || '10c FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '10c ok gerente no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin perform public.neumaticos_listado(); v_res := v_res || '10d FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '10d ok anon; '; end;
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;
