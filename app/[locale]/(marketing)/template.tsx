import {ViewTransition, type ReactNode} from 'react';

// Route transition for marketing pages: crossfade + slight rise via React's
// <ViewTransition> (enabled with experimental.viewTransition). Browsers without
// the View Transitions API, and reduced-motion users, simply get no animation.
export default function Template({children}: {children: ReactNode}) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
