-- Pruebas de integración del corte 8 (engrase), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar lo esperado entre paréntesis.
do $$
declare
  v_plan uuid; a uuid; b uuid;
  pa_pla uuid; pa_sup uuid; pa_tec uuid; pa_ger uuid; pb uuid;
  ua_pla uuid := gen_random_uuid(); ua_sup uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid();
  ua_ger uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_pla uuid := gen_random_uuid(); sa_sup uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid();
  sa_ger uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; cat2 uuid; eq uuid; eq_no uuid; eq2 uuid; grasa uuid; grasa_b uuid; pl_cat uuid; pl_gen uuid; pl_otra uuid;
  r1 uuid; r2 uuid; k1 uuid := gen_random_uuid(); p_car uuid; p_mue uuid; eq_baja uuid;
  usa uuid := gen_random_uuid(); ssa uuid := gen_random_uuid();
  v_res text := ''; v_n int; v_txt text; v_json jsonb;
  hoy date := (now() at time zone 'America/Lima')::date;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Eng A', '20777777781', 'eng-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Eng B', '20777777782', 'eng-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values
    (a, v_plan, current_date - 1, current_date + 29, 380), (b, v_plan, current_date - 1, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Pia', 'Pla') returning id into pa_pla;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sus', 'Sup') returning id into pa_sup;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Gina', 'Ger') returning id into pa_ger;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_pla, 'ep.a@x.pe'), (ua_sup, 'es.a@x.pe'), (ua_tec, 'et.a@x.pe'),
    (ua_ger, 'eg.a@x.pe'), (ub, 'ep.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_pla, ua_pla), (sa_sup, ua_sup), (sa_tec, ua_tec), (sa_ger, ua_ger), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_pla, a, pa_pla, 'PLANIFICADOR', 'ep.a@x.pe'), (ua_sup, a, pa_sup, 'SUPERVISOR', 'es.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 'et.a@x.pe'), (ua_ger, a, pa_ger, 'GERENTE', 'eg.a@x.pe'),
    (ub, b, pb, 'PLANIFICADOR', 'ep.b@x.pe');
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Volquete', 'HORAS') returning id into cat;
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Excavadora', 'HORAS') returning id into cat2;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'VOL-1', cat, 1000) returning id into eq;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual, requiere_engrase) values (a, 'VOL-NO', cat, 10, false) returning id into eq_no;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'EXC-1', cat2, 500) returning id into eq2;
  insert into public.tipos_grasa (empresa_id, nombre) values (a, 'EP2') returning id into grasa;
  insert into public.tipos_grasa (empresa_id, nombre) values (b, 'EP2 B') returning id into grasa_b;
  insert into public.plantillas_puntos_engrase (empresa_id, categoria_id, descripcion, orden) values (a, cat, 'Pasador de tolva', 1) returning id into pl_cat;
  insert into public.plantillas_puntos_engrase (empresa_id, categoria_id, descripcion, orden) values (a, null, 'Cardán', 2) returning id into pl_gen;
  insert into public.plantillas_puntos_engrase (empresa_id, categoria_id, descripcion, orden) values (a, cat2, 'Brazo', 0) returning id into pl_otra;

  -- 1. Aviso por defecto: 20 % en la empresa nueva y en todas las existentes.
  select count(*) into v_n from public.empresas where engrase_aviso_tipo <> 'PORCENTAJE' or engrase_aviso_valor <> 20;
  v_res := v_res || format('1 %s %s distintas=%s (PORCENTAJE 20 0); ',
    (select engrase_aviso_tipo from public.empresas where id = a), (select engrase_aviso_valor from public.empresas where id = a), v_n);
  -- 1b. Rango del aviso en la base.
  begin update public.empresas set engrase_aviso_valor = 101 where id = a;
    v_res := v_res || '1b FALLO; ';
  exception when check_violation then v_res := v_res || '1b ok; '; end;

  -- 2. Un registro incompleto sin observación no se guarda ni por fuera de las funciones.
  begin insert into public.registros_engrase (empresa_id, equipo_id, fecha, horometro, tipo_grasa_id, completo, clave)
    values (a, eq, hoy, 1000, grasa, false, gen_random_uuid());
    v_res := v_res || '2 FALLO; ';
  exception when check_violation then v_res := v_res || '2 ok; '; end;

  -- 3. Nadie escribe directo en las tablas de engrase (ni el planificador).
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_pla, sa_pla), true);
  execute 'set local role authenticated';
  begin insert into public.planes_engrase (empresa_id, equipo_id, cada_horas, tipo_grasa_id) values (a, eq, 250, grasa);
    v_res := v_res || '3 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '3 ok; '; end;
  begin insert into public.registros_engrase (empresa_id, equipo_id, fecha, horometro, tipo_grasa_id, completo, clave)
    values (a, eq, hoy, 1000, grasa, true, gen_random_uuid());
    v_res := v_res || '3b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '3b ok; '; end;
  begin update public.registros_engrase set horometro = 1 where empresa_id = a;
    v_res := v_res || '3c FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '3c ok; '; end;
  begin update public.registros_engrase_puntos set engrasado = true where empresa_id = a;
    v_res := v_res || '3d FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '3d ok; '; end;
  execute 'reset role';

  -- 4. Aislamiento: un plan de A no lo ve el planificador de B.
  insert into public.planes_engrase (empresa_id, equipo_id, cada_horas, tipo_grasa_id) values (a, eq2, 100, grasa);
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.planes_engrase;
  v_res := v_res || format('4 B ve planes=%s (0); ', v_n);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.planes_engrase;
  v_res := v_res || format('4b gerente A ve planes=%s (1); ', v_n);
  execute 'reset role';

  -- 5. Lectura: los 4 roles ven solo equipos activos que se engrasan; B no ve nada de A.
  perform set_config('request.jwt.claims', '', true);
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'VOL-BAJA', cat, 1) returning id into eq_baja;
  update public.equipos set eliminado_en = now() where id = eq_baja;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  select string_agg(codigo, ',' order by codigo) into v_txt from public.engrase_equipos();
  v_res := v_res || format('5 tecnico ve=%s (EXC-1,VOL-1); ', v_txt);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.engrase_equipos();
  v_res := v_res || format('5b B ve=%s (0); ', v_n);
  -- 5c. B no guarda plan ni registra en un equipo de A.
  begin perform public.guardar_plan_engrase(eq, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa_b, 'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'x'))));
    v_res := v_res || '5c FALLO; ';
  exception when sqlstate 'P0002' then v_res := v_res || '5c ok; '; end;
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 2000, 'tipo_grasa_id', grasa_b, 'engrasados', '[]'::jsonb), gen_random_uuid());
    v_res := v_res || '5d FALLO; ';
  exception when sqlstate 'P0002' then v_res := v_res || '5d ok; '; end;
  execute 'reset role';

  -- 6. Plan: técnico y gerente no; supervisor sí; editar desactiva los puntos que salen.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.guardar_plan_engrase(eq, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa, 'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'x'))));
    v_res := v_res || '6 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '6 ok tecnico no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  begin perform public.guardar_plan_engrase(eq, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa, 'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'x'))));
    v_res := v_res || '6b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '6b ok gerente no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  begin perform public.guardar_plan_engrase(eq, jsonb_build_object('tipo_grasa_id', grasa, 'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'x'))));
    v_res := v_res || '6c FALLO; ';
  exception when check_violation then v_res := v_res || format('6c ok %s; ', sqlerrm); end;
  begin perform public.guardar_plan_engrase(eq_no, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa, 'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'x'))));
    v_res := v_res || '6d FALLO; ';
  exception when sqlstate 'P0002' then v_res := v_res || '6d ok sin engrase; '; end;
  perform public.guardar_plan_engrase(eq, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa,
    'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'Tolva'), jsonb_build_object('descripcion', 'Cardán'))));
  perform public.guardar_plan_engrase(eq, jsonb_build_object('cada_horas', 250, 'tipo_grasa_id', grasa,
    'puntos', jsonb_build_array(jsonb_build_object('descripcion', 'Cardán'), jsonb_build_object('descripcion', 'Muelle'))));
  execute 'reset role';
  select string_agg(descripcion, ',' order by orden) into v_txt from public.puntos_engrase where equipo_id = eq and activo;
  select count(*) into v_n from public.puntos_engrase where equipo_id = eq;
  v_res := v_res || format('6e activos=%s total=%s (Cardán,Muelle 3); ', v_txt, v_n);
  select id into p_car from public.puntos_engrase where equipo_id = eq and descripcion = 'Cardán';
  select id into p_mue from public.puntos_engrase where equipo_id = eq and descripcion = 'Muelle';

  -- 7. Registro como técnico.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car)), gen_random_uuid());
    v_res := v_res || '7 FALLO; ';
  exception when check_violation then v_res := v_res || format('7 ok %s; ', sqlerrm); end;
  r1 := public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'tipo_grasa_id', grasa,
    'engrasados', jsonb_build_array(p_car), 'observacion', 'Muelle sin acceso'), k1);
  if public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1100, 'tipo_grasa_id', grasa,
    'engrasados', jsonb_build_array(p_car), 'observacion', 'Muelle sin acceso'), k1) <> r1 then
    v_res := v_res || '7b FALLO reintento; ';
  end if;
  select ultimo_fecha::text || '/' || ultimo_registro_horometro into v_txt from public.engrase_equipos(eq);
  v_res := v_res || format('7b incompleto no reinicia: ultimo completo=%s (null/1100.00 => vacío); ', coalesce(v_txt, 'vacío'));
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1099, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car, p_mue)), gen_random_uuid());
    v_res := v_res || '7c FALLO; ';
  exception when check_violation then v_res := v_res || format('7c ok %s; ', sqlerrm); end;
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1200, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car, pl_otra)), gen_random_uuid());
    v_res := v_res || '7d FALLO; ';
  exception when check_violation then v_res := v_res || format('7d ok %s; ', sqlerrm); end;
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy + 1, 'horometro', 1200, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car, p_mue)), gen_random_uuid());
    v_res := v_res || '7e FALLO; ';
  exception when check_violation then v_res := v_res || format('7e ok %s; ', sqlerrm); end;
  begin perform public.registrar_engrase(eq_no, jsonb_build_object('fecha', hoy, 'horometro', 20, 'tipo_grasa_id', grasa,
      'engrasados', '[]'::jsonb), gen_random_uuid());
    v_res := v_res || '7f FALLO; ';
  exception when sqlstate 'P0002' then v_res := v_res || '7f ok; '; end;
  r2 := public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1150, 'tipo_grasa_id', grasa,
    'engrasados', jsonb_build_array(p_car, p_mue)), gen_random_uuid());
  -- 7g. Sin puntos propios: las plantillas de su categoría y las generales.
  perform public.registrar_engrase(eq2, jsonb_build_object('fecha', hoy, 'horometro', 500, 'tipo_grasa_id', grasa,
    'engrasados', jsonb_build_array(pl_otra, pl_gen)), gen_random_uuid());
  -- 7h. El técnico no inserta una lectura ENGRASE por su cuenta.
  begin insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 5000, hoy, 'ENGRASE');
    v_res := v_res || '7h FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '7h ok; '; end;
  execute 'reset role';
  select count(*) into v_n from public.registros_engrase where equipo_id = eq;
  v_res := v_res || format('7i registros=%s completo2=%s horo=%s lecturas_engrase=%s (2 true 1150.00 2); ', v_n,
    (select completo from public.registros_engrase where id = r2), (select horometro_actual from public.equipos where id = eq),
    (select count(*) from public.lecturas_horometro where equipo_id = eq and origen_tipo = 'ENGRASE'));
  v_res := v_res || format('7j plantillas completo=%s puntos=%s (true Brazo,Cardán); ',
    (select completo from public.registros_engrase where equipo_id = eq2),
    (select string_agg(p.descripcion, ',' order by p.orden) from public.registros_engrase_puntos p join public.registros_engrase r on r.id = p.registro_id where r.equipo_id = eq2));
  -- 7k. Tras corregir el horómetro a la baja, el equipo no queda bloqueado.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_pla, sa_pla), true);
  execute 'set local role authenticated';
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo, es_correccion, motivo_correccion)
    values (a, eq, 1120, hoy, 'MANUAL', true, 'Error de digitación');
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1125, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car, p_mue)), gen_random_uuid());
    v_res := v_res || '7k ok; ';
  exception when others then v_res := v_res || format('7k FALLO %s; ', sqlerrm); end;
  execute 'reset role';
  -- 7l. El gerente no registra.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  begin perform public.registrar_engrase(eq, jsonb_build_object('fecha', hoy, 'horometro', 1200, 'tipo_grasa_id', grasa,
      'engrasados', jsonb_build_array(p_car, p_mue)), gen_random_uuid());
    v_res := v_res || '7l FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '7l ok; '; end;
  execute 'reset role';

  -- 8. Aviso: solo el planificador, solo su empresa, con rangos.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('HORAS', 30); v_res := v_res || '8 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '8 ok supervisor no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('HORAS', 30); v_res := v_res || '8b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '8b ok tecnico no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, sa_ger), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('HORAS', 30); v_res := v_res || '8c FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '8c ok gerente no; '; end;
  execute 'reset role';
  insert into auth.users (id, email, raw_app_meta_data) values (usa, 'sa.eng@x.pe', '{"rol":"SUPERADMIN"}');
  insert into auth.sessions (id, user_id) values (ssa, usa);
  insert into public.usuarios (id, empresa_id, rol, correo) values (usa, null, 'SUPERADMIN', 'sa.eng@x.pe');
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s","app_metadata":{"rol":"SUPERADMIN"}}', usa, ssa), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('HORAS', 30); v_res := v_res || '8d FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '8d ok superadmin no; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  perform public.configurar_aviso_engrase('DIAS', 5);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_pla, sa_pla), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('DIAS', 5000); v_res := v_res || '8e FALLO; ';
  exception when check_violation then v_res := v_res || '8e ok rango; '; end;
  begin perform public.configurar_aviso_engrase('SEMANAS', 2); v_res := v_res || '8f FALLO; ';
  exception when check_violation then v_res := v_res || '8f ok tipo; '; end;
  perform public.configurar_aviso_engrase('HORAS', 30);
  execute 'reset role';
  v_res := v_res || format('8g A=%s %s B=%s %s (HORAS 30 DIAS 5); ',
    (select engrase_aviso_tipo from public.empresas where id = a), (select engrase_aviso_valor from public.empresas where id = a),
    (select engrase_aviso_tipo from public.empresas where id = b), (select engrase_aviso_valor from public.empresas where id = b));

  -- 9. Empresa inactiva y sin sesión: rechazadas.
  update public.empresas set estado = 'INACTIVA', motivo_inactivacion = 'MANUAL', inactivada_en = now() where id = b;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  begin perform public.configurar_aviso_engrase('HORAS', 10); v_res := v_res || '9 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '9 ok inactiva; '; end;
  execute 'reset role';
  perform set_config('request.jwt.claims', '{}', true);
  execute 'set local role anon';
  begin perform public.registrar_engrase(eq, '{}'::jsonb, gen_random_uuid()); v_res := v_res || '9b FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '9b ok anon; '; end;
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;
