import type { ThemeBuilderContext } from '../../theme/types';
import ThemeBuilderHost from './components/ThemeBuilderHost';
import { useThemeBuilderPageOrchestration } from './hooks/useThemeBuilderPageOrchestration';

type ThemeBuilderPageProps = {
  context: ThemeBuilderContext;
  onBackToLanding: () => void;
  onBackToReport: () => void;
  canBackToReport: boolean;
};

export default function ThemeBuilderPage({
  context,
  onBackToLanding,
  onBackToReport,
  canBackToReport,
}: ThemeBuilderPageProps) {
  const { builder, handleClearError, handleUpdateThemeSaveDraft } =
    useThemeBuilderPageOrchestration(context);

  return (
    <ThemeBuilderHost
      builder={builder}
      onBackToLanding={onBackToLanding}
      onBackToReport={onBackToReport}
      canBackToReport={canBackToReport}
      onClearError={handleClearError}
      onUpdateThemeSaveDraft={handleUpdateThemeSaveDraft}
    />
  );
}
