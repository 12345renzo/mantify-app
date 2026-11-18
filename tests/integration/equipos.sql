-- Pruebas de integración del corte 4 (equipos y horómetro), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar el valor esperado entre paréntesis.
do $$
declare
  v_plan uuid; a uuid; b uuid;
  pa_plan uuid; pa_sup uuid; pa_tec uuid; pb uuid;
  ua_plan uuid := gen_random_uuid(); ua_sup uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_plan uuid := gen_random_uuid(); sa_sup uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat_a uuid; cat_b uuid; ubi_a uuid; eq uuid; eq_b uuid;
  v_res text := ''; v_n int; v_num numeric; v_txt text;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Eq A', '20666666661', 'eq-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Eq B', '20666666662', 'eq-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sus', 'Sup') returning id into pa_sup;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_plan, 'ep.a@x.pe'), (ua_sup, 'es.a@x.pe'), (ua_tec, 'et.a@x.pe'), (ub, 'ep.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_plan, ua_plan), (sa_sup, ua_sup), (sa_tec, ua_tec), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'ep.a@x.pe'), (ua_sup, a, pa_sup, 'SUPERVISOR', 'es.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 'et.a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'ep.b@x.pe');

  -- Empresa B: su categoría y su EQ-001
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (b, 'Volquete', 'KILOMETROS') returning id into cat_b;
  insert into public.equipos (empresa_id, codigo, categoria_id) values (b, 'EQ-001', cat_b) returning id into eq_b;
  execute 'reset role';

  -- 1. Planificador A crea EQ-001 (mismo código que B) con horómetro inicial
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat_a;
  insert into public.ubicaciones (empresa_id, nombre, tipo) values (a, 'Lomadas 4', 'FRENTE') returning id into ubi_a;
  insert into public.equipos (empresa_id, codigo, categoria_id, ubicacion_id, horometro_actual) values (a, 'EQ-001', cat_a, ubi_a, 1500) returning id into eq;
  v_res := v_res || '1 ok EQ-001 existe en A y en B; ';
  select count(*) into v_n from public.lecturas_horometro where equipo_id = eq;
  v_res := v_res || format('1b lecturas iniciales %s (esperado 1); ', v_n);

  -- 2. Código repetido en la misma empresa
  begin
    insert into public.equipos (empresa_id, codigo, categoria_id) values (a, 'EQ-001', cat_a);
    v_res := v_res || '2 FALLA código repetido; ';
  exception when unique_violation then v_res := v_res || '2 ok código único por empresa; ';
  end;
  begin
    insert into public.equipos (empresa_id, codigo, categoria_id) values (a, 'eq 002', cat_a);
    v_res := v_res || '2b FALLA código sin normalizar; ';
  exception when check_violation then v_res := v_res || '2b ok código sin normalizar rechazado; ';
  end;

  -- 3. Lectura mayor sube el horómetro; igual pasa; menor se rechaza
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1600, current_date, 'MANUAL');
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1600, current_date, 'MANUAL');
  select horometro_actual into v_num from public.equipos where id = eq;
  v_res := v_res || format('3 horómetro %s (esperado 1600.00); ', v_num);
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1599, current_date, 'MANUAL');
    v_res := v_res || '3b FALLA lectura menor aceptada; ';
  exception when sqlstate 'MT002' then v_res := v_res || '3b ok lectura menor rechazada; ';
  end;
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1700, current_date + 5, 'MANUAL');
    v_res := v_res || '3c FALLA fecha futura; ';
  exception when check_violation then v_res := v_res || '3c ok fecha futura rechazada; ';
  end;

  -- 4. Escritura directa: el horómetro no cambia por UPDATE, ni hacia arriba ni hacia abajo
  begin
    update public.equipos set horometro_actual = 10 where id = eq;
    v_res := v_res || '4 FALLA update directo bajó el horómetro; ';
  exception when insufficient_privilege then v_res := v_res || '4 ok update directo rechazado; ';
  end;

  -- 5. Corrección a la baja: con motivo, solo el planificador
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo, es_correccion) values (a, eq, 1550, current_date, 'MANUAL', true);
    v_res := v_res || '5 FALLA corrección sin motivo; ';
  exception when check_violation then v_res := v_res || '5 ok corrección exige motivo; ';
  end;
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo, es_correccion, motivo_correccion)
    values (a, eq, 1550, current_date, 'MANUAL', true, 'Se tecleó un cero de más');
  select horometro_actual into v_num from public.equipos where id = eq;
  v_res := v_res || format('5b corregido a %s (esperado 1550.00); ', v_num);

  -- 6. Lecturas: no se editan ni se borran
  begin
    update public.lecturas_horometro set valor = 1 where equipo_id = eq;
    v_res := v_res || '6 FALLA editó una lectura; ';
  exception when insufficient_privilege then v_res := v_res || '6 ok lecturas no se editan; ';
  end;
  begin
    delete from public.lecturas_horometro where equipo_id = eq;
    v_res := v_res || '6b FALLA borró una lectura; ';
  exception when insufficient_privilege then v_res := v_res || '6b ok lecturas no se borran; ';
  end;

  -- 7. Editar datos sube version; una lectura no
  select version into v_n from public.equipos where id = eq;
  update public.equipos set marca = 'CAT' where id = eq;
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1560, current_date, 'MANUAL');
  select format('%s→%s', v_n, version) into v_txt from public.equipos where id = eq;
  v_res := v_res || format('7 version %s (esperado 1→2); ', v_txt);

  -- 8. Categoría y ubicación en uso no se desactivan; tras desmovilizar, sí
  begin
    update public.categorias_equipo set activo = false where id = cat_a;
    v_res := v_res || '8 FALLA desactivó categoría en uso; ';
  exception when sqlstate 'MT003' then v_res := v_res || '8 ok categoría en uso; ';
  end;
  begin
    update public.ubicaciones set activo = false where id = ubi_a;
    v_res := v_res || '8b FALLA desactivó ubicación en uso; ';
  exception when sqlstate 'MT003' then v_res := v_res || '8b ok ubicación en uso; ';
  end;
  update public.equipos set estado_movilizacion = 'DESMOVILIZADO' where id = eq;
  update public.categorias_equipo set activo = false where id = cat_a;
  v_res := v_res || '8c ok desmovilizado libera la categoría; ';
  update public.categorias_equipo set activo = true where id = cat_a;
  update public.equipos set estado_movilizacion = 'MOVILIZADO' where id = eq;

  -- 9. No usa categoría de otra empresa ni ve sus equipos
  begin
    insert into public.equipos (empresa_id, codigo, categoria_id) values (a, 'EQ-X', cat_b);
    v_res := v_res || '9 FALLA categoría de otra empresa; ';
  exception when foreign_key_violation then v_res := v_res || '9 ok no usa categoría de B; ';
  end;
  select count(*) into v_n from public.equipos;
  v_res := v_res || format('9b A ve %s equipos (esperado 1); ', v_n);
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (b, eq_b, 9, current_date, 'MANUAL');
    v_res := v_res || '9c FALLA lectura en B; ';
  exception when insufficient_privilege then v_res := v_res || '9c ok no registra lecturas en B; ';
  end;
  execute 'reset role';

  -- 10. Supervisor: registra lecturas, no corrige ni edita equipos
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 1570, current_date, 'MANUAL');
  v_res := v_res || '10 ok supervisor registra lectura; ';
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo, es_correccion, motivo_correccion)
      values (a, eq, 1000, current_date, 'MANUAL', true, 'Quiero bajarlo');
    v_res := v_res || '10b FALLA supervisor corrigió; ';
  exception when insufficient_privilege then v_res := v_res || '10b ok supervisor no corrige; ';
  end;
  update public.equipos set marca = 'Otra' where id = eq;
  get diagnostics v_n = row_count;
  v_res := v_res || format('10c supervisor editó %s equipos (esperado 0); ', v_n);
  execute 'reset role';

  -- 11. Técnico: no ve la flota
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.equipos;
  v_res := v_res || format('11 técnico ve %s equipos (esperado 0); ', v_n);
  begin
    insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 99999, current_date, 'MANUAL');
    v_res := v_res || '11b FALLA técnico registró; ';
  exception when insufficient_privilege then v_res := v_res || '11b ok técnico no registra lecturas; ';
  end;
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;

