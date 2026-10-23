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

Place the dock after screen content, inside a screen-sized positioned parent and `SafeAreaProvider`. Reserve at least `64 + bottomSafeArea + 28` points below scroll content. Icons are render functions so the blue layer can use a filled variant. IDs must be unique. Keep tab arrays stable with a module constant or `useMemo`.

The selected capsule targets 68 by 52 points, with 21-point icons and 11-point labels. Its width adapts to text and compact screens. Extra horizontal end padding keeps the first and last capsule centered without shifting their icons. The outer height is 64 points, so existing screen clearances remain valid.

## Rendering and fallbacks

- Web: a 16% tint with 24px backdrop blur and 180% saturation lets page content show through. SVG reflections and a bright upper rim supply the gloss. Unsupported browsers use a readable solid fallback.
- iOS: `expo-blur` supplies the glass surface. Android 12+ uses `BlurTargetView`; wrap the scene and pass its ref as `blurTarget`. STRIDE and the demo already supply targets. Older Android uses the fallback.
- Set `appearance="dark"` over dark screens and `appearance="light"` over light ones. The appearance changes the tint, inactive ink, and active blue for contrast. STRIDE uses the dark treatment.
- The background capsule moves and stretches independently of stationary tab icons and labels. Lens position crossfades the two glyph variants in each cell. This keeps labels readable during rapid page changes and avoids clipped, counter-translated text layers.
- Destination geometry is compared before starting a spring, so repeated navigation renders do not restart the animation. Reduced-motion changes still cancel the spring and use a fade.

The component uses Reanimated, Expo Blur, SVG, safe-area, and haptics. Native appearance still needs checking on a physical device.

## Interaction

Tap selects a tab. Horizontal dragging previews the lens and commits the nearest tab on release; cancellation restores the controlled selection. Haptics fire when crossing native tab boundaries. Arrow keys move keyboard focus, Home/End reach the ends, and Enter/Space select. Screen readers get a tablist, individual tab labels, and selected state. Decorative copies are hidden from accessibility.

OS reduced-motion settings disable spring, stretch, and press scaling; selection uses a short fade. `SPRING`, `DARK`, `LIGHT`, `BLUR`, and the reflection gradient in the component are the customization points.

## Validation

`npx jest __tests__/liquidGlassDock.test.ts --runInBand` checks bounds, adaptive width, drag snapping, and pre-layout state. Export with `npx expo export --platform all --max-workers 2` to check web/iOS/Android bundles. Existing unrelated repository lint/type errors are tracked separately.
