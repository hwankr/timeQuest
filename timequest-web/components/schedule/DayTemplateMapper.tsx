'use client';

// 요일별 템플릿 배정 UI — dayTemplateMap 수정
import { useState } from 'react';
import { ScheduleTemplate, DayOfWeek } from '@/types';
import { UserRepository } from '@/repositories/userRepo';
import { useAuth } from '@/hooks/useAuth';

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

interface DayTemplateMapperProps {
  templates: ScheduleTemplate[];
  dayTemplateMap: Record<DayOfWeek, string>;
}

export function DayTemplateMapper({ templates, dayTemplateMap }: DayTemplateMapperProps) {
  const { user } = useAuth();
  const [localMap, setLocalMap] = useState(dayTemplateMap);
  const [saving, setSaving] = useState<DayOfWeek | null>(null);

  const handleChange = async (day: DayOfWeek, templateId: string) => {
    if (!user) return;

    const newMap = { ...localMap, [day]: templateId };
    setLocalMap(newMap);
    setSaving(day);

    try {
      const repo = new UserRepository(user.uid);
      // Firestore 중첩 필드 업데이트: 'settings.dayTemplateMap.{day}' 형식
      await repo.updateUser({
        settings: { dayTemplateMap: newMap },
      } as Parameters<typeof repo.updateUser>[0]);
    } catch (err) {
      console.error('요일 템플릿 배정 실패:', err);
      setLocalMap(dayTemplateMap);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-[var(--color-text-secondary)]">
        요일별 템플릿 배정
      </h4>
      <div className="space-y-1.5">
        {DAY_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-6 text-xs font-medium text-[var(--color-text-primary)] text-center">
              {label}
            </span>
            <select
              value={localMap[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={saving === key}
              className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand-primary)] disabled:opacity-50"
            >
              <option value="">미지정</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {saving === key && (
              <div className="h-3 w-3 animate-spin rounded-full border border-[var(--color-brand-primary)] border-t-transparent" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
