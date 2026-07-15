# BillManager Mobile design QA

## References and coverage

- Android reference: `C:/Users/brdwe/.codex/generated_images/019f66c7-d4b1-7c91-8ad0-ea8904aec52d/exec-1e527f15-b77d-4658-b385-20af976924b7.png`
- iOS reference: `C:/Users/brdwe/.codex/generated_images/019f66c7-d4b1-7c91-8ad0-ea8904aec52d/exec-439cb746-2961-499f-b9f9-f4bce3aa8d8a.png`
- Implementation preview: `http://localhost:8088/home`, run with `EXPO_PUBLIC_DESIGN_PREVIEW=1` and the selected platform adapter.

The in-app browser comparison emitted each reference and its implementation screenshot together. Android was checked at 412 x 915, 820 x 1180, and 1280 x 900. iOS was checked at 320 x 700, 412 x 915, and 1024 x 1366. The five-tab shell, Bills, and Settings were exercised through accessible tab controls.

## Findings and iterations

1. The first iOS rendering reused too much of the Android card hierarchy. It was replaced with an iOS-specific grouped overview, toolbar create action, restrained inset surfaces, SF Symbols, and native-sized row actions. Android retains the Monthly Pulse cards and floating action button.
2. Wide tablet navigation initially used an incompatible tab-label position and crowded content. The adaptive breakpoints now keep bottom tabs on compact tablets, use a Material navigation rail on wide Android layouts, and use an iOS sidebar on wide iPad layouts.
3. The iOS monthly amount wrapped on a 320-point phone. Compact summary spacing, typography, and column proportions were adjusted; the final amount and labels remain readable without horizontal clipping.
4. Navigation transitions briefly exposed both screens in the web accessibility snapshot. After the transition settled, only the active screen and the shared tab list remained in the accessibility tree.
5. Development-only HMR frames occasionally produced incomplete black screenshot regions. All visual judgments use screenshots captured after a stable repaint.

## Final checks

- Visual hierarchy, spacing, platform differentiation, tab treatment, primary actions, and wide-layout behavior match the selected direction closely while preserving real product data semantics.
- Interactive controls expose role/name/state data, financial charts expose textual summaries, and primary touch targets follow the 44-point iOS and 48-dp Android targets.
- The preview has no current fatal runtime error. Remaining console output is limited to expected React Native Web or development warnings.
- Native-only transitions, system sheets, swipe/context actions, widgets, notifications, passkeys, VoiceOver, and TalkBack remain part of the physical-device release gate and are not inferred from the web preview.

final result: passed
