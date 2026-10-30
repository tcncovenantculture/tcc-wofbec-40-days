-- Local seed, applied by `supabase db reset`. Never run against staging or prod.
--
-- Sign in locally with any of these emails; the 6-digit code arrives in Mailpit (http://127.0.0.1:54324).
--   ada@example.com         Rooftop pod (undergrad), facilitator
--   bola@example.com        Rooftop pod
--   chidi@example.com       Lantern pod (early career)
--   reviewer@example.com    reviewer (can open /preview/1 to /preview/40), no pod
--   moderator@example.com   moderator, no pod
-- Rooftop also has dayo, efe and funmi; Lantern has gbenga (its facilitator), halima, ife and jide, all
-- @example.com. Ada and Bola can chat on two phones while Chidi, in the other pod, sees none of it.
--
-- Everyone but Funmi has an avatar, so seeded sign-ins skip the avatar builder; sign up with a new email
-- to see it.
--
-- Module 1 sample days are loaded with publish_at in the past, so they are open now. For the other 32
-- sample days: pnpm content:load content/samples/module-N.json --publish-now

-- Users ------------------------------------------------------------------------------------------------
-- Shaped like real sign-ups so Supabase Auth can sign them in: the zero instance id, empty-string tokens
-- (Auth fails on NULL here) and an email identity. The handle_new_user trigger creates each profile.

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ada@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Ada", "segment": "undergrad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'bola@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Bola", "segment": "undergrad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'chidi@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Chidi", "segment": "early_career"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'reviewer@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Rev Reviewer", "segment": "experienced_professional"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'moderator@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Mo Moderator", "segment": "experienced_professional"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'dayo@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Dayo", "segment": "undergrad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'efe@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Efe", "segment": "undergrad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'funmi@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Funmi", "segment": "undergrad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000009', 'authenticated', 'authenticated', 'gbenga@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Gbenga", "segment": "early_career"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000010', 'authenticated', 'authenticated', 'halima@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Halima", "segment": "early_career"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'ife@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Ife", "segment": "early_career"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'jide@example.com', now(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Jide", "segment": "early_career"}', now(), now());

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
from auth.users
where email like '%@example.com';

-- Avatars, so local sign-ins go straight to home. Funmi has none, to show the seeded fallback in the pod;
-- sign up with a new email to try the builder.
update public.profiles p
set avatar = jsonb_build_object(
  'v', 1,
  'skin', (array['8c5a2b', '643d19', 'a47539', 'c99c62', 'e2ba87', 'f5d7b1'])[1 + s.n % 6],
  'hair', (array['froBun', 'braids', 'shortHair', 'curlyBob', 'shavedHead', 'curlyShortHair', 'bunHair'])[1 + s.n % 7],
  'hairColour', (array['220f00', '3a1a00', '71472d'])[1 + s.n % 3],
  'accessory', (array['none', 'none', 'glasses', 'none', 'sunglasses'])[1 + s.n % 5],
  'eyes', (array['cheery', 'normal', 'winking'])[1 + s.n % 3],
  'mouth', (array['openedSmile', 'teethSmile', 'gapSmile', 'kawaii'])[1 + s.n % 4],
  'background', 1 + s.n % 5
)
from (select id, row_number() over (order by email)::int as n from public.profiles where email like '%@example.com') s
where p.id = s.id and p.email <> 'funmi@example.com';

update public.profiles set role = 'reviewer' where id = 'a1000000-0000-4000-8000-000000000004';
update public.profiles set role = 'moderator' where id = 'a1000000-0000-4000-8000-000000000005';

-- Module 1 sample days (from content/samples/module-1.json), open now --------------------------------

insert into public.days (
  day_number, module_number, kind, title, introduction, scripture_ref, scripture_text, scripture_url,
  body_md, media, reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes,
  publish_at, status
)
select
  d.day_number, 1, d.kind, d.title, d.introduction, d.scripture_ref, d.scripture_text, d.scripture_url,
  d.body_md, d.media, d.reflection_prompts, d.practical_action, d.action_dimension, d.pod_prompt, d.est_minutes,
  now() - interval '1 day', d.status
