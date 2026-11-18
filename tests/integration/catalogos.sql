-- Pruebas de integración del corte 3 (catálogos), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar el valor esperado entre paréntesis.
do $$
declare
  v_plan uuid;
  a uuid; b uuid;
  pa_plan uuid; pa_tec uuid; pb uuid;
  ua_plan uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ub_plan uuid := gen_random_uuid();
  s_plan uuid := gen_random_uuid(); s_tec uuid := gen_random_uuid(); s_b uuid := gen_random_uuid();
  v_id uuid;
  v_res text := '';
  v_n int;
  v_txt text;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Cat A', '20777777771', 'cat-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Cat B', '20777777772', 'cat-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380);
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_plan, 'cp.a@x.pe'), (ua_tec, 'ct.a@x.pe'), (ub_plan, 'cp.b@x.pe');
  insert into auth.sessions (id, user_id) values (s_plan, ua_plan), (s_tec, ua_tec), (s_b, ub_plan);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'cp.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 'ct.a@x.pe'),
    (ub_plan, b, pb, 'PLANIFICADOR', 'cp.b@x.pe');

  -- 1. Empresa nueva: catálogos vacíos (sin seeds)
  select count(*) into v_n from public.ubicaciones where empresa_id = a;
  v_res := v_res || format('1 empresa nueva tiene %s ubicaciones (esperado 0); ', v_n);

  -- 2. Planificador A crea; la base pone quién lo creó
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  execute 'set local role authenticated';
  insert into public.ubicaciones (empresa_id, nombre, tipo) values (a, 'Lomadas 4', 'FRENTE') returning id into v_id;
  select format('%s', creado_por = ua_plan) into v_txt from public.ubicaciones where id = v_id;
  v_res := v_res || format('2 creado_por puesto por la base: %s (esperado t); ', v_txt);

  -- 3. Duplicado ignorando mayúsculas, tildes y espacios
  begin
    insert into public.ubicaciones (empresa_id, nombre, tipo) values (a, '  LOMADAS   4 ', 'FRENTE');
    v_res := v_res || '3 FALLA duplicado aceptado; ';
  exception when unique_violation then v_res := v_res || '3 ok duplicado rechazado; ';
  end;
  begin
    insert into public.tipos_grasa (empresa_id, nombre) values (a, 'Grasa de litio');
    insert into public.tipos_grasa (empresa_id, nombre) values (a, 'grasa de lítio');
    v_res := v_res || '3b FALLA tilde no detectada; ';
  exception when unique_violation then v_res := v_res || '3b ok tilde detectada; ';
  end;
  -- 3c. Mismo nombre en otro tipo sí se puede
  insert into public.ubicaciones (empresa_id, nombre, tipo) values (a, 'Lomadas 4', 'LUGAR');
  v_res := v_res || '3c ok mismo nombre en otro tipo; ';

  -- 4. No escribe en la empresa B
  begin
    insert into public.ubicaciones (empresa_id, nombre, tipo) values (b, 'Intruso', 'SEDE');
    v_res := v_res || '4 FALLA escribió en B; ';
  exception when insufficient_privilege then v_res := v_res || '4 ok no escribe en B; ';
  end;

  -- 5. No se borra (no hay política de borrado): se desactiva
  delete from public.ubicaciones where id = v_id;
  get diagnostics v_n = row_count;
  v_res := v_res || format('5 borró %s filas (esperado 0); ', v_n);
  update public.ubicaciones set activo = false where id = v_id;
  get diagnostics v_n = row_count;
  v_res := v_res || format('5b desactivó %s (esperado 1); ', v_n);

  -- 6. Intento de mudar el elemento a otra empresa: la base lo ignora o lo rechaza
  begin
    update public.ubicaciones set empresa_id = b where id = v_id;
    select format('%s', empresa_id = a) into v_txt from public.ubicaciones where id = v_id;
    v_res := v_res || format('6 sigue en A: %s (esperado t); ', v_txt);
  exception when insufficient_privilege then v_res := v_res || '6 ok no se muda de empresa; ';
  end;
  execute 'reset role';

  -- 7. Planificador B: no ve ni edita lo de A; puede usar el mismo nombre
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub_plan, s_b), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.ubicaciones;
  v_res := v_res || format('7 B ve %s ubicaciones (esperado 0); ', v_n);
  update public.ubicaciones set nombre = 'Hackeado' where id = v_id;
  get diagnostics v_n = row_count;
  v_res := v_res || format('7b B editó %s de A (esperado 0); ', v_n);
  insert into public.ubicaciones (empresa_id, nombre, tipo) values (b, 'Lomadas 4', 'FRENTE');
  v_res := v_res || '7c ok B usa el mismo nombre que A; ';
  execute 'reset role';

  -- 8. Técnico A: lee, pero no escribe
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, s_tec), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.ubicaciones;
  v_res := v_res || format('8 técnico ve %s ubicaciones (esperado 2); ', v_n);
  begin
    insert into public.sistemas_mantenimiento (empresa_id, nombre) values (a, 'MOTOR');
    v_res := v_res || '8b FALLA técnico creó; ';
  exception when insufficient_privilege then v_res := v_res || '8b ok técnico no crea; ';
  end;
  update public.ubicaciones set activo = true where id = v_id;
  get diagnostics v_n = row_count;
  v_res := v_res || format('8c técnico editó %s (esperado 0); ', v_n);
  execute 'reset role';

  -- 9. Empresa vencida: su planificador deja de ver sus catálogos
  update public.membresias set fecha_inicio = current_date - 60, fecha_fin = current_date - 31 where empresa_id = a;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.ubicaciones;
  v_res := v_res || format('9 vencida ve %s (esperado 0); ', v_n);
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;

