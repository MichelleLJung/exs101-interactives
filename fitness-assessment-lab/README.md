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


## Canvas course alignment — September 2026

The current definitions use the instructor-provided EXS testing protocols Canvas export. Bench press and paced partial curl-up percentile tables are transcribed from their accessible pages, citing Haff & Triplett (2016). Rockport now selects the course college equation for ages 18–29 and adult equation for ages 30–69, with immediate finish heart rate. Rockport and Queens estimates include age-matched course VO₂max reference context for ages 20–69; estimates remain explicitly distinct from measured VO₂max.

Protocol corrections: push-up targets and stop rules; partial curl-ups at 40 beats/min, age-dependent tape spacing and 75-repetition cap; plank capped at 360 seconds; squats to fatigue with a chair depth target; YMCA sit-and-reach best of two valid trials; shoulder three trials on each side; vertical jump three valid trials; broad jump two or three trials with 1–2 minutes rest. Optional body-composition participation and all category requirements remain unchanged.

Reference limitations deliberately retained: push-up male ages 30–39 scores 20–21 and female ages 60–69 score 1 fall in overlapping supplied categories. The sit-and-reach age-65 bands overlap; box zero instructions conflict. Plank categories lack a source and conflict with its cap. Shoulder ranges have gaps and no clear population. Squat material has no identified normative source. Vertical anchors are approximate context, and broad-jump anchors represent elite athletes rather than introductory students. These cases do not receive invented automatic classifications. Existing verified YMCA step norms remain because no matching replacement was found in the export. Fit3D stays as available.

Draft compatibility: old values and reflections are preserved, completion/protocol confirmations are reset, and a testing note requires review of the revised procedure. Automated comparisons are withheld while that note remains. Old one-minute curl-up, timed squat, and single-trial shoulder results must not be silently relabeled as the revised tests.

The separate course-wide interactive is deferred as requested. Its scope will include all distinct assessment protocols in the export, including running/walking/treadmill/cycle tests, maximal and multi-repetition strength tests, agility/sprints, mobility tests, and body-composition methods. Duplicate accessible pages will be reconciled, and missing/contradictory norm sources resolved before classifications are implemented. No private screening forms or student records are published.


## Visible norm charts

The interpretation step now displays accessible data tables directly, separately from protocol/source references and independently of automated classification eligibility. Charts cover VO₂max (Rockport/Queens), YMCA recovery pulse, bench press, push-ups, partial curl-ups, YMCA sit-and-reach, and shoulder mobility. VO₂max tables include the supplied course category labels. Shoulder distances support inches or cm, with the exact printed course categories applied separately to the best of three trials per side; gaps remain unclassified. Existing shoulder drafts without a unit remain cm.

Vertical approximate anchors and elite broad-jump references are explicitly contextual. The unsourced/conflicting plank table is displayed as unresolved course material, with no automated classification. Squats and optional body-composition outputs do not acquire invented charts. The example bench screenshot has different scores from the age-specific course table; it illustrates the desired format and does not replace the selected dataset.