-- Entrega 2: importación (función importar_equipos).
do $$
declare
  v_plan uuid; a uuid; b uuid; pa uuid; pb uuid; pt uuid;
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid(); ut uuid := gen_random_uuid();
  sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid(); st uuid := gen_random_uuid();
  cat_a uuid; cat_b uuid; v_r jsonb; v_filas jsonb;
  v_res text := ''; v_n int; v_num numeric;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Imp A', '20666666663', 'imp-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Imp B', '20666666664', 'imp-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'A', 'A') returning id into pa;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'B', 'B') returning id into pb;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'T', 'T') returning id into pt;
  insert into auth.users (id, email) values (ua, 'ia@x.pe'), (ub, 'ib@x.pe'), (ut, 'it@x.pe');
  insert into auth.sessions (id, user_id) values (sa, ua), (sb, ub), (st, ut);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua, a, pa, 'PLANIFICADOR', 'ia@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'ib@x.pe'), (ut, a, pt, 'TECNICO', 'it@x.pe');

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (b, 'Volquete', 'HORAS') returning id into cat_b;
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua, sa), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Volquete', 'HORAS') returning id into cat_a;
  v_filas := jsonb_build_array(
    jsonb_build_object('fila', 2, 'codigo', 'V-01', 'categoria_id', cat_a, 'marca', 'Volvo', 'horometro', 1200),
    jsonb_build_object('fila', 3, 'codigo', 'V-02', 'categoria_id', cat_a),
    jsonb_build_object('fila', 4, 'codigo', 'V-03', 'categoria_id', cat_b),
    jsonb_build_object('fila', 5, 'codigo', 'mal codigo', 'categoria_id', cat_a));
  v_r := public.importar_equipos(v_filas);
  v_res := v_res || format('12 primera importación: %s (esperado filas 2 y 3 CREADO, 4 CATALOGO, 5 DATOS); ', v_r);
  select count(*) into v_n from public.equipos;
  v_res := v_res || format('12b equipos %s (esperado 2); ', v_n);

  v_r := public.importar_equipos(v_filas);
  select count(*) into v_n from public.equipos;
  v_res := v_res || format('13 tras importar dos veces: %s equipos (esperado 2); ', v_n);
  select count(*) into v_n from public.lecturas_horometro;
  v_res := v_res || format('13b lecturas %s (esperado 1); ', v_n);

  v_r := public.importar_equipos(jsonb_build_array(
    jsonb_build_object('fila', 2, 'codigo', 'V-01', 'categoria_id', cat_a, 'horometro', 1300),
    jsonb_build_object('fila', 3, 'codigo', 'V-02', 'categoria_id', cat_a, 'horometro', 50, 'modelo', 'FH')));
  select horometro_actual into v_num from public.equipos where codigo = 'V-01';
  v_res := v_res || format('14 actualiza horómetro a %s (esperado 1300.00), marca se conserva: %s (esperado Volvo); ', v_num, (select marca from public.equipos where codigo = 'V-01'));
  v_r := public.importar_equipos(jsonb_build_array(
    jsonb_build_object('fila', 2, 'codigo', 'V-01', 'categoria_id', cat_a, 'horometro', 900)));
  v_res := v_res || format('15 horómetro menor: %s (esperado error HOROMETRO_MENOR); ', v_r);
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  v_r := public.importar_equipos(jsonb_build_array(jsonb_build_object('fila', 2, 'codigo', 'V-01', 'categoria_id', cat_b)));
  select count(*) into v_n from public.equipos;
  v_res := v_res || format('16 B importa su propio V-01: %s, ve %s equipos (esperado CREADO y 1); ', v_r, v_n);
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  begin
    v_r := public.importar_equipos(v_filas);
    v_res := v_res || '17 FALLA técnico importó; ';
  exception when insufficient_privilege then v_res := v_res || '17 ok técnico no importa; ';
  end;
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;

