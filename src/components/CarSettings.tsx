// B120 (owner 2026-11-20): My car settings. `CarSettingsFields` is the trim / wheels / heat pump
// block, shared by the Modify car settings dialog and the Change car dialog (CarPicker).
// `CarSettingsPanel` is the Modify car settings dialog's content: those fields, the plug
// switches and their note, a link to the car's charging curve, and Save / Cancel.

import { useEffect, useId, useMemo, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { setMyCar, withSettings, type CarSettings, type MyCar } from '../lib/my-car.ts';
import { trimSettingsInfo, trimText } from '../lib/car-settings.ts';
import { carChipParts } from '../lib/car-label.ts';
import { DC_PLUGS, carMapInfo, defaultDcPlugs, type DcPlug } from '../lib/map-filter.ts';
import PlugIcon from './PlugIcon.tsx';
import type { CarDetail } from '../lib/types.ts';

type Trims = CarDetail['trims'];

export const carHref = (id: string, trim: string | null) =>
  `/charging?car=${id.split('/').map(encodeURIComponent).join('/')}${trim ? `&trim=${encodeURIComponent(trim)}` : ''}`;

interface FieldsProps {
  trims: Trims;
  trimId: string | null;
  variantName: string;
  settings: CarSettings;
  onChange: (s: CarSettings) => void;
  /** Shown only when given and the car has several trims (the Change car dialog has its own). */
  onTrim?: (trimId: string) => void;
}

export function CarSettingsFields({ trims, trimId, variantName, settings, onChange, onTrim }: FieldsProps) {
  const id = useId();
  const info = trimSettingsInfo(trims, trimId);
  const wheel = settings.wheelIn ?? info.standardIn;
  const tire = wheel !== null ? info.tireFor(wheel) : undefined;
  const trim = trims.find((x) => x.id === trimId) ?? trims[0];
  return (
    <div className="cs-fields">
      {onTrim && trims.length > 1 && (
        <label className="cs-field">
          <span className="cs-label">{t('charging.trim')}</span>
          <select className="field-input" value={trim?.id ?? ''} onChange={(e) => onTrim(e.target.value)}>
            {trims.map((x) => <option key={x.id} value={x.id}>{trimText(x.name, variantName)}</option>)}
          </select>
        </label>
      )}
      <label className="cs-field">
        <span className="cs-label">{t('wheel.label')}</span>
        {info.sizes.length ? (
          <>
            <select className="field-input" value={wheel ?? ''} onChange={(e) => onChange({ ...settings, wheelIn: Number(e.target.value) === info.standardIn ? null : Number(e.target.value) })}>
              {info.sizes.map((n) => (
                <option key={n} value={n}>
                  {n === info.standardIn ? t('mycar.wheelStandard', { size: n }) : info.factory.has(n) ? t('wheel.factory', { size: n }) : t('wheel.option', { size: n })}
                </option>
              ))}
            </select>
            {tire && <span className="small muted">{t('wheel.tire', { tire })}</span>}
          </>
        ) : <span className="small muted">{t('mycar.wheelsUnknown')}</span>}
      </label>
      <div className="cs-field">
        <span className="cs-label" id={`${id}-hp`}>{t('mycar.heatPump')}</span>
        {info.heatPumpOptional ? (
          <>
            <button type="button" role="switch" aria-checked={settings.heatPump} aria-labelledby={`${id}-hp`} aria-describedby={`${id}-hp-note`}
              className="chip-plug cp-plug cs-switch" onClick={() => onChange({ ...settings, heatPump: !settings.heatPump })}>
              <span>{t(settings.heatPump ? 'mycar.heatPumpOn' : 'mycar.heatPumpOff')}</span>
              <span className="switch" aria-hidden="true" />
            </button>
            <span id={`${id}-hp-note`} className="small muted">{t('mycar.heatPump.optional')}</span>
          </>
        ) : <span className="small muted">{t(`mycar.heatPump.${info.heatPump}` as MessageKey)}</span>}
      </div>
    </div>
  );
}

interface PanelProps {
  mine: MyCar;
  onDone: () => void;
}

export function CarSettingsPanel({ mine, onDone }: PanelProps) {
  const id = useId();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [trimId, setTrimId] = useState<string | null>(mine.trimId);
  const [settings, setSettings] = useState<CarSettings>({ wheelIn: mine.wheelIn ?? null, heatPump: Boolean(mine.heatPump) });
  const [plugs, setPlugs] = useState<DcPlug[] | null>(mine.plugs ?? null);
  useEffect(() => {
    let live = true;
    fetch(`/data/cars/${mine.carId}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CarDetail>) : Promise.reject(r.status)))
      .then((c) => live && setCar(c))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [mine.carId]);
  const port = useMemo(() => (car ? carMapInfo(car) : null), [car]);
  const plugsOn = plugs ?? (port ? defaultDcPlugs(port.port, port.adapter) : null);
  const togglePlug = (p: DcPlug) => {
    if (!plugsOn) return;
    const next = plugsOn.includes(p) ? plugsOn.filter((x) => x !== p) : [...plugsOn, p];
    setPlugs(DC_PLUGS.filter((x) => next.includes(x)));
  };
  const info = car ? trimSettingsInfo(car.trims, trimId) : null;
  const [, withYear, full] = carChipParts(mine);
  const variantText = full.slice(withYear.length).trim();
  const save = () => {
    if (!info) return;
    setMyCar(withSettings({ ...mine, trimId, ...(plugs ? { plugs } : {}) }, settings, info));
    onDone();
  };
  // Back to defaults (design-language §10's "Clear"): resets the range settings, shown only while they differ.
  const differs = settings.wheelIn !== null || (settings.heatPump && Boolean(info?.heatPumpOptional));
  const reset = () => setSettings({ wheelIn: null, heatPump: false });

  return (
    <section className="car-picker card car-settings" aria-labelledby={`${id}-title`}>
      {/* Owner 2026-11-20: the car leads, big and bold like the trip time (.ti-time); its variant
          smaller under it; "Car settings" a small label above. */}
      <header className="cs-head">
        <p className="cs-eyebrow">{t('mycar.settingsTitle')}</p>
        <h2 id={`${id}-title`} className="cs-car">{carChipParts(mine)[1]}</h2>
        {variantText && <p className="cs-variant">{variantText}</p>}
      </header>
      {/* The car's page, as a row action like the trip panel's Change car (design-language §8 rows). */}
      <a href={carHref(mine.carId, trimId)} className="cs-curve">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 19V5M4 19h16M7 15l4-6 3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span>{t('mycar.curveLink')}</span>
        <svg className="route-car-change-go" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </a>
      {!car ? (
        <p className="muted" role="status">{t(failed ? 'mycar.settingsFailed' : 'mycar.settingsLoading')}</p>
      ) : (
        <>
          <div className="panel cs-panel">
            <div className="cs-panel-head">
              <h3 className="panel-title">{t('mycar.rangeTitle')}</h3>
              {differs && <button type="button" className="link-btn small cs-reset" onClick={reset}>{t('mycar.reset')}</button>}
            </div>
            <CarSettingsFields trims={car.trims} trimId={trimId} variantName={car.name} settings={settings}
              onChange={setSettings} onTrim={(x) => { setTrimId(x); setSettings((s) => ({ ...s, wheelIn: null })); }} />
            <p className="muted small cs-note">{t('mycar.rangeNote')}</p>
          </div>
          <div className="panel cp-plugs" role="group" aria-labelledby={`${id}-plugs`}>
            <h3 id={`${id}-plugs`} className="panel-title">{t('mycar.plugs')}</h3>
            <div className="cp-plug-row">
              {DC_PLUGS.map((p) => (
                <button key={p} type="button" role="switch" aria-checked={plugsOn ? plugsOn.includes(p) : false} disabled={!plugsOn}
                  className="chip-plug cp-plug" onClick={() => togglePlug(p)}>
                  <PlugIcon plug={p} />
                  <span className="cp-plug-name">{t(`value.${p}` as MessageKey)}</span>
                  <span className="switch" aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="muted small cp-plugs-note">{t('mycar.plugsNote')}</p>
          </div>
        </>
      )}
      <div className="cp-actions">
        <button type="button" className="btn primary" disabled={!info} onClick={save}>{t('mycar.save')}</button>
        <button type="button" className="btn" onClick={onDone}>{t('picker.cancel')}</button>
      </div>
    </section>
  );
}
