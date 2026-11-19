-- Pruebas de integración del corte 5 (backlogs, OT, RM, RQ y firmas), para pegar en el SQL editor de Supabase.
-- Todo corre en un bloque que termina con RAISE EXCEPTION: nada queda guardado.
-- Cada punto debe decir "ok".
do $$
declare
  v_plan uuid; a uuid; b uuid; v_anio text := extract(year from now() at time zone 'America/Lima')::text;
  pa_plan uuid; pa_sup uuid; pa_tec uuid; pa_cuad uuid; pb uuid;
  ua_plan uuid := gen_random_uuid(); ua_sup uuid := gen_random_uuid(); ua_tec uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  sa_plan uuid := gen_random_uuid(); sa_sup uuid := gen_random_uuid(); sa_tec uuid := gen_random_uuid(); sb uuid := gen_random_uuid();
  cat uuid; eq uuid; bk uuid; bk2 uuid; ot uuid; v_res text := ''; v_n int; v_txt text; v_num numeric;
  k1 uuid := gen_random_uuid(); k_cierre uuid := gen_random_uuid(); k_rq uuid := gen_random_uuid();
  f_tec text; f_sup text; f_plan text; fotos text[] := '{}'; i int;
begin
  select id into v_plan from public.planes where codigo = 'ESTANDAR';
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Tr A', '20777777771', 'tr-a-x', v_plan) returning id into a;
  insert into public.empresas (nombre, ruc, slug, plan_id) values ('Tr B', '20777777772', 'tr-b-x', v_plan) returning id into b;
  insert into public.membresias (empresa_id, plan_id, fecha_inicio, fecha_fin, monto) values (a, v_plan, current_date, current_date + 29, 380), (b, v_plan, current_date, current_date + 29, 380);
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Ana', 'Plan') returning id into pa_plan;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Sus', 'Sup') returning id into pa_sup;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Tito', 'Tec') returning id into pa_tec;
  insert into public.personas (empresa_id, nombres, apellidos) values (a, 'Cuadri', 'Lla') returning id into pa_cuad;
  insert into public.personas (empresa_id, nombres, apellidos) values (b, 'Beto', 'B') returning id into pb;
  insert into auth.users (id, email) values (ua_plan, 'tp.a@x.pe'), (ua_sup, 'ts.a@x.pe'), (ua_tec, 'tt.a@x.pe'), (ub, 'tp.b@x.pe');
  insert into auth.sessions (id, user_id) values (sa_plan, ua_plan), (sa_sup, ua_sup), (sa_tec, ua_tec), (sb, ub);
  insert into public.usuarios (id, empresa_id, persona_id, rol, correo) values
    (ua_plan, a, pa_plan, 'PLANIFICADOR', 'tp.a@x.pe'), (ua_sup, a, pa_sup, 'SUPERVISOR', 'ts.a@x.pe'),
    (ua_tec, a, pa_tec, 'TECNICO', 'tt.a@x.pe'), (ub, b, pb, 'PLANIFICADOR', 'tp.b@x.pe');
  insert into public.categorias_equipo (empresa_id, nombre, tipo_medidor) values (a, 'Camión', 'HORAS') returning id into cat;
  insert into public.equipos (empresa_id, codigo, categoria_id, horometro_actual) values (a, 'EQ-1', cat, 1500) returning id into eq;
  -- Objetos de Storage "subidos" por cada usuario (firmas y fotos).
  f_tec := a || '/firmas/' || gen_random_uuid() || '.png';
  f_sup := a || '/firmas/' || gen_random_uuid() || '.png';
  f_plan := a || '/firmas/' || gen_random_uuid() || '.png';
  insert into storage.objects (bucket_id, name, owner_id, metadata) values
    ('archivos', f_tec, ua_tec::text, '{"mimetype":"image/png","size":1200}'),
    ('archivos', f_sup, ua_sup::text, '{"mimetype":"image/png","size":1200}'),
    ('archivos', f_plan, ua_plan::text, '{"mimetype":"image/png","size":1200}');
  for i in 1..4 loop
    v_txt := a || '/backlogs/' || gen_random_uuid() || '.jpg';
    insert into storage.objects (bucket_id, name, owner_id, metadata) values ('archivos', v_txt, ua_tec::text, '{"mimetype":"image/jpeg","size":50000}');
    fotos := fotos || v_txt;
  end loop;

  -- 1. Técnico crea backlog con 1 foto antes: código BKL-000001, PENDIENTE, historial CREAR. Reintento no duplica.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  bk := public.crear_backlog(jsonb_build_object('equipo_id', eq, 'componente', 'Bomba', 'criticidad', 'ALTA', 'descripcion', 'Fuga',
    'fecha_observacion', current_date, 'fecha_programada', current_date + 3), array[fotos[1]], k1);
  if public.crear_backlog(jsonb_build_object('equipo_id', eq), '{}', k1) <> bk then raise exception '1 reintento creó otro'; end if;
  select codigo || estado into v_txt from public.backlogs where id = bk;
  select count(*) into v_n from public.backlogs where empresa_id = a;
  v_res := v_res || format('1 %s (BKL-000001PENDIENTE, 1 backlog=%s); ', v_txt, v_n);

  -- 2. El técnico no abre OT.
  begin perform public.abrir_orden_trabajo(bk, pa_tec, gen_random_uuid()); v_res := v_res || '2 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '2 ok; '; end;
  -- 3. El técnico no escribe en backlogs directo (sin política de escritura).
  begin update public.backlogs set estado = 'COMPLETADO' where id = bk; get diagnostics v_n = row_count;
    v_res := v_res || format('3 %s (0 filas); ', case when v_n = 0 then 'ok' else 'FALLO' end);
  exception when others then v_res := v_res || '3 ok; '; end;
  -- 4. El técnico sigue sin registrar lecturas a mano.
  begin insert into public.lecturas_horometro (empresa_id, equipo_id, valor, fecha) values (a, eq, 1700, current_date); v_res := v_res || '4 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '4 ok; '; end;
  execute 'reset role';

  -- 5. Empresa B no ve ni abre la OT del backlog de A.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ub, sb), true);
  execute 'set local role authenticated';
  select count(*) into v_n from public.backlogs where id = bk;
  begin perform public.abrir_orden_trabajo(bk, pb, gen_random_uuid()); v_res := v_res || '5 FALLO; ';
  exception when no_data_found then v_res := v_res || format('5 ok (ve %s); ', v_n); end;
  execute 'reset role';

  -- 6. Supervisor abre la OT (OT-AAAA-001) con el técnico. Una segunda OT para el mismo backlog no entra.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  perform public.abrir_orden_trabajo(bk, pa_tec, gen_random_uuid());
  select o.codigo, o.id into v_txt, ot from public.ordenes_trabajo o where o.backlog_id = bk;
  v_res := v_res || format('6 %s (%s) %s; ', v_txt, 'OT-' || v_anio || '-001', (select estado from public.backlogs where id = bk));
  begin perform public.abrir_orden_trabajo(bk, pa_tec, gen_random_uuid()); v_res := v_res || '6b FALLO; ';
  exception when sqlstate 'MT004' then v_res := v_res || '6b ok; '; end;
  execute 'reset role';
  begin insert into public.ordenes_trabajo (empresa_id, codigo, backlog_id, responsable_id, creado_por) values (a, 'OT-X', bk, pa_tec, ua_sup);
    v_res := v_res || '7 FALLO; ';
  exception when unique_violation then v_res := v_res || '7 ok una OT por backlog; '; end;

  -- 8. Técnico responsable pide repuesto: RQ-AAAA-001. Reintento con la misma clave no duplica.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  perform public.crear_requisicion(ot, 'Sello', 2, 'und', k_rq);
  perform public.crear_requisicion(ot, 'Sello', 2, 'und', k_rq);
  select count(*), min(codigo) into v_n, v_txt from public.requisiciones where orden_trabajo_id = ot;
  v_res := v_res || format('8 %s x%s (RQ-%s-001 x1); ', v_txt, v_n, v_anio);

  -- 9. Sin firma no cierra. 10. Más de 3 fotos después no entra.
  begin perform public.cerrar_reporte(bk, current_date, 1600, 'Cambio de sello', '{}', gen_random_uuid()); v_res := v_res || '9 FALLO; ';
  exception when check_violation then v_res := v_res || format('9 ok %s; ', sqlerrm); end;
  perform public.guardar_mi_firma(f_tec);
  begin perform public.cerrar_reporte(bk, current_date, 1600, 'x', fotos[1:4], gen_random_uuid()); v_res := v_res || '10 FALLO; ';
  exception when check_violation then v_res := v_res || format('10 ok %s; ', sqlerrm); end;

  -- 11. Cierra con firma y 2 fotos: PENDIENTE_VALIDACION, RM-AAAA-001, firma vigente, horómetro 1500 → 1600 (lectura BACKLOG).
  perform public.cerrar_reporte(bk, current_date, 1600, 'Cambio de sello', fotos[2:3], k_cierre);
  perform public.cerrar_reporte(bk, current_date, 1600, 'Cambio de sello', fotos[2:3], k_cierre);
  execute 'reset role';
  select b.estado || ' ' || r.codigo || ' ' || e.horometro_actual into v_txt
    from public.backlogs b join public.reportes_mantenimiento r on r.orden_trabajo_id = b.orden_trabajo_id join public.equipos e on e.id = b.equipo_id where b.id = bk;
  select count(*) into v_n from public.backlog_firmas where backlog_id = bk and vigente and tipo = 'CIERRE';
  v_res := v_res || format('11 %s firmas=%s lecturas_backlog=%s fotos_despues=%s (PENDIENTE_VALIDACION RM-%s-001 1600.00 1 1 2); ', v_txt, v_n,
    (select count(*) from public.lecturas_horometro where equipo_id = eq and origen_tipo = 'BACKLOG'),
    (select count(*) from public.backlog_archivos where backlog_id = bk and rol = 'DESPUES'), v_anio);

  -- 12. El técnico no valida.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  begin perform public.validar_trabajo(bk, true, null, gen_random_uuid()); v_res := v_res || '12 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '12 ok; '; end;
  execute 'reset role';
  -- 13. Planificador sin autorización de su empresa no valida.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  begin perform public.validar_trabajo(bk, true, null, gen_random_uuid()); v_res := v_res || '13 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || '13 ok; '; end;
  execute 'reset role';

  -- 14. Supervisor devuelve: sin nota no; con nota vuelve a EN_PROCESO y la firma de cierre deja de valer.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  begin perform public.validar_trabajo(bk, false, '', gen_random_uuid()); v_res := v_res || '14 FALLO; ';
  exception when check_violation then v_res := v_res || '14 ok sin nota; '; end;
  perform public.validar_trabajo(bk, false, 'Falta ajustar pernos', gen_random_uuid());
  select estado into v_txt from public.backlogs where id = bk;
  v_res := v_res || format('14b %s vigentes=%s (EN_PROCESO 0); ', v_txt, (select count(*) from public.backlog_firmas where backlog_id = bk and vigente));
  execute 'reset role';

  -- 15. Técnico vuelve a cerrar (mismo RM) y el supervisor aprueba con su firma: COMPLETADO, 2 firmas vigentes.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_tec, sa_tec), true);
  execute 'set local role authenticated';
  perform public.cerrar_reporte(bk, current_date, 1600, 'Pernos ajustados', '{}', gen_random_uuid());
  execute 'reset role';
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  begin perform public.validar_trabajo(bk, true, null, gen_random_uuid()); v_res := v_res || '15 FALLO sin firma; ';
  exception when check_violation then v_res := v_res || '15 ok validador sin firma; '; end;
  perform public.guardar_mi_firma(f_sup);
  perform public.validar_trabajo(bk, true, null, gen_random_uuid());
  -- 16. Dos validaciones del mismo backlog: la segunda ve el estado ya cambiado.
  begin perform public.validar_trabajo(bk, true, null, gen_random_uuid()); v_res := v_res || '16 FALLO; ';
  exception when sqlstate 'MT004' then v_res := v_res || '16 ok; '; end;
  select estado into v_txt from public.backlogs where id = bk;
  v_res := v_res || format('15b %s vigentes=%s rms=%s (COMPLETADO 2 1); ', v_txt,
    (select count(*) from public.backlog_firmas where backlog_id = bk and vigente),
    (select count(*) from public.reportes_mantenimiento where orden_trabajo_id = ot));

  -- 17. Corrección tras cierre: queda en auditoría con CORRECCION.
  select version into v_n from public.backlogs where id = bk;
  perform public.editar_backlog(bk, v_n, jsonb_build_object('componente', 'Bomba hidráulica', 'criticidad', 'MEDIA', 'descripcion', 'Fuga',
    'fecha_observacion', current_date, 'fecha_programada', current_date + 3), 'Corrijo el componente');
  execute 'reset role';
  select count(*) into v_n from public.eventos_auditoria where registro_id = bk and accion = 'CORRECCION';
  v_res := v_res || format('17 auditoria=%s (1); ', v_n);

  -- 18. Reabrir: firmas no vigentes (siguen en el historial) y EN_PROCESO.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  perform public.reabrir_trabajo(bk, 'Volvió a fugar', gen_random_uuid());
  select estado into v_txt from public.backlogs where id = bk;
  v_res := v_res || format('18 %s vigentes=%s total=%s (EN_PROCESO 0 3); ', v_txt,
    (select count(*) from public.backlog_firmas where backlog_id = bk and vigente), (select count(*) from public.backlog_firmas where backlog_id = bk));
  execute 'reset role';
  -- Aquí todo corre en una transacción (mismo now()): se cuenta, no se ordena.
  select count(*) into v_n from public.backlog_historial_estados where backlog_id = bk;
  v_res := v_res || format('19 historial=%s (8: crear, OT, cierre, devolver, cierre, aprobar, corrección, reabrir); ', v_n);

  -- 20. Supervisor que cierra su propio trabajo no lo valida; el planificador autorizado sí.
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_sup, sa_sup), true);
  execute 'set local role authenticated';
  bk2 := public.crear_backlog(jsonb_build_object('equipo_id', eq, 'componente', 'Luces', 'criticidad', 'BAJA', 'descripcion', 'Foco',
    'fecha_observacion', current_date, 'fecha_programada', current_date), '{}', gen_random_uuid());
  perform public.abrir_orden_trabajo(bk2, pa_cuad, gen_random_uuid());
  perform public.cerrar_reporte(bk2, current_date, 1550, null, '{}', gen_random_uuid());
  begin perform public.validar_trabajo(bk2, true, null, gen_random_uuid()); v_res := v_res || '20 FALLO; ';
  exception when insufficient_privilege then v_res := v_res || format('20 ok %s; ', sqlerrm); end;
  execute 'reset role';
  update public.empresas set planificador_puede_validar = true where id = a;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated","session_id":"%s"}', ua_plan, sa_plan), true);
  execute 'set local role authenticated';
  perform public.guardar_mi_firma(f_plan);
  perform public.validar_trabajo(bk2, true, null, gen_random_uuid());
  select estado into v_txt from public.backlogs where id = bk2;
  select horometro_actual into v_num from public.equipos where id = eq;
  v_res := v_res || format('21 %s horometro=%s (COMPLETADO 1600.00: 1550 no lo baja); ', v_txt, v_num);
  execute 'reset role';

  -- 22. Códigos por empresa: B empieza en 1.
  v_res := v_res || format('22 %s (BKL-000001); ', public.siguiente_codigo(b, 'BACKLOG'));
  raise exception 'RESULTADOS: %', v_res;
end $$;
