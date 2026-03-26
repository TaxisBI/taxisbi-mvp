import { StyleStudioToken, ThemeBuilderUiTheme } from '../types';

type ThemeStyleTokenControlProps = {
  token: StyleStudioToken;
  uiTheme: ThemeBuilderUiTheme;
  draftValue: string;
  enumOptions?: Array<{ value: string; label: string }>;
  isToggle: boolean;
  onDraftValueChange: (next: string) => void;
  onApplyValue: (next: string) => void;
};

export default function ThemeStyleTokenControl({
  token,
  uiTheme,
  draftValue,
  enumOptions,
  isToggle,
  onDraftValueChange,
  onApplyValue,
}: ThemeStyleTokenControlProps) {
  const fieldStyle = {
    display: 'grid',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
  } as const;
  const inputStyle = {
    border: '1px solid',
    borderColor: uiTheme.buttonBorder,
    borderRadius: 6,
    padding: '6px 8px',
    background: uiTheme.buttonBackground,
    color: uiTheme.buttonText,
    fontSize: 12,
  } as const;

  if (enumOptions) {
    const safeValue = enumOptions.some((option) => option.value === draftValue)
      ? draftValue
      : enumOptions[0].value;

    return (
      <label style={fieldStyle}>
        <span>{token.label}</span>
        <select
          value={safeValue}
          onChange={(event) => {
            const next = event.target.value;
            onDraftValueChange(next);
            onApplyValue(next);
          }}
          style={inputStyle}
        >
          {enumOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (isToggle) {
    const checked = draftValue === '1' || draftValue.toLowerCase() === 'true';

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
        <span>{token.label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            const next = event.target.checked ? '1' : '0';
            onDraftValueChange(next);
            onApplyValue(next);
          }}
        />
      </label>
    );
  }

  return (
    <label style={fieldStyle}>
      <span>{token.label}</span>
      <input
        type={token.valueType === 'number' ? 'number' : 'text'}
        step={token.valueType === 'number' ? '0.1' : undefined}
        value={draftValue}
        onChange={(event) => onDraftValueChange(event.target.value)}
        onBlur={() => onApplyValue(draftValue)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        style={inputStyle}
      />
    </label>
  );
}
