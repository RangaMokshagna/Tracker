# STRIDE · Tidal Glass

A calm, movement-focused interface inspired by translucent iOS surfaces and landscape contours.

## Palette

- Ink `#101B21`: screen background.
- Sea glass `#B9E8DA`: primary actions and progress.
- Pearl `#F3F2EC`: primary reading color.
- Mist `#A8B8BF`: secondary information.
- Apricot `#EDB79B`: occasional warm detail.

## Interface rules

Use ambient color behind translucent panels, fine reflective top borders, and restrained highlights. Keep body text opaque for readability. The glass treatment is rendered with existing SVG and React Native primitives, so it works without a native blur dependency.

Use light, large numbers for primary metrics and compact, sentence-case action labels. Keep touch targets at least 44 points. Reserve the sea-glass fill for primary actions; most panels stay neutral.

The floating dock must stay clear of scroll content, the run controls, and the Coach composer. Run metrics scroll on short screens. Dashboard history and weekly activity come from saved runs; the contour artwork is decorative rather than a real map.

The historical `lime` token names remain as compatibility aliases for sea glass. New styles should use the centralized palette rather than hardcoded accent values.
