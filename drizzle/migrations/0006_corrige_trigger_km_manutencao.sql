CREATE OR REPLACE FUNCTION public.avancar_km_veiculo()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE k numeric;
BEGIN
  IF TG_TABLE_NAME = 'abastecimentos' THEN
    k := to_jsonb(NEW)->>'km_atual';
  ELSE
    k := to_jsonb(NEW)->>'km';
  END IF;
  IF k IS NOT NULL THEN
    UPDATE public.veiculos SET km_atual = k WHERE id = NEW.veiculo_id AND (km_atual IS NULL OR km_atual < k);
  END IF;
  RETURN NEW;
END $function$;