-- Entrega 2: categorías, motivos de parada y plantillas.
do $$
declare
  v_plan uuid; a uuid; b uuid; pa uuid; pb uuid;
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat_a uuid; cat_b uuid;
  v_res text := ''; v_txt text;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Cat2 A', '20777777773', 'cat2-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Cat2 B', '20777777774', 'cat2-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'A') returning id into pa;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Bea', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua, 'c2a@x.pe'), (ub, 'c2b@x.pe');
  insert into auth.sessions (id, user_id) values (sa, ua), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values (ua, a, pa, 'PLANIFICADOR', 'c2a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'c2b@x.pe');

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (b, 'Volquete', 'KILOMETROS') returning id into cat_b;
  execute 'reset role';

  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua, sa), true);
  execute 'set local role authenticated';
  insert into public.categorias_equipo (empresa_id, nombre, nombre_flota, tipo_medidor) values (a, 'Camión Minero', 'VOLQUETE', 'HORAS') returning id into cat_a;
  begin
    insert into public.categorias_equipo (empresa_id, nombre, nombre_flota, tipo_medidor) values (a, 'Otro', 'volquete', 'HORAS');
    v_res := v_res || '10 FALLA nombre_flota repetido; ';
  exception when unique_violation then v_res := v_res || '10 ok nombre_flota único; ';
  end;

  insert into public.motivos_parada (empresa_id, codigo, nombre, duracion_estandar_horas) values (a, 'PM1', 'PM1 — Preventivo 1', 4);
  insert into public.motivos_parada (empresa_id, codigo, nombre) values (a, 'MCI', 'Correctivo inmediato');
  select string_agg(codigo || '=' || es_planificado, ',' order by codigo) into v_txt from public.motivos_parada;
  v_res := v_res || format('11 planificado por código: %s (esperado MCI=false,PM1=true); ', v_txt);
  begin
    insert into public.motivos_parada (empresa_id, codigo, nombre, duracion_estandar_horas) values (a, 'MCP', 'Correctivo programado', 2);
    v_res := v_res || '12 FALLA duración en MCP; ';
  exception when check_violation then v_res := v_res || '12 ok duración solo en PM1 a PM4; ';
  end;
  begin
    insert into public.motivos_parada (empresa_id, codigo, nombre) values (a, 'PM1', 'Otro PM1');
    v_res := v_res || '13 FALLA código repetido; ';
  exception when unique_violation then v_res := v_res || '13 ok código único; ';
  end;
  begin
    insert into public.motivos_parada (empresa_id, codigo, nombre) values (a, 'INVENTADO', 'x');
    v_res := v_res || '14 FALLA código inventado; ';
  exception when check_violation then v_res := v_res || '14 ok código fuera de la lista rechazado; ';
  end;

  insert into public.plantillas_actividades (empresa_id, categoria_id, plan, descripcion) values (a, cat_a, 'PM1', 'Cambio de aceite');
  insert into public.plantillas_puntos_engrase (empresa_id, descripcion) values (a, 'Puntos generales');
  v_res := v_res || '15 ok plantillas con categoría propia o general; ';
  begin
    insert into public.plantillas_actividades (empresa_id, categoria_id, descripcion) values (a, cat_b, 'Cruzada');
    v_res := v_res || '16 FALLA categoría de otra empresa; ';
  exception when foreign_key_violation then v_res := v_res || '16 ok no usa categoría de otra empresa; ';
  end;

  insert into public.plantillas_disposicion_neumatico (empresa_id, nombre, preset, layout) values (a, '4x2', '4X2', E'DEL-I | DEL-D\nPOS-IE | POS-II | POS-DI | POS-DE');
  v_res := v_res || '17 ok disposición válida; ';
  begin
    insert into public.plantillas_disposicion_neumatico (empresa_id, nombre, preset, layout) values (a, 'Mala', '4X2', 'del;izq');
    v_res := v_res || '18 FALLA disposición inválida; ';
  exception when check_violation then v_res := v_res || '18 ok disposición inválida rechazada; ';
  end;
  execute 'reset role';

  raise exception 'RESULTADOS: %', v_res;
end $$;
