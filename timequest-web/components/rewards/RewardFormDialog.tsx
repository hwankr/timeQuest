'use client';

import { useState, useEffect } from 'react';
import { Reward, RewardCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/hooks/useRewards';

// 자주 쓰는 이모지 목록
const EMOJI_LIST = [
  '🎮', '📱', '🎬', '📺', '🎵', '🎨', '📚', '🏃',
  '🔄', '⏱️', '⏸️', '🔀', '➡️', '⬆️', '⬇️', '🔁',
  '🍕', '🍫', '☕', '🍜', '🍰', '🥤', '🍣', '🍔',
  '😴', '💤', '🛁', '🌿', '🧘', '🎯', '🏖️', '✈️',
  '🎁', '⭐', '🏆', '💎', '🎊', '🌟', '💰', '🎀',
];

interface RewardFormDialogProps {
  open: boolean;
  reward?: Reward | null; // null이면 생성, 값이 있으면 편집
  onClose: () => void;
  onSubmit: (data: Omit<Reward, 'id' | 'createdAt'>) => Promise<void>;
}

const DEFAULT_FORM = {
  name: '',
  description: '',
  icon: '🎁',
  cost: 10,
  category: 'activity' as RewardCategory,
  isActive: true,
  cooldownHours: 0,
  dailyLimit: -1,
  sortOrder: 0,
  isCustom: true,
};

export function RewardFormDialog({ open, reward, onClose, onSubmit }: RewardFormDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 편집 시 기존 값으로 초기화
  useEffect(() => {
    if (reward) {
      setForm({
        name: reward.name,
        description: reward.description,
        icon: reward.icon,
        cost: reward.cost,
        category: reward.category,
        isActive: reward.isActive,
        cooldownHours: reward.cooldownHours,
        dailyLimit: reward.dailyLimit,
        sortOrder: reward.sortOrder,
        isCustom: reward.isCustom,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError('');
    setShowEmojiPicker(false);
  }, [reward, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('보상 이름을 입력해주세요');
      return;
    }
    if (form.cost <= 0) {
      setError('포인트는 1 이상이어야 합니다');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {reward ? '보상 편집' : '새 보상 추가'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)]"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* 아이콘 선택 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              아이콘
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-2xl transition-colors hover:border-[var(--color-brand-primary)]"
              >
                {form.icon}
              </button>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                아이콘을 클릭하거나 직접 이모지를 입력하세요
              </span>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                maxLength={4}
                className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-center text-sm"
              />
            </div>
            {showEmojiPicker && (
              <div className="mt-2 grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, icon: emoji }));
                      setShowEmojiPicker(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-[var(--color-surface)]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              이름 <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="보상 이름"
              maxLength={30}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              설명
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="보상 설명 (선택)"
              maxLength={80}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
            />
          </div>

          {/* 포인트 + 카테고리 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                포인트 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: Math.max(1, Number(e.target.value)) }))}
                min={1}
                max={9999}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                카테고리
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as RewardCategory }))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
              >
                {CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 쿨다운 + 일일 한도 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                쿨다운 (시간)
              </label>
              <input
                type="number"
                value={form.cooldownHours}
                onChange={(e) => setForm((f) => ({ ...f, cooldownHours: Math.max(0, Number(e.target.value)) }))}
                min={0}
                max={168}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
              />
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">0 = 제한 없음</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                일일 한도
              </label>
              <input
                type="number"
                value={form.dailyLimit}
                onChange={(e) => setForm((f) => ({ ...f, dailyLimit: Number(e.target.value) }))}
                min={-1}
                max={99}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:border-[var(--color-brand-primary)] focus:outline-none"
              />
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">-1 = 무제한</p>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--color-error)]">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[var(--color-brand-primary)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-primary-dark)] disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : reward ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
