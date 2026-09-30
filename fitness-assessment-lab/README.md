# EXS101 Fitness Assessment Lab

Standalone classroom digital notebook at `/fitness-assessment-lab/`. Uses the Human Performance Lab typography, panels, controls, and report styling, with teal accents. No network requests contain student-entered data. All calculations and report generation run locally.

## Assessment and completion rules

Six distinct required assessments: one cardio, two muscular endurance, one flexibility, one power, plus one surplus assessment from those categories. Optional body composition contributes no required credit. A completed assessment requires valid recorded data, protocol confirmation, interpretation, and limitation. Editing data or writing returns that assessment to draft. Synthesis adapts when the selected assessments contain no normative comparison or no estimated value.

`localStorage` preserves drafts across navigation and reload on the same origin/device. Browser privacy settings and third-party iframe restrictions can prevent persistence; JSON backup/restore provides a portable fallback. Start Over requires confirmation. Body composition may be skipped without explanation and excluded from the submitted report.

## Reference implementation

- YMCA step: ACE Tables 1–2, reproducing YMCA 4th-edition reference anchors, ages 18–25 through 66+. Full-minute recovery count, not a 15-second count multiplied by four.
- Push-up: CSEP/ACE Table 3, ages 20–59, matching reference category to the actual standard/modified version. Older/mismatched groups receive descriptive results. The female 60–69 table contains overlapping published ranges, so no automated classification is implemented there.
- Sit-and-reach: ACE Table 18, heels at the 15-inch mark; inch/cm recording allowed, three valid trials required. Other box/zero-point conventions receive descriptive results, with no claim of equivalence.
- Plank: Strand et al. (2014) Table 2 sex-specific anchors. Restricted to a conservative college-age comparison context selected by the student; 18–25 is an application eligibility choice, not a validated study cutoff. The paper has inconsistent subgroup counts; no athlete/non-athlete subgroup lookup is implemented.
- Rockport: standard relative equation reproduced in University of Michigan exercise-physiology materials. Weight is converted to pounds; minutes/seconds to decimal minutes. PhenX timing guidance uses final walking HR. Estimated VO2max is explicitly distinguished from gas-analysis measurements. Original development population: adults 30–69.
- Queens College: 41.3 cm step, source-specific 22/24 cycles per minute, 15-second recovery pulse from seconds 5–20; male/female equations only when the performed cadence matches.
- Bench, one-minute YMCA half sit-up, classroom squat, shoulder reach, and jump protocols are descriptive. No unverified normative table is substituted. Squat, shoulder, and jump classroom procedures should be checked against the instructor’s station setup before assigning.
- Optional BIA and Fit3D outputs are identified by method and units and receive no body-size judgments.

Normative anchors are bracketed without interpolation or extrapolation. Protocol changes recorded in the testing-note field withhold automated comparison/prediction. Each report cites only sources used by the completed, included assessments.

## Reports and accessibility

PDFs use letter pages, embedded DejaVu fonts (license included), tagged structure, language metadata, logical text order, and a Unicode text layer for rasterized non-ASCII text. Non-ASCII visual glyphs use the device’s available fonts. An equivalent semantic HTML report can also be downloaded. This is not a PDF/UA certification.

Checked during initial release:

- End-to-end six-assessment workflow through synthesis and PDF/HTML download.
- Data retained after reload; category coverage and additional-assessment gating.
- Rockport pound/kg equivalence, decimal-time equation, Queens College equations, and mismatched-protocol fallback.
- WCAG 2.1 A/AA axe scans of preparation, dashboard, six interpretation screens, report, narrow dashboard, and recording form: no violations found.
- Keyboard focus after navigation, visible focus, semantic form labels, accessible error/status roles, reduced-motion media, and 320px reflow.
- Embedded iframe loading and input interaction in a local Canvas-style iframe. Actual Canvas permissions/browser settings may differ.
- Multi-page PDF rendered and visually inspected; tags and text extraction inspected.

Remaining verification: hands-on NVDA/JAWS/VoiceOver testing, actual Canvas embedding and downloads, mobile Safari, and device-specific non-Latin visual glyph coverage. Automated scans and accessibility-tree checks alone do not establish WCAG conformance.
