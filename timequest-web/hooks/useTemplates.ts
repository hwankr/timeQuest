'use client';

// 템플릿/블록 CRUD 훅 — 실시간 구독 + Optimistic Update (DnD 순서 변경)
import { useEffect, useState, useCallback, useRef } from 'react';
import { ScheduleTemplate, TimeBlock } from '@/types';
import { ScheduleRepository } from '@/repositories/scheduleRepo';
import { useAuth } from './useAuth';

interface UseTemplatesReturn {
  // 템플릿
  templates: ScheduleTemplate[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  createTemplate: (name: string) => Promise<string>;
  updateTemplate: (templateId: string, data: { name?: string; isDefault?: boolean }) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<string>;

  // 블록
  displayBlocks: TimeBlock[];
  createBlock: (templateId: string, block: Omit<TimeBlock, 'id'>) => Promise<string>;
  updateBlock: (templateId: string, blockId: string, data: Partial<Omit<TimeBlock, 'id'>>) => Promise<void>;
  deleteBlock: (templateId: string, blockId: string) => Promise<void>;

  // DnD
  reorderBlocks: (templateId: string, orderedBlockIds: string[]) => Promise<void>;
  pendingReorder: boolean;

  // 상태
  isLoading: boolean;
}

export function useTemplates(): UseTemplatesReturn {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [optimisticBlocks, setOptimisticBlocks] = useState<TimeBlock[] | null>(null);
  const [pendingReorder, setPendingReorder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pendingReorderRef = useRef(false);

  // 템플릿 실시간 구독
  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    const repo = new ScheduleRepository(user.uid);
    setIsLoading(true);
    const unsubscribe = repo.subscribeToTemplates((newTemplates) => {
      setTemplates(newTemplates);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // 블록 실시간 구독 (선택된 템플릿 변경 시)
  useEffect(() => {
    if (!user || !selectedTemplateId) {
      setBlocks([]);
      setOptimisticBlocks(null);
      return;
    }

    const repo = new ScheduleRepository(user.uid);
    const unsubscribe = repo.subscribeToBlocks(selectedTemplateId, (newBlocks) => {
      setBlocks(newBlocks);
      // pendingReorder 중이면 optimisticBlocks 유지
      if (!pendingReorderRef.current) {
        setOptimisticBlocks(null);
      }
    });

    return unsubscribe;
  }, [user, selectedTemplateId]);

  // ─── 템플릿 CRUD ───

  const createTemplate = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    return repo.createTemplate(name, false);
  }, [user]);

  const updateTemplate = useCallback(async (
    templateId: string,
    data: { name?: string; isDefault?: boolean },
  ): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    await repo.updateTemplate(templateId, data);
  }, [user]);

  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    await repo.deleteTemplate(templateId);
    // 삭제된 템플릿이 선택된 상태면 선택 해제
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
    }
  }, [user, selectedTemplateId]);

  const duplicateTemplate = useCallback(async (templateId: string): Promise<string> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    return repo.duplicateTemplate(templateId);
  }, [user]);

  // ─── 블록 CRUD ───

  const createBlock = useCallback(async (
    templateId: string,
    block: Omit<TimeBlock, 'id'>,
  ): Promise<string> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    return repo.createBlock(templateId, block);
  }, [user]);

  const updateBlock = useCallback(async (
    templateId: string,
    blockId: string,
    data: Partial<Omit<TimeBlock, 'id'>>,
  ): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    await repo.updateBlock(templateId, blockId, data);
  }, [user]);

  const deleteBlock = useCallback(async (
    templateId: string,
    blockId: string,
  ): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');
    const repo = new ScheduleRepository(user.uid);
    await repo.deleteBlock(templateId, blockId);
  }, [user]);

  // ─── DnD Optimistic Update ───

  const reorderBlocks = useCallback(async (
    templateId: string,
    orderedBlockIds: string[],
  ): Promise<void> => {
    if (!user) throw new Error('로그인이 필요합니다');

    // 1. optimisticBlocks 즉시 설정
    const currentBlocks = optimisticBlocks ?? blocks;
    const blockMap = new Map(currentBlocks.map((b) => [b.id, b]));
    const newOrder = orderedBlockIds
      .map((id, index) => {
        const block = blockMap.get(id);
        if (!block) return null;
        return { ...block, sortOrder: index };
      })
      .filter((b): b is TimeBlock => b !== null);

    setOptimisticBlocks(newOrder);
    setPendingReorder(true);
    pendingReorderRef.current = true;

    try {
      // 2. Firestore 업데이트
      const repo = new ScheduleRepository(user.uid);
      await repo.updateBlocksSortOrder(templateId, orderedBlockIds);
      // 3. 성공: optimistic 상태 해제
    } catch {
      // 4. 실패: 롤백 (onSnapshot 데이터로 복원)
      console.error('블록 순서 변경 실패');
    } finally {
      setPendingReorder(false);
      pendingReorderRef.current = false;
      setOptimisticBlocks(null);
    }
  }, [user, blocks, optimisticBlocks]);

  // 렌더링 시 사용할 블록: optimisticBlocks ?? blocks
  const displayBlocks = optimisticBlocks ?? blocks;

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    displayBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    pendingReorder,
    isLoading,
  };
}
