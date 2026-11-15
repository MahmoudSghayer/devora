import AuraSceneLazy from '@/components/three/AuraSceneLazy';

export default function Page() {
  return (
    <div style={{position: 'fixed', inset: 0, zIndex: 50, background: 'var(--color-bg)'}}>
      <AuraSceneLazy />
    </div>
  );
}
