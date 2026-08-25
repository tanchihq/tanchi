import { GraduationCap } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppEmpty, AppError, AppLoader } from '@/components/AsyncState';
import useRetrieveLearnings from './hooks/useRetrieveLearnings';
import LearningCard from './learning-card/LearningCard';

const Learnings = () => {
  const { data, status, refetch } = useRetrieveLearnings();

  if (status === 'loading') {
    return (
      <AppScreen title="Learnings">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Learnings">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const learnings = data ?? [];

  if (learnings.length === 0) {
    return (
      <AppScreen title="Learnings">
        <AppEmpty
          icon={<GraduationCap size={22} />}
          title="No learnings yet"
          hint="Once the agent has exchanged with a few prospects, it distills what works per ICP here."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Learnings">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <div className="mx-auto max-w-[780px]">
          <p className="mb-5 text-sm leading-relaxed text-app-soft">
            What the agent observes about your prospects, summarized plainly. Nothing to
            tune — this refines the next messages.
          </p>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {learnings.map((learning) => (
              <LearningCard key={learning.icp} learning={learning} />
            ))}
          </div>
        </div>
      </div>
    </AppScreen>
  );
};

export default Learnings;
