<?xml version="1.0" encoding="UTF-8"?>
<!--
  Historical Manuscript Style for MuseScore 3/4
  =============================================
  Emulates the look of 18th-century handwritten scores (Mozart, Beethoven era).

  What this changes:
    - Music font:  Petaluma  (handwritten notation symbols)
    - Text font:   Petaluma Script / Edwin as fallback
    - Ink color:   Dark sepia brown (#4B3012) on all text and frame elements
    - Line widths: Thinner staff lines and stems for an organic, quill-pen feel
    - Spacing:     Classical-era proportions (wider margins, generous staff distance)
    - Layout:      No measure numbers, minimal headers, period-appropriate sizing

  How to use:
    MuseScore 3:  Format > Load Style > select this file
    MuseScore 4:  Format > Load Style > select this file

  For the full parchment look, also set your paper colour in
    Edit > Preferences > Canvas > Paper: #F5E6C8 (warm parchment cream)
-->
<museScore version="3.01">
  <Style>
    <!-- ===== PAGE LAYOUT (generous classical margins) ===== -->
    <pageWidth>8.5</pageWidth>
    <pageHeight>11</pageHeight>
    <pagePrintableWidth>7.1</pagePrintableWidth>
    <pageEvenLeftMargin>0.7</pageEvenLeftMargin>
    <pageOddLeftMargin>0.7</pageOddLeftMargin>
    <pageEvenTopMargin>0.6</pageEvenTopMargin>
    <pageEvenBottomMargin>0.8</pageEvenBottomMargin>
    <pageOddTopMargin>0.6</pageOddTopMargin>
    <pageOddBottomMargin>0.8</pageOddBottomMargin>
    <pageTwosided>0</pageTwosided>

    <!-- ===== STAFF & SYSTEM SPACING ===== -->
    <staffUpperBorder>7</staffUpperBorder>
    <staffLowerBorder>7</staffLowerBorder>
    <staffDistance>7.5</staffDistance>
    <akkoladeDistance>7.5</akkoladeDistance>
    <minSystemDistance>9.5</minSystemDistance>
    <maxSystemDistance>15</maxSystemDistance>

    <!-- ===== LYRICS ===== -->
    <lyricsPlacement>1</lyricsPlacement>
    <lyricsPosAbove x="0" y="-2"/>
    <lyricsPosBelow x="0" y="3"/>
    <lyricsMinTopDistance>1</lyricsMinTopDistance>
    <lyricsMinBottomDistance>2</lyricsMinBottomDistance>
    <lyricsLineHeight>1</lyricsLineHeight>
    <lyricsDashMinLength>0.4</lyricsDashMinLength>
    <lyricsDashMaxLegth>0.8</lyricsDashMaxLegth>
    <lyricsDashMaxDistance>16</lyricsDashMaxDistance>
    <lyricsDashForce>1</lyricsDashForce>
    <lyricsAlignVerseNumber>1</lyricsAlignVerseNumber>
    <lyricsLineThickness>0.25</lyricsLineThickness>
    <lyricsMelismaPad>0.1</lyricsMelismaPad>
    <lyricsDashPad>0.05</lyricsDashPad>
    <lyricsDashLineThickness>0.12</lyricsDashLineThickness>
    <lyricsDashYposRatio>0.67</lyricsDashYposRatio>
    <lyricsOddFontFace>Edwin</lyricsOddFontFace>
    <lyricsOddFontSize>10</lyricsOddFontSize>
    <lyricsOddFontStyle>2</lyricsOddFontStyle>
    <lyricsOddFrameType>0</lyricsOddFrameType>
    <lyricsOddFramePadding>0.2</lyricsOddFramePadding>
    <lyricsOddFrameWidth>0.1</lyricsOddFrameWidth>
    <lyricsOddFrameRound>0</lyricsOddFrameRound>
    <lyricsOddFrameFgColor r="75" g="48" b="18" a="255"/>
    <lyricsOddFrameBgColor r="255" g="255" b="255" a="0"/>
    <lyricsEvenFontFace>Edwin</lyricsEvenFontFace>
    <lyricsEvenFontSize>10</lyricsEvenFontSize>
    <lyricsEvenFontStyle>2</lyricsEvenFontStyle>
    <lyricsEvenFrameType>0</lyricsEvenFrameType>
    <lyricsEvenFramePadding>0.2</lyricsEvenFramePadding>
    <lyricsEvenFrameWidth>0.1</lyricsEvenFrameWidth>
    <lyricsEvenFrameRound>0</lyricsEvenFrameRound>
    <lyricsEvenFrameFgColor r="75" g="48" b="18" a="255"/>
    <lyricsEvenFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== FIGURED BASS ===== -->
    <figuredBassFontFamily>MScoreBC</figuredBassFontFamily>
    <figuredBassYOffset>6</figuredBassYOffset>
    <figuredBassLineHeight>1</figuredBassLineHeight>
    <figuredBassAlignment>0</figuredBassAlignment>
    <figuredBassStyle>0</figuredBassStyle>

    <!-- ===== FRAME DISTANCES ===== -->
    <systemFrameDistance>7</systemFrameDistance>
    <frameSystemDistance>7</frameSystemDistance>
    <minMeasureWidth>5</minMeasureWidth>

    <!-- ===== BARLINES (thinner for quill-pen look) ===== -->
    <barWidth>0.22</barWidth>
    <doubleBarWidth>0.22</doubleBarWidth>
    <endBarWidth>0.5</endBarWidth>
    <doubleBarDistance>0.5</doubleBarDistance>
    <endBarDistance>0.65</endBarDistance>
    <repeatBarlineDotSeparation>0.46</repeatBarlineDotSeparation>
    <repeatBarTips>0</repeatBarTips>
    <startBarlineSingle>0</startBarlineSingle>
    <startBarlineMultiple>1</startBarlineMultiple>

    <!-- ===== BRACKETS & BRACES ===== -->
    <bracketWidth>0.4</bracketWidth>
    <bracketDistance>0.1</bracketDistance>
    <akkoladeWidth>1.6</akkoladeWidth>
    <akkoladeBarDistance>0.4</akkoladeBarDistance>

    <!-- ===== DIVIDERS ===== -->
    <dividerLeft>0</dividerLeft>
    <dividerLeftSym>systemDivider</dividerLeftSym>
    <dividerLeftX>0</dividerLeftX>
    <dividerLeftY>0</dividerLeftY>
    <dividerRight>0</dividerRight>
    <dividerRightSym>systemDivider</dividerRightSym>
    <dividerRightX>0</dividerRightX>
    <dividerRightY>0</dividerRightY>

    <!-- ===== MARGINS & CLEF SPACING ===== -->
    <clefLeftMargin>0.8</clefLeftMargin>
    <keysigLeftMargin>0.5</keysigLeftMargin>
    <ambitusMargin>0.5</ambitusMargin>
    <timesigLeftMargin>0.5</timesigLeftMargin>
    <timesigScale w="1" h="1"/>
    <clefKeyRightMargin>0.8</clefKeyRightMargin>
    <clefKeyDistance>0.75</clefKeyDistance>
    <clefTimesigDistance>1</clefTimesigDistance>
    <keyTimesigDistance>1</keyTimesigDistance>
    <systemHeaderDistance>2.5</systemHeaderDistance>
    <systemHeaderTimeSigDistance>2</systemHeaderTimeSigDistance>
    <clefBarlineDistance>0.5</clefBarlineDistance>
    <timesigBarlineDistance>0.5</timesigBarlineDistance>

    <!-- ===== STEMS & NOTEHEADS (thinner, organic) ===== -->
    <stemWidth>0.12</stemWidth>
    <shortenStem>1</shortenStem>
    <shortestStem>2.25</shortestStem>
    <beginRepeatLeftMargin>1</beginRepeatLeftMargin>
    <minNoteDistance>0.25</minNoteDistance>
    <barNoteDistance>1</barNoteDistance>
    <barAccidentalDistance>0.3</barAccidentalDistance>
    <multiMeasureRestMargin>1.2</multiMeasureRestMargin>
    <noteBarDistance>1</noteBarDistance>
    <measureSpacing>1.3</measureSpacing>

    <!-- ===== STAFF LINES (thin, delicate quill strokes) ===== -->
    <staffLineWidth>0.08</staffLineWidth>
    <ledgerLineWidth>0.16</ledgerLineWidth>
    <ledgerLineLength>0.2</ledgerLineLength>

    <!-- ===== ACCIDENTALS ===== -->
    <accidentalDistance>0.22</accidentalDistance>
    <accidentalNoteDistance>0.22</accidentalNoteDistance>

    <!-- ===== BEAMS ===== -->
    <beamWidth>0.45</beamWidth>
    <beamDistance>0.33</beamDistance>
    <beamMinLen>1.32</beamMinLen>
    <beamNoSlope>0</beamNoSlope>

    <!-- ===== DOTS ===== -->
    <dotMag>1</dotMag>
    <dotNoteDistance>0.35</dotNoteDistance>
    <dotRestDistance>0.25</dotRestDistance>
    <dotDotDistance>0.5</dotDotDistance>

    <!-- ===== ARTICULATIONS ===== -->
    <propertyDistanceHead>0.5</propertyDistanceHead>
    <propertyDistanceStem>0.5</propertyDistanceStem>
    <propertyDistance>0.5</propertyDistance>
    <articulationMag>1</articulationMag>
    <articulationPosAbove x="0" y="0"/>
    <lastSystemFillLimit>0.3</lastSystemFillLimit>

    <!-- ===== HAIRPINS ===== -->
    <hairpinPlacement>1</hairpinPlacement>
    <hairpinPosAbove x="0" y="-3.5"/>
    <hairpinPosBelow x="0" y="3.5"/>
    <hairpinHeight>1.2</hairpinHeight>
    <hairpinContHeight>0.5</hairpinContHeight>
    <hairpinWidth>0.13</hairpinWidth>
    <hairpinFontFace>Edwin</hairpinFontFace>
    <hairpinFontSize>11</hairpinFontSize>
    <hairpinFontStyle>2</hairpinFontStyle>
    <hairpinFrameType>0</hairpinFrameType>
    <hairpinFramePadding>0.2</hairpinFramePadding>
    <hairpinFrameWidth>0.1</hairpinFrameWidth>
    <hairpinFrameRound>0</hairpinFrameRound>
    <hairpinFrameFgColor r="75" g="48" b="18" a="255"/>
    <hairpinFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== PEDAL ===== -->
    <pedalPlacement>1</pedalPlacement>
    <pedalPosAbove x="0" y="-4"/>
    <pedalPosBelow x="0" y="4"/>
    <pedalLineWidth>0.15</pedalLineWidth>
    <pedalListStyle>1</pedalListStyle>
    <pedalBeginTextOffset x="0" y="0.15"/>
    <pedalHookHeight>-1.2</pedalHookHeight>
    <pedalFontFace>Edwin</pedalFontFace>
    <pedalFontSize>11</pedalFontSize>
    <pedalFontStyle>2</pedalFontStyle>
    <pedalFrameType>0</pedalFrameType>
    <pedalFramePadding>0.2</pedalFramePadding>
    <pedalFrameWidth>0.1</pedalFrameWidth>
    <pedalFrameRound>0</pedalFrameRound>
    <pedalFrameFgColor r="75" g="48" b="18" a="255"/>
    <pedalFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== TRILLS & ORNAMENTS ===== -->
    <trillPlacement>0</trillPlacement>
    <trillPosAbove x="0" y="-1"/>
    <trillPosBelow x="0" y="1"/>
    <vibratoPlacement>0</vibratoPlacement>
    <vibratoPosAbove x="0" y="-1"/>
    <vibratoPosBelow x="0" y="1"/>

    <!-- ===== HARMONY / CHORD SYMBOLS ===== -->
    <harmonyFretDist>0.5</harmonyFretDist>
    <minHarmonyDistance>0.5</minHarmonyDistance>
    <maxHarmonyBarDistance>3</maxHarmonyBarDistance>
    <harmonyPlacement>0</harmonyPlacement>
    <chordSymbolPosAbove x="0" y="-2.5"/>
    <chordSymbolPosBelow x="0" y="3.5"/>
    <chordSymbolBPosAbove x="0" y="-5.5"/>
    <chordSymbolBPosBelow x="0" y="3.5"/>
    <chordSymbolAFontFace>Edwin</chordSymbolAFontFace>
    <chordSymbolAFontSize>12</chordSymbolAFontSize>
    <chordSymbolAFontStyle>0</chordSymbolAFontStyle>
    <chordSymbolAFrameType>0</chordSymbolAFrameType>
    <chordSymbolAFramePadding>0.2</chordSymbolAFramePadding>
    <chordSymbolAFrameWidth>0.1</chordSymbolAFrameWidth>
    <chordSymbolAFrameRound>0</chordSymbolAFrameRound>
    <chordSymbolAFrameFgColor r="75" g="48" b="18" a="255"/>
    <chordSymbolAFrameBgColor r="255" g="255" b="255" a="0"/>
    <chordSymbolBFontFace>Edwin</chordSymbolBFontFace>
    <chordSymbolBFontSize>10</chordSymbolBFontSize>
    <chordSymbolBFontStyle>2</chordSymbolBFontStyle>
    <chordSymbolBFrameType>0</chordSymbolBFrameType>
    <chordSymbolBFramePadding>0.2</chordSymbolBFramePadding>
    <chordSymbolBFrameWidth>0.1</chordSymbolBFrameWidth>
    <chordSymbolBFrameRound>0</chordSymbolBFrameRound>
    <chordSymbolBFrameFgColor r="75" g="48" b="18" a="255"/>
    <chordSymbolBFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== FRET DIAGRAMS ===== -->
    <capoPosition>0</capoPosition>
    <fretNumMag>2</fretNumMag>
    <fretNumPos>0</fretNumPos>
    <fretY>2</fretY>
    <fretMinDistance>0.5</fretMinDistance>
    <fretMag>1</fretMag>
    <fretPlacement>0</fretPlacement>
    <fretStrings>6</fretStrings>
    <fretFrets>5</fretFrets>
    <fretOffset>0</fretOffset>
    <fretBarre>0</fretBarre>

    <!-- ===== PAGE & MEASURE NUMBERS (hidden for period look) ===== -->
    <showPageNumber>0</showPageNumber>
    <showPageNumberOne>0</showPageNumberOne>
    <pageNumberOddEven>0</pageNumberOddEven>
    <showMeasureNumber>0</showMeasureNumber>
    <showMeasureNumberOne>0</showMeasureNumberOne>
    <measureNumberInterval>0</measureNumberInterval>
    <measureNumberSystem>0</measureNumberSystem>
    <measureNumberAllStaffs>0</measureNumberAllStaffs>

    <!-- ===== MAGNIFICATION ===== -->
    <smallNoteMag>0.7</smallNoteMag>
    <graceNoteMag>0.7</graceNoteMag>
    <smallStaffMag>0.7</smallStaffMag>
    <smallClefMag>0.8</smallClefMag>
    <genClef>1</genClef>
    <genKeysig>1</genKeysig>
    <genCourtesyTimesig>1</genCourtesyTimesig>
    <genCourtesyKeysig>1</genCourtesyKeysig>
    <genCourtesyClef>1</genCourtesyClef>

    <!-- ===== SWING (none for classical) ===== -->
    <swingRatio>60</swingRatio>
    <swingUnit></swingUnit>
    <useStandardNoteNames>1</useStandardNoteNames>
    <useGermanNoteNames>0</useGermanNoteNames>
    <useFullGermanNoteNames>0</useFullGermanNoteNames>
    <useSolfeggioNoteNames>0</useSolfeggioNoteNames>
    <useFrenchNoteNames>0</useFrenchNoteNames>
    <automaticCapitalization>1</automaticCapitalization>
    <lowerCaseMinorChords>0</lowerCaseMinorChords>
    <lowerCaseBassNotes>0</lowerCaseBassNotes>
    <allCapsNoteNames>0</allCapsNoteNames>

    <!-- ===== CHORD STYLE (standard, not jazz) ===== -->
    <chordStyle>std</chordStyle>
    <chordsXmlFile>0</chordsXmlFile>
    <chordDescriptionFile>chords_std.xml</chordDescriptionFile>
    <concertPitch>0</concertPitch>
    <createMultiMeasureRests>0</createMultiMeasureRests>
    <minEmptyMeasures>2</minEmptyMeasures>
    <minMMRestWidth>4</minMMRestWidth>
    <hideEmptyStaves>0</hideEmptyStaves>
    <dontHidStavesInFirstSystm>1</dontHidStavesInFirstSystm>
    <hideInstrumentNameIfOneInstrument>1</hideInstrumentNameIfOneInstrument>

    <!-- ===== PLAYBACK ===== -->
    <gateTime>100</gateTime>
    <tenutoGateTime>100</tenutoGateTime>
    <staccatoGateTime>50</staccatoGateTime>
    <slurGateTime>100</slurGateTime>

    <!-- ===== ARPEGGIOS ===== -->
    <ArpeggioNoteDistance>0.5</ArpeggioNoteDistance>
    <ArpeggioLineWidth>0.14</ArpeggioLineWidth>
    <ArpeggioHookLen>0.8</ArpeggioHookLen>
    <ArpeggioHiddenInStdIfTab>0</ArpeggioHiddenInStdIfTab>

    <!-- ===== SLURS & TIES (slightly thinner for quill pen) ===== -->
    <slurEndWidth>0.08</slurEndWidth>
    <slurMidWidth>0.2</slurMidWidth>
    <slurDottedWidth>0.08</slurDottedWidth>
    <minTieLength>1</minTieLength>
    <slurMinDistance>0.5</slurMinDistance>
    <sectionPause>3</sectionPause>

    <!-- =====================================================
         MUSIC FONT:  Petaluma (handwritten notation symbols)
         This is the key setting for the handwritten look.
         ===================================================== -->
    <musicalSymbolFont>Petaluma</musicalSymbolFont>
    <musicalTextFont>Petaluma Text</musicalTextFont>

    <!-- ===== HEADER & FOOTER (minimal for period look) ===== -->
    <showHeader>0</showHeader>
    <headerFirstPage>0</headerFirstPage>
    <headerOddEven>0</headerOddEven>
    <evenHeaderL></evenHeaderL>
    <evenHeaderC></evenHeaderC>
    <evenHeaderR></evenHeaderR>
    <oddHeaderL></oddHeaderL>
    <oddHeaderC></oddHeaderC>
    <oddHeaderR></oddHeaderR>
    <showFooter>0</showFooter>
    <footerFirstPage>0</footerFirstPage>
    <footerOddEven>0</footerOddEven>
    <evenFooterL></evenFooterL>
    <evenFooterC></evenFooterC>
    <evenFooterR></evenFooterR>
    <oddFooterL></oddFooterL>
    <oddFooterC></oddFooterC>
    <oddFooterR></oddFooterR>

    <!-- ===== VOLTA ===== -->
    <voltaPosAbove x="-0.6" y="-5.6"/>
    <voltaHook>1.9</voltaHook>
    <voltaLineWidth>0.15</voltaLineWidth>
    <voltaLineStyle>1</voltaLineStyle>
    <voltaFontFace>Edwin</voltaFontFace>
    <voltaFontSize>10</voltaFontSize>
    <voltaFontStyle>1</voltaFontStyle>
    <voltaOffset x="0.5" y="1.9"/>
    <voltaFrameType>0</voltaFrameType>
    <voltaFramePadding>0.2</voltaFramePadding>
    <voltaFrameWidth>0.1</voltaFrameWidth>
    <voltaFrameRound>0</voltaFrameRound>
    <voltaFrameFgColor r="75" g="48" b="18" a="255"/>
    <voltaFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== OTTAVA ===== -->
    <ottava8VAPlacement>0</ottava8VAPlacement>
    <ottava8VBPlacement>1</ottava8VBPlacement>
    <ottava15MAPlacement>0</ottava15MAPlacement>
    <ottava15MBPlacement>1</ottava15MBPlacement>
    <ottava22MAPlacement>0</ottava22MAPlacement>
    <ottava22MBPlacement>1</ottava22MBPlacement>
    <ottava8VAText>&lt;sym&gt;ottavaAlta&lt;/sym&gt;</ottava8VAText>
    <ottava8VBText>&lt;sym&gt;ottavaBassaBa&lt;/sym&gt;</ottava8VBText>
    <ottava15MAText>&lt;sym&gt;quindicesimaAlta&lt;/sym&gt;</ottava15MAText>
    <ottava15MBText>&lt;sym&gt;quindicesimaBassa&lt;/sym&gt;</ottava15MBText>
    <ottava22MAText>&lt;sym&gt;ventiduesimaAlta&lt;/sym&gt;</ottava22MAText>
    <ottava22MBText>&lt;sym&gt;ventiduesimaBassa&lt;/sym&gt;</ottava22MBText>
    <ottava8VAnoText>&lt;sym&gt;ottava&lt;/sym&gt;</ottava8VAnoText>
    <ottava8VBnoText>&lt;sym&gt;ottava&lt;/sym&gt;</ottava8VBnoText>
    <ottava15MAnoText>&lt;sym&gt;quindicesima&lt;/sym&gt;</ottava15MAnoText>
    <ottava15MBnoText>&lt;sym&gt;quindicesima&lt;/sym&gt;</ottava15MBnoText>
    <ottava22MAnoText>&lt;sym&gt;ventiduesima&lt;/sym&gt;</ottava22MAnoText>
    <ottava22MBnoText>&lt;sym&gt;ventiduesima&lt;/sym&gt;</ottava22MBnoText>
    <ottavaPosAbove x="0" y="-3"/>
    <ottavaPosBelow x="0" y="3"/>
    <ottavaHookAbove>1.9</ottavaHookAbove>
    <ottavaHookBelow>-1.9</ottavaHookBelow>
    <ottavaLineWidth>0.15</ottavaLineWidth>
    <ottavaLineStyle>2</ottavaLineStyle>
    <ottavaNumbersOnly>1</ottavaNumbersOnly>
    <ottavaFontFace>Edwin</ottavaFontFace>
    <ottavaFontSize>10</ottavaFontSize>
    <ottavaFontStyle>2</ottavaFontStyle>
    <ottavaFrameType>0</ottavaFrameType>
    <ottavaFramePadding>0.2</ottavaFramePadding>
    <ottavaFrameWidth>0.1</ottavaFrameWidth>
    <ottavaFrameRound>0</ottavaFrameRound>
    <ottavaFrameFgColor r="75" g="48" b="18" a="255"/>
    <ottavaFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== TREMOLO ===== -->
    <tabClef>29</tabClef>
    <tremoloWidth>1.2</tremoloWidth>
    <tremoloBoxHeight>0.65</tremoloBoxHeight>
    <tremoloLineWidth>0.5</tremoloLineWidth>
    <tremoloDistance>0.8</tremoloDistance>
    <linearStretch>1.5</linearStretch>
    <crossMeasureValues>0</crossMeasureValues>
    <keySigNaturals>0</keySigNaturals>

    <!-- ===== TUPLETS ===== -->
    <tupletMaxSlope>0.5</tupletMaxSlope>
    <tupletOufOfStaff>1</tupletOufOfStaff>
    <tupletVHeadDistance>0.5</tupletVHeadDistance>
    <tupletVStemDistance>0.25</tupletVStemDistance>
    <tupletStemLeftDistance>0.5</tupletStemLeftDistance>
    <tupletStemRightDistance>0.5</tupletStemRightDistance>
    <tupletNoteLeftDistance>0</tupletNoteLeftDistance>
    <tupletNoteRightDistance>0</tupletNoteRightDistance>
    <tupletBracketWidth>0.15</tupletBracketWidth>
    <tupletDirection>0</tupletDirection>
    <tupletNumberType>0</tupletNumberType>
    <tupletBracketType>0</tupletBracketType>
    <tupletFontFace>Edwin</tupletFontFace>
    <tupletFontSize>10</tupletFontSize>
    <tupletFontStyle>2</tupletFontStyle>
    <tupletBracketHookHeight>1</tupletBracketHookHeight>
    <tupletOffset x="0" y="0"/>
    <tupletFrameType>0</tupletFrameType>
    <tupletFramePadding>0.2</tupletFramePadding>
    <tupletFrameWidth>0.1</tupletFrameWidth>
    <tupletFrameRound>0</tupletFrameRound>
    <tupletFrameFgColor r="75" g="48" b="18" a="255"/>
    <tupletFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- ===== MISCELLANEOUS ===== -->
    <barreLineWidth>1</barreLineWidth>
    <scaleBarlines>1</scaleBarlines>
    <barGraceDistance>0.6</barGraceDistance>
    <minVerticalDistance>0.5</minVerticalDistance>
    <ornamentStyle>0</ornamentStyle>
    <autoplaceHairpinDynamicsDistance>0.5</autoplaceHairpinDynamicsDistance>

    <!-- ===== DYNAMICS ===== -->
    <dynamicsPlacement>1</dynamicsPlacement>
    <dynamicsPosAbove x="0" y="-2"/>
    <dynamicsPosBelow x="0" y="4"/>
    <dynamicsMinDistance>0.5</dynamicsMinDistance>

    <!-- ===== TEXT LINE ===== -->
    <textLinePlacement>0</textLinePlacement>
    <textLinePosAbove x="0" y="-3.5"/>
    <textLinePosBelow x="0" y="3.5"/>
    <textLineFrameType>0</textLineFrameType>
    <textLineFramePadding>0.2</textLineFramePadding>
    <textLineFrameWidth>0.1</textLineFrameWidth>
    <textLineFrameRound>0</textLineFrameRound>
    <textLineFrameFgColor r="75" g="48" b="18" a="255"/>
    <textLineFrameBgColor r="255" g="255" b="255" a="0"/>
    <tremoloBarLineWidth>0.1</tremoloBarLineWidth>
    <jumpPosAbove x="0" y="-2"/>
    <markerPosAbove x="0" y="-2"/>

    <!-- ==========================================================
         TEXT STYLES — All set to sepia brown (#4B3012)
         Font: "Edwin" (MuseScore's default serif — elegant, readable)
         For a more handwritten look, install "IM Fell English"
         (free Google Font) and replace "Edwin" below.
         ========================================================== -->

    <!-- DEFAULT TEXT -->
    <defaultFontFace>Edwin</defaultFontFace>
    <defaultFontSize>10</defaultFontSize>
    <defaultFontSpatiumDependent>1</defaultFontSpatiumDependent>
    <defaultFontStyle>0</defaultFontStyle>
    <defaultFrameType>0</defaultFrameType>
    <defaultFramePadding>0.2</defaultFramePadding>
    <defaultFrameWidth>0.1</defaultFrameWidth>
    <defaultFrameRound>0</defaultFrameRound>
    <defaultFrameFgColor r="75" g="48" b="18" a="255"/>
    <defaultFrameBgColor r="255" g="255" b="255" a="0"/>
    <defaultOffset x="0" y="0"/>
    <defaultOffsetType>1</defaultOffsetType>
    <defaultSystemFlag>0</defaultSystemFlag>
    <defaultText></defaultText>

    <!-- TITLE (large, elegant) -->
    <titleFontFace>Edwin</titleFontFace>
    <titleFontSize>26</titleFontSize>
    <titleFontSpatiumDependent>0</titleFontSpatiumDependent>
    <titleFontStyle>0</titleFontStyle>
    <titleOffset x="0" y="0"/>
    <titleOffsetType>0</titleOffsetType>
    <titleFrameType>0</titleFrameType>
    <titleFramePadding>0.2</titleFramePadding>
    <titleFrameWidth>0.1</titleFrameWidth>
    <titleFrameRound>0</titleFrameRound>
    <titleFrameFgColor r="75" g="48" b="18" a="255"/>
    <titleFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- SUBTITLE -->
    <subTitleFontFace>Edwin</subTitleFontFace>
    <subTitleFontSize>13</subTitleFontSize>
    <subTitleFontSpatiumDependent>0</subTitleFontSpatiumDependent>
    <subTitleFontStyle>2</subTitleFontStyle>
    <subTitleOffset x="0" y="10"/>
    <subTitleOffsetType>0</subTitleOffsetType>
    <subTitleFrameType>0</subTitleFrameType>
    <subTitleFramePadding>0.2</subTitleFramePadding>
    <subTitleFrameWidth>0.1</subTitleFrameWidth>
    <subTitleFrameRound>0</subTitleFrameRound>
    <subTitleFrameFgColor r="75" g="48" b="18" a="255"/>
    <subTitleFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- COMPOSER -->
    <composerFontFace>Edwin</composerFontFace>
    <composerFontSize>11</composerFontSize>
    <composerFontSpatiumDependent>0</composerFontSpatiumDependent>
    <composerFontStyle>2</composerFontStyle>
    <composerOffset x="0" y="0"/>
    <composerOffsetType>0</composerOffsetType>
    <composerFrameType>0</composerFrameType>
    <composerFramePadding>0.2</composerFramePadding>
    <composerFrameWidth>0.1</composerFrameWidth>
    <composerFrameRound>0</composerFrameRound>
    <composerFrameFgColor r="75" g="48" b="18" a="255"/>
    <composerFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- LYRICIST -->
    <lyricistFontFace>Edwin</lyricistFontFace>
    <lyricistFontSize>11</lyricistFontSize>
    <lyricistFontSpatiumDependent>0</lyricistFontSpatiumDependent>
    <lyricistFontStyle>2</lyricistFontStyle>
    <lyricistOffset x="0" y="0"/>
    <lyricistOffsetType>0</lyricistOffsetType>
    <lyricistFrameType>0</lyricistFrameType>
    <lyricistFramePadding>0.2</lyricistFramePadding>
    <lyricistFrameWidth>0.1</lyricistFrameWidth>
    <lyricistFrameRound>0</lyricistFrameRound>
    <lyricistFrameFgColor r="75" g="48" b="18" a="255"/>
    <lyricistFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- FINGERING -->
    <fingeringFontFace>Edwin</fingeringFontFace>
    <fingeringFontSize>8</fingeringFontSize>
    <fingeringFontStyle>0</fingeringFontStyle>
    <fingeringFrameType>0</fingeringFrameType>
    <fingeringFramePadding>0.2</fingeringFramePadding>
    <fingeringFrameWidth>0.1</fingeringFrameWidth>
    <fingeringFrameRound>0</fingeringFrameRound>
    <fingeringFrameFgColor r="75" g="48" b="18" a="255"/>
    <fingeringFrameBgColor r="255" g="255" b="255" a="0"/>
    <fingeringOffset x="0" y="0"/>

    <!-- GUITAR FINGERING (LH) -->
    <lhGuitarFingeringFontFace>Edwin</lhGuitarFingeringFontFace>
    <lhGuitarFingeringFontSize>8</lhGuitarFingeringFontSize>
    <lhGuitarFingeringFontStyle>0</lhGuitarFingeringFontStyle>
    <lhGuitarFingeringFrameType>0</lhGuitarFingeringFrameType>
    <lhGuitarFingeringFramePadding>0.2</lhGuitarFingeringFramePadding>
    <lhGuitarFingeringFrameWidth>0.1</lhGuitarFingeringFrameWidth>
    <lhGuitarFingeringFrameRound>0</lhGuitarFingeringFrameRound>
    <lhGuitarFingeringFrameFgColor r="75" g="48" b="18" a="255"/>
    <lhGuitarFingeringFrameBgColor r="255" g="255" b="255" a="0"/>
    <lhGuitarFingeringOffset x="-0.5" y="0"/>

    <!-- GUITAR FINGERING (RH) -->
    <rhGuitarFingeringFontFace>Edwin</rhGuitarFingeringFontFace>
    <rhGuitarFingeringFontSize>8</rhGuitarFingeringFontSize>
    <rhGuitarFingeringFontStyle>0</rhGuitarFingeringFontStyle>
    <rhGuitarFingeringFrameType>0</rhGuitarFingeringFrameType>
    <rhGuitarFingeringFramePadding>0.2</rhGuitarFingeringFramePadding>
    <rhGuitarFingeringFrameWidth>0.1</rhGuitarFingeringFrameWidth>
    <rhGuitarFingeringFrameRound>0</rhGuitarFingeringFrameRound>
    <rhGuitarFingeringFrameFgColor r="75" g="48" b="18" a="255"/>
    <rhGuitarFingeringFrameBgColor r="255" g="255" b="255" a="0"/>
    <rhGuitarFingeringOffset x="0" y="0"/>

    <!-- STRING NUMBER -->
    <stringNumberFontFace>Edwin</stringNumberFontFace>
    <stringNumberFontSize>8</stringNumberFontSize>
    <stringNumberFontStyle>0</stringNumberFontStyle>
    <stringNumberFrameType>2</stringNumberFrameType>
    <stringNumberFramePadding>0.2</stringNumberFramePadding>
    <stringNumberFrameWidth>0.1</stringNumberFrameWidth>
    <stringNumberFrameRound>0</stringNumberFrameRound>
    <stringNumberFrameFgColor r="75" g="48" b="18" a="255"/>
    <stringNumberFrameBgColor r="255" g="255" b="255" a="0"/>
    <stringNumberOffset x="0" y="-2"/>

    <!-- INSTRUMENT NAMES (LONG) -->
    <longInstrumentFontFace>Edwin</longInstrumentFontFace>
    <longInstrumentFontSize>11</longInstrumentFontSize>
    <longInstrumentFontStyle>0</longInstrumentFontStyle>
    <longInstrumentOffset x="0" y="0"/>
    <longInstrumentFrameType>0</longInstrumentFrameType>
    <longInstrumentFramePadding>0.2</longInstrumentFramePadding>
    <longInstrumentFrameWidth>0.1</longInstrumentFrameWidth>
    <longInstrumentFrameRound>0</longInstrumentFrameRound>
    <longInstrumentFrameFgColor r="75" g="48" b="18" a="255"/>
    <longInstrumentFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- INSTRUMENT NAMES (SHORT) -->
    <shortInstrumentFontFace>Edwin</shortInstrumentFontFace>
    <shortInstrumentFontSize>11</shortInstrumentFontSize>
    <shortInstrumentFontStyle>0</shortInstrumentFontStyle>
    <shortInstrumentOffset x="0" y="0"/>
    <shortInstrumentFrameType>0</shortInstrumentFrameType>
    <shortInstrumentFramePadding>0.2</shortInstrumentFramePadding>
    <shortInstrumentFrameWidth>0.1</shortInstrumentFrameWidth>
    <shortInstrumentFrameRound>0</shortInstrumentFrameRound>
    <shortInstrumentFrameFgColor r="75" g="48" b="18" a="255"/>
    <shortInstrumentFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- PART INSTRUMENT -->
    <partInstrumentFontFace>Edwin</partInstrumentFontFace>
    <partInstrumentFontSize>16</partInstrumentFontSize>
    <partInstrumentFontStyle>0</partInstrumentFontStyle>
    <partInstrumentOffset x="0" y="0"/>
    <partInstrumentFrameType>0</partInstrumentFrameType>
    <partInstrumentFramePadding>0.2</partInstrumentFramePadding>
    <partInstrumentFrameWidth>0.1</partInstrumentFrameWidth>
    <partInstrumentFrameRound>0</partInstrumentFrameRound>
    <partInstrumentFrameFgColor r="75" g="48" b="18" a="255"/>
    <partInstrumentFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- DYNAMICS -->
    <dynamicsFontFace>Edwin</dynamicsFontFace>
    <dynamicsFontSize>11</dynamicsFontSize>
    <dynamicsFontStyle>2</dynamicsFontStyle>
    <dynamicsFrameType>0</dynamicsFrameType>
    <dynamicsFramePadding>0.2</dynamicsFramePadding>
    <dynamicsFrameWidth>0.1</dynamicsFrameWidth>
    <dynamicsFrameRound>0</dynamicsFrameRound>
    <dynamicsFrameFgColor r="75" g="48" b="18" a="255"/>
    <dynamicsFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- EXPRESSION -->
    <expressionFontFace>Edwin</expressionFontFace>
    <expressionFontSize>10</expressionFontSize>
    <expressionFontStyle>2</expressionFontStyle>
    <expressionPlacement>0</expressionPlacement>
    <expressionOffset x="0" y="0"/>
    <expressionFrameType>0</expressionFrameType>
    <expressionFramePadding>0.2</expressionFramePadding>
    <expressionFrameWidth>0.1</expressionFrameWidth>
    <expressionFrameRound>0</expressionFrameRound>
    <expressionFrameFgColor r="75" g="48" b="18" a="255"/>
    <expressionFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- TEMPO -->
    <tempoFontFace>Edwin</tempoFontFace>
    <tempoFontSize>11</tempoFontSize>
    <tempoFontStyle>1</tempoFontStyle>
    <tempoSystemFlag>1</tempoSystemFlag>
    <tempoPlacement>0</tempoPlacement>
    <tempoPosAbove x="0" y="-2"/>
    <tempoPosBelow x="0" y="3"/>
    <tempoMinDistance>0.5</tempoMinDistance>
    <tempoFrameType>0</tempoFrameType>
    <tempoFramePadding>0.2</tempoFramePadding>
    <tempoFrameWidth>0.1</tempoFrameWidth>
    <tempoFrameRound>0</tempoFrameRound>
    <tempoFrameFgColor r="75" g="48" b="18" a="255"/>
    <tempoFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- METRONOME -->
    <metronomeFontFace>Edwin</metronomeFontFace>
    <metronomeFontSize>11</metronomeFontSize>
    <metronomeFontStyle>1</metronomeFontStyle>
    <metronomePlacement>0</metronomePlacement>
    <metronomeOffset x="0" y="0"/>
    <metronomeFrameType>0</metronomeFrameType>
    <metronomeFramePadding>0.2</metronomeFramePadding>
    <metronomeFrameWidth>0.1</metronomeFrameWidth>
    <metronomeFrameRound>0</metronomeFrameRound>
    <metronomeFrameFgColor r="75" g="48" b="18" a="255"/>
    <metronomeFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- MEASURE NUMBER -->
    <measureNumberFontFace>Edwin</measureNumberFontFace>
    <measureNumberFontSize>8</measureNumberFontSize>
    <measureNumberFontStyle>0</measureNumberFontStyle>
    <measureNumberOffset x="0" y="-2"/>
    <measureNumberOffsetType>1</measureNumberOffsetType>
    <measureNumberFrameType>0</measureNumberFrameType>
    <measureNumberFramePadding>0.2</measureNumberFramePadding>
    <measureNumberFrameWidth>0.1</measureNumberFrameWidth>
    <measureNumberFrameRound>0</measureNumberFrameRound>
    <measureNumberFrameFgColor r="75" g="48" b="18" a="255"/>
    <measureNumberFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- TRANSLATOR -->
    <translatorFontFace>Edwin</translatorFontFace>
    <translatorFontSize>10</translatorFontSize>
    <translatorFontStyle>0</translatorFontStyle>
    <translatorOffset x="0" y="0"/>
    <translatorFrameType>0</translatorFrameType>
    <translatorFramePadding>0.2</translatorFramePadding>
    <translatorFrameWidth>0.1</translatorFrameWidth>
    <translatorFrameRound>0</translatorFrameRound>
    <translatorFrameFgColor r="75" g="48" b="18" a="255"/>
    <translatorFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- SYSTEM TEXT -->
    <systemFontFace>Edwin</systemFontFace>
    <systemFontSize>10</systemFontSize>
    <systemFontStyle>0</systemFontStyle>
    <systemOffsetType>1</systemOffsetType>
    <systemPlacement>0</systemPlacement>
    <systemPosAbove x="0" y="-2"/>
    <systemPosBelow x="0" y="3.5"/>
    <systemMinDistance>0.5</systemMinDistance>
    <systemFrameType>0</systemFrameType>
    <systemFramePadding>0.2</systemFramePadding>
    <systemFrameWidth>0.1</systemFrameWidth>
    <systemFrameRound>0</systemFrameRound>
    <systemFrameFgColor r="75" g="48" b="18" a="255"/>
    <systemFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- STAFF TEXT -->
    <staffFontFace>Edwin</staffFontFace>
    <staffFontSize>10</staffFontSize>
    <staffFontStyle>0</staffFontStyle>
    <staffPlacement>1</staffPlacement>
    <staffPosAbove x="0" y="-2"/>
    <staffPosBelow x="0" y="3.5"/>
    <staffMinDistance>0.5</staffMinDistance>
    <staffFrameType>0</staffFrameType>
    <staffFramePadding>0.2</staffFramePadding>
    <staffFrameWidth>0.1</staffFrameWidth>
    <staffFrameRound>0</staffFrameRound>
    <staffFrameFgColor r="75" g="48" b="18" a="255"/>
    <staffFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- REHEARSAL MARK -->
    <rehearsalMarkFontFace>Edwin</rehearsalMarkFontFace>
    <rehearsalMarkFontSize>13</rehearsalMarkFontSize>
    <rehearsalMarkFontStyle>1</rehearsalMarkFontStyle>
    <rehearsalMarkAlign>right,baseline</rehearsalMarkAlign>
    <rehearsalMarkFrameType>1</rehearsalMarkFrameType>
    <rehearsalMarkFramePadding>0.5</rehearsalMarkFramePadding>
    <rehearsalMarkFrameWidth>0.15</rehearsalMarkFrameWidth>
    <rehearsalMarkFrameRound>20</rehearsalMarkFrameRound>
    <rehearsalMarkFrameFgColor r="75" g="48" b="18" a="255"/>
    <rehearsalMarkFrameBgColor r="255" g="255" b="255" a="0"/>
    <rehearsalMarkPlacement>0</rehearsalMarkPlacement>
    <rehearsalMarkPosAbove x="0" y="-3"/>
    <rehearsalMarkPosBelow x="0" y="4"/>
    <rehearsalMarkMinDistance>0.5</rehearsalMarkMinDistance>

    <!-- REPEAT TEXT (LEFT) -->
    <repeatLeftFontFace>Edwin</repeatLeftFontFace>
    <repeatLeftFontSize>18</repeatLeftFontSize>
    <repeatLeftFontStyle>0</repeatLeftFontStyle>
    <repeatLeftPlacement>0</repeatLeftPlacement>
    <repeatLeftFrameType>0</repeatLeftFrameType>
    <repeatLeftFramePadding>0.2</repeatLeftFramePadding>
    <repeatLeftFrameWidth>0.1</repeatLeftFrameWidth>
    <repeatLeftFrameRound>0</repeatLeftFrameRound>
    <repeatLeftFrameFgColor r="75" g="48" b="18" a="255"/>
    <repeatLeftFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- REPEAT TEXT (RIGHT) -->
    <repeatRightFontFace>Edwin</repeatRightFontFace>
    <repeatRightFontSize>11</repeatRightFontSize>
    <repeatRightFontStyle>0</repeatRightFontStyle>
    <repeatRightPlacement>0</repeatRightPlacement>
    <repeatRightFrameType>0</repeatRightFrameType>
    <repeatRightFramePadding>0.2</repeatRightFramePadding>
    <repeatRightFrameWidth>0.1</repeatRightFrameWidth>
    <repeatRightFrameRound>0</repeatRightFrameRound>
    <repeatRightFrameFgColor r="75" g="48" b="18" a="255"/>
    <repeatRightFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- FRAME TEXT -->
    <frameFontFace>Edwin</frameFontFace>
    <frameFontSize>11</frameFontSize>
    <frameFontStyle>0</frameFontStyle>
    <frameOffset x="0" y="0"/>
    <frameFrameType>0</frameFrameType>
    <frameFramePadding>0.2</frameFramePadding>
    <frameFrameWidth>0.1</frameFrameWidth>
    <frameFrameRound>0</frameFrameRound>
    <frameFrameFgColor r="75" g="48" b="18" a="255"/>
    <frameFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- TEXT LINE -->
    <textLineFontFace>Edwin</textLineFontFace>
    <textLineFontSize>11</textLineFontSize>
    <textLineFontStyle>0</textLineFontStyle>

    <!-- GLISSANDO -->
    <glissandoFontFace>Edwin</glissandoFontFace>
    <glissandoFontSize>8</glissandoFontSize>
    <glissandoFontStyle>2</glissandoFontStyle>
    <glissandoOffset x="0" y="0"/>
    <glissandoFrameType>0</glissandoFrameType>
    <glissandoFramePadding>0.2</glissandoFramePadding>
    <glissandoFrameWidth>0.1</glissandoFrameWidth>
    <glissandoFrameRound>0</glissandoFrameRound>
    <glissandoFrameFgColor r="75" g="48" b="18" a="255"/>
    <glissandoFrameBgColor r="255" g="255" b="255" a="0"/>
    <glissandoLineWidth>0.12</glissandoLineWidth>
    <glissandoText>gliss.</glissandoText>

    <!-- BEND -->
    <bendFontFace>Edwin</bendFontFace>
    <bendFontSize>8</bendFontSize>
    <bendFontStyle>0</bendFontStyle>
    <bendOffset x="0" y="0"/>
    <bendFrameType>0</bendFrameType>
    <bendFramePadding>0.2</bendFramePadding>
    <bendFrameWidth>0.1</bendFrameWidth>
    <bendFrameRound>0</bendFrameRound>
    <bendFrameFgColor r="75" g="48" b="18" a="255"/>
    <bendFrameBgColor r="255" g="255" b="255" a="0"/>
    <bendLineWidth>0.12</bendLineWidth>
    <bendArrowWidth>0.5</bendArrowWidth>

    <!-- HEADER -->
    <headerFontFace>Edwin</headerFontFace>
    <headerFontSize>8</headerFontSize>
    <headerFontStyle>0</headerFontStyle>
    <headerOffset x="0" y="0"/>
    <headerFrameType>0</headerFrameType>
    <headerFramePadding>0.2</headerFramePadding>
    <headerFrameWidth>0.1</headerFrameWidth>
    <headerFrameRound>0</headerFrameRound>
    <headerFrameFgColor r="75" g="48" b="18" a="255"/>
    <headerFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- FOOTER -->
    <footerFontFace>Edwin</footerFontFace>
    <footerFontSize>8</footerFontSize>
    <footerFontStyle>0</footerFontStyle>
    <footerOffset x="0" y="0"/>
    <footerFrameType>0</footerFrameType>
    <footerFramePadding>0.2</footerFramePadding>
    <footerFrameWidth>0.1</footerFrameWidth>
    <footerFrameRound>0</footerFrameRound>
    <footerFrameFgColor r="75" g="48" b="18" a="255"/>
    <footerFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- INSTRUMENT CHANGE -->
    <instrumentChangeFontFace>Edwin</instrumentChangeFontFace>
    <instrumentChangeFontSize>11</instrumentChangeFontSize>
    <instrumentChangeFontStyle>1</instrumentChangeFontStyle>
    <instrumentChangeOffset x="0" y="0"/>
    <instrumentChangePlacement>0</instrumentChangePlacement>
    <instrumentChangePosAbove x="0" y="-2"/>
    <instrumentChangePosBelow x="0" y="3.5"/>
    <instrumentChangeMinDistance>0.5</instrumentChangeMinDistance>
    <instrumentChangeFrameType>0</instrumentChangeFrameType>
    <instrumentChangeFramePadding>0.2</instrumentChangeFramePadding>
    <instrumentChangeFrameWidth>0.1</instrumentChangeFrameWidth>
    <instrumentChangeFrameRound>0</instrumentChangeFrameRound>
    <instrumentChangeFrameFgColor r="75" g="48" b="18" a="255"/>
    <instrumentChangeFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- FIGURED BASS (text style) -->
    <figuredBassFontFace>MScoreBC</figuredBassFontFace>
    <figuredBassFontSize>8</figuredBassFontSize>
    <figuredBassFontStyle>0</figuredBassFontStyle>

    <!-- USER TEXT STYLES 1-6 -->
    <user1FontFace>Edwin</user1FontFace>
    <user1FontSize>10</user1FontSize>
    <user1FontStyle>0</user1FontStyle>
    <user1Offset>0</user1Offset>
    <user1OffsetType>1</user1OffsetType>
    <user1FrameType>0</user1FrameType>
    <user1FramePadding>0.2</user1FramePadding>
    <user1FrameWidth>0.1</user1FrameWidth>
    <user1FrameRound>0</user1FrameRound>
    <user1FrameFgColor r="75" g="48" b="18" a="255"/>
    <user1FrameBgColor r="255" g="255" b="255" a="0"/>
    <user2FontFace>Edwin</user2FontFace>
    <user2FontSize>10</user2FontSize>
    <user2FontStyle>0</user2FontStyle>
    <user2Offset>0</user2Offset>
    <user2OffsetType>1</user2OffsetType>
    <user2FrameType>0</user2FrameType>
    <user2FramePadding>0.2</user2FramePadding>
    <user2FrameWidth>0.1</user2FrameWidth>
    <user2FrameRound>0</user2FrameRound>
    <user2FrameFgColor r="75" g="48" b="18" a="255"/>
    <user2FrameBgColor r="255" g="255" b="255" a="0"/>
    <user3FontFace>Edwin</user3FontFace>
    <user3FontSize>10</user3FontSize>
    <user3FontStyle>0</user3FontStyle>
    <user3Offset>0</user3Offset>
    <user3OffsetType>1</user3OffsetType>
    <user3FrameType>0</user3FrameType>
    <user3FramePadding>0.2</user3FramePadding>
    <user3FrameWidth>0.1</user3FrameWidth>
    <user3FrameRound>0</user3FrameRound>
    <user3FrameFgColor r="75" g="48" b="18" a="255"/>
    <user3FrameBgColor r="255" g="255" b="255" a="0"/>
    <user4FontFace>Edwin</user4FontFace>
    <user4FontSize>10</user4FontSize>
    <user4FontStyle>0</user4FontStyle>
    <user4Offset>0</user4Offset>
    <user4OffsetType>1</user4OffsetType>
    <user4FrameType>0</user4FrameType>
    <user4FramePadding>0.2</user4FramePadding>
    <user4FrameWidth>0.1</user4FrameWidth>
    <user4FrameRound>0</user4FrameRound>
    <user4FrameFgColor r="75" g="48" b="18" a="255"/>
    <user4FrameBgColor r="255" g="255" b="255" a="0"/>
    <user5FontFace>Edwin</user5FontFace>
    <user5FontSize>10</user5FontSize>
    <user5FontStyle>0</user5FontStyle>
    <user5Offset>0</user5Offset>
    <user5OffsetType>1</user5OffsetType>
    <user5FrameType>0</user5FrameType>
    <user5FramePadding>0.2</user5FramePadding>
    <user5FrameWidth>0.1</user5FrameWidth>
    <user5FrameRound>0</user5FrameRound>
    <user5FrameFgColor r="75" g="48" b="18" a="255"/>
    <user5FrameBgColor r="255" g="255" b="255" a="0"/>
    <user6FontFace>Edwin</user6FontFace>
    <user6FontSize>10</user6FontSize>
    <user6FontStyle>0</user6FontStyle>
    <user6Offset>0</user6Offset>
    <user6OffsetType>1</user6OffsetType>
    <user6FrameType>0</user6FrameType>
    <user6FramePadding>0.2</user6FramePadding>
    <user6FrameWidth>0.1</user6FrameWidth>
    <user6FrameRound>0</user6FrameRound>
    <user6FrameFgColor r="75" g="48" b="18" a="255"/>
    <user6FrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- LET RING -->
    <letRingFontFace>Edwin</letRingFontFace>
    <letRingFontSize>10</letRingFontSize>
    <letRingFontStyle>0</letRingFontStyle>
    <letRingHookHeight>0.6</letRingHookHeight>
    <letRingPlacement>1</letRingPlacement>
    <letRingPosAbove x="0" y="-4"/>
    <letRingPosBelow x="0" y="4"/>
    <letRingLineWidth>0.12</letRingLineWidth>
    <letRingLineStyle>2</letRingLineStyle>
    <letRingBeginTextOffset x="0" y="0.15"/>
    <letRingText>let ring</letRingText>
    <letRingFrameType>0</letRingFrameType>
    <letRingFramePadding>0.2</letRingFramePadding>
    <letRingFrameWidth>0.1</letRingFrameWidth>
    <letRingFrameRound>0</letRingFrameRound>
    <letRingFrameFgColor r="75" g="48" b="18" a="255"/>
    <letRingFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- PALM MUTE -->
    <palmMuteFontFace>Edwin</palmMuteFontFace>
    <palmMuteFontSize>10</palmMuteFontSize>
    <palmMuteFontStyle>0</palmMuteFontStyle>
    <palmMuteHookHeight>0.6</palmMuteHookHeight>
    <palmMutePlacement>1</palmMutePlacement>
    <palmMutePosAbove x="0" y="-4"/>
    <palmMutePosBelow x="0" y="4"/>
    <palmMuteLineWidth>0.12</palmMuteLineWidth>
    <palmMuteLineStyle>2</palmMuteLineStyle>
    <palmMuteBeginTextOffset x="0" y="0.15"/>
    <palmMuteText>P.M.</palmMuteText>
    <palmMuteFrameType>0</palmMuteFrameType>
    <palmMuteFramePadding>0.2</palmMuteFramePadding>
    <palmMuteFrameWidth>0.1</palmMuteFrameWidth>
    <palmMuteFrameRound>0</palmMuteFrameRound>
    <palmMuteFrameFgColor r="75" g="48" b="18" a="255"/>
    <palmMuteFrameBgColor r="255" g="255" b="255" a="0"/>

    <!-- FERMATA -->
    <fermataPosAbove x="0" y="-1"/>
    <fermataPosBelow x="0" y="1"/>
    <fermataMinDistance>0.4</fermataMinDistance>

    <!-- SPATIAL UNIT -->
    <Spatium>1.76389</Spatium>
  </Style>
</museScore>
