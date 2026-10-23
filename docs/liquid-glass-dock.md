# LiquidGlassDock

The self-contained implementation is `src/components/navigation/LiquidGlassDock.tsx`.
The five-tab App Store-style demo is at `/dock-demo`; STRIDE's navigator uses the same component with its own labels and icons.

```tsx
import { useState } from 'react';
import { Search } from 'lucide-react-native';
import { LiquidGlassDock, type LiquidGlassTab } from './LiquidGlassDock';

const tabs: LiquidGlassTab[] = [
  // Add Today, Games, Apps, and Arcade in the same shape.
  {
    id: 'search',
    label: 'Search',
    icon: ({ color, size, selected }) => (
      <Search color={color} size={size} strokeWidth={selected ? 3 : 1.8} />
    ),
  },
];

function Screen() {
  const [activeId, setActiveId] = useState('search');
  return <LiquidGlassDock tabs={tabs} activeId={activeId} onChange={setActiveId} />;
}
```

Place the dock after screen content, inside a screen-sized positioned parent and `SafeAreaProvider`. Reserve at least `74 + bottomSafeArea + 28` points below scroll content. Icons are render functions so the blue layer can use a filled variant. IDs must be unique. Keep tab arrays stable with a module constant or `useMemo`.

## Rendering and fallbacks

- Web: 20px backdrop blur, 180% saturation, SVG displacement/blur/chromatic fringe during transitions. A solid 94% white surface replaces backdrop blur in unsupported browsers.
- iOS: `expo-blur` for the surface. A native Skia shader refracts a snapshot of the actual icon/label row during transitions. The normal vector row stays available if snapshot capture fails.
- Android: wrap the scene in `BlurTargetView` from `expo-blur` and pass its ref as the optional `blurTarget` prop. Android 12+ gets native blur; older Android and missing targets use a translucent white fallback. STRIDE and the demo already supply targets.
- Refraction affects the tab content, not arbitrary native screen pixels. The native optical effect has been bundle-checked but still needs testing on a physical device.

The component uses the existing Reanimated, Skia, safe-area, and haptics dependencies plus Expo SDK-compatible `expo-blur`. It intentionally does not load Skia/CanvasKit on web.

## Interaction

Tap selects a tab. Horizontal dragging previews the lens and commits the nearest tab on release; cancellation restores the controlled selection. Haptics fire when crossing native tab boundaries. Arrow keys move keyboard focus, Home/End reach the ends, and Enter/Space select. Screen readers get a tablist, individual tab labels, and selected state. Decorative copies are hidden from accessibility.

OS reduced-motion settings disable spring, stretch, refraction, and press scaling; selection uses a short fade. `SPRING`, `BLUE`, `INK`, `BLUR`, and the shader/filter definitions in the component are the customization points.

## Validation

`npx jest __tests__/liquidGlassDock.test.ts --runInBand` checks bounds, adaptive width, drag snapping, and pre-layout state. Export with `npx expo export --platform all --max-workers 2` to check web/iOS/Android bundles. Existing unrelated repository lint/type errors are tracked separately.