from jsonb_to_recordset($days$
[
  {
    "day_number": 1,
    "kind": "intro",
    "title": "Sample: Forty days with Jesus",
    "introduction": "Today is about forty days with jesus. This is sample content standing in for the real Day 1, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Acts 1:3 (KJV)",
    "scripture_text": "To whom also he shewed himself alive after his passion by many infallible proofs, being seen of them forty days, and speaking of the things pertaining to the kingdom of God:",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Acts%201%3A3&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 1 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *forty days with jesus* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?",
      "Where have you noticed “forty days with jesus” in your life this week?"
    ],
    "practical_action": "Before you start work or study tomorrow, write down one way you can do it as if for God, not for applause.",
    "action_dimension": "career",
    "pod_prompt": "Where did today’s theme show up in your week? Keep it short and honest.",
    "est_minutes": 11,
    "status": "published"
  },
  {
    "day_number": 2,
    "kind": "developmental",
    "title": "Sample: Being seen and known",
    "introduction": "Today is about being seen and known. This is sample content standing in for the real Day 2, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Romans 12:11 (KJV)",
    "scripture_text": "Not slothful in business; fervent in spirit; serving the Lord;",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Romans%2012%3A11&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 2 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *being seen and known* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?",
      "Where have you noticed “being seen and known” in your life this week?",
      "If you took today seriously, what would change tomorrow?"
    ],
    "practical_action": "Send a short, encouraging message to someone in your pod or your family today.",
    "action_dimension": "community",
    "pod_prompt": "Is there something the pod can pray about for you this week?",
    "est_minutes": 12,
    "status": "published"
  },
  {
    "day_number": 3,
    "kind": "developmental",
    "title": "Sample: Listening first",
    "introduction": "Today is about listening first. This is sample content standing in for the real Day 3, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Mark 2:3-4 (KJV)",
    "scripture_text": "And they come unto him, bringing one sick of the palsy, which was borne of four. And when they could not come nigh unto him for the press, they uncovered the roof where he was: and when they had broken it up, they let down the bed wherein the sick of the palsy lay.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Mark%202%3A3-4&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 3 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *listening first* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?\n\nSome days need more room. This paragraph stands in for a longer passage of teaching: a story, an example from work or campus life, or a few lines of background on the passage. On a small phone this pushes the page past one screen, which is what we want to test.\n\nYou can read the passage in full on [Bible Gateway](https://www.biblegateway.com/passage/?search=Mark%202%3A3-4&version=KJV) if you want more context.",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?"
    ],
    "practical_action": "Pick one small promise you have made to someone and keep it today, quietly.",
    "action_dimension": "character",
    "pod_prompt": "What is one thing you want to try before tomorrow? Tell the pod so they can ask you about it.",
    "est_minutes": 13,
    "status": "published"
  },
  {
    "day_number": 4,
    "kind": "developmental",
    "title": "Sample: Trust",
    "introduction": "Today is about trust. This is sample content standing in for the real Day 4, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Proverbs 3:5-6 (KJV)",
    "scripture_text": "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Proverbs%203%3A5-6&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 4 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *trust* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?",
      "Where have you noticed “trust” in your life this week?"
    ],
    "practical_action": "Before you start work or study tomorrow, write down one way you can do it as if for God, not for applause.",
    "action_dimension": "career",
    "pod_prompt": "Share one sentence about what stood out to you in today’s passage.",
    "est_minutes": 14,
    "status": "published"
  },
  {
    "day_number": 5,
    "kind": "developmental",
    "title": "Sample: A lamp for the path",
    "introduction": "Today is about a lamp for the path. This is sample content standing in for the real Day 5, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Psalm 119:105 (KJV)",
    "scripture_text": "Thy word is a lamp unto my feet, and a light unto my path.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Psalm%20119%3A105&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 5 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *a lamp for the path* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?",
      "Where have you noticed “a lamp for the path” in your life this week?",
      "If you took today seriously, what would change tomorrow?"
    ],
    "practical_action": "Send a short, encouraging message to someone in your pod or your family today.",
    "action_dimension": "community",
    "pod_prompt": "Where did today’s theme show up in your week? Keep it short and honest.",
    "est_minutes": 15,
    "status": "published"
  },
  {
    "day_number": 6,
    "kind": "developmental",
    "title": "Sample: Small faithfulness",
    "introduction": "Today is about small faithfulness. This is sample content standing in for the real Day 6, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Luke 16:10 (KJV)",
    "scripture_text": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Luke%2016%3A10&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 6 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *small faithfulness* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?\n\nSome days need more room. This paragraph stands in for a longer passage of teaching: a story, an example from work or campus life, or a few lines of background on the passage. On a small phone this pushes the page past one screen, which is what we want to test.\n\nYou can read the passage in full on [Bible Gateway](https://www.biblegateway.com/passage/?search=Luke%2016%3A10&version=KJV) if you want more context.",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?"
    ],
    "practical_action": "Pick one small promise you have made to someone and keep it today, quietly.",
    "action_dimension": "character",
    "pod_prompt": "Is there something the pod can pray about for you this week?",
    "est_minutes": 10,
    "status": "published"
  },
  {
    "day_number": 7,
    "kind": "developmental",
    "title": "Sample: Rest that renews",
    "introduction": "Today is about rest that renews. This is sample content standing in for the real Day 7, so the words will change but the shape of the day won’t.",
    "scripture_ref": "Matthew 11:28 (KJV)",
    "scripture_text": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Matthew%2011%3A28&version=KJV",
    "body_md": "**Sample text.** The real teaching for Day 7 will replace these paragraphs. They are here so the screen has a realistic amount to read on a phone.\n\nRead the passage slowly, twice. The first time, read it for what happens. The second time, notice one word or phrase that stays with you, and sit with it for a moment.\n\nThen think about where *rest that renews* shows up in your week: in your studies or work, in how you treat people, and in your time with God.\n\n- What does the passage say?\n- What does it ask of you?\n- Who could you talk to about it?",
    "media": [],
    "reflection_prompts": [
      "What word or phrase from the passage stayed with you, and why?",
      "Where have you noticed “rest that renews” in your life this week?"
    ],
    "practical_action": "Before you start work or study tomorrow, write down one way you can do it as if for God, not for applause.",
    "action_dimension": "career",
    "pod_prompt": "What is one thing you want to try before tomorrow? Tell the pod so they can ask you about it.",
    "est_minutes": 11,
    "status": "published"
  },
  {
    "day_number": 8,
    "kind": "synthesis",
    "title": "Sample: Rest and look back",
    "introduction": "Day 8 is for rest, looking back and getting aligned as a pod. No new lesson today. (Sample text: the real words replace this.)",
    "scripture_ref": "Psalm 46:10 (KJV)",
    "scripture_text": "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
    "scripture_url": "https://www.biblegateway.com/passage/?search=Psalm%2046%3A10&version=KJV",
    "body_md": "**Sample text.** Look back over the last seven days. You don’t need to remember everything: notice what stayed with you, and what you want to carry forward.\n\nTake your time with your pod today. Read what others shared and add your own thoughts.",
    "media": [],
    "reflection_prompts": [
      "What stood out to you most in this module?",
      "What do you want to carry into the next one?"
    ],
    "practical_action": "Write down one thing from this module that you want to keep doing.",
    "action_dimension": "community",
    "pod_prompt": "Where does the pod want to grow together next? Share one hope for the coming week.",
    "est_minutes": 10,
    "status": "published"
  }
]
$days$::jsonb) as d(
  day_number int, kind public.day_kind, title text, introduction text, scripture_ref text,
  scripture_text text, scripture_url text, body_md text, media jsonb, reflection_prompts text[],
  practical_action text, action_dimension public.dimension, pod_prompt text, est_minutes int, status text
);