-- Auditoría: quién registró cada lectura (función autores_lecturas).
do $$
declare
  v_plan uuid; a uuid; b uuid; pa uuid; ps uuid; pt uuid; pb uuid;
  ua uuid := gen_random_uuid(); us uuid := gen_random_uuid(); ut uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa uuid := gen_random_uuid(); ss uuid := gen_random_uuid(); st uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat_a uuid; eq uuid; v_res text := ''; v_txt text; v_n int;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Aud A', '20666666665', 'aud-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Aud B', '20666666666', 'aud-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Planif') returning id into pa;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sara', 'Superv') returning id into ps;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tecnico') returning id into pt;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'Otro') returning id into pb;
  insert into auth.users (id, email) values (ua, 'aa@x.pe'), (us, 'as@x.pe'), (ut, 'at@x.pe'), (ub, 'ab@x.pe');
  insert into auth.sessions (id, user_id) values (sa, ua), (ss, us), (st, ut), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua, a, pa, 'PLANIFICADOR', 'aa@x.pe'), (us, a, ps, 'SUPERVISOR', 'as@x.pe'),
    (ut, a, pt, 'TECNICO', 'at@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'ab@x.pe');

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua, sa), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat_a;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'AUD-1', cat_a, 100) returning id into eq;
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo, es_correccion, motivo_correccion)
    values (a, eq, 90, current_date, 'MANUAL', true, 'Se tecleó mal');
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', us, ss), true);
  execute 'set local role authenticated';
  insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha, origen_tipo) values (a, eq, 120, current_date, 'MANUAL');
  -- El supervisor no lee `usuarios`, pero sí ve quién registró cada lectura.
  select string_agg(nombre, ', ' order by nombre) into v_txt from public.autores_lecturas(eq);
  v_res := v_res || format('18 supervisor ve autores: %s (esperado Ana Planif, Ana Planif, Sara Superv); ', v_txt);
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ut, st), true);
  execute 'set local role authenticated';
  begin
    perform * from public.autores_lecturas(eq);
    v_res := v_res || '19 FALLA técnico vio autores; ';
  exception when insufficient_privilege then v_res := v_res || '19 ok técnico no ve autores; ';
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.autores_lecturas(eq);
  v_res := v_res || format('20 planificador de B ve %s autores de A (esperado 0); ', v_n);
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;
