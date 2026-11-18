-- Pruebas de integración del corte 1, para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Resultado esperado: un error "RESULTADOS (todo revertido): ..." donde cada punto dice "ok"
-- y: 4 activa=t inactiva=f; 5 anon ve 0 empresas; 6 planificador ve 0;
-- 7 superadmin ve 2; 8b pagos con monto del plan=1; 8c vista AL_DIA=1.
do $$
declare
  v_plan uuid;
  v_emp uuid;
  v_inact uuid;
  v_res text := '';
  v_n int;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';

  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Prueba A', '20999999991', 'prueba-a', v_plan) returning id into v_emp;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto)
    values (v_emp, v_plan, current_date, current_date + 29, 380);

  begin
    insert into public.empresas (nombre, ruc, slug, plan_id) values ('Dup', '20999999991', 'dup', v_plan);
    v_res := v_res || '1 FALLA ruc duplicado aceptado; ';
  exception when unique_violation then v_res := v_res || '1 ok ruc duplicado rechazado; ';
  end;

  begin
    insert into public.empresas (nombre, ruc, slug, plan_id) values ('Letras', '2099999999A', 'letras', v_plan);
    v_res := v_res || '2 FALLA ruc con letras aceptado; ';
  exception when check_violation then v_res := v_res || '2 ok ruc con letras rechazado; ';
  end;
  begin
    insert into public.empresas (nombre, ruc, slug, plan_id) values ('Corto', '2099999999', 'corto', v_plan);
    v_res := v_res || '2b FALLA ruc de 10 aceptado; ';
  exception when check_violation then v_res := v_res || '2b ok ruc de 10 rechazado; ';
  end;

  begin
    insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto)
      values (v_emp, v_plan, current_date + 29, current_date + 58, 380);
    v_res := v_res || '3 FALLA solape aceptado; ';
  exception when exclusion_violation then v_res := v_res || '3 ok solape rechazado; ';
  end;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto)
    values (v_emp, v_plan, current_date + 30, current_date + 59, 380);
  v_res := v_res || '3b ok siguiente periodo aceptado; ';

  insert into public.empresas (nombre, ruc, slug, plan_id, estado, motivo_inactivacion, inactivada_en)
    values ('Inactiva', '20999999992', 'inactiva', v_plan, 'INACTIVA', 'MANUAL', now()) returning id into v_inact;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto)
    values (v_inact, v_plan, current_date, current_date + 29, 380);
  v_res := v_res || format('4 activa=%s inactiva=%s; ', public.empresa_activa(v_emp), public.empresa_activa(v_inact));

  execute 'set local role anon';
  select count(*) into v_n from public.empresas;
  v_res := v_res || format('5 anon ve %s empresas; ', v_n);
  select count(*) into v_n from public.planes;
  v_res := v_res || format('5b anon ve %s planes; ', v_n);
  execute 'reset role';

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"rol":"PLANIFICADOR"}}', true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.empresas;
  v_res := v_res || format('6 planificador ve %s empresas; ', v_n);
  begin
    perform public.registrar_pago_manual(v_emp, current_date + 60, current_date + 89, 'x');
    v_res := v_res || '6b FALLA planificador registró pago; ';
  exception when insufficient_privilege then v_res := v_res || '6b ok planificador no puede pagar; ';
  end;
  execute 'reset role';

  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","app_metadata":{"rol":"SUPERADMIN"}}', true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.empresas where ruc like '2099999999%';
  v_res := v_res || format('7 superadmin ve %s empresas de prueba; ', v_n);
  perform public.registrar_pago_manual(v_emp, current_date + 60, current_date + 89, 'OP-1');
  select count(*) into v_n from public.pagos where empresa_id = v_emp and monto = 380;
  v_res := v_res || format('8b pagos con monto del plan=%s; ', v_n);
  select count(*) into v_n from public.v_empresas_estado where empresa_id = v_emp and estado = 'AL_DIA';
  v_res := v_res || format('8c vista AL_DIA=%s; ', v_n);
  execute 'reset role';

  raise exception 'RESULTADOS (todo revertido): %', v_res;
end $$;
