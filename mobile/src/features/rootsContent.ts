export const thoughts = [
 ['Keep noticing', 'The things that become ordinary are often the things most worth seeing again.'],
 ['Small things count', 'Closeness rarely changes in one big moment. Sometimes it begins with simply noticing each other again.'],
 ['There’s no catching up to do', 'Come back whenever it feels right. There is room to begin from here.'],
 ['Something small can still matter', 'A gentle question. A little patience. A moment you chose to share.'],
 ['Ordinary is full of things', 'There may be something worth remembering in a day that did not seem remarkable.'],
 ['A little room', 'You do not have to find the perfect words to make a little room for each other.'],
 ['A fresh look', 'The person beside you is still becoming someone. There are things you have not noticed yet.'],
];
export const prompts = ['What did you notice today?', 'What did you appreciate today?', 'Was there a moment today you’d like to remember?', 'What felt good between you today?', 'What did you notice about them that you usually overlook?', 'Did anything feel a little different today?', 'What would you like to bring a little more of tomorrow?', 'Two sentences about today.'];
export const reads = [
 { title: 'The person you know best is still changing', paragraphs: [
 'Knowing someone well is a kind of comfort. You know how they take their coffee, which story they are about to tell, and what their face looks like when they are tired. You can share a room without filling every silence. There is something lovely about not having to explain everything.',
 'But familiarity can also make us finish the picture too early. We hear the beginning of an answer and think we know the rest. We ask how the day was while already turning towards the next thing. It is an ordinary shortcut, especially when life is full. It does not mean the interest has gone.',
 'Sometimes a fresh look begins with a very small pause. What did they actually say? Which part of the story seemed to matter to them? Is the thing they used to love still the thing they would choose today? There is no need to make an evening into an interview. One unhurried follow-up can be enough to let a conversation take an unexpected turn.',
 'You are allowed to discover something new about a person you have known for years. A different opinion. A small hope. A detail about an ordinary afternoon. Familiarity can be a place from which to be curious, rather than a reason to stop. And some days, simply listening to a familiar story with your whole attention is a way of meeting them again.'
 ], notice: 'When a familiar story begins, notice one detail you might usually skip over.' },
 { title: 'A small ritual can make room for you', paragraphs: [
 'A ritual does not need a name, a plan, or a beautiful setting. It might be the few minutes you stand together while the kettle boils. A wave from the window. The walk to the corner shop when you could have gone alone. Its value can live in the simple feeling: this little part of the day is ours.',
 'Ordinary life asks us to make a lot of decisions. What to eat, what needs fixing, who is going where. A familiar shared moment can offer a small resting place inside all that movement. You already know how to begin. You do not need to make it impressive.',
 'The moment can change as your lives change. Something that felt easy last month might be difficult this week. It is fine to make it smaller, find another time, or let it rest. A ritual is useful when it makes room for you, not when you have to work to prove you are keeping it.',
 'Perhaps there is already something you both return to without thinking about it. Before inventing something new, you might notice what is there. A particular joke, a shared snack, the way one of you waits for the other at the door. Small familiar moments can hold a surprising amount of affection. They do not need to happen every day to count, and you do not need to measure them to enjoy them.'
 ], notice: 'Notice a small moment you already share, without trying to improve it.' },
 { title: 'Let appreciation become visible', paragraphs: [
 'You may feel grateful for things you rarely mention. Someone remembered what you needed from the shop. They made room for your difficult mood. They told a story that made a long day feel lighter. Inside your own head, the appreciation can seem obvious. Outside it, the moment may pass without a trace.',
 'There is no need for a grand speech. A particular observation often feels more natural than a sweeping compliment. “I liked sitting with you for those few minutes” says something different from “You are wonderful.” It points to a piece of real life that you shared, and says that you saw it.',
 'Appreciation does not have to make everything feel better. You can be glad about one moment while another part of the day was difficult. Noticing something good does not mean pretending the rest did not happen. It is simply allowing that good thing to have a place too.',
 'And appreciation is not a trade. You do not have to wait for the perfect response, or turn your observation into a request for something in return. Sometimes a few words can stand on their own. Sometimes you might first keep the thought privately, and find your words later. What matters here is the small act of paying attention to something you could easily have let become invisible.'
 ], notice: 'Notice one ordinary thing you appreciated before the day moves on.' },
];
// Input is the server's relationship-local YYYY-MM-DD, not the device timezone.
export function dailyIndex(date: string, length: number) {
 const day = Math.floor(Date.parse(date + 'T12:00:00Z') / 86400000);
 return ((day % length) + length) % length;
}