-- Pods: two pods of five, a facilitator in each ---------------------------------------------------------

insert into public.pods (id, name, segment) values
  ('b1000000-0000-4000-8000-000000000001', 'Rooftop', 'undergrad'),
  ('b1000000-0000-4000-8000-000000000002', 'Lantern', 'early_career');

insert into public.pod_members (pod_id, user_id, is_facilitator) values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', true),  -- Ada
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', false), -- Bola
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000006', false), -- Dayo
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000007', false), -- Efe
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000008', false), -- Funmi
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000009', true),  -- Gbenga
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003', false), -- Chidi
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000010', false), -- Halima
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000011', false), -- Ife
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000012', false); -- Jide

-- Dayo and Efe have finished Day 1, so Rooftop shows "2 of 5" on Day 1 (try /pod?asOf=2026-11-14).
insert into public.progress (user_id, day_number) values
  ('a1000000-0000-4000-8000-000000000006', 1),
  ('a1000000-0000-4000-8000-000000000007', 1),
  ('a1000000-0000-4000-8000-000000000010', 1);

insert into public.messages (pod_id, day_number, author_id, kind, body, created_at) values
  (null, null, 'a1000000-0000-4000-8000-000000000005', 'announcement',
   'Welcome to your pod! Be kind, keep it honest, and tell a leader if anything here worries you.',
   now() - interval '2 days'),
  ('b1000000-0000-4000-8000-000000000001', null, 'a1000000-0000-4000-8000-000000000008', 'message',
   'Hi everyone! Glad to be doing this with you.', now() - interval '26 hours'),
  ('b1000000-0000-4000-8000-000000000001', 1, 'a1000000-0000-4000-8000-000000000006', 'message',
   'The line about working for God, not for applause, stayed with me. Trying it at my internship this week.',
   now() - interval '3 hours'),
  ('b1000000-0000-4000-8000-000000000001', 1, 'a1000000-0000-4000-8000-000000000007', 'message',
   'Same here. Praying for you, Dayo.', now() - interval '2 hours'),
  ('b1000000-0000-4000-8000-000000000002', 1, 'a1000000-0000-4000-8000-000000000010', 'message',
   'Starting today. Glad to be in this pod.', now() - interval '1 hour');

-- Local only: email the moderators when a message is reported -------------------------------------------
-- The same as the Database Webhook set up in the dashboard on staging and prod (Database → Webhooks): it
-- calls the notify-report edge function, which sends to Mailpit locally (http://127.0.0.1:54324).

create extension if not exists pg_net;

create trigger notify_report
after insert on public.reports
for each row
execute function supabase_functions.http_request(
  'http://kong:8000/functions/v1/notify-report',
  'POST',
  '{"Content-Type": "application/json"}',
  '{}',
  '5000'
);
