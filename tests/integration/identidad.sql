-- Pruebas de integración del corte 2, para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok" o mostrar el valor esperado entre paréntesis.
do $$
declare
  v_plan uuid;
  a uuid; b uuid;
  pa_plan uuid; pa_ger uuid; pa_tec uuid; pa_otro uuid; pb uuid; pb_libre uuid;
  ua_plan uuid := gen_random_uuid(); ua_ger uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid();
  ub_plan uuid := gen_random_uuid();
  s_plan uuid := gen_random_uuid(); s_ger uuid := gen_random_uuid(); s_tec uuid := gen_random_uuid();
  s_tec2 uuid := gen_random_uuid();
  v_res text := '';
  v_n int;
  v_txt text;
  i int;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Prueba A', '20888888881', 'prueba-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Prueba B', '20888888882', 'prueba-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380);
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (b, v_plan, current_date, current_date + 29, 380);

  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Gino', 'Ger') returning id into pa_ger;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Otro', 'Sin cuenta') returning id into pa_otro;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Bea', 'Libre') returning id into pb_libre;

  insert into auth.users (id, email) values (ua_plan, 'p.a@x.pe'), (ua_ger, 'g.a@x.pe'), (ua_tec, 't.a@x.pe'), (ub_plan, 'p.b@x.pe');
  insert into auth.sessions (id, user_id) values (s_plan, ua_plan), (s_ger, ua_ger), (s_tec, ua_tec);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'p.a@x.pe'),
    (ua_ger, a, pa_ger, 'GERENTE', 'g.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 't.a@x.pe'),
    (ub_plan, b, pb, 'PLANIFICADOR', 'p.b@x.pe');

  -- 1. Una persona no puede tener dos cuentas
  begin
    insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'dup@x.pe');
    insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values ('00000000-0000-0000-0000-0000000000a1', a, pa_tec, 'TECNICO', 'dup@x.pe');
    v_res := v_res || '1 FALLA persona con dos cuentas; ';
  exception when unique_violation then v_res := v_res || '1 ok persona con dos cuentas rechazada; ';
  end;

  -- 2. Una cuenta no puede usar una persona de otra empresa
  begin
    insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a2', 'cruz@x.pe');
    insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values ('00000000-0000-0000-0000-0000000000a2', a, pb_libre, 'TECNICO', 'cruz@x.pe');
    v_res := v_res || '2 FALLA persona de otra empresa; ';
  exception when foreign_key_violation then v_res := v_res || '2 ok persona de otra empresa rechazada; ';
  end;

  -- 3. Sin sesión vigente no hay acceso (token sin session_id)
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', ua_plan), true);
  select format('%s/%s', habilitado, motivo) into v_txt from public.mi_acceso();
  v_res := v_res || format('3 token sin sesión: %s (esperado f/SESION_REVOCADA); ', v_txt);

  -- 4. Planificador A: ve lo suyo, nada de B
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.personas;
  v_res := v_res || format('4 planificador A ve %s personas (esperado 4); ', v_n);
  select count(*) into v_n from public.personas where empresa_id = b;
  v_res := v_res || format('4b ve %s personas de B (esperado 0); ', v_n);
  select count(*) into v_n from public.usuarios where empresa_id = b;
  v_res := v_res || format('4c ve %s cuentas de B (esperado 0); ', v_n);
  select count(*) into v_n from public.empresas;
  v_res := v_res || format('4d ve %s empresas (esperado 1, la suya); ', v_n);
  -- 5. No puede crear planificadores ni escribir en B
  begin
    insert into public.usuarios (id, empresa_id, rol, correo) values (ua_plan, a, 'PLANIFICADOR', 'x@x.pe');
    v_res := v_res || '5 FALLA planificador creó planificador; ';
  exception when insufficient_privilege then v_res := v_res || '5 ok no crea planificador; ';
  end;
  begin
    insert into public.personas (empresa_id, nombres, apellidos) values (b, 'X', 'Y');
    v_res := v_res || '5b FALLA creó persona en B; ';
  exception when insufficient_privilege then v_res := v_res || '5b ok no crea en B; ';
  end;
  begin
    perform public.revocar_sesiones_usuario(ub_plan);
    v_res := v_res || '5c FALLA revocó sesiones de B; ';
  exception when insufficient_privilege then v_res := v_res || '5c ok no revoca sesiones de B; ';
  end;
  execute 'reset role';

  -- 6. Gerente: lee, no escribe
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_ger, s_ger), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.personas;
  v_res := v_res || format('6 gerente lee %s personas (esperado 4); ', v_n);
  begin
    insert into public.personas (empresa_id, nombres, apellidos) values (a, 'X', 'Y');
    v_res := v_res || '6b FALLA gerente insertó; ';
  exception when insufficient_privilege then v_res := v_res || '6b ok gerente no inserta; ';
  end;
  update public.personas set cargo = 'hack' where empresa_id = a;
  get diagnostics v_n = row_count;
  v_res := v_res || format('6c gerente actualizó %s filas (esperado 0); ', v_n);
  begin
    perform public.dar_baja_persona(pa_tec);
    v_res := v_res || '6d FALLA gerente dio de baja; ';
  exception when others then v_res := v_res || '6d ok gerente no da de baja; ';
  end;
  execute 'reset role';

  -- 7. Técnico: solo ve su propia persona
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, s_tec), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.personas;
  v_res := v_res || format('7 técnico ve %s persona (esperado 1); ', v_n);
  execute 'reset role';

  -- 8. Baja de persona: su sesión muere al instante y la cuenta queda sin persona
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  execute 'set local role authenticated';
  perform public.dar_baja_persona(pa_tec);
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, s_tec), true);
  select format('%s/%s', habilitado, motivo) into v_txt from public.mi_acceso();
  v_res := v_res || format('8 técnico tras baja: %s (esperado f/SESION_REVOCADA); ', v_txt);
  execute 'set local role authenticated';
  select count(*) into v_n from public.personas;
  v_res := v_res || format('8b ve %s personas (esperado 0); ', v_n);
  execute 'reset role';
  select persona_id::text into v_txt from public.usuarios where id = ua_tec;
  v_res := v_res || format('8c cuenta sin persona: %s; ', coalesce(v_txt, 'ok'));

  -- 9. Reasignar la cuenta: la sesión vieja sigue muerta y una sesión nueva sí entra
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  execute 'set local role authenticated';
  perform public.asignar_persona(ua_tec, pa_otro, 'nuevo@x.pe');
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, s_tec), true);
  select format('%s/%s', habilitado, motivo) into v_txt from public.mi_acceso();
  v_res := v_res || format('9 sesión vieja tras reasignar: %s (esperado f/SESION_REVOCADA); ', v_txt);
  insert into auth.sessions (id, user_id) values (s_tec2, ua_tec);
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, s_tec2), true);
  select format('%s/%s', habilitado, coalesce(motivo, '-')) into v_txt from public.mi_acceso();
  v_res := v_res || format('9b sesión nueva: %s (esperado t/-); ', v_txt);

  -- 10. Empresa desactivada: nadie de A entra; reactivada: vuelven
  update public.empresas set estado = 'INACTIVA', motivo_inactivacion = 'VENCIMIENTO', inactivada_en = now() where id = a;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, s_plan), true);
  select format('%s/%s', habilitado, motivo) into v_txt from public.mi_acceso();
  v_res := v_res || format('10 empresa inactiva: %s (esperado f/EMPRESA_INACTIVA); ', v_txt);
  execute 'set local role authenticated';
  select count(*) into v_n from public.personas;
  v_res := v_res || format('10b ve %s personas (esperado 0); ', v_n);
  execute 'reset role';
  update public.empresas set estado = 'ACTIVA', motivo_inactivacion = null, inactivada_en = null where id = a;
  select format('%s/%s', habilitado, coalesce(motivo, '-')) into v_txt from public.mi_acceso();
  v_res := v_res || format('10c reactivada: %s (esperado t/-); ', v_txt);

  -- 11. Membresía vencida tras la gracia: sin acceso aunque la empresa siga ACTIVA
  update public.membresias set fecha_inicio = current_date - 40, fecha_fin = current_date - 11 where empresa_id = a;
  select format('%s/%s', habilitado, motivo) into v_txt from public.mi_acceso();
  v_res := v_res || format('11 membresía vencida: %s (esperado f/EMPRESA_INACTIVA); ', v_txt);

  -- 12. Cupo del plan Estándar (10): A tiene 3 cuentas; se llenan 7 más y la 11.ª se rechaza
  for i in 1..7 loop
    insert into auth.users (id, email) values (('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, 'c' || i || '@x.pe');
    insert into public.usuarios (id, empresa_id, rol, correo) values (('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, a, 'TECNICO', 'c' || i || '@x.pe');
  end loop;
  begin
    insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000199', 'c11@x.pe');
    insert into public.usuarios (id, empresa_id, rol, correo) values ('00000000-0000-0000-0000-000000000199', a, 'TECNICO', 'c11@x.pe');
    v_res := v_res || '12 FALLA cuenta 11 aceptada; ';
  exception when sqlstate 'MT001' then v_res := v_res || '12 ok cuenta 11 rechazada por cupo; ';
  end;

  raise exception 'RESULTADOS (todo revertido): %', v_res;
end $$;
