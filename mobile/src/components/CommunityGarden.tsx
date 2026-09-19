import { useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { theme } from '../theme';
import { styles } from './ui';

type CoupleFlower = {
  id: string;
  x: number;
  y: number;
  names: string;
  location: string;
  flower: string;
  meaning: string;
  quote: string;
  story: string;
};

const couples: CoupleFlower[] = [
  { id:'ira-christos', x:27.8, y:41.5, names:'Ira & Christos', location:'Berlin, Germany', flower:'Cosmos', meaning:'Harmony', quote:'It’s the small things that keep us close.', story:'Ira & Christos started Same Side during a busy season in their lives. Their Cosmos became a reminder to slow down, notice one another, and make room for the small moments that are easy to miss.' },
  { id:'maya-leo', x:87.9, y:25.5, names:'Maya & Leo', location:'Amsterdam, Netherlands', flower:'Zinnia', meaning:'Lasting affection', quote:'We wanted ordinary days to feel like ours again.', story:'Maya & Leo grew their flower through small gestures of affection and playfulness. Their Zinnia marks a chapter where everyday attention became something they chose on purpose.' },
  { id:'elena-marco', x:65.8, y:45.2, names:'Elena & Marco', location:'Milan, Italy', flower:'Daisy', meaning:'New beginnings', quote:'Starting small made starting again feel possible.', story:'Elena & Marco chose a Daisy for a fresh chapter. Their flower grew from quiet moments of appreciation, curiosity and showing up for each other in ways that felt natural.' },
  { id:'nina-alex', x:84.3, y:48.4, names:'Nina & Alex', location:'Athens, Greece', flower:'Calendula', meaning:'Warmth', quote:'A little warmth changed the whole week.', story:'Nina & Alex wanted more warmth in the everyday. Their Calendula grew from simple acts of care — the kind that rarely look dramatic, but change how home feels.' },
  { id:'sofia-daniel', x:32.4, y:56.6, names:'Sofia & Daniel', location:'Barcelona, Spain', flower:'Cornflower', meaning:'Devotion', quote:'We made a little more room for us.', story:'Sofia & Daniel wanted their relationship to have space inside busy weeks. Their Cornflower grew from small choices to turn toward one another again.' },
  { id:'lea-noah', x:52.9, y:60.7, names:'Lea & Noah', location:'Vienna, Austria', flower:'Daisy', meaning:'New beginnings', quote:'We stopped waiting for the perfect moment.', story:'Lea & Noah began with very small actions. Their Daisy marks a chapter of beginning again without needing a grand reset.' },
  { id:'maria-theo', x:15.2, y:68.1, names:'Maria & Theo', location:'Thessaloniki, Greece', flower:'Calendula', meaning:'Warmth', quote:'Care became visible again.', story:'Maria & Theo grew their Calendula by making everyday care easier to notice and easier to return.' },
  { id:'anonymous', x:78.3, y:80.5, names:'Anonymous couple', location:'Lisbon, Portugal', flower:'Forget-me-not', meaning:'Remembrance', quote:'A quieter kind of closeness returned.', story:'This couple chose to share their flower without their names. Their Forget-me-not represents the small, consistent gestures that helped closeness feel natural again.' },
];

export function CommunityGarden({ visible, close }: { visible: boolean; close: () => void }) {
  const [selected, setSelected] = useState<CoupleFlower | null>(null);
  const { width, height } = useWindowDimensions();
  // The approved garden artwork is 1024 × 1536 (2:3).
  // Fit it without cropping so the percentage hit areas stay aligned with
  // the visible circles baked into that exact image.
  const sceneWidth = Math.min(width, (height - 12) * (2 / 3), 620);
  const sceneHeight = sceneWidth * 1.5;

  function dismiss() {
    setSelected(null);
    close();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.colors.cream }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: 620, flex: 1 }}>
          <ImageBackground
            source={require('../../assets/same-side-community-garden.png')}
            resizeMode="cover"
            style={{ width: sceneWidth, height: sceneHeight, alignSelf: 'center' }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to your garden"
              onPress={dismiss}
              hitSlop={8}
              style={{
                position: 'absolute',
                left: '7.5%',
                top: '6.8%',
                width: 58,
                height: 58,
                marginLeft: -29,
                marginTop: -29,
                borderRadius: 29,
                zIndex: 20,
                backgroundColor: 'transparent',
              }}
            />

<Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to your garden"
              onPress={dismiss}
              style={{
                position: 'absolute',
                left: 20,
                top: 22,
                zIndex: 20,
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(250,247,240,0.94)',
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              <Text style={{ fontSize: 25, color: theme.colors.ink }}>‹</Text>
            </Pressable>

            {couples.map(couple => (
              <Pressable
                key={couple.id}
                accessibilityRole="button"
                accessibilityLabel={`Open the flower story for ${couple.names}`}
                onPress={() => setSelected(couple)}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  left: `${couple.x}%`,
                  top: `${couple.y}%`,
                  width: 58,
                  height: 58,
                  marginLeft: -29,
                  marginTop: -29,
                  borderRadius: 29,
                  zIndex: 12,
                  backgroundColor: 'transparent',
                }}
              />
            ))}


          </ImageBackground>
        </View>

        <Modal
          visible={!!selected}
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(26,34,28,0.58)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 18,
            paddingVertical: 24,
          }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close story"
              onPress={() => setSelected(null)}
              style={{ position: 'absolute', inset: 0 }}
            />

            {selected && (
              <View style={{
                width: '78%',
                maxWidth: 350,
                maxHeight: '68%',
                backgroundColor: '#FBF7EF',
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.24,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
                elevation: 16,
              }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 16 }}
                >
                  <View style={{
                    height: 108,
                    overflow: 'hidden',
                    backgroundColor: '#E7EDE3',
                  }}>
                    <ImageBackground
                      source={require('../../assets/same-side-community-garden.png')}
                      resizeMode="cover"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: -170,
                        height: 520,
                      }}
                    >
                      <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,248,238,0.04)',
                      }}/>
                    </ImageBackground>

                    <View style={{
                      position: 'absolute',
                      left: 14,
                      bottom: 12,
                      backgroundColor: 'rgba(251,247,239,0.95)',
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}>
                      <Text style={{
                        color: '#48604B',
                        fontSize: 11.5,
                        fontWeight: '600',
                        letterSpacing: 0.3,
                      }}>
                        {selected.flower} · {selected.meaning}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close story"
                    onPress={() => setSelected(null)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      zIndex: 5,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(251,247,239,0.96)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 5,
                    }}
                  >
                    <Text style={{ fontSize: 22, lineHeight: 24, color: '#425746' }}>×</Text>
                  </Pressable>

                  <View style={{ paddingHorizontal: 18, paddingTop: 14 }}>
                    <Text style={{
                      fontFamily: theme.fonts.serif,
                      fontSize: 25,
                      lineHeight: 30,
                      color: '#3F5343',
                      letterSpacing: -0.3,
                    }}>
                      {selected.names}
                    </Text>

                    <Text style={{
                      fontFamily: theme.fonts.serif,
                      fontSize: 14.5,
                      lineHeight: 21,
                      fontStyle: 'italic',
                      color: '#776B61',
                      marginTop: 3,
                    }}>
                      “{selected.quote}”
                    </Text>

                    <Text style={{
                      fontSize: 12.5,
                      lineHeight: 18,
                      color: '#7C746C',
                      marginTop: 13,
                    }}>
                      {selected.location} · {selected.flower} · {selected.meaning}
                    </Text>

                    <View style={{
                      height: 1,
                      backgroundColor: '#DDD5C9',
                      marginTop: 12,
                      marginBottom: 12,
                    }}/>

                    <Text
                      numberOfLines={4}
                      style={{
                        fontSize: 13.5,
                        lineHeight: 20,
                        color: '#5F5A54',
                      }}
                    >
                      {selected.story}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelected(null)}
                      style={{
                        marginTop: 16,
                        minHeight: 46,
                        borderRadius: 15,
                        backgroundColor: '#708873',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 18,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: '600' }}>
                        Back to the garden
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
