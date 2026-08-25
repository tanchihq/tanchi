import { TriangleAlert } from 'lucide-react';
import SettingsSection from '../settings-section/SettingsSection';
import useRetrieveIntelligence from '../hooks/useRetrieveIntelligence';
import { agentLabel, providerLabel, vendorLabel } from './utils';

const IntelligenceSection = () => {
  const { data, status } = useRetrieveIntelligence();

  if (status !== 'success' || data === undefined) return null;

  const sameProvider = data.generationProvider === data.researchProvider;

  if (data.isManaged) {
    return (
      <SettingsSection title="Intelligence">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-app-soft text-[13px]">Powered by</span>
            <span className="text-app-fg text-[13px] font-medium">
              {vendorLabel(data.generationProvider)}
            </span>
          </div>
          <p className="text-app-faint text-[12px] leading-relaxed">
            Managed by Tanchi — nothing to set up on your side.
          </p>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Intelligence">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-app-soft text-[13px]">Writing and copilot</span>
          <span className="text-app-fg text-[13px] font-medium">
            {providerLabel(data.generationProvider)}
          </span>
        </div>
        {!sameProvider && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-app-soft text-[13px]">Web research</span>
            <span className="text-app-fg text-[13px] font-medium">
              {providerLabel(data.researchProvider)}
            </span>
          </div>
        )}

        {!data.isResearchAvailable && (
          <div className="border-app-accent-line bg-app-warn-bg text-app-warn-fg flex items-start gap-2 rounded-xl border p-[11px_13px] text-[12.5px] leading-relaxed">
            <TriangleAlert size={14} className="mt-px shrink-0" />
            <span>
              This model has no usable web search, so prospect research is
              paused. Without it a dossier could carry facts we cannot trace to
              a source.
            </span>
          </div>
        )}

        {data.models.length > 0 && (
          <div className="border-app-line mt-1 border-t pt-3">
            <div className="text-app-faint mb-2 text-[11px] tracking-[0.06em] uppercase">
              Models in use
            </div>
            <div className="flex flex-col gap-1.5">
              {data.models.map((entry) => (
                <div
                  key={entry.agent}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-app-soft text-[12.5px]">
                    {agentLabel(entry.agent)}
                  </span>
                  <span className="text-app-faint font-mono text-[12px]">
                    {entry.model}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-app-faint text-[12px] leading-relaxed">
          Set by whoever runs this instance, in its environment configuration.
        </p>
      </div>
    </SettingsSection>
  );
};

export default IntelligenceSection;
