'use client';

import {
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  isValidElement,
  cloneElement,
} from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variants,
  type HTMLMotionProps,
} from 'motion/react';
import useClickOutside from './useClickOutside';
import { cn } from '@/lib/utils';

const TRANSITION: Transition = {
  type: 'spring',
  bounce: 0.1,
  duration: 0.4,
};

type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  uniqueId: string;
  variants?: Variants;
};

const MorphingPopoverContext =
  createContext<MorphingPopoverContextValue | null>(null);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = useCallback(() => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  }, [controlledOpen, onOpenChange]);

  const close = useCallback(() => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  }, [controlledOpen, onOpenChange]);

  return { isOpen, open, close, uniqueId };
}

export type MorphingPopoverProps = {
  children: React.ReactNode;
  transition?: Transition;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: Variants;
  className?: string;
} & Omit<React.ComponentProps<'div'>, 'children' | 'className'>;

function MorphingPopover({
  children,
  transition = TRANSITION,
  defaultOpen,
  open,
  onOpenChange,
  variants,
  className,
  ...props
}: MorphingPopoverProps) {
  const popoverLogic = usePopoverLogic({ defaultOpen, open, onOpenChange });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <MotionConfig transition={transition}>
        <div
          className={cn('relative flex items-center justify-center', className)}
          key={popoverLogic.uniqueId}
          {...props}
        >
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

function useMorphingPopoverContext(componentName: string) {
  const context = useContext(MorphingPopoverContext);
  if (!context) {
    throw new Error(`${componentName} must be used within MorphingPopover`);
  }
  return context;
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<'button'>, 'children' | 'className'>;

function MorphingPopoverTrigger({
  children,
  className,
  asChild = false,
  ...props
}: MorphingPopoverTriggerProps) {
  const context = useMorphingPopoverContext('MorphingPopoverTrigger');

  if (asChild && isValidElement(children)) {
    // We intentionally treat the child's props as `any` here: the child's
    // element type isn't statically known, so its prop shape can't be
    // verified against motion's HTML prop types at compile time. Casting
    // narrowly (instead of using `unknown`) avoids spreading untyped values
    // into JSX, which is what previously caused the type errors.
    const MotionComponent = motion.create(
      children.type as React.ElementType
    );
    const childProps = children.props as Record<string, any>;

    return (
      <MotionComponent
        {...childProps}
        onClick={context.open}
        layoutId={`popover-trigger-${context.uniqueId}`}
        className={childProps.className}
        key={context.uniqueId}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      />
    );
  }

  return (
    <motion.div
      key={context.uniqueId}
      layoutId={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
    >
      <motion.button
        {...props}
        layoutId={`popover-label-${context.uniqueId}`}
        key={context.uniqueId}
        className={className}
        aria-expanded={context.isOpen}
        aria-controls={`popover-content-${context.uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

export type MorphingPopoverContentProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<'div'>, 'children' | 'className'>;

function MorphingPopoverContent({
  children,
  className,
  ...props
}: MorphingPopoverContentProps) {
  const context = useMorphingPopoverContext('MorphingPopoverContent');

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, context.close);

  useEffect(() => {
    if (!context.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') context.close();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context.isOpen, context.close]);

  return (
    <AnimatePresence>
      {context.isOpen && (
        <motion.div
          {...props}
          ref={ref}
          layoutId={`popover-trigger-${context.uniqueId}`}
          key={context.uniqueId}
          id={`popover-content-${context.uniqueId}`}
          role="dialog"
          aria-modal="true"
          className={cn(
            'absolute overflow-hidden rounded-md border border-zinc-950/10 bg-white p-2 text-zinc-950 shadow-md dark:border-zinc-50/10 dark:bg-zinc-700 dark:text-zinc-50',
            className
          )}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={context.variants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent };