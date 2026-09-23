import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CaseTabKey } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Tabs } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSelectedCase, fetchCaseDetail } from '../../store/slices/casesSlice';
import { OverviewPanel } from '../../features/cases/panels/OverviewPanel';
import { AssessmentsPanel } from '../../features/cases/panels/AssessmentsPanel';
import { HudDataPanel } from '../../features/cases/panels/HudDataPanel';
import { NotYetBuiltPanel } from '../../features/cases/NotYetBuiltPanel';

const TABS: { key: CaseTabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'services', label: 'Services' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'hudData', label: 'HUD Data' },
  { key: 'healthWellness', label: 'Health and Wellness' },
];

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { case: caseDetail, status, error } = useAppSelector((state) => state.cases.detail);
  const [activeTab, setActiveTab] = useState<CaseTabKey>('overview');

  useEffect(() => {
    if (id) {
      dispatch(fetchCaseDetail(id));
    }
    return () => {
      dispatch(clearSelectedCase());
    };
  }, [dispatch, id]);

  if (status === 'loading' || status === 'idle') {
    return (
      <ContentAreaTemplate title="Case">
        <p className="text-sm text-textMuted">Loading case…</p>
      </ContentAreaTemplate>
    );
  }

  if (status === 'failed' || !caseDetail) {
    return (
      <ContentAreaTemplate title="Case">
        <p className="text-sm text-textMuted">{error ?? 'Case not found.'}</p>
      </ContentAreaTemplate>
    );
  }

  return (
    <ContentAreaTemplate title={caseDetail.caseNumber} subtitle={caseDetail.clientName}>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <Tabs tabs={TABS} activeKey={activeTab} onChange={(key) => setActiveTab(key as CaseTabKey)} />

        {activeTab === 'overview' ? <OverviewPanel caseDetail={caseDetail} /> : null}
        {activeTab === 'plan' ? <NotYetBuiltPanel tabLabel="Plan" /> : null}
        {activeTab === 'services' ? <NotYetBuiltPanel tabLabel="Services" /> : null}
        {activeTab === 'assessments' ? (
          <AssessmentsPanel hasContent={caseDetail.tabsWithContent.assessments} />
        ) : null}
        {activeTab === 'referrals' ? <NotYetBuiltPanel tabLabel="Referrals" /> : null}
        {activeTab === 'hudData' ? <HudDataPanel caseId={caseDetail.id} /> : null}
        {activeTab === 'healthWellness' ? <NotYetBuiltPanel tabLabel="Health and Wellness" /> : null}
      </div>
    </ContentAreaTemplate>
  );
}
