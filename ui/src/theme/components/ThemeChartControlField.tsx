import { ThemeBuilderUiTheme } from '../types';
import { ChartControlField } from './themeBuilderWorkspaceConfig';

type ThemeChartControlFieldProps = {
  field: ChartControlField;
  uiTheme: ThemeBuilderUiTheme;
  getSettingNumber: (key: string, fallback?: number) => number;
  getSettingString: (key: string, fallback?: string) => string;
  getSettingColor: (key: string, fallback?: string) => string;
  onApplyUiSetting: (key: string, value: unknown) => void;
};

export default function ThemeChartControlField({
  field,
  uiTheme,
  getSettingNumber,
  getSettingString,
  getSettingColor,
  onApplyUiSetting,
}: ThemeChartControlFieldProps) {
  const commonInputStyle = {
    border: '1px solid',
    borderColor: uiTheme.buttonBorder,
    borderRadius: 6,
    padding: '6px 8px',
    background: uiTheme.buttonBackground,
    color: uiTheme.buttonText,
    fontSize: 12,
    width: '100%',
    boxSizing: 'border-box',
  } as const;

  if (field.type === 'number') {
    return (
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600 }}>
        <span>{field.label}</span>
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={getSettingNumber(field.key, 0)}
          onChange={(event) =>
            onApplyUiSetting(field.key, Number.parseFloat(event.target.value) || 0)
          }
          style={commonInputStyle}
        />
      </label>
    );
  }

  if (field.type === 'color') {
    return (
      <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600 }}>
        <span>{field.label}</span>
        <input
          type="color"
          value={getSettingColor(field.key, '#000000')}
          onChange={(event) => onApplyUiSetting(field.key, event.target.value)}
          style={{
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            borderRadius: 6,
            padding: '2px',
            background: uiTheme.buttonBackground,
            height: 34,
            width: 48,
          }}
        />
      </label>
    );
  }

  if (field.type === 'toggle') {
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: 12,
          fontWeight: 600,
          border: '1px solid',
          borderColor: uiTheme.buttonBorder,
          borderRadius: 6,
          padding: '8px 10px',
          background: uiTheme.buttonBackground,
        }}
      >
        <span>{field.label}</span>
        <input
          type="checkbox"
          checked={getSettingNumber(field.key, 0) > 0}
          onChange={(event) => onApplyUiSetting(field.key, event.target.checked ? 1 : 0)}
        />
      </label>
    );
  }

  return (
    <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 600 }}>
      <span>{field.label}</span>
      <select
        value={getSettingString(field.key, field.options[0]?.value ?? '')}
        onChange={(event) => onApplyUiSetting(field.key, event.target.value)}
        style={commonInputStyle}
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
