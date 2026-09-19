import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Notice, Screen, styles } from '../../src/components/ui';
import { AppHeader } from '../../src/components/AppHeader';
import { LoadState, useProductData } from '../../src/components/product';
import { completeMove, getMove, getTodayMove, getProgram } from '../../src/features/product';
import { useAuth } from '../../src/providers/AuthProvider';

const chapters = [
  'Notice each other again',
  'Add a little surprise',
  'Turn toward each other',
  'Keep what works',
];

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Today() {
  const { session } = useAuth();
  const load = useCallback(async () => {
    const program = await getProgram(session!.user.id);
    return { program, move: await getTodayMove(session!.user.id) };
  }, [session!.user.id]);

  const state = useProductData(load);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathOpen, setPathOpen] = useState(false);

  async function complete() {
    if (locked.current || !state.data) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await completeMove(state.data.move.id);
      await state.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function oneMore() {
    const current = state.data?.move;
    if (locked.current || !current || current.status !== 'completed' || current.slot >= 2) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await getMove(current.slot + 1);
      await state.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const move = state.data?.move;
  const week = move ? Math.min(4, Math.max(1, Math.ceil(move.program_day / 7))) : 1;
  const dayInWeek = move ? ((move.program_day - 1) % 7) + 1 : 1;
  const primaryMove = !move || move.slot === 0;

  return (
    <Screen compact>
      <AppHeader />

      <LoadState {...state} />

      {!state.loading && !state.error && move && (
        <>
          <View style={s.intro}>
            <Text style={[styles.eyebrow, s.pathLabel]}>THE ROUTINE · WEEK {week} OF 4</Text>
            <Text style={[styles.title, s.heading]}>A little move{`\n`}for today</Text>
            <Text style={[styles.body, s.privateCopy]}>
              Just for you. Your partner gets their own.
            </Text>
          </View>

          <View style={s.weekJourney}>
            <View style={s.weekJourneyHeader}>
              <View style={s.weekTitleWrap}>
                <Text style={s.weekKicker}>WEEK {week}</Text>
                <Text style={s.weekTitle}>{chapters[week - 1]}</Text>
              </View>
              <Text style={s.dayCount}>DAY {dayInWeek} / 7</Text>
            </View>

            <View style={s.timeline}>
              {dayLabels.map((label, index) => {
                const day = index + 1;
                const past = day < dayInWeek;
                const today = day === dayInWeek;
                const tomorrow = day === dayInWeek + 1;

                return (
                  <View key={`${label}-${index}`} style={s.dayColumn}>
                    <View style={s.markerRow}>
                      {index > 0 && <View style={[s.connector, s.connectorLeft, past || today ? s.connectorActive : null]} />}
                      <View
                        accessibilityLabel={today ? `${label}, today` : `${label}, day ${day}`}
                        style={[
                          s.dayMarker,
                          past && s.dayMarkerPast,
                          today && s.dayMarkerToday,
                          tomorrow && s.dayMarkerTomorrow,
                        ]}
                      >
                        {past ? <View style={s.leaf} /> : today ? <View style={s.todayDot} /> : tomorrow ? <View style={s.bud} /> : null}
                      </View>
                      {index < 6 && <View style={[s.connector, s.connectorRight, past ? s.connectorActive : null]} />}
                    </View>
                    <Text style={[s.dayLabel, today && s.dayLabelToday]}>{label}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={s.journeyHint}>
              {dayInWeek < 7 ? 'Another little move is waiting tomorrow.' : 'A new chapter begins next week.'}
            </Text>
          </View>

          <View style={[styles.card, s.moveCard]}>
            <View style={s.row}>
              <Text style={styles.eyebrow}>{primaryMove ? 'FOR YOU TODAY' : 'A LITTLE MORE'}</Text>
              <View style={s.pill}><Text style={styles.small}>{move.task_minutes} min</Text></View>
            </View>

            <Text style={[styles.cardTitle, s.moveTitle]}>{move.task_title}</Text>
            <Text style={[styles.body, s.description]}>{move.task_body}</Text>

            {move.status === 'completed' ? (
              <View style={s.completed}>
                <View style={s.growthMark}>
                  <View style={s.growthStem} />
                  <View style={s.growthLeafLeft} />
                  <View style={s.growthLeafRight} />
                </View>
                <View style={s.completedCopy}>
                  <Text accessibilityLiveRegion="polite" style={s.completedTitle}>A little something just grew.</Text>
                  <Text style={s.completedBody}>Your move is now part of your garden.</Text>
                  <Pressable accessibilityRole="button" style={s.link} onPress={() => router.navigate('/garden')}>
                    <Text style={styles.label}>See what grew →</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Button label="I did it" busy={busy} onPress={() => { void complete(); }} />
            )}
          </View>

          {move.status === 'completed' && (
            move.slot < 2 ? (
              <View style={s.bonus}>
                <Text style={s.bonusPrompt}>Feel like doing one more?</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy, busy }}
                  disabled={busy}
                  style={[s.link, { opacity: busy ? 0.5 : 1 }]}
                  onPress={() => { void oneMore(); }}
                >
                  <Text style={styles.label}>{busy ? 'A moment…' : 'Give me another little move →'}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.small, s.bonus]}>That’s plenty for today.</Text>
            )
          )}

          {error && <Notice>{error}</Notice>}
          {error && (
            <Button
              label="Try again"
              secondary
              disabled={busy}
              onPress={() => { setError(null); void state.refresh(); }}
            />
          )}

          <View style={s.pathSection}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: pathOpen }}
              style={s.pathToggle}
              onPress={() => setPathOpen(value => !value)}
            >
              <View>
                <Text style={s.pathToggleKicker}>YOUR FOUR-WEEK PATH</Text>
                <Text style={s.pathToggleTitle}>The Routine</Text>
              </View>
              <Text style={s.chevron}>{pathOpen ? '−' : '+'}</Text>
            </Pressable>

            {pathOpen && (
              <View style={s.chapters}>
                {chapters.map((chapter, index) => {
                  const number = index + 1;
                  const active = number === week;
                  const past = number < week;
                  return (
                    <View key={chapter} style={[s.chapterRow, index === chapters.length - 1 && s.chapterRowLast]}>
                      <View style={[s.chapterNumber, active && s.chapterNumberActive, past && s.chapterNumberPast]}>
                        <Text style={[s.chapterNumberText, (active || past) && s.chapterNumberTextActive]}>
                          {past ? '✓' : `0${number}`}
                        </Text>
                      </View>
                      <View style={s.chapterCopy}>
                        <Text style={[s.chapterTitle, active && s.chapterTitleActive]}>{chapter}</Text>
                        <Text style={s.chapterMeta}>{active ? 'This week' : past ? 'Completed' : 'Coming up'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  intro: { marginTop: 28 },
  pathLabel: { letterSpacing: 1.35, marginBottom: 12 },
  heading: { fontSize: 40, lineHeight: 43, letterSpacing: -1.3, marginBottom: 12 },
  privateCopy: { maxWidth: 420, lineHeight: 24 },

  weekJourney: {
    marginTop: 26,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#DED7CA',
    borderRadius: 24,
    backgroundColor: '#FBF8F2',
  },
  weekJourneyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  weekTitleWrap: { flex: 1 },
  weekKicker: { fontSize: 10, lineHeight: 14, letterSpacing: 1.5, fontWeight: '700', color: '#728978' },
  weekTitle: { marginTop: 4, fontFamily: 'Georgia', fontSize: 19, lineHeight: 24, color: '#34483C' },
  dayCount: { fontSize: 10, lineHeight: 14, letterSpacing: 1.1, color: '#9A9186' },
  timeline: { flexDirection: 'row', marginTop: 22, marginHorizontal: -4 },
  dayColumn: { flex: 1, alignItems: 'center' },
  markerRow: { width: '100%', height: 30, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  connector: { position: 'absolute', top: 14, height: 1, width: '50%', backgroundColor: '#DED8CD' },
  connectorLeft: { left: 0 },
  connectorRight: { right: 0 },
  connectorActive: { backgroundColor: '#8FA08F' },
  dayMarker: {
    zIndex: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CEC7BB',
    backgroundColor: '#FBF8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMarkerPast: { borderColor: '#718675', backgroundColor: '#718675' },
  dayMarkerToday: { width: 26, height: 26, borderRadius: 13, borderColor: '#718675', borderWidth: 1.5, backgroundColor: '#EEF1E9' },
  dayMarkerTomorrow: { borderColor: '#B6A995', backgroundColor: '#F8F2E9' },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#718675' },
  leaf: { width: 8, height: 5, borderTopRightRadius: 8, borderBottomLeftRadius: 8, backgroundColor: '#F7F3EB', transform: [{ rotate: '-22deg' }] },
  bud: { width: 7, height: 8, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: '#D8C5AF' },
  dayLabel: { marginTop: 4, fontSize: 10, letterSpacing: 0.6, color: '#9B9388' },
  dayLabelToday: { color: '#405448', fontWeight: '700' },
  journeyHint: { marginTop: 16, fontSize: 12, lineHeight: 18, color: '#8A8278', textAlign: 'center' },

  moveCard: { marginTop: 20, padding: 22, gap: 0, borderRadius: 26 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pill: { backgroundColor: '#F1ECE4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  moveTitle: { fontSize: 28, lineHeight: 32, marginTop: 16, marginBottom: 12 },
  description: { lineHeight: 24, marginBottom: 20 },

  completed: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 4, paddingBottom: 2 },
  growthMark: { width: 48, height: 62, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  growthStem: { width: 2, height: 44, borderRadius: 2, backgroundColor: '#718675' },
  growthLeafLeft: { position: 'absolute', left: 9, bottom: 19, width: 20, height: 10, borderTopRightRadius: 18, borderBottomLeftRadius: 18, backgroundColor: '#A8B6A2', transform: [{ rotate: '18deg' }] },
  growthLeafRight: { position: 'absolute', right: 8, bottom: 31, width: 19, height: 9, borderTopLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: '#829681', transform: [{ rotate: '-18deg' }] },
  completedCopy: { flex: 1 },
  completedTitle: { fontFamily: 'Georgia', fontSize: 19, lineHeight: 24, color: '#34483C' },
  completedBody: { marginTop: 5, fontSize: 13, lineHeight: 19, color: '#847C72' },
  link: { minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' },
  bonus: { marginTop: 18, paddingHorizontal: 4 },
  bonusPrompt: { fontFamily: 'Georgia', fontSize: 17, lineHeight: 22, color: '#4A5A50' },

  pathSection: { marginTop: 32, marginBottom: 24, borderTopWidth: 1, borderTopColor: '#DED7CA' },
  pathToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  pathToggleKicker: { fontSize: 10, lineHeight: 14, letterSpacing: 1.4, fontWeight: '700', color: '#788C7B' },
  pathToggleTitle: { marginTop: 4, fontFamily: 'Georgia', fontSize: 21, lineHeight: 26, color: '#34483C' },
  chevron: { fontSize: 25, lineHeight: 28, color: '#728276', fontWeight: '300' },
  chapters: { borderWidth: 1, borderColor: '#E0D9CD', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FBF8F2' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E8E1D6' },
  chapterRowLast: { borderBottomWidth: 0 },
  chapterNumber: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#D2CBC0', alignItems: 'center', justifyContent: 'center' },
  chapterNumberActive: { borderColor: '#718675', backgroundColor: '#E6EBE3' },
  chapterNumberPast: { borderColor: '#718675', backgroundColor: '#718675' },
  chapterNumberText: { fontSize: 10, letterSpacing: 0.4, color: '#938B81' },
  chapterNumberTextActive: { color: '#405448', fontWeight: '700' },
  chapterCopy: { flex: 1 },
  chapterTitle: { fontFamily: 'Georgia', fontSize: 16, lineHeight: 21, color: '#7D776F' },
  chapterTitleActive: { color: '#34483C' },
  chapterMeta: { marginTop: 2, fontSize: 11, lineHeight: 15, color: '#A0988D' },
});
