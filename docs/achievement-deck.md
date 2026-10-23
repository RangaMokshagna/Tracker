# Achievement collection

`AchievementDeck` accepts `badges`, `axis` (`vertical` by default, or `horizontal`), and `onClose`. Each badge has `id`, `title`, optional React Native `image` source, `earned`, normalized `progress` (0–1), optional `earnedAt`, `description`, and optional `color`, `category`, and `stats`.

`BadgeCard` renders both faces with accessible actions; `DeckHeader` provides back and earned filtering. Share opens the OS share sheet only when pressed. The route maps existing goal records to the deck without changing earned state. Metric captions identify current records rather than inventing historical run distances.

The Profile folder measures its artwork before navigation. A transparent modal animates a duplicate of the folder from that rectangle into the collection, then reveals the deck. Closing reverses the geometry; Android hardware Back uses the same close path. This is a matched-geometry image transition, not the navigator's native shared-element API. The raster artwork's two panels are not independently hinged.

Swipes use distance and velocity thresholds, resist outward dragging at the ends, and never wrap. Buttons provide equivalent navigation without gestures. The active card flips to details; decorative back cards are excluded from accessibility. Reduced motion uses opacity changes instead of flips and spring travel. Runtime animations use transforms and opacity; the warm ambient color changes by crossfading static color layers under a soft radial gradient.

Regression tests cover slow drags, fast flicks/reversals, end boundaries, and empty collections. Physical-device review is still needed for gesture feel, haptics, and native sharing.
