ALTER TABLE public.viagens
  ADD COLUMN IF NOT EXISTS tem_volta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS volta_saida_em timestamptz,
  ADD COLUMN IF NOT EXISTS volta_chegada_em timestamptz,
  ADD COLUMN IF NOT EXISTS tempo_volta_min integer,
  ADD COLUMN IF NOT EXISTS consumo_km_litro numeric(10,3),
  ADD COLUMN IF NOT EXISTS combustivel_estimado_litros numeric(12,3);

ALTER TABLE public.diarias
  ADD COLUMN IF NOT EXISTS veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS diarias_veiculo_id_idx ON public.diarias(veiculo_id);

COMMENT ON COLUMN public.viagens.tempo_volta_min IS 'Duração da volta em minutos; tempo_real_min permanece sendo a duração da ida.';
COMMENT ON COLUMN public.viagens.consumo_km_litro IS 'Média de KM/L do veículo registrada no momento do lançamento do trajeto.';
COMMENT ON COLUMN public.viagens.combustivel_estimado_litros IS 'Estimativa de litros para ida e, quando marcada, volta.